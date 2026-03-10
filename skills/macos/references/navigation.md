# macOS Navigation and Multi-Window Patterns

## Table of Contents

- [1. Choosing a Window Architecture](#1-choosing-a-window-architecture)
- [2. Document-Based Architecture](#2-document-based-architecture)
- [3. Multi-Window with SwiftUI](#3-multi-window-with-swiftui)
- [4. Tab-Based Windows](#4-tab-based-windows)
- [5. Navigation Within a Window](#5-navigation-within-a-window)
- [6. Focus and Active Window Tracking](#6-focus-and-active-window-tracking)
- [7. Toolbar and Menu Integration](#7-toolbar-and-menu-integration)
- [8. Sheets, Popovers, and Panels](#8-sheets-popovers-and-panels)

---

## 1. Choosing a Window Architecture

| App Shape | Architecture | Key Types |
|---|---|---|
| **Single-window utility / menu bar app** | One `WindowGroup`, `NavigationSplitView` for sidebar | `WindowGroup`, `MenuBarExtra` |
| **Multi-window, same type** (browser, text editor) | `WindowGroup` with typed destinations; each window independent | `WindowGroup(id:for:)` |
| **Document-based** (code editor, design tool) | `DocumentGroup` (simple) or `NSDocument`/`NSDocumentController` (complex — CodeEdit pattern) | `DocumentGroup`, `NSDocument` |
| **Mixed windows** (main + settings + inspectors) | Multiple `Window`/`WindowGroup` scenes with distinct IDs | `Window(id:)`, `Settings` |

Use `NSPanel` (not `NSWindow`) for floating/auxiliary windows — color pickers, inspectors, palettes. Panels don't steal focus and can float with `panel.isFloatingPanel = true`.

---

## 2. Document-Based Architecture

### SwiftUI `DocumentGroup`

For simple document apps with automatic open/save/recent:

```swift
@main struct MyApp: App {
    var body: some Scene {
        DocumentGroup(newDocument: TextDocument()) { file in
            ContentView(document: file.$document)
        }
    }
}
```

### NSDocument + AppKit Hybrid (CodeEdit Pattern)

The proven approach for complex document apps.

**Custom `NSDocumentController`** — controls document routing:

```swift
class WorkspaceDocumentController: NSDocumentController {
    override func openDocument(withContentsOf url: URL, display: Bool) async throws -> (NSDocument, Bool) {
        if let existing = documents.first(where: { ($0 as? WorkspaceDocument)?.fileURL == url }) {
            existing.showWindows()
            return (existing, false)
        }
        return try await super.openDocument(withContentsOf: url, display: display)
    }
}
```

**`NSDocument` subclass** — owns all per-window state:

```swift
class WorkspaceDocument: NSDocument {
    var fileManager: WorkspaceFileManager!
    var editorManager: EditorManager!
    var utilityAreaModel: UtilityAreaModel!

    override func makeWindowControllers() {
        addWindowController(WorkspaceWindowController(document: self))
    }
}
```

`makeWindowControllers()` creates: `NSWindowController` -> `NSSplitViewController` -> `NSHostingController` per pane. Each window is fully independent — state is NOT shared across windows.

**Idle document recycling** (IINA pattern): Reuse document instances instead of destroying/recreating expensive resources. Track idle state and reclaim when opening a new file.

---

## 3. Multi-Window with SwiftUI

### Typed Window Groups

```swift
@main struct MyApp: App {
    var body: some Scene {
        WindowGroup(id: "main") { MainView() }
        WindowGroup(id: "editor", for: EditorConfig.self) { $config in
            EditorView(config: config)
        }
        Settings { SettingsView() }
    }
}
```

### Opening Windows

```swift
@Environment(\.openWindow) var openWindow

func openEditor(for config: EditorConfig) {
    openWindow(value: config)
    NSApp.activate() // Useful when opening from a backgrounded agent/menu bar app and you need the app brought forward
}
```

### Typed Window Destinations (IceCubesApp Pattern)

```swift
enum WindowDestinationEditor: Codable, Hashable { case newDocument, openFile(URL) }
enum WindowDestinationMedia: Codable, Hashable { case imageViewer(URL), videoPlayer(URL) }
```

Register separate `WindowGroup(id:for:)` for each destination enum.

### Window Restoration

- SwiftUI `WindowGroup`: automatic via `Codable` conformance on the value type.
- AppKit windows: manually persist/restore in `NSWindowController.encodeRestorableState(with:)`.

---

## 4. Tab-Based Windows

macOS supports native window tabbing, letting users consolidate multiple windows into a single tabbed window — like Safari or Terminal.

### Automatic Window Tabbing

```swift
// AppKit — enable for your window class
window.tabbingMode = .preferred  // Always tab; .automatic = system default; .disallowed = never

// The system property controls the global preference
NSWindow.allowsAutomaticWindowTabbing = true  // Default is true
```

When `tabbingMode` is `.preferred`, new windows created via Cmd+N merge into the frontmost window's tab group automatically.

### Tab Group Management

```swift
// Merge a window into an existing tab group
existingWindow.addTabbedWindow(newWindow, ordered: .above)
newWindow.makeKeyAndOrderFront(nil)

// Enumerate tabs in a group
if let tabGroup = window.tabGroup {
    for tabbedWindow in tabGroup.windows {
        print(tabbedWindow.title)
    }
    // Select a specific tab
    tabGroup.selectedWindow = targetWindow
}
```

### SwiftUI Integration

SwiftUI `WindowGroup` supports automatic tabbing by default. Users can merge windows via Window > Merge All Windows. To customise:

```swift
WindowGroup {
    ContentView()
}
.commands {
    CommandGroup(after: .windowArrangement) {
        Button("New Tab") {
            // WindowGroup automatically handles tabbing when tabbingMode is .preferred
        }
        .keyboardShortcut("t", modifiers: .command)
    }
}
```

### Combining Tabs with Document Architecture

For document-based apps, tabs work naturally — each `NSDocument` gets its own tab within a window:

```swift
class WorkspaceWindowController: NSWindowController {
    override func newWindowForTab(_ sender: Any?) {
        // Called when user requests a new tab (Cmd+T or + button)
        // Pass false to avoid a visual flash — the window would briefly appear before being re-parented as a tab
        let newDocument = try? NSDocumentController.shared.openUntitledDocumentAndDisplay(false)
        if let newWindow = newDocument?.windowControllers.first?.window,
           let currentWindow = window {
            currentWindow.addTabbedWindow(newWindow, ordered: .above)
            newWindow.makeKeyAndOrderFront(nil)  // Order front after adding as tab
        }
    }
}
```

Set `window.tab.title` and `window.tab.toolTip` to customise what appears on each tab. Use `window.tab.accessoryView` for adding close or status indicators.

---

## 5. Navigation Within a Window

### Three-Column Layout (Sidebar + Content + Inspector)

**Pure SwiftUI:**

```swift
NavigationSplitView(columnVisibility: $visibility) {
    SidebarView()
} content: {
    ContentListView(selection: $selection)
} detail: {
    DetailView(item: selection)
}
```

**Hybrid (CodeEdit pattern)** — more control over collapse animations, minimum widths, divider styles:

```swift
class WorkspaceSplitViewController: NSSplitViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        let navigator = NSSplitViewItem(sidebarWithViewController: makeHosting(SidebarView()))
        let editor = NSSplitViewItem(viewController: makeHosting(EditorAreaView()))
        let inspector = NSSplitViewItem(inspectorWithViewController: makeHosting(InspectorView()))
        navigator.minimumThickness = 200; navigator.canCollapse = true
        inspector.minimumThickness = 260; inspector.canCollapse = true
        splitViewItems = [navigator, editor, inspector]
    }
}
```

Collapse/show panels via toolbar buttons or keyboard shortcuts. Persist panel visibility per window.

### Router Pattern (IceCubesApp)

`RouterPath` — an `@Observable` class per tab/section:

```swift
@Observable class RouterPath {
    var path: [RouterDestination] = []
    var presentedSheet: SheetDestination?
    func navigate(to destination: RouterDestination) { path.append(destination) }
}

enum RouterDestination: Hashable { case itemDetail(ItemID), settings, profile(UserID) }
enum SheetDestination: Identifiable {
    case newItem, editItem(ItemID)
    var id: String { /* unique per case */ }
}
```

Wire up with reusable view modifiers:

```swift
extension View {
    func withAppRouter() -> some View {
        navigationDestination(for: RouterDestination.self) { dest in
            switch dest {
            case .itemDetail(let id): ItemDetailView(id: id)
            case .settings: SettingsView()
            case .profile(let id): ProfileView(id: id)
            }
        }
    }
    func withSheetDestinations(sheetDestination: Binding<SheetDestination?>) -> some View {
        sheet(item: sheetDestination) { dest in
            switch dest {
            case .newItem: NewItemView()
            case .editItem(let id): EditItemView(id: id)
            }
        }
    }
}
```

**URL deep linking:** Intercept URLs, resolve to a `RouterDestination`, push onto the active router's path.

### Recursive Editor Layouts (CodeEdit)

For arbitrary split panes (code editors, design tools):

```swift
enum EditorLayout: Equatable {
    case one(Editor)
    case vertical(SplitViewData)
    case horizontal(SplitViewData)
}
```

`SplitViewData` manages ordered child `EditorLayout` nodes. Supports split left/right/top/bottom. Each `Editor` owns its own tab set, nav history (back/forward), and temp tabs (single-click preview vs double-click persistent).

---

## 6. Focus and Active Window Tracking

### SwiftUI Focus System

```swift
@FocusState var focusedEditor: Editor?                // Track active pane
EditorView(editor: editor).focusedValue(\.editor, editor) // Expose to menu commands (@Observable-compatible)
ContentView().focusedSceneValue(\.document, document) // Expose per-window values
```

> **Note:** `.focusedSceneValue` does not have an overload for `@Observable` objects (known API gap). Workaround: wrap in a value type (e.g., a struct holding a reference) or use `@FocusedBinding` with a `Binding`.

### Reading Focused Values in Commands

> **Note:** `@FocusedObject` and `.focusedObject()` require `ObservableObject` conformance, not `@Observable`. This is a known API gap. For `@Observable` classes, use `@FocusedValue` with a custom `FocusedValueKey` instead:

```swift
// @Observable-compatible approach using @FocusedValue
struct FocusedEditorKey: FocusedValueKey {
    typealias Value = Editor
}
extension FocusedValues {
    var editor: Editor? {
        get { self[FocusedEditorKey.self] }
        set { self[FocusedEditorKey.self] = newValue }
    }
}

// Expose in view
EditorView(editor: editor).focusedValue(\.editor, editor)

// Read in commands
struct FileCommands: Commands {
    @FocusedValue(\.editor) var editor
    var body: some Commands {
        CommandGroup(after: .saveItem) {
            Button("Format Document") { editor?.format() }.disabled(editor == nil)
        }
    }
}
```

### AppKit Active Window Tracking

Custom property wrapper (CodeEdit pattern) — observes `NSApp.keyWindow` changes:

```swift
@propertyWrapper
struct UpdatingWindowController: DynamicProperty {
    @State private var controller: WorkspaceWindowController?
    var wrappedValue: WorkspaceWindowController? { controller }
    func update() {
        let new = NSApp.keyWindow?.windowController as? WorkspaceWindowController
        if new !== controller { controller = new }
    }
}
```

> **Caveat:** Setting `@State` inside `update()` can cause infinite view update loops. Prefer observing `NSWindow.didBecomeKeyNotification` via `.onReceive(NotificationCenter.default.publisher(for: NSWindow.didBecomeKeyNotification))` instead.

Use `NSApp.mainWindow?.windowController` to find the active document from global context (IINA pattern).

---

## 7. Toolbar and Menu Integration

### SwiftUI Toolbar

```swift
.toolbar {
    ToolbarItem(placement: .navigation) {
        Button(action: toggleSidebar) { Image(systemName: "sidebar.left") }
    }
    ToolbarItem(placement: .primaryAction) {
        Button("Run") { editor?.run() }
    }
}
```

### NSToolbar (Hybrid)

Use when you need custom item types, overflow menu, user customization, or per-item validation.

```swift
class WorkspaceWindowController: NSWindowController, NSToolbarDelegate {
    func setupToolbar() {
        let toolbar = NSToolbar(identifier: "MainToolbar")
        toolbar.delegate = self
        toolbar.displayMode = .iconOnly
        window?.toolbar = toolbar
    }
    func toolbar(_ toolbar: NSToolbar, itemForItemIdentifier id: NSToolbarItem.Identifier,
                 willBeInsertedIntoToolbar flag: Bool) -> NSToolbarItem? {
        let item = NSToolbarItem(itemIdentifier: id)
        item.view = NSHostingView(rootView: ToolbarButtonView()) // Embed SwiftUI
        return item
    }
}
```

### Routing Commands to the Correct Window

Use `@FocusedObject` or `@FocusedValue` — never store a global reference to "the" editor. The focus system routes commands to the active window automatically. Enable/disable menu items by checking for `nil`.

---

## 8. Sheets, Popovers, and Panels

### Sheets

Prefer typed `item:` binding over boolean `isPresented:`:

```swift
.sheet(item: $router.presentedSheet) { destination in
    switch destination { ... }
}
```

Sheets inherit `@Environment` from the presenting view in modern SwiftUI. However, custom `EnvironmentKey` values set via `.environment()` propagate correctly, while values set on a parent `WindowGroup` do not cross into sheet windows. If a sheet doesn't receive expected environment values, add explicit `.environment()` calls on the sheet content.

### NSPanel for Floating UI

```swift
let panel = NSPanel(
    contentRect: .init(origin: .zero, size: .init(width: 280, height: 400)),
    styleMask: [.titled, .closable, .resizable, .utilityWindow, .nonactivatingPanel],
    backing: .buffered, defer: true
)
panel.isFloatingPanel = true
panel.hidesOnDeactivate = false  // Stay visible when app loses focus
panel.contentView = NSHostingView(rootView: InspectorPanelView())
```

Use `NSPanel` for: color pickers, inspectors, palette windows, tool options. Use `.nonactivatingPanel` to prevent stealing focus from the main window.

### Popovers

Use `.popover(item:arrowEdge:)` in SwiftUI. For AppKit popovers anchored to toolbar items, use `NSPopover` with `contentViewController` set to an `NSHostingController`.
