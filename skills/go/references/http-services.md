# Go HTTP Services

Use this when building or reviewing Go HTTP servers, clients, handlers, middleware, or graceful shutdown.

## Service shape

- Keep `main` responsible for config, dependency construction, route registration, and shutdown.
- Put durable dependencies on a server/app struct.
- Keep handlers thin: parse/validate request, call service, map result/error to response.
- Keep business rules out of middleware and routing code.
- Prefer stdlib `net/http` unless the project already uses a framework or the user approves adding one.

Example shape:

```go
type Server struct {
    users *users.Service
    log   *slog.Logger
}

func (s *Server) user(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    // parse, call service, write response
    _ = ctx
}
```

## Routing

- Go 1.22+: stdlib `http.ServeMux` supports method/path patterns and path values: `mux.HandleFunc("GET /users/{id}", h)`, `r.PathValue("id")`.
- Older Go or existing routers: follow the project's router conventions.
- Keep route registration centralized enough to audit but not so centralized that each domain loses ownership.

## Handler rules

- Write at most one status/body response path.
- Return immediately after `http.Error` or any helper that writes an error response.
- Set headers before `WriteHeader` or first body write.
- Use `json.NewDecoder`/`Encoder` for streaming-sized bodies; `io.ReadAll` only when bounded and reasonable.
- Limit untrusted body sizes with `http.MaxBytesReader` or an explicit `io.LimitReader` at the boundary.
- Validate content type and required fields when protocol requires it.
- Avoid storing `http.ResponseWriter` or `*http.Request` beyond the handler lifetime.

## Error mapping

Map domain errors at the HTTP boundary:

```go
switch {
case errors.Is(err, users.ErrNotFound):
    http.Error(w, "not found", http.StatusNotFound)
case errors.Is(err, context.Canceled):
    return
case err != nil:
    http.Error(w, "internal server error", http.StatusInternalServerError)
default:
    // success
}
```

Do not leak internal error text to clients unless it is intentionally user-facing.

## Contexts

- Use `r.Context()` for request-scoped downstream work.
- Do not pass `r.Context()` to background work that must complete after the response is written; derive a separate context with its own timeout, and use `context.WithoutCancel` on Go 1.21+ only when appropriate.
- For client calls, create requests with `http.NewRequestWithContext`.

## Server timeouts

Production servers should construct `http.Server` explicitly. Common fields to consider:

```go
srv := &http.Server{
    Addr:              addr,
    Handler:           mux,
    ReadHeaderTimeout: 5 * time.Second,
    ReadTimeout:       30 * time.Second,
    WriteTimeout:      30 * time.Second,
    IdleTimeout:       120 * time.Second,
}
```

Tune values for streaming endpoints; a blanket `WriteTimeout` can break long-lived responses.

## HTTP clients

Avoid `http.DefaultClient` for production clients. Use an explicit client with timeouts:

```go
client := &http.Client{
    Timeout: 10 * time.Second,
}
```

For high-throughput services, tune `Transport` deliberately rather than copying large config blocks blindly.

Client rules:

- Use context-aware requests.
- Close `resp.Body` on every successful `Do` that returns a response, even for non-2xx statuses.
- Check status before decoding success payloads.
- Bound response reads when the peer is untrusted.
- Reuse clients; do not create a new client/transport per request unless there is a specific reason.

## Middleware

Good middleware is small and orthogonal: logging, panic recovery, request IDs, auth, CORS, compression, metrics.

- Middleware should call the next handler exactly once or write a terminal response and return.
- Avoid hiding business logic or database calls in generic middleware.
- Preserve request context and response semantics.
- Be careful wrapping `ResponseWriter`; implement optional interfaces only when needed and tested.

## Graceful shutdown

Use signal handling and `Server.Shutdown` with a bounded context. Shutdown stops accepting new connections and waits for in-flight handlers until the context expires.

Also stop background workers, queues, tickers, and database resources owned by the process.

## Testing

- Use `httptest.NewRecorder` for handler tests.
- Use `httptest.NewServer` for client tests or end-to-end HTTP behavior.
- Test status, headers, and body semantics.
- Test malformed input, unsupported method, missing auth, upstream timeout/error, and success.
- Prefer comparing decoded JSON objects over raw JSON strings unless exact formatting is part of the contract.

## Security reminders

- Use `crypto/rand`, not `math/rand`, for secrets/tokens.
- Set secure cookie attributes deliberately (`HttpOnly`, `Secure`, `SameSite`, path/domain).
- Treat request body, headers, path variables, and query strings as untrusted.
- Do not log credentials, tokens, cookies, or full untrusted payloads by default.
