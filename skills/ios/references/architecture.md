# iOS Architecture

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Architecture and DI](#2-architecture-and-di)
3. [Concurrency](#3-concurrency)
4. [Swift 6 Concurrency](#4-swift-6-concurrency)
5. [State Management](#5-state-management)
6. [Styling and UI](#6-styling-and-ui)
7. [Navigation](#7-navigation)
8. [Error Handling](#8-error-handling)
9. [Accessibility and Localization](#9-accessibility-and-localization)
10. [Performance](#10-performance)
11. [Testing](#11-testing)
12. [PR Checklist](#12-pr-checklist)

---

## 1. Project Structure

```text
App/
Core/
  Models/
  Networking/
  Persistence/
  Logging/
  Utils/
Features/
  <Feature>/
    <Feature>View.swift
    <Feature>Model.swift
    <Feature>ViewModel.swift
    Components/
UI/
  Components/
  Theme/
Infrastructure/
  DI/
  Config/
Tests/
  Unit/
  UI/
```

For each new feature, include:
- A view plus extracted subviews as needed
- A reference model/store or view model only when the feature needs one
- Domain model mapping (if needed)
- Unit tests for the feature logic that owns behavior
- Preview states (loading/empty/error/success)

Definition of done:
- Compiles and runs
- Tests pass
- Accessibility checks pass
- Uses design tokens/components
- Navigation path is stable

## 2. Architecture and DI

- Prefer vanilla SwiftUI first: local `@State`, explicit inputs, and `@Environment` for shared services.
- Use dedicated view model files when the feature genuinely needs a reference type for orchestration or long-lived feature state.
- Prefer `@Observable` + `@MainActor` for UI-facing models on iOS 17+.
- If you must support iOS 16, keep `ObservableObject`/`@Published` at the compatibility boundary instead of mixing state systems throughout the same feature.
- Inject dependencies via protocol-based initializers.
- Keep composition/root wiring centralized.
- Avoid direct singleton access in feature code; prefer scene-owned services injected from the root.

### Scene-Owned @Environment-Based Dependency Injection

Use SwiftUI's environment to propagate scene-owned `@Observable` services throughout the view hierarchy. Own mutable dependencies at the app/scene root so previews, tests, and multi-window iPad state stay isolated.

**Injecting @Observable services via .environment():**

```swift
@MainActor @Observable
public final class Theme { /* colors, fonts, spacing */ }

@MainActor @Observable
public final class CurrentAccount { /* user session state */ }

@MainActor @Observable
public final class UserPreferences { /* persisted user settings */ }

// Own mutable services at the scene root.
// RouterPath should be owned as @State in the root view, not created inline.
struct AppSceneRoot: View {
    @State private var theme = Theme()
    @State private var currentAccount = CurrentAccount()
    @State private var userPreferences = UserPreferences()
    @State private var routerPath = RouterPath()

    var body: some View {
        ContentView()
            .environment(theme)
            .environment(currentAccount)
            .environment(userPreferences)
            .environment(routerPath)
    }
}

// In any descendant view, consume without key paths:
struct ProfileView: View {
    @Environment(Theme.self) private var theme
    @Environment(CurrentAccount.self) private var currentAccount

    var body: some View { /* use theme, currentAccount */ }
}
```

**Custom environment values with @Entry (iOS 18+):**

The `@Entry` macro eliminates the boilerplate of defining a separate `EnvironmentKey` struct. Each entry defines a default value inline.

```swift
extension EnvironmentValues {
    @Entry public var isCompact: Bool = false
    @Entry public var isSecondaryColumn: Bool = false
    @Entry public var indentationLevel: UInt = 0
}

// Inject via key path:
ChildView()
    .environment(\.isCompact, true)
    .environment(\.isSecondaryColumn, true)

// Read in child:
@Environment(\.isCompact) private var isCompact
```

> Note: `@Entry` requires iOS 18+ / macOS 15+. For earlier targets, define `EnvironmentKey` conformances manually:
>
> ```swift
> private struct IsCompactKey: EnvironmentKey {
>     static let defaultValue = false
> }
> extension EnvironmentValues {
>     var isCompact: Bool {
>         get { self[IsCompactKey.self] }
>         set { self[IsCompactKey.self] = newValue }
>     }
> }
> ```

Reserve singletons for process-wide utilities that do not carry scene-specific state, such as logging sinks or image caches.

**Centralizing environment wiring:**

Create an extension to apply all scoped environments in one call, keeping the injection site DRY without reaching into globals:

```swift
extension View {
    func withEnvironments(
        theme: Theme,
        currentAccount: CurrentAccount,
        userPreferences: UserPreferences,
        routerPath: RouterPath
    ) -> some View {
        environment(theme)
            .environment(currentAccount)
            .environment(userPreferences)
            .environment(routerPath)
    }
}

// Usage — the caller owns each dependency via @State:
struct TabShellView: View {
    @State private var theme = Theme()
    @State private var currentAccount = CurrentAccount()
    @State private var userPreferences = UserPreferences()
    @State private var routerPath = RouterPath()

    var body: some View {
        DetailView()
            .withEnvironments(
                theme: theme,
                currentAccount: currentAccount,
                userPreferences: userPreferences,
                routerPath: routerPath
            )
    }
}
```

## 3. Concurrency

- Use structured concurrency (`Task`, `async/await`).
- Use `withTaskGroup` / `withThrowingTaskGroup` for structured parallel work (e.g., fetching multiple independent resources concurrently).
- Cancel long-running work when view disappears or inputs change.
- Prefer `.task(id:)` for input-driven reloads.
- Keep UI mutations on MainActor.
- Avoid unscoped fire-and-forget tasks in UI code.

## 4. Swift 6 Concurrency

### Adopt Swift 6 Language Mode

Enable strict concurrency per target in Package.swift:

```swift
.target(
  name: "MyFeature",
  swiftSettings: [
    .swiftLanguageMode(.v6)
  ]
)
```

- `swift-tools-version: 6.0` is sufficient for `.swiftLanguageMode(.v6)`. Only bump to `6.2` if you need 6.2-specific features such as `.defaultIsolation(MainActor.self)`. Set `.swiftLanguageMode(.v6)` on every target.
- Data-only packages (Models, Network) use `.swiftLanguageMode(.v6)` alone.
- UI feature packages add `.defaultIsolation(MainActor.self)` so all declarations are main-actor by default, reducing annotation noise:

```swift
// UI feature target — Timeline, Account, StatusKit, etc.
swiftSettings: [
  .swiftLanguageMode(.v6),
  .defaultIsolation(MainActor.self)
]
```

### @MainActor and @Observable UI Models

In Swift 6, `@Observable` models mutated from SwiftUI views should be `@MainActor`-isolated to guarantee property access happens on the main thread. `@Observable` classes are not `Sendable` by default. Mark UI-facing reference models and view models `@MainActor` explicitly (or rely on `defaultIsolation` at the package level):

```swift
@MainActor
@Observable class TimelineViewModel {
  var statusesState: StatusesState = .loading
  var client: MastodonClient?
  // All property access and methods are main-actor-isolated
}
```

In packages with `.defaultIsolation(MainActor.self)`, the `@MainActor` annotation is implicit -- you only need `@Observable class`.

> **Protocol constraints:** `@Observable` is a macro, not a protocol you can use as a generic constraint. For protocol-based DI with feature models or view models, define the property and method requirements the view needs -- do not attempt to constrain a protocol to `Observable` conformance.

### Sendable Conformance

All types that cross isolation boundaries must be `Sendable`.

- **Value types with immutable/`Sendable` fields** get automatic conformance. Enums and structs with `Sendable` stored properties just declare it:

```swift
public enum TimelineFilter: Hashable, Equatable, Sendable {
  case home, local, federated, trending
  case hashtag(tag: String, accountId: String?)
  // ...
}
```

- **Immutable reference types** -- classes where every stored property is `let` and itself `Sendable` -- use a retroactive extension to assert conformance:

```swift
public final class Status: Codable, Identifiable, Equatable, Hashable {
  public let id: String
  public let content: HTMLString
  // ... all properties are `let`
}

// Every property in Status is immutable.
extension Status: Sendable {}
```

- **`@unchecked Sendable`** -- use when the compiler cannot prove safety but you guarantee it (e.g., mutable state behind a lock, or types with non-`Sendable` fields that are effectively immutable after init):

```swift
// Struct with internally mutable NSRegularExpression fields set once at init
public struct HTMLString: Codable, Equatable, Hashable, @unchecked Sendable {
  public var htmlValue: String = ""
  private var main_regex: NSRegularExpression?
  // ...
}

// UI-facing main-actor service owned by the app/intents root.
// @MainActor guarantees all access is on the main thread,
// making @unchecked Sendable safe despite the mutable stored property.
@MainActor @Observable
public final class AppIntentService: @unchecked Sendable {
  var handledIntent: HandledIntent?
}
```

- **`@retroactive Sendable`** -- when conforming third-party or system types you don't own:

```swift
extension NSExtensionContext: @unchecked @retroactive Sendable {}
```

- **Protocol constraints** -- require `Sendable` on protocols that define cross-isolation contracts:

```swift
public protocol Endpoint: Sendable {
  func path() -> String
  func queryItems() -> [URLQueryItem]?
}

protocol TimelineStatusFetching: Sendable {
  func fetchFirstPage(client: MastodonClient?, timeline: TimelineFilter) async throws -> [Status]
}
```

### OSAllocatedUnfairLock for Sendable Mutable State

When a class needs to be both `@Observable` and `Sendable` with mutable state, use `OSAllocatedUnfairLock` to protect mutable fields:

```swift
// @Observable synthesizes mutable backing storage, so checked `Sendable` won't compile.
// Use `@unchecked Sendable` when you protect all mutable state with a lock.
@Observable
public final class MastodonClient: Equatable, Identifiable, Hashable, @unchecked Sendable {
  public let server: String

  private let critical: OSAllocatedUnfairLock<Critical>
  private struct Critical: Sendable {
    var oauthApp: InstanceApp?
    var oauthToken: OauthToken?
    var connections: Set<String> = []
  }

  public var isAuth: Bool {
    critical.withLock { $0.oauthToken != nil }
  }
}
```

> **iOS 18+ / macOS 15+:** Prefer `Synchronization.Mutex` (SE-0433) from the standard library over `OSAllocatedUnfairLock`. It is a pure-Swift, non-copyable type with the same semantics. Keep `OSAllocatedUnfairLock` for iOS 17 deployment targets.

### Actors for Background Data Processing

Use actors when mutable state needs async access but not synchronous reads from the main thread:

```swift
actor TimelineDatasource {
  private var items: [TimelineItem] = []

  func get() -> [Status] {
    items.compactMap { if case .status(let s) = $0 { s } else { nil } }
  }
  func set(_ statuses: [Status]) { items = statuses.map { .status($0) } }
  func reset() { items = [] }
}
```

Actors are implicitly `Sendable`. All external access requires `await`:

```swift
await datasource.set(statuses)
let items = await datasource.getFilteredItems()
```

Use a private actor for serializing background work (e.g., sequential decoding):

```swift
private actor StreamEventDecoder {
  private var lastTask: Task<DecodedEvent, Error>?

  func decode(data: Data) async throws -> DecodedEvent {
    let previousTask = lastTask
    let task = Task {
      if let previousTask { _ = try? await previousTask.value }
      return try decodeSequentially(data: data)
    }
    lastTask = task
    return try await task.value
  }

  private nonisolated func decodeSequentially(data: Data) throws -> DecodedEvent {
    // Pure computation, no actor state needed -- nonisolated avoids a hop
    let decoder = JSONDecoder()
    return try decoder.decode(RawStreamEvent.self, from: data)
  }
}
```

### nonisolated

Use `nonisolated` to opt specific members out of actor/global-actor isolation:

- **Computed properties that access only `Sendable` immutable state** (common in `Identifiable` conformance on `@MainActor` types):

```swift
@MainActor
public struct Language: Identifiable, Equatable, Hashable {
  public nonisolated var id: String { isoCode }
  public let isoCode: String
}
```

- **Protocol requirements that cannot be isolated** (e.g., `CaseIterable.allCases`, `AppEntity` properties):

```swift
public nonisolated static var allCases: [Self] {
  [.iconWithText, .iconOnly]
}

public nonisolated var displayRepresentation: DisplayRepresentation {
  DisplayRepresentation(title: "\(timeline.title)")
}
```

- **Pure functions on actors** that don't read actor state -- avoids an unnecessary actor hop:

```swift
// Inside an actor
private nonisolated func decodeEvent(rawEvent: RawStreamEvent, decoder: JSONDecoder)
  throws -> (any StreamEvent)? { /* ... */ }
```

- **`nonisolated(unsafe)`** (Swift 5.10 / SE-0412) -- for global or static stored properties that cannot satisfy `Sendable` but are known safe at runtime (e.g., loggers, formatters initialized once and never mutated):

```swift
nonisolated(unsafe) static let dateFormatter: DateFormatter = {
    let f = DateFormatter()
    f.dateStyle = .medium
    return f
}()
```

- **Delegate callbacks** that are called from non-main-actor contexts, trampolining back via `Task { @MainActor in }`:

```swift
nonisolated func safariViewControllerDidFinish(_: SFSafariViewController) {
  Task { @MainActor in
    window?.rootViewController?.dismiss(animated: true)
  }
}
```

### sending Keyword (SE-0430)

The `sending` keyword marks parameters and return values that transfer ownership across isolation boundaries. The compiler verifies the value is not used after being sent, preventing data races without requiring `Sendable` conformance.

Use `sending` when passing non-`Sendable` values into a different isolation domain:

```swift
func process(_ items: sending [MediaContainer]) async { /* ... */ }
```

This is useful for types that are expensive to make `Sendable` or contain non-`Sendable` framework types. The caller gives up access after passing the value.

### Sendable Snapshots for Cross-Isolation Data

When a `@MainActor` `@Observable` class needs to hand data to an actor, create a `Sendable` snapshot struct:

```swift
@MainActor
@Observable public class TimelineContentFilter {
  public struct Snapshot: Sendable {
    public let showBoosts: Bool
    public let showReplies: Bool
    // ...
  }

  public func snapshot() -> Snapshot {
    Snapshot(showBoosts: showBoosts, showReplies: showReplies, /* ... */)
  }
}

// In the actor:
let snapshot = await contentFilter.snapshot()
return items.filter { shouldShow($0, filter: snapshot) }
```

### Migration Checklist (Swift 5 to Swift 6)

- Enable `.swiftLanguageMode(.v6)` per target. Fix errors target by target, starting with leaf packages (Models, Network).
- Add `.defaultIsolation(MainActor.self)` to UI feature packages to reduce annotation noise.
- Add `Sendable` to all types that cross isolation boundaries: model structs/enums, protocol definitions, closures.
- Use `extension MyClass: Sendable {}` for immutable `final class` types.
- Wrap mutable shared state in `OSAllocatedUnfairLock` or convert to an `actor`.
- Mark delegate callbacks `nonisolated` and trampoline to `@MainActor` via `Task`.
- Use `nonisolated` on computed properties that satisfy protocol requirements without accessing isolated state.
- Audit `@unchecked Sendable` -- each use should have a comment explaining why it is safe.

## 5. State Management

- Use local `@State` for local UI concerns only.
- Use plain value state before introducing a reference model.
- Use `@State private var model = MyFeatureModel()` to own an `@Observable` object in a view (replaces `@StateObject` from ObservableObject).
- Use `@Bindable var model` to create two-way bindings to `@Observable` properties (e.g., `$model.searchText`).
- Reach for a view model only when async orchestration, cross-section feature state, or test seams justify it.
- Use shared/global state only when truly cross-feature.
- Keep one-way data flow and derived state computed, not duplicated.
- Avoid side effects directly in body builders.

## 6. Styling and UI

- Use app tokens for color, typography, spacing, radius, borders.
- Use shared UI components for repeated patterns.
- Make list backgrounds/rows explicit to avoid platform default bleed-through.
- Keep spacing rhythm consistent between sections.
- Prefer semantic styles over hard-coded visual values.

## 7. Navigation

- Prefer value-based navigation (`NavigationLink(value:)`).
- Register destinations at `NavigationStack` root via `.navigationDestination(for:)`.
- Avoid mixing legacy destination-based links with value-based links.
- Keep route types explicit and centralized.

### Deep Linking / onOpenURL Routing

Use `onOpenURL` to handle incoming URLs (universal links, custom schemes) and route them into app navigation state.

**Centralized route definitions:**

```swift
enum RouterDestination: Hashable {
    case accountDetail(id: String)
    case statusDetail(id: String)
    case hashTag(tag: String)
    case remoteStatusDetail(url: URL)
}
```

**Router with URL parsing and navigation integration:**

```swift
@MainActor @Observable
class RouterPath {
    var path: [RouterDestination] = []

    func navigate(to destination: RouterDestination) {
        path.append(destination)
    }

    /// Handle internal URLs (tapped links within the app).
    func handle(url: URL) -> OpenURLAction.Result {
        if url.pathComponents.contains("tags"), let tag = url.pathComponents.last {
            navigate(to: .hashTag(tag: tag))
            return .handled
        } else if let id = Int(url.lastPathComponent) {
            navigate(to: .statusDetail(id: String(id)))
            return .handled
        }
        return .systemAction
    }

    /// Handle deep links from external sources (custom URL scheme).
    func handleDeepLink(url: URL) -> OpenURLAction.Result {
        guard let id = Int(url.lastPathComponent) else { return .systemAction }
        navigate(to: .statusDetail(id: String(id)))
        return .handled
    }
}
```

**Wiring onOpenURL and OpenURLAction in a ViewModifier:**

```swift
struct DeepLinkRouter: ViewModifier {
    @Environment(RouterPath.self) private var routerPath

    func body(content: Content) -> some View {
        content
            // Override in-app link taps:
            .environment(\.openURL, OpenURLAction { url in
                routerPath.handle(url: url)
            })
            // Handle external deep links (e.g., myapp://path):
            .onOpenURL { url in
                let cleaned = url.absoluteString
                    .replacingOccurrences(of: "myapp://", with: "https://")
                guard let parsed = URL(string: cleaned) else { return }
                _ = routerPath.handleDeepLink(url: parsed)
            }
    }
}
```

Key points:
- Use `.environment(\.openURL, ...)` to intercept in-app link taps before they leave the app.
- Use `.onOpenURL` for links arriving from outside (custom scheme, universal links).
- Parse the URL path components to match against known route patterns.
- Fall back to `.systemAction` for unrecognized URLs so the system browser handles them.

## 8. Logging

### Category-Based Unified Logging

Use Apple's `os.Logger` with an enum of categories for consistent, filterable diagnostics. This is always-on (not `#if DEBUG`-gated) — `os.Logger` has near-zero overhead and the OS handles filtering. Use Console.app (macOS) or Xcode console to filter by subsystem and category.

```swift
import os.log

enum AppLog {
    static let subsystem = "com.example.MyApp"

    enum Category: String {
        case networking = "Networking"
        case persistence = "Persistence"
        case auth = "Auth"
        case ui = "UI"
    }

    static func logger(_ category: Category) -> os.Logger {
        os.Logger(subsystem: subsystem, category: category.rawValue)
    }

    static let networking = logger(.networking)
    static let persistence = logger(.persistence)
    static let auth = logger(.auth)
    static let ui = logger(.ui)
}
```

Usage: `AppLog.networking.info("Request completed: \(url, privacy: .private)")`. Use `privacy: .private` for user data, file paths, and anything potentially sensitive — these are redacted in release builds but visible during debug.

## 9. Error Handling

- Use typed domain errors and map to user-facing messages.
- Provide retry paths for recoverable failures.
- Use structured logs with context (feature, operation, ids).
- Keep analytics events consistent and intentional.

### Pure Decision Engines

When a feature model, view model, or service has complex conditional logic (e.g., "should we retry this request?", "which state should we transition to?"), extract the decision into a pure struct with a static function:

```swift
struct RetryDecisionEngine {
    struct Context {
        var attemptCount: Int
        var lastError: AppError
        var elapsedTime: TimeInterval
    }

    enum Decision {
        case retry(after: TimeInterval)
        case giveUp(reason: String)
    }

    static func decide(_ context: Context) -> Decision {
        guard context.attemptCount < 3 else { return .giveUp(reason: "max retries") }
        guard context.elapsedTime < 30 else { return .giveUp(reason: "timeout") }
        let backoff = pow(2.0, Double(context.attemptCount))
        return .retry(after: backoff)
    }
}
```

Benefits: trivially testable (construct context, assert decision), no dependencies, no async, documents the rules in one place. Use this pattern whenever branching logic depends on multiple inputs and the "right answer" isn't obvious.

## 10. Accessibility and Localization

- Add accessibility labels/values/hints for controls.
- Verify Dynamic Type behavior.
- Verify contrast and tap target size.
- Externalize all user-facing strings for localization.

## 11. Performance

- Ensure stable identity for list rows.
- Keep heavy work off main thread.
- Use image caching/downsampling patterns.
- Avoid repeated expensive computations in `body`.
- Profile with Instruments for hot paths before major optimizations.

## 12. Testing

- Add or adjust tests for the feature logic that changed (view model, store, service, reducer).
- Validate loading/success/error transitions.
- Verify dependency call counts in mocks.
- Add smoke UI tests for core user flows.
- Keep preview coverage for key states.

## 13. PR Checklist

- UI follows design tokens and shared patterns
- Navigation is stable and type-safe
- State ownership and feature boundaries are clean
- Accessibility/localization addressed
- Tests updated for changed behavior
- Build and gates pass
- New files are properly included in project/workspace
