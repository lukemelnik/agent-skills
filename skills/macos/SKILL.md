---
name: macos
description: Build native macOS apps with SwiftUI and AppKit: architecture, navigation and multi-window, HIG, AppKit bridging, sandboxing and platform capabilities, persistence, and testing. Use when building, reviewing, or refactoring macOS desktop apps.
---

# macOS Development

## Quick start

Choose the narrowest skill that matches the request:

- **General macOS architecture, UI, navigation, capabilities, persistence, or HIG questions**: stay in this `macos` skill and load the relevant reference.
- **Protocol customization or object-lifetime bug**: load `references/architecture.md` for dispatch through abstractions, explicit ownership, and optimized-build diagnosis.
- **Build, launch, logs, test failures, or shell-first debugging**: use `build-run-debug`.
- **Window or scene chrome/placement behavior**: use `window-management`.
- **Modern Liquid Glass adoption**: use `liquid-glass`.
- **Signing, notarization, archiving, or distribution**: use `apple-release`.
- **Actor isolation, Sendable, or Swift 6.2 concurrency issues**: use `swift-concurrency`.

Prefer the focused skill when the user request is clearly narrower than broad macOS app development.

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

Read when setting up a new macOS app, choosing state management patterns, structuring modules/packages, implementing dependency injection, or deciding between AppKit vs SwiftUI vs hybrid.

Covers: app lifecycle (@main + NSApplicationDelegate, async shutdown, ownership and optimized object lifetimes), protocol customization-point dispatch, state management (@Observable scene models, scoped environment state, @AppStorage workaround, optimistic updates, thread-safe state), DI (environment-based composition roots, typed dependencies), module structure (SPM packages vs feature folders), pure decision engines (extracting complex branching into testable structs), service layer (Endpoint enum pattern), AppKit vs SwiftUI decision guide.

### `references/navigation.md`

Read when implementing multi-window support, document-based architecture, navigation patterns, router systems, toolbar/menu integration, or managing focus across windows.

Covers: window architecture decision guide, document-based apps (DocumentGroup vs NSDocument hybrid), multi-window SwiftUI (typed WindowGroup, window destinations), navigation within a window (three-column layout, router pattern with typed enums, recursive editor layouts), focus/active window tracking (@FocusState, @FocusedObject, Commands routing), toolbar integration (SwiftUI vs NSToolbar hybrid), sheets/popovers/NSPanel.

### `references/hig.md`

Read when building macOS UI, reviewing HIG compliance, implementing menus/toolbars/sidebars, adding keyboard shortcuts, or auditing before release.

Covers: menu bar (CRITICAL), windows (CRITICAL), keyboard, toolbars, sidebars, popovers/panels, menu bar extras, undo/redo, settings window, notifications, system integration, anti-patterns, evaluation checklist.

### `references/appkit-bridge.md`

Read when wrapping AppKit views in SwiftUI (NSViewRepresentable), embedding SwiftUI in AppKit (NSHostingView/Controller), bridging @Observable state across frameworks, or implementing views that need AppKit capabilities (NSTextView, NSTableView, drag and drop).

Covers: when to bridge (decision guide), NSViewRepresentable full protocol (coordinator lifecycle, dismantling, sizeThatFits, common pitfalls), rich text editor pattern, high-performance list pattern, drag and drop, NSHostingView/Controller, @Observable state bridging with withObservationTracking.

### `references/persistence.md`

Read when implementing data storage, choosing a persistence strategy, caching data, using NSDocument for file-based apps, or integrating SQLite/GRDB.

Covers: @Observable + UserDefaults bridge, Codable-to-file (JSON settings with throttled auto-save, actor-based caches, versioned settings with fixture-based migration testing), NSDocument (lifecycle, read/write, autosave, undo, NSDocumentController), security-scoped bookmarks integration (with SwiftData, UserDefaults), SQLite/GRDB (record pattern, encrypted databases, actor-based wrappers, migration system), decision guide.

### `references/testing.md`

Read when writing macOS UI tests, mocking AppKit, adding snapshot tests, testing document-based apps, testing menus/windows, or reviewing test coverage.

Covers: AppKit protocol mocks, snapshot testing (NSHostingView, light/dark appearance), UI testing with XCUIApplication (launch helpers, element query organization, navigator interactions), menu testing (keyboard shortcuts, menu item state), multi-window testing (window lifecycle, tab close vs window close, different window types), testing AppKit bridges (NSViewRepresentable coordinators, snapshot verification), testing document-based apps (workspace lifecycle, file indexing, UTType detection), accessibility-based UI tests (identifiers, predicates, AppleScript), scenario-based state machine testing (declarative time-stamped steps, dependency-injected time control).

### `references/capabilities.md`

Read when implementing sandboxing, file access outside the container, persistent file/folder access, login items, background tasks, file system monitoring, or configuring entitlements.

Covers: App Sandbox (restrictions, container directory, user-selected files, rejection reasons), security-scoped bookmarks (save/restore, start/stop pairing, folder access), SMAppService login items, background operations (ProcessInfo, BGTaskScheduler, NSBackgroundActivityScheduler, sleep prevention), file system monitoring (DispatchSource, FSEventStream), entitlements quick reference.
