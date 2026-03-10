# macOS App Architecture

## Table of Contents

1. [App Lifecycle](#1-app-lifecycle)
2. [State Management](#2-state-management)
3. [Dependency Injection](#3-dependency-injection)
4. [Module / Package Structure](#4-module--package-structure)
5. [Concurrency (Swift 6)](#5-concurrency-swift-6)
6. [Service Layer](#6-service-layer)
7. [When to Use AppKit vs SwiftUI vs Hybrid](#7-when-to-use-appkit-vs-swiftui-vs-hybrid)

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

## 5. Concurrency (Swift 6)

### Adopt Swift 6 Language Mode

Enable strict concurrency checking in Package.swift or build settings:

```swift
.target(name: "MyFeature", swiftSettings: [.swiftLanguageMode(.v6)])
```

### Default Main Actor Isolation

Use `.defaultIsolation(MainActor.self)` on UI feature packages (requires swift-tools-version 6.2+; for 6.0, use `.swiftLanguageMode(.v6)` instead). Most UI code is main-actor anyway.

### Sendable

All types crossing isolation boundaries must conform to `Sendable`.

### OSAllocatedUnfairLock

Prefer over actors when you need synchronous access. Actors are implicitly `Sendable`, but all external access requires `await`, making them unsuitable when callers need synchronous reads:

```swift
// @Observable synthesizes mutable backing storage, so use @unchecked Sendable
@Observable final class CacheService: @unchecked Sendable {
    private let storage = OSAllocatedUnfairLock(initialState: [String: Data]())
    func get(_ key: String) -> Data? { storage.withLock { $0[key] } }
    func set(_ key: String, data: Data) { storage.withLock { $0[key] = data } }
}
```

### Actors for Data Sources

Use actors for background data processing (IceCubesApp's `TimelineDatasource`):

```swift
actor TimelineDatasource {
    private var events: [TimelineEvent] = []
    func append(_ newEvents: [TimelineEvent]) { events.append(contentsOf: newEvents) }
    func filtered(matching query: String) -> [TimelineEvent] {
        events.filter { $0.content.localizedCaseInsensitiveContains(query) }
    }
}
```

### Dedicated DispatchQueues for C Libraries

IINA pattern — one queue per subsystem (events, rendering). Dispatch to main thread from C callbacks:

```swift
private let eventQueue = DispatchQueue(label: "com.app.player.events")

mpv_set_wakeup_callback(handle, { ctx in
    let player = Unmanaged<MediaPlayer>.fromOpaque(ctx!).takeUnretainedValue()
    player.eventQueue.async { player.processEvents() }
}, Unmanaged.passUnretained(self).toOpaque())

// In processEvents():
DispatchQueue.main.async { self.handleEvent(event) }
```

### Energy-Aware Patterns

- Stop timers when window not visible, idle display links when paused
- Check `ProcessInfo.processInfo.isLowPowerModeEnabled`

---

## 6. Service Layer

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

## 7. When to Use AppKit vs SwiftUI vs Hybrid

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
