# iOS Networking

## Table of Contents

1. [Endpoint Protocol](#1-endpoint-protocol)
2. [Client Architecture](#2-client-architecture)
3. [Generic Request Methods](#3-generic-request-methods)
4. [Auth / Token Handling](#4-auth--token-handling)
5. [Error Handling](#5-error-handling)
6. [Pagination](#6-pagination)
7. [Multipart Upload](#7-multipart-upload)
8. [WebSocket Streaming](#8-websocket-streaming)
9. [Thread Safety](#9-thread-safety)
10. [Quick Checklist](#10-quick-checklist)

---

## 1. Endpoint Protocol

Define a `Sendable` protocol that every API group conforms to as an enum:

```swift
public protocol Endpoint: Sendable {
  func path() -> String
  func queryItems() -> [URLQueryItem]?
  var jsonValue: Encodable? { get }   // body payload; default nil
}
```

Each API area is its own enum file conforming to `Endpoint`:

```swift
public enum Statuses: Endpoint {
  case status(id: String)
  case postStatus(json: StatusData)
  case favorite(id: String)
  case context(id: String)
  case rebloggedBy(id: String, maxId: String?)
  // ...

  public func path() -> String {
    switch self {
    case .status(let id):       "statuses/\(id)"
    case .postStatus:           "statuses"
    case .favorite(let id):     "statuses/\(id)/favourite"
    case .context(let id):      "statuses/\(id)/context"
    case .rebloggedBy(let id, _): "statuses/\(id)/reblogged_by"
    }
  }

  public func queryItems() -> [URLQueryItem]? {
    switch self {
    case .rebloggedBy(_, let maxId):
      makePaginationParam(sinceId: nil, maxId: maxId, mindId: nil)
    default: nil
    }
  }

  public var jsonValue: Encodable? {
    switch self {
    case .postStatus(let json): json
    default: nil
    }
  }
}
```

Key conventions:
- Path never includes `/api/v1/` -- the client prepends that.
- Query params return `nil` when there are none.
- `jsonValue` carries `Encodable` body structs for POST/PUT (defined alongside the enum).
  **Note:** `jsonValue` is typed as `Encodable?` (existential). You cannot call `encoder.encode(json)` directly on an existential -- pass the concrete type through a generic parameter (e.g. `func makeURLRequest<Body: Encodable>(..., jsonBody: Body?)`) or use a type-erased wrapper.
- Pagination helpers live in a protocol extension (`makePaginationParam`).

Body data structs sit next to the enum:

```swift
public struct StatusData: Encodable, Sendable {
  public let status: String
  public let visibility: Visibility
  public let inReplyToId: String?
  public let mediaIds: [String]?
  // ...
}
```

## 2. Client Architecture

A single `@Observable` class owns URLSession, decoder, and mutable auth state:

```swift
@Observable
public final class MastodonClient: @unchecked Sendable {
  // @unchecked because @Observable synthesizes mutable backing storage
  public let server: String
  public let version: Version           // .v1 or .v2
  private let urlSession: URLSession
  private let decoder: JSONDecoder      // .convertFromSnakeCase
  private let logger: Logger

  // All mutable state behind a lock (see Thread Safety)
  private let critical: OSAllocatedUnfairLock<Critical>
}
```

- Conforms to `Equatable`, `Identifiable`, `Hashable`, `Sendable`.
- Injected into SwiftUI views via `@Environment(MastodonClient.self)`.
- Widgets/Intents create their own instance: `MastodonClient(server:oauthToken:)`.

URL construction is centralized:

```swift
private func makeURL(
  scheme: String = "https",
  endpoint: Endpoint,
  forceVersion: Version? = nil,
  forceServer: String? = nil
) throws -> URL
// Produces: https://{server}/api/{version}/{endpoint.path()}?{endpoint.queryItems()}
// Special-cases OAuth endpoints (no /api/vN prefix).
```

## 3. Generic Request Methods

All HTTP verbs follow the same shape -- generic over `Decodable`:

```swift
// Decode response into Entity
public func get<Entity: Decodable>(endpoint: Endpoint, forceVersion: Version? = nil) async throws -> Entity
public func post<Entity: Decodable>(endpoint: Endpoint, forceVersion: Version? = nil) async throws -> Entity
public func put<Entity: Decodable>(endpoint: Endpoint, forceVersion: Version? = nil) async throws -> Entity

// Return raw HTTPURLResponse (for fire-and-forget mutations)
public func post(endpoint: Endpoint, forceVersion: Version? = nil) async throws -> HTTPURLResponse?
public func patch(endpoint: Endpoint) async throws -> HTTPURLResponse?
public func delete(endpoint: Endpoint, forceVersion: Version? = nil) async throws -> HTTPURLResponse?

// Decode response + parse Link header for pagination
public func getWithLink<Entity: Decodable>(endpoint: Endpoint) async throws -> (Entity, LinkHandler?)
```

Internal plumbing:

```swift
private func makeEntityRequest<Entity: Decodable>(
  endpoint: Endpoint, method: String, forceVersion: Version? = nil
) async throws -> Entity {
  let url = try makeURL(endpoint: endpoint, forceVersion: forceVersion)
  let request = try makeURLRequest(url: url, endpoint: endpoint, httpMethod: method)
  let (data, httpResponse) = try await urlSession.data(for: request)
  logResponseOnError(httpResponse: httpResponse, data: data)
  do {
    return try decoder.decode(Entity.self, from: data)
  } catch {
    // Try to decode server error before re-throwing
    if var serverError = try? decoder.decode(ServerError.self, from: data) {
      serverError.httpCode = (httpResponse as? HTTPURLResponse)?.statusCode
      throw serverError
    }
    throw error
  }
}
```

Request construction auto-attaches Bearer token and JSON body:

```swift
private func makeURLRequest<Body: Encodable>(
  url: URL,
  endpoint: Endpoint,
  httpMethod: String,
  jsonBody: Body? = nil
) throws -> URLRequest {
  var request = URLRequest(url: url)
  request.httpMethod = httpMethod
  if let oauthToken = critical.withLock({ $0.oauthToken }) {
    request.setValue("Bearer \(oauthToken.accessToken)", forHTTPHeaderField: "Authorization")
  }
  if let json = jsonBody {
    let encoder = JSONEncoder()
    encoder.keyEncodingStrategy = .convertToSnakeCase
    request.httpBody = try encoder.encode(json)
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
  }
  return request
}
```

Keep request construction throwing. Swallowing `Encodable` failures with `try?` produces hard-to-debug empty or malformed bodies.

Usage at call site is clean:

```swift
let status: Status = try await client.get(endpoint: Statuses.status(id: "123"))
let _: HTTPURLResponse? = try await client.post(endpoint: Statuses.favorite(id: "123"))
let (statuses, link): ([Status], LinkHandler?) = try await client.getWithLink(endpoint: Timelines.home(...))
```

## 4. Auth / Token Handling

OAuth flow is a two-step process on the client:

```swift
// Step 1: Register app, get authorization URL
public func oauthURL() async throws -> URL {
  let app: InstanceApp = try await post(endpoint: Apps.registerApp)
  critical.withLock { $0.oauthApp = app }
  return try makeURL(endpoint: Oauth.authorize(clientId: app.clientId))
}

// Step 2: Exchange code for token (after redirect)
public func continueOauthFlow(url: URL) async throws -> OauthToken {
  guard let app = critical.withLock({ $0.oauthApp }) else { throw OauthError.missingApp }
  let code = /* extract from redirect URL */
  let token: OauthToken = try await post(endpoint: Oauth.token(code:clientId:clientSecret:))
  critical.withLock { $0.oauthToken = token }
  return token
}
```

Key points:
- Token is stored in `Critical` behind `OSAllocatedUnfairLock`.
- Every request reads the token at send time via `critical.withLock`.
- No automatic token refresh -- Mastodon tokens are long-lived.
- OAuth endpoints skip the `/api/vN/` path prefix (special-cased in `makeURL`).

`OauthToken` model:

```swift
public struct OauthToken: Codable, Hashable, Sendable {
  public let accessToken: String
  public let tokenType: String
  public let scope: String
  public let createdAt: Double
}
```

## 5. Error Handling

Two-tier error strategy:

```swift
// Domain error from server
public struct ServerError: Decodable, Error, Sendable {
  public let error: String?
  public var httpCode: Int?
}

// Client-side errors
public enum ClientError: Error {
  case unexpectedRequest
}

public enum OauthError: Error {
  case missingApp
  case invalidRedirectURL
}
```

Error mapping in request methods:
- Attempt to decode `Entity` first.
- On decode failure, try `ServerError` -- if that succeeds, attach the HTTP status code and throw it.
- Otherwise re-throw the original decoding error.
- HTTP status > 299 is always logged (status code + response body).

No retry logic in the main client. WebSocket streaming has its own reconnect with incremental backoff (see WebSocket Streaming below).

## 6. Pagination

Cursor-based using Mastodon's `max_id` / `since_id` / `min_id` params.

Endpoint helper in the protocol extension:

```swift
extension Endpoint {
  func makePaginationParam(sinceId: String?, maxId: String?, mindId: String?) -> [URLQueryItem]? {
    var params: [URLQueryItem] = []
    if let sinceId { params.append(.init(name: "since_id", value: sinceId)) }
    if let maxId   { params.append(.init(name: "max_id", value: maxId)) }
    if let mindId  { params.append(.init(name: "min_id", value: mindId)) }
    return params.isEmpty ? nil : params
  }
}
```

Endpoints bake pagination into their associated values:

```swift
case home(sinceId: String?, maxId: String?, minId: String?, limit: Int?)
```

Link header parsing for `getWithLink`:

```swift
public struct LinkHandler: Sendable {
  public let rawLink: String

  public var maxId: String? {
    // Regex extracts max_id=\d+ from Link header
  }
}
```

Typical pagination loop:

```swift
let (statuses, link): ([Status], LinkHandler?) =
  try await client.getWithLink(endpoint: Timelines.home(sinceId: nil, maxId: nil, minId: nil, limit: 20))

// Load next page:
let (more, nextLink): ([Status], LinkHandler?) =
  try await client.getWithLink(endpoint: Timelines.home(sinceId: nil, maxId: link?.maxId, minId: nil, limit: 20))
```

## 7. Multipart Upload

Four overloads -- with/without progress, returning `Entity` or raw `HTTPURLResponse`:

```swift
public func mediaUpload<Entity: Decodable>(
  endpoint: Endpoint,
  version: Version,
  method: String,
  mimeType: String,
  filename: String,
  data: Data
) async throws -> Entity

// With progress callback
public func mediaUpload<Entity: Decodable>(
  endpoint: Endpoint,
  version: Version,
  method: String,
  mimeType: String,
  filename: String,
  data: Data,
  progressHandler: @escaping @Sendable (Double) -> Void
) async throws -> Entity
```

Multipart body construction:

```swift
private func makeFormDataRequest(...) throws -> URLRequest {
  let boundary = UUID().uuidString
  request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

  let httpBody = NSMutableData()
  httpBody.append(Data("--\(boundary)\r\n".utf8))
  httpBody.append(Data("Content-Disposition: form-data; name=\"\(filename)\"; filename=\"\(filename)\"\r\n".utf8))
  httpBody.append(Data("Content-Type: \(mimeType)\r\n".utf8))
  httpBody.append(Data("\r\n".utf8))
  httpBody.append(data)
  httpBody.append(Data("\r\n--\(boundary)--\r\n".utf8))
  request.httpBody = httpBody as Data
  return request
}
```

Progress tracking uses a `URLSessionTaskDelegate`:

```swift
private final class UploadProgressDelegate: NSObject, URLSessionTaskDelegate, Sendable {
  private let progressHandler: @Sendable (Double) -> Void

  func urlSession(_ session: URLSession, task: URLSessionTask,
                  didSendBodyData bytesSent: Int64,
                  totalBytesSent: Int64,
                  totalBytesExpectedToSend: Int64) {
    let progress = Double(totalBytesSent) / Double(totalBytesExpectedToSend)
    progressHandler(progress)
  }
}

// Used via:
let (data, response) = try await urlSession.upload(
  for: request, from: request.httpBody!,
  delegate: UploadProgressDelegate(progressHandler: progressHandler)
)
```

## 8. WebSocket Streaming

Client exposes a factory method; the `StreamWatcher` manages the lifecycle:

```swift
// On MastodonClient:
public func makeWebSocketTask(endpoint: Endpoint, instanceStreamingURL: URL?) throws -> URLSessionWebSocketTask {
  let url = try makeURL(scheme: "wss", endpoint: endpoint, forceServer: instanceStreamingURL?.host)
  var subprotocols: [String] = []
  if let oauthToken = critical.withLock({ $0.oauthToken }) {
    subprotocols.append(oauthToken.accessToken)  // Auth via subprotocol
  }
  return urlSession.webSocketTask(with: url, protocols: subprotocols)
}
```

StreamWatcher pattern:
- `@MainActor @Observable` service owned by the current app/scene root.
- Subscribes to streams (`user`, `public`, `local`, `direct`) via JSON messages.
- Recursive `receiveMessage()` loop.
- On failure: cancel, wait `retryDelay` seconds, reconnect. Backoff increases by 30s each failure.
- Decoded events published to an `events` array and `latestEvent` property.
- Uses a private `actor StreamEventDecoder` to serialize decoding off main thread.

## 9. Thread Safety

`MastodonClient` achieves `Sendable` conformance via `OSAllocatedUnfairLock`:

```swift
private let critical: OSAllocatedUnfairLock<Critical>

private struct Critical: Sendable {
  var oauthApp: InstanceApp?
  var oauthToken: OauthToken?
  var connections: Set<String> = []
}
```

All mutable state access goes through `critical.withLock { ... }`:

```swift
public var isAuth: Bool {
  critical.withLock { $0.oauthToken != nil }
}

// In makeURLRequest:
if let oauthToken = critical.withLock({ $0.oauthToken }) { ... }
```

Rules:
- `OSAllocatedUnfairLock` (from `os` module) -- lightweight, non-reentrant. The struct wraps a `ManagedBuffer` heap allocation.
- Keep lock scope minimal -- read the value out, then use it outside the lock.
- All stored properties on the client are either `let` or behind the lock.
- The `Sendable` conformance is provable by the compiler with Swift 6 strict concurrency.

## 10. Quick Checklist

- [ ] Define endpoints as `enum: Endpoint` -- one file per API area
- [ ] Paths exclude `/api/vN/` prefix; client prepends it
- [ ] Use `jsonValue` for POST/PUT bodies, `queryItems()` for URL params
- [ ] Generic `get/post/put` return `Decodable`; non-generic return `HTTPURLResponse?`
- [ ] Use `getWithLink` for paginated lists; parse `LinkHandler.maxId` for next page
- [ ] Multipart uploads use `makeFormDataRequest` with `UUID` boundary
- [ ] All mutable client state behind `OSAllocatedUnfairLock` for `Sendable`
- [ ] Decode `ServerError` as fallback when entity decoding fails
- [ ] Log HTTP errors (status > 299) with response body
- [ ] Use `Logger(subsystem:category:)` for structured logging
- [ ] WebSocket auth via subprotocol header, not query param
- [ ] Snake-case decoding (`convertFromSnakeCase`) on decoder, snake-case encoding on encoder
