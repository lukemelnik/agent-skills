# iOS Architecture

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Architecture and DI](#2-architecture-and-di)
3. [Concurrency](#3-concurrency)
4. [State Management](#4-state-management)
5. [Styling and UI](#5-styling-and-ui)
6. [Navigation](#6-navigation)
7. [Logging](#7-logging)
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
- Inject dependencies via protocol-based initializers.
- Keep composition/root wiring centralized.
- Avoid direct singleton access in feature code; prefer scene-owned services injected from the root.

### Protocol Customization Points

Declare a method as a protocol **requirement** when conformers must customize it through generic or protocol-typed callers. A default implementation can live in an extension, but an extension-only method is not a protocol customization point.

```swift
protocol StatusProviding {
    func statusText() -> String  // Requirement: conformers can customize this.
}

extension StatusProviding {
    func statusText() -> String { "Unknown" }
}

struct ReadyStatus: StatusProviding {
    func statusText() -> String { "Ready" }
}

func label<T: StatusProviding>(for status: T) -> String {
    status.statusText()
}

// label(for: ReadyStatus()) == "Ready"
// Remove the protocol requirement and the generic call uses "Unknown".
```

Test customization through the same abstraction the application uses, not only by calling a concrete instance directly. This avoids mocks or services appearing correct in isolation but using the extension's implementation after injection. This example concerns protocol dispatch; subclass overrides and inherited conformances require separate analysis.

### Ownership and Object Lifetime

- Make the long-lived owner explicit: scene, feature, subscription, delegate coordinator, or resource manager. A weak reference observes an object; it does not keep it alive for an operation.
- Do not assume a local strong reference survives until the closing brace. Optimized code may release it after its last use. Investigate last-use lifetime when a delegate or weakly observed object disappears only in optimized builds.
- Prefer fixing ownership or restructuring a reference cycle over scattering weak captures. Use weak references where non-ownership is intentional, not as a universal fix.
- Use `withExtendedLifetime` for a narrowly defined synchronous operation that genuinely needs a strong owner kept alive. It does not keep an escaping callback or asynchronous operation alive after the closure returns; those need an explicit owner or cancellation lifecycle.
- Make order-sensitive shutdown, cancellation, and async cleanup explicit. Keep ordinary resource release in `deinit` where appropriate, but do not make user-visible completion depend on an assumed deallocation time.
- Reproduce lifetime failures in the relevant optimized build, not only Debug. Check retain cycles and premature release as different failure modes.

These craft checks are informed by Emil Kowalski's [Swift guidance](https://github.com/emilkowalski/skills/blob/2d228630ba1446365f614a108cb8252f1feda202/skills/write-swift/SKILL.md); apply the project's toolchain and actual ownership contracts rather than importing unrelated language-version defaults.

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

See the `swift-concurrency` skill. Prefer `.task(id:)` for input-driven reloads, and avoid unscoped fire-and-forget tasks in UI code. UI-facing `@Observable` models are `@MainActor`; `@Observable` is a macro, not a generic constraint, so protocol-based DI must declare the properties/methods the view needs.

## 4. State Management

- Use local `@State` for local UI concerns only.
- Use plain value state before introducing a reference model.
- Use `@State private var model = MyFeatureModel()` to own an `@Observable` object in a view (replaces `@StateObject` from ObservableObject).
- Use `@Bindable var model` to create two-way bindings to `@Observable` properties (e.g., `$model.searchText`).
- Reach for a view model only when async orchestration, cross-section feature state, or test seams justify it.
- Use shared/global state only when truly cross-feature.
- Keep one-way data flow and derived state computed, not duplicated.
- Avoid side effects directly in body builders.

## 5. Styling and UI

- Use app tokens for color, typography, spacing, radius, borders.
- Use shared UI components for repeated patterns.
- Make list backgrounds/rows explicit to avoid platform default bleed-through.
- Keep spacing rhythm consistent between sections.
- Prefer semantic styles over hard-coded visual values.

## 6. Navigation

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

## 7. Logging

Use the `ios-debugger` skill to capture simulator logs. Use `os.Logger` with category enums and `privacy: .private` for user data; never `print`.

## 8. Error Handling

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

## 9. Accessibility and Localization

- Add accessibility labels/values/hints for controls.
- Verify Dynamic Type behavior.
- Verify contrast and tap target size.
- Externalize all user-facing strings for localization.

## 10. Performance

- Ensure stable identity for list rows.
- Keep heavy work off main thread.
- Use image caching/downsampling patterns.
- Avoid repeated expensive computations in `body`.
- Profile with Instruments for hot paths before major optimizations.

## 11. Testing

- Add or adjust tests for the feature logic that changed (view model, store, service, reducer).
- Validate loading/success/error transitions.
- Verify dependency call counts in mocks.
- Add smoke UI tests for core user flows.
- Keep preview coverage for key states.

## 12. PR Checklist

- UI follows design tokens and shared patterns
- Navigation is stable and type-safe
- State ownership and feature boundaries are clean
- Accessibility/localization addressed
- Tests updated for changed behavior
- Build and gates pass
- New files are properly included in project/workspace
