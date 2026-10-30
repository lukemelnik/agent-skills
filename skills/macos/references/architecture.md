# macOS App Architecture

## Table of Contents

1. [App Lifecycle](#1-app-lifecycle)
2. [State Management](#2-state-management)
3. [Dependency Injection](#3-dependency-injection)
4. [Module / Package Structure](#4-module--package-structure)
5. [Concurrency](#5-concurrency)
6. [Logging](#6-logging)
7. [Service Layer](#7-service-layer)
8. [When to Use AppKit vs SwiftUI vs Hybrid](#8-when-to-use-appkit-vs-swiftui-vs-hybrid)

---

## 1. App Lifecycle

### @main App Struct

Use SwiftUI `App` as entry point. Add `@NSApplicationDelegateAdaptor` for complex lifecycle needs.

```swift
@main
struct MyApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State private var appModel = AppModel()

    var body: some Scene {
        WindowGroup { ContentView().environment(appModel) }
        Settings { SettingsView() }
    }
}
```

### When to Use NSApplicationDelegate

- Custom URL scheme handling (`application(_:open:)`)
- CLI argument processing at launch
- Async shutdown orchestration
- Reopen behavior (`applicationShouldHandleReopen`)
- Dock menu, push notification registration

### Startup and Shutdown

Register services, restore state, handle launch arguments in `applicationDidFinishLaunching`. For async shutdown, return `.terminateLater` and call `NSApp.reply(toApplicationShouldTerminate:)` when done:

```swift
func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
    Task {
        await shutdownServices()  // CodeEdit: wait for LSP; IINA: wait for mpv quit
        NSApp.reply(toApplicationShouldTerminate: true)
    }
    return .terminateLater
}
```

### Ownership and Optimized Lifetimes

Make the owner of each window controller, delegate coordinator, observer, and long-running operation explicit. A weak delegate reference does not keep its delegate alive, and a local strong reference is not guaranteed to survive until the closing brace: optimized code may release it after its last use.

- Distinguish retain cycles from premature release; indiscriminate weak captures can introduce the latter while hiding the former.
- Use `withExtendedLifetime` only for a synchronous operation whose owner must remain alive through that closure. Escaping callbacks and asynchronous operations need explicit ownership/cancellation beyond it.
- Make order-sensitive shutdown, observer removal, and async cleanup explicit. Let `deinit` perform appropriate resource release, but do not rely on its timing to signal user-visible completion.
- Reproduce suspected lifetime failures in an optimized build and inspect the actual ownership graph.

### SwiftUI + AppKit Window Split

SwiftUI owns simple scenes (settings, about). AppKit handles complex window creation with custom toolbars or split views via `NSWindow` + `NSHostingView`.

---

## 2. State Management

### @Observable Is the Standard

Use `@Observable` for new macOS 14+ code. If you must support macOS 13, keep `ObservableObject`/`@Published` at the compatibility boundary instead of mixing both state systems throughout the same feature.

```swift
// In Swift 6, @Observable classes mutated from SwiftUI views should be @MainActor-isolated
@MainActor @Observable class AppModel {
    var currentProject: Project?
    var recentFiles: [URL] = []
    var isProcessing = false
}
```

### Root-Owned Mutable Services

Prefer owning mutable services at the app/window/document root and injecting them via `.environment()`. Reserve `static let shared` for effectively stateless process-wide utilities such as loggers or caches, not user/session/document state:

```swift
@MainActor @Observable class AccountService {
    var currentAccount: Account?
}

struct WorkspaceRoot: View {
    @State private var accountService = AccountService()

    var body: some View {
        ContentView()
            .environment(accountService)
    }
}
```

### @AppStorage Workaround

Can't use `@AppStorage` directly on `@Observable` (`@AppStorage` is a `DynamicProperty` that only works inside SwiftUI views). Use stored properties with `didSet` to sync with `UserDefaults` when this process owns the writes:

```swift
@Observable class Preferences {
    var showSidebar: Bool = UserDefaults.standard.bool(forKey: "showSidebar") {
        didSet { UserDefaults.standard.set(showSidebar, forKey: "showSidebar") }
    }
    var fontSize: Double = UserDefaults.standard.double(forKey: "fontSize") {
        didSet { UserDefaults.standard.set(fontSize, forKey: "fontSize") }
    }
}
```

If extensions, helper apps, or imported settings can change the same keys, reload from `UserDefaults` when the scene becomes active or after receiving an explicit sync signal.

### Optimistic Updates with Rollback

Apply changes immediately, roll back on failure (IceCubesApp `StatusDataController` pattern):

```swift
func toggleFavorite() async {
    let previous = isFavorited
    isFavorited.toggle()  // Optimistic
    do { try await api.setFavorite(item.id, isFavorited) }
    catch { isFavorited = previous }  // Rollback
}
```

### Custom Settings Property Wrapper

CodeEdit's `@AppSettings` bridges file-backed settings to SwiftUI reactivity. Implement as a `DynamicProperty` with `@State` internally, writing changes back to a shared `SettingsStore` on set.

### Thread-Safe Mutable State

Use `OSAllocatedUnfairLock` for `Sendable` types. Use `@Atomic` property wrapper when bridging C libraries:

```swift
final class ConnectionPool: Sendable {
    private let state = OSAllocatedUnfairLock(initialState: [Connection]())

    func acquire() -> Connection? {
        state.withLock { $0.isEmpty ? nil : $0.removeFirst() }
    }
}
```

---

## 3. Dependency Injection

### Recommended: @Observable + .environment()

Prefer scoped instances over global singletons. For per-window or per-document state, create instances at the appropriate scope and inject via `.environment()`:

```swift
// App-global window scene
@State private var theme = ThemeService()

// Per-window (scoped) — preferred for document/workspace state
@State private var workspace = WorkspaceModel()

// Inject both
.environment(theme).environment(workspace)

// Read in views
@Environment(ThemeService.self) var theme
@Environment(WorkspaceModel.self) var workspace
```

**Account/context switching**: replace or reconfigure the scoped service owned by the current window/document root, not a global singleton shared by every window.

### For Larger Apps: Typed Dependencies Container

Prefer a typed dependencies struct at the composition root over a stringly-typed service locator:

```swift
struct AppDependencies {
    let gitService: GitService
    let searchIndexer: SearchIndexer
    let settingsStore: SettingsStore
}

@MainActor @Observable final class WorkspaceModel {
    let dependencies: AppDependencies

    init(dependencies: AppDependencies) {
        self.dependencies = dependencies
    }
}
```

If you genuinely need runtime registration for plugins or tests, keep that registry outside app-facing view code, make lookups throwing, and avoid `as!`-based resolution.

### Scoped State

Per-window or per-document state: pass through init or `.environment()` + `@Environment(Type.self)`.

### Protocol Customization Points

When a service must customize behavior through a generic or protocol-typed caller, declare that method as a protocol requirement. An extension may supply its default implementation. A same-named method that exists only in an extension is statically selected through the protocol abstraction and is not a customization point; a concrete call may therefore look correct while the injected service uses the default. Test through the application's actual abstraction, and analyze subclass/inherited-conformance cases separately.

The protocol and lifetime checks here are informed by Emil Kowalski's [Swift guidance](https://github.com/emilkowalski/skills/blob/2d228630ba1446365f614a108cb8252f1feda202/skills/write-swift/SKILL.md), without adopting its unrelated language-version defaults.

---

## 4. Module / Package Structure

### Swift Packages for Larger Apps

IceCubesApp uses 13 packages organized by domain:

```
Packages/
├── Models/        # Leaf — no internal dependencies
├── Network/       # Depends on Models
├── Env/           # Services — depends on Models, Network
├── DesignSystem/  # Shared UI — depends on Models
├── Timeline/      # Feature — depends on Env, DesignSystem
├── Account/       # Feature — depends on Env, DesignSystem
└── StatusKit/     # Shared feature logic
```

- `Models` is a leaf, imported by everything
- Feature packages communicate only through shared types + `@Environment` services
- Each package can set its own Swift language mode and default isolation
- Benefits: compile-time boundary enforcement, parallel builds

### Feature Folders for Smaller Apps

CodeEdit uses `Features/Editor/{Models,Views,Controllers}/`. Simpler build setup, no compile-time boundaries.

### When to Choose

- **SPM packages**: 3+ developers, distinct feature domains, compile-time enforcement needed
- **Feature folders**: solo/small team, rapid iteration

---

## 5. Concurrency

See the `swift-concurrency` skill for isolation, `Sendable`, actors, and Swift 6 migration.

---

## 6. Logging

Use one `os.Logger` per subsystem/category, always on (not `#if DEBUG`-gated), with `privacy: .private` for user data and file paths. See the `build-run-debug` skill for adding and verifying runtime logs.

### Pure Decision Engines

When a reducer, ViewModel, or client has complex conditional logic (e.g., "should we keep this recording?", "should we retry this request?", "which state should we transition to?"), extract the decision into a pure struct with a static function:

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

---

## 7. Service Layer

### Protocol-Based Endpoint Pattern

Each API resource is an enum conforming to `Endpoint`. Generic client methods decode responses:

```swift
protocol Endpoint: Sendable {
    var path: String { get }
    var method: HTTPMethod { get }
    var queryItems: [URLQueryItem]? { get }
}

enum TimelineEndpoint: Endpoint {
    case home(sinceId: String?)
    case hashtag(tag: String, sinceId: String?)

    var path: String {
        switch self {
        case .home: "/api/v1/timelines/home"
        case .hashtag(let tag, _): "/api/v1/timelines/tag/\(tag)"
        }
    }
    // ...
}

// Client
func get<T: Decodable>(endpoint: some Endpoint) async throws -> T
```

Own the network client at the app or document composition root and inject it via environment or typed dependencies. Use a singleton only if the entire process truly shares one session/account context.

---

## 8. When to Use AppKit vs SwiftUI vs Hybrid

| Approach | Use When | Examples |
|----------|----------|---------|
| **Pure SwiftUI** | Utility apps, single-window, menu bar apps, settings | Menu bar extras, simple viewers |
| **Hybrid** | Custom toolbars, advanced split views, document-based, complex windows | CodeEdit, most pro macOS apps |
| **Pure AppKit** | Media/rendering (Metal, CADisplayLink — macOS 14+; CVDisplayLink is deprecated), deep event handling, responder chain, window subclassing | IINA, video editors |

### Hybrid Architecture (Most Common)

AppKit owns window chrome (NSWindow, NSToolbar, NSSplitViewController). SwiftUI renders content panes via NSHostingController:

```swift
class MainWindowController: NSWindowController {
    override func windowDidLoad() {
        let splitVC = NSSplitViewController()

        let sidebarItem = NSSplitViewItem(
            sidebarWithViewController: NSHostingController(rootView: SidebarView()))
        sidebarItem.minimumThickness = 200
        splitVC.addSplitViewItem(sidebarItem)

        let contentItem = NSSplitViewItem(
            viewController: NSHostingController(rootView: ContentView()))
        splitVC.addSplitViewItem(contentItem)

        window?.contentViewController = splitVC
        window?.toolbar = buildToolbar()
    }
}
```

### Decision Guide

1. **Start with SwiftUI** unless you know you need AppKit
2. **Add AppKit window management** for custom toolbars, multi-pane layouts, document architecture
3. **Go full AppKit** only for rendering-heavy or event-heavy apps
4. **Never mix randomly** — clear boundary: AppKit owns windows/chrome, SwiftUI owns content
