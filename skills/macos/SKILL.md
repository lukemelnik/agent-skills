---
name: macos
description: Build native macOS apps with SwiftUI and AppKit. Covers app architecture (lifecycle, state management, DI, modules, Swift 6 concurrency), navigation and multi-window (document-based, router pattern, split views, focus tracking), Human Interface Guidelines (menu bars, windows, toolbars, sidebars, keyboard shortcuts, popovers, menu bar extras), AppKit-SwiftUI bridging (NSViewRepresentable, NSHostingView, state management), platform capabilities (sandboxing, security-scoped bookmarks, login items, background tasks, file monitoring), undo/redo architecture, accessibility, and desktop power-user patterns. Use when building, reviewing, or refactoring macOS desktop apps.
---

# macOS Development

## Core Principles

- Mac users expect menu bars, keyboard shortcuts, and multi-window support.
- User-initiated content modifications should support Cmd+Z undo.
- Expose customization where it meaningfully helps power users, especially for toolbars and inspector/sidebar visibility.
- Respect system appearance (Dark Mode, accent color, reduce transparency).
- Support drag and drop everywhere it makes sense.
- Desktop apps are power-user tools — don't hide functionality.

### Deployment Target

- **Default: macOS 14+ (Sonoma)** — recommended for `@Observable`, `.inspector` modifier, `#Preview`, modern SwiftUI APIs.
- Use `if #available(macOS 15, *)` for macOS 15+ APIs: improved `@Observable` change tracking, new `ControlGroup` styles, `TabView` with `Tab` syntax. (`@Entry` macro generates backward-compatible code and works on macOS 10.15+.)
- macOS 13 support only when business requirements demand it.

## References

### `references/architecture.md`

Read when setting up a new macOS app, choosing state management patterns, structuring modules/packages, implementing dependency injection, adopting Swift 6 concurrency, or deciding between AppKit vs SwiftUI vs hybrid.

Covers: app lifecycle (@main + NSApplicationDelegate, async shutdown), state management (@Observable scene models, scoped environment state, @AppStorage workaround, optimistic updates, thread-safe state), DI (environment-based composition roots, typed dependencies), module structure (SPM packages vs feature folders), Swift 6 concurrency (MainActor isolation, OSAllocatedUnfairLock, actors, C library bridging queues), service layer (Endpoint enum pattern), AppKit vs SwiftUI decision guide.

### `references/navigation.md`

Read when implementing multi-window support, document-based architecture, navigation patterns, router systems, toolbar/menu integration, or managing focus across windows.

Covers: window architecture decision guide, document-based apps (DocumentGroup vs NSDocument hybrid), multi-window SwiftUI (typed WindowGroup, window destinations), navigation within a window (three-column layout, router pattern with typed enums, recursive editor layouts), focus/active window tracking (@FocusState, @FocusedObject, Commands routing), toolbar integration (SwiftUI vs NSToolbar hybrid), sheets/popovers/NSPanel.

### `references/hig.md`

Read when building macOS UI, reviewing HIG compliance, implementing menus/toolbars/sidebars, adding keyboard shortcuts, or auditing before release.

Covers: menu bar (CRITICAL), windows (CRITICAL), keyboard (CRITICAL), toolbars, sidebars, popovers/panels, menu bar extras, undo/redo, settings window, notifications, system integration, visual design, accessibility, anti-patterns, evaluation checklist.

### `references/appkit-bridge.md`

Read when wrapping AppKit views in SwiftUI (NSViewRepresentable), embedding SwiftUI in AppKit (NSHostingView/Controller), bridging @Observable state across frameworks, or implementing views that need AppKit capabilities (NSTextView, NSTableView, drag and drop).

Covers: when to bridge (decision guide), NSViewRepresentable full protocol (coordinator lifecycle, dismantling, sizeThatFits, common pitfalls), rich text editor pattern, high-performance list pattern, drag and drop, NSHostingView/Controller, @Observable state bridging with withObservationTracking.

### `references/persistence.md`

Read when implementing data storage, choosing a persistence strategy, setting up SwiftData or Core Data, storing credentials, caching data, using NSDocument for file-based apps, or integrating SQLite/GRDB.

Covers: SwiftData (@Model, @Query, ModelContainer, relationships, predicates, CRUD), schema migration (VersionedSchema, SchemaMigrationPlan, lightweight vs custom), Core Data (NSPersistentContainer, NSFetchRequest, migration), @AppStorage (UserDefaults, custom RawRepresentable types, @Observable bridge, workspace-specific state), Keychain (Security framework, protocol-based access), Codable-to-file (JSON settings with throttled auto-save, actor-based caches), NSDocument (lifecycle, read/write, autosave, undo, NSDocumentController), security-scoped bookmarks integration (with SwiftData, UserDefaults), SQLite/GRDB (record pattern, encrypted databases, actor-based wrappers, migration system), decision guide.

### `references/testing.md`

Read when writing unit tests, UI tests, setting up mocks, testing async code, adding snapshot tests, testing document-based apps, testing menus/windows, or reviewing test coverage.

Covers: Swift Testing framework (@Test, #expect, @Suite, traits, parameterized tests), XCTest essentials (XCTestCase, assertions, expectations), testing @Observable ViewModels, async test patterns (polling waits, predicate expectations, indexing waits), protocol-based mocking (AppKit mocks, in-memory DB mocks, tracking mocks, simulating mocks), snapshot testing (NSHostingView, light/dark appearance), UI testing with XCUIApplication (launch helpers, element query organization, navigator interactions), menu testing (keyboard shortcuts, menu item state), multi-window testing (window lifecycle, tab close vs window close, different window types), testing AppKit bridges (NSViewRepresentable coordinators, snapshot verification), testing document-based apps (workspace lifecycle, file indexing, UTType detection), accessibility-based UI tests (identifiers, predicates, AppleScript), preview-based testing.

### `references/capabilities.md`

Read when implementing sandboxing, file access outside the container, persistent file/folder access, login items, background tasks, file system monitoring, or configuring entitlements.

Covers: App Sandbox (restrictions, container directory, user-selected files, rejection reasons), security-scoped bookmarks (save/restore, start/stop pairing, folder access), SMAppService login items, background operations (ProcessInfo, BGTaskScheduler, NSBackgroundActivityScheduler, sleep prevention), file system monitoring (DispatchSource, FSEventStream), entitlements quick reference.
