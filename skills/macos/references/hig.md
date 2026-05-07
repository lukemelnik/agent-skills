# macOS Human Interface Guidelines

## Table of Contents

1. [Menu Bar](#1-menu-bar) — CRITICAL
2. [Windows](#2-windows) — CRITICAL
3. [Toolbars](#3-toolbars) — HIGH
4. [Sidebars](#4-sidebars) — HIGH
5. [Keyboard](#5-keyboard) — CRITICAL
6. [Pointer and Mouse](#6-pointer-and-mouse) — HIGH
7. [Popovers and Panels](#7-popovers-and-panels) — HIGH
8. [Menu Bar Extras](#8-menu-bar-extras) — HIGH
9. [Undo/Redo Architecture](#9-undoredo-architecture) — CRITICAL
10. [Settings Window](#10-settings-window) — HIGH
11. [Notifications and Alerts](#11-notifications-and-alerts) — MEDIUM
12. [System Integration](#12-system-integration) — MEDIUM
13. [Printing](#13-printing) — MEDIUM
14. [Services Menu](#14-services-menu) — MEDIUM
15. [Table View](#15-table-view) — HIGH
16. [Visual Design](#16-visual-design) — HIGH
17. [Accessibility](#17-accessibility) — HIGH
18. [Anti-Patterns](#anti-patterns)
19. [Evaluation Checklist](#evaluation-checklist)

---

## 1. Menu Bar
**CRITICAL**

### 1.1 — Provide Standard Menus

Full desktop apps usually expose **App**, **Edit**, **View**, **Window**, and **Help** menus; document-based apps also expose **File**. Menu bar extras, agent apps, and single-purpose utilities can expose a smaller command surface that matches their scene model.

```swift
// SwiftUI
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .commands {
            CommandGroup(after: .newItem) {
                Button("New from Template...") { newFromTemplate() }
                    .keyboardShortcut("T", modifiers: [.command, .shift])
            }
            CommandMenu("Canvas") {
                Button("Zoom to Fit") { zoomToFit() }
                    .keyboardShortcut("0", modifiers: .command)
                Divider()
                Button("Add Artboard") { addArtboard() }
                    .keyboardShortcut("A", modifiers: [.command, .shift])
            }
        }
    }
}
```

```swift
// AppKit
let editMenu = NSMenu(title: "Edit")
let undoItem = NSMenuItem(title: "Undo", action: #selector(UndoManager.undo), keyEquivalent: "z")
let redoItem = NSMenuItem(title: "Redo", action: #selector(UndoManager.redo), keyEquivalent: "Z")
editMenu.addItem(undoItem)
editMenu.addItem(redoItem)
editMenu.addItem(.separator())
```

### 1.2 — Keyboard Shortcuts for Common Actions

Standard actions must use the conventional shortcuts below. Frequently-used app-specific actions should also have shortcuts. Rarely-used or context-dependent items (e.g., dynamic submenus, one-time setup actions) don't need shortcuts:

| Action | Shortcut |
|--------|----------|
| New | Cmd+N |
| Open | Cmd+O |
| Close | Cmd+W |
| Save | Cmd+S |
| Save As | Cmd+Shift+S |
| Print | Cmd+P |
| Undo | Cmd+Z |
| Redo | Cmd+Shift+Z |
| Cut / Copy / Paste | Cmd+X / C / V |
| Select All | Cmd+A |
| Find | Cmd+F |
| Find Next / Previous | Cmd+G / Cmd+Shift+G |
| Preferences/Settings | Cmd+, |
| Hide App | Cmd+H |
| Quit | Cmd+Q |
| Minimize | Cmd+M |
| Fullscreen | Fn+F (Globe+F) or Cmd+Ctrl+F |

Custom shortcuts: Cmd+letter for primary, Cmd+Shift for variants, Cmd+Option for alternatives, Cmd+Ctrl for window/view controls.

### 1.3 — Dynamic Menu Updates

Disable unavailable items, update titles contextually ("Undo Typing" not "Undo"), toggle checkmarks.

```swift
// SwiftUI
CommandGroup(replacing: .toolbar) {
    Button(showingSidebar ? "Hide Sidebar" : "Show Sidebar") {
        showingSidebar.toggle()
    }
    .keyboardShortcut("S", modifiers: [.command, .control])
}
```

```swift
// AppKit
override func validateMenuItem(_ menuItem: NSMenuItem) -> Bool {
    if menuItem.action == #selector(delete(_:)) {
        menuItem.title = selectedItems.count > 1
            ? "Delete \(selectedItems.count) Items"
            : "Delete"
        return !selectedItems.isEmpty
    }
    return super.validateMenuItem(menuItem)
}
```

### 1.4 — Contextual Menus

Provide right-click context menus on content elements where secondary actions are useful (list items, documents, media, canvas objects). Not every control needs one — standard buttons, toggles, and labels typically don't.

```swift
Text(item.name)
    .contextMenu {
        Button("Rename...") { rename(item) }
        Button("Duplicate") { duplicate(item) }
        Divider()
        Button("Delete", role: .destructive) { delete(item) }
    }
```

### 1.5 — App Menu Structure

When the app menu is visible, it should contain About, Settings (Cmd+,), Services, Hide App, Hide Others, Show All, and Quit.

```swift
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup { ContentView() }
        Settings { SettingsView() }  // Automatically wired to Cmd+,
    }
}
```

---

## 2. Windows
**CRITICAL**

### 2.1 — Resizable with Sensible Minimums

Main document/content windows should generally be freely resizable. Only cap the size when the content has real layout constraints; utility panels and tightly scoped inspectors can be intentionally smaller or fixed.

```swift
// SwiftUI
WindowGroup {
    ContentView()
        .frame(minWidth: 600, minHeight: 400)
}
.defaultSize(width: 900, height: 600)

// AppKit
window.minSize = NSSize(width: 600, height: 400)
```

### 2.2 — Support Fullscreen and Split View

```swift
// AppKit
window.collectionBehavior.insert(.fullScreenPrimary)
// SwiftUI gets fullscreen automatically
```

### 2.3 — Multiple Windows

Support multiple windows unless single-purpose utility. Use `WindowGroup` or `DocumentGroup`.

### 2.4 — Title Bar Shows Document Info

Show document name, support proxy icon, show edited state, support title bar renaming.

```swift
window.representedURL = document.fileURL
window.title = document.displayName
window.isDocumentEdited = document.hasUnsavedChanges
```

### 2.5 — Remember Window State

```swift
// AppKit
window.setFrameAutosaveName("MainWindow")

// SwiftUI — automatic with WindowGroup
WindowGroup(id: "main") { ContentView() }
    .defaultPosition(.center)
```

### 2.6 — Traffic Light Buttons

Never hide or reposition close/minimize/zoom. Custom title bar must preserve them.

```swift
window.titlebarAppearsTransparent = true
window.styleMask.insert(.fullSizeContentView)
```

---

## 3. Toolbars
**HIGH**

### 3.1 — Unified Title Bar and Toolbar

```swift
// SwiftUI
WindowGroup {
    ContentView()
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button(action: compose) {
                    Label("Compose", systemImage: "square.and.pencil")
                }
            }
        }
}
.windowToolbarStyle(.unified)

// AppKit
window.titleVisibility = .hidden
window.toolbarStyle = .unified
```

### 3.2 — User-Customizable Toolbars

```swift
.toolbar(id: "main") {
    ToolbarItem(id: "compose", placement: .primaryAction) {
        Button(action: compose) {
            Label("Compose", systemImage: "square.and.pencil")
        }
    }
    ToolbarItem(id: "filter", placement: .secondaryAction) {
        Button(action: toggleFilter) {
            Label("Filter", systemImage: "line.3.horizontal.decrease")
        }
    }
}
.toolbarRole(.editor)
```

### 3.3 — Segmented Controls for View Switching

```swift
ToolbarItem(placement: .principal) {
    Picker("View Mode", selection: $viewMode) {
        Label("List", systemImage: "list.bullet").tag(ViewMode.list)
        Label("Grid", systemImage: "square.grid.2x2").tag(ViewMode.grid)
    }
    .pickerStyle(.segmented)
}
```

### 3.4 — Search Field in Toolbar

```swift
NavigationSplitView {
    SidebarView()
} detail: {
    ContentListView()
        .searchable(text: $searchText, placement: .toolbar, prompt: "Search items")
}
```

### 3.5 — Toolbar Labels and Icons

Items should have both an SF Symbol and text label via `Label`. Icons only in compact mode.

---

## 4. Sidebars
**HIGH**

### 4.1 — Leading Edge, Collapsible

```swift
NavigationSplitView(columnVisibility: $columnVisibility) {
    List(selection: $selection) {
        Section("Library") {
            Label("All Items", systemImage: "tray.full")
            Label("Favorites", systemImage: "star")
            Label("Recent", systemImage: "clock")
        }
        Section("Tags") {
            ForEach(tags) { tag in
                Label(tag.name, systemImage: "tag")
            }
        }
    }
    .navigationSplitViewColumnWidth(min: 180, ideal: 220, max: 320)
} detail: {
    DetailView(selection: selection)
}
.navigationSplitViewStyle(.prominentDetail)
```

### 4.2 — Source List Style

`.listStyle(.sidebar)` for translucent vibrancy.

### 4.3 — Outline Views for Hierarchies

```swift
List(selection: $selection) {
    OutlineGroup(rootNodes, children: \.children) { node in
        Label(node.name, systemImage: node.icon)
    }
}
```

### 4.4 — Drag to Reorder

```swift
ForEach(favorites) { item in
    Label(item.name, systemImage: item.icon)
}
.onMove { source, destination in
    favorites.move(fromOffsets: source, toOffset: destination)
}
```

### 4.5 — Badge Counts

```swift
Label("Inbox", systemImage: "tray")
    .badge(unreadCount)
```

---

## 5. Keyboard
**CRITICAL**

### 5.1 — Keyboard Shortcuts for Common Actions

Frequently-used actions should have keyboard equivalents. Standard system shortcuts are mandatory. Not every menu item or button needs a shortcut — prioritize actions users perform repeatedly.

| Modifier | Usage |
|----------|-------|
| Cmd+letter | Primary actions |
| Cmd+Shift+letter | Variant of primary |
| Cmd+Option+letter | Alternative mode |
| Cmd+Ctrl+letter | Window/view controls |
| Ctrl+letter | Emacs-style text nav |

### 5.2 — Full Keyboard Navigation

Tab between controls, arrow keys within lists/grids/tables, Shift+Tab for reverse.

```swift
struct ContentView: View {
    @FocusState private var focusedField: Field?

    var body: some View {
        VStack {
            TextField("Name", text: $name)
                .focused($focusedField, equals: .name)
            TextField("Email", text: $email)
                .focused($focusedField, equals: .email)
        }
        .onSubmit { advanceFocus() }
    }
}
```

### 5.3 — Escape to Cancel or Close

Esc dismisses popovers, sheets, dialogs. In text fields, reverts to previous value.

```swift
// AppKit
override func cancelOperation(_ sender: Any?) {
    dismiss(nil)
}
```

### 5.4 — Return for Default Action

```swift
Button("Save") { save() }
    .keyboardShortcut(.defaultAction)  // Enter

Button("Cancel") { cancel() }
    .keyboardShortcut(.cancelAction)   // Esc
```

### 5.5 — Delete for Removal

Delete key removes selected items. Cmd+Delete for Trash. Always support Cmd+Z to undo.

### 5.6 — Space for Quick Look

```swift
List(selection: $selection) {
    ForEach(files) { file in
        FileRow(file: file)
    }
}
.quickLookPreview($quickLookItem, in: fileURLs)  // quickLookItem: Binding<URL?>, fileURLs: [URL]
```

### 5.7 — Arrow Key Navigation

Up/Down move selection. Left/Right collapse/expand. Cmd+Up/Down goes to beginning/end.

---

## 6. Pointer and Mouse
**HIGH**

### 6.1 — Hover States

```swift
struct HoverableRow: View {
    @State private var isHovered = false

    var body: some View {
        HStack {
            Text(item.name)
            Spacer()
            if isHovered {
                Button("Edit") { edit() }
                    .buttonStyle(.borderless)
            }
        }
        .padding(8)
        .background(isHovered ? Color.primary.opacity(0.05) : .clear)
        .cornerRadius(6)
        .onHover { hovering in isHovered = hovering }
    }
}
```

### 6.2 — Right-Click on Content

Content elements (list items, documents, canvas objects, media) should respond to right-click with contextual menus offering relevant secondary actions. Standard controls (buttons, toggles, text fields) don't need custom context menus.

### 6.3 — Drag and Drop

```swift
ForEach(items) { item in
    ItemView(item: item)
        .draggable(item)
}
.dropDestination(for: Item.self) { items, location in
    handleDrop(items, at: location)
    return true
}

// File drops from Finder
.dropDestination(for: URL.self) { urls, location in
    importFiles(urls)
    return true
}
```

### 6.4 — Scroll Behavior

Support trackpad (smooth/inertial) and mouse wheel (discrete). Elastic bounce at boundaries.

### 6.5 — Cursor Changes

Pointer for clickable, I-beam for text, crosshair for drawing, resize at edges, grab hand for draggable.

```swift
// AppKit
override func resetCursorRects() {
    addCursorRect(bounds, cursor: .crosshair)
}
```

### 6.6 — Multi-Selection

Cmd+Click for non-contiguous, Shift+Click for range.

```swift
Table(items, selection: $selectedItems) {
    TableColumn("Name", value: \.name)
    TableColumn("Date", value: \.dateFormatted)
    TableColumn("Size", value: \.sizeFormatted)
}
```

---

## 7. Popovers and Panels
**HIGH**

### 7.1 — Popovers for Inline Editing

Use for quick edits, pickers, transient settings. Dismiss on click-outside. No explicit confirmation needed.

```swift
Button("Edit Color") { showPopover = true }
    .popover(isPresented: $showPopover, arrowEdge: .bottom) {
        ColorPickerView(color: $selectedColor)
            .padding()
            .frame(width: 260)
    }
```

### 7.2 — Popover vs Sheet vs Panel

- **Popover**: single-purpose, non-modal, anchored to trigger, click-outside dismisses
- **Sheet**: multi-step workflow, requires explicit save/cancel, blocks parent window
- **Panel (Inspector)**: persistent, floats alongside content, user-toggled

### 7.3 — Inspector Panels

```swift
// SwiftUI (macOS 14+)
NavigationSplitView {
    SidebarView()
} detail: {
    CanvasView()
        .inspector(isPresented: $showInspector) {
            InspectorView(selection: $selection)
                .inspectorColumnWidth(min: 200, ideal: 260, max: 320)
        }
}
```

```swift
// AppKit — Utility panel
let panel = NSPanel(
    contentRect: NSRect(x: 0, y: 0, width: 260, height: 400),
    styleMask: [.titled, .closable, .utilityWindow, .nonactivatingPanel],
    backing: .buffered, defer: true
)
panel.isFloatingPanel = true
panel.hidesOnDeactivate = false
```

---

## 8. Menu Bar Extras
**HIGH**

### 8.1 — MenuBarExtra in SwiftUI

```swift
@main
struct MyUtilityApp: App {
    var body: some Scene {
        // Rich popover-style UI
        MenuBarExtra("Color Picker", systemImage: "eyedropper") {
            ColorPickerMenu()
        }
        .menuBarExtraStyle(.window)

        // Standard menu appearance
        MenuBarExtra("Utility", systemImage: "gear") {
            Button("Action One") { actionOne() }
            Button("Action Two") { actionTwo() }
            Divider()
            Button("Quit") { NSApp.terminate(nil) }
                .keyboardShortcut("Q")
        }
        .menuBarExtraStyle(.menu)
    }
}
```

### 8.2 — NSStatusItem (AppKit)

```swift
class StatusBarController {
    private var statusItem: NSStatusItem

    init() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        if let button = statusItem.button {
            button.image = NSImage(systemSymbolName: "eyedropper", accessibilityDescription: "Color Picker")
            button.action = #selector(togglePopover)
        }
    }
}
```

### 8.3 — Menu Bar App Guidelines

- Include Quit (Cmd+Q) in the menu
- Clear icon communicating the app's purpose
- No main window → agent app: `LSUIElement = YES` in Info.plist
- Consider offering both Dock icon and menu bar item (user preference)
- Keep menu bar UI lightweight — complex workflows should open a window

---

## 9. Undo/Redo Architecture
**CRITICAL**

### 9.1 — UndoManager in SwiftUI

`registerUndo(withTarget:handler:)` requires a class (AnyObject) target. Use an `@Observable` class as your document model, or register undo via a coordinator/controller.

```swift
@Observable class MyDocument {
    var title: String = ""
}

struct DocumentView: View {
    @Environment(\.undoManager) private var undoManager
    var document: MyDocument

    func updateTitle(_ newTitle: String) {
        let oldTitle = document.title
        document.title = newTitle
        undoManager?.registerUndo(withTarget: document) { doc in
            doc.title = oldTitle
        }
        undoManager?.setActionName("Change Title")
    }
}
```

### 9.2 — UndoManager in AppKit

```swift
func moveItems(_ items: [Item], to folder: Folder) {
    let previousLocations = items.map { ($0, $0.folder) }
    items.forEach { $0.folder = folder }

    undoManager?.registerUndo(withTarget: self) { target in
        for (item, oldFolder) in previousLocations {
            item.folder = oldFolder
        }
        target.undoManager?.registerUndo(withTarget: target) { t in
            t.moveItems(items, to: folder)
        }
        target.undoManager?.setActionName("Move Items")
    }
    undoManager?.setActionName("Move Items")
}
```

### 9.3 — Undo Grouping

Group related changes into a single undo operation. Use `beginUndoGrouping()` / `endUndoGrouping()` for multi-step edits that should undo atomically.

---

## 10. Settings Window
**HIGH**

### 10.1 — Tabbed Settings

```swift
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup { ContentView() }
        Settings {
            TabView {
                GeneralSettingsView()
                    .tabItem { Label("General", systemImage: "gear") }
                AppearanceSettingsView()
                    .tabItem { Label("Appearance", systemImage: "paintbrush") }
                ShortcutsSettingsView()
                    .tabItem { Label("Shortcuts", systemImage: "keyboard") }
                AdvancedSettingsView()
                    .tabItem { Label("Advanced", systemImage: "gearshape.2") }
            }
            .frame(width: 450)
        }
    }
}
```

### 10.2 — Settings Conventions

- Non-resizable (fixed width, height adjusts per tab)
- Form layout within each tab
- Group related controls into sections
- Changes take effect immediately (no Apply button) unless expensive or dangerous

---

## 11. Notifications and Alerts
**MEDIUM**

### 11.1 — Notifications for External Events Only

```swift
let content = UNMutableNotificationContent()
content.title = "Download Complete"
content.body = "project-assets.zip is ready"
content.sound = .default

let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil)
UNUserNotificationCenter.current().add(request)
```

### 11.2 — Alert Suppression

```swift
let alert = NSAlert()
alert.messageText = "Remove from library?"
alert.informativeText = "The file will be moved to the Trash."
alert.alertStyle = .warning
alert.addButton(withTitle: "Remove")
alert.addButton(withTitle: "Cancel")
alert.showsSuppressionButton = true

let response = alert.runModal()
if alert.suppressionButton?.state == .on {
    UserDefaults.standard.set(true, forKey: "suppressRemoveAlert")
}
```

### 11.3 — No Alerts for Success

Use inline status, toolbar badges, or subtle animations.

### 11.4 — Dock Badge

```swift
NSApp.dockTile.badgeLabel = unreadCount > 0 ? "\(unreadCount)" : nil
```

---

## 12. System Integration
**MEDIUM**

### 12.1 — Dock Menu

```swift
override func applicationDockMenu(_ sender: NSApplication) -> NSMenu? {
    let menu = NSMenu()
    menu.addItem(withTitle: "New Window", action: #selector(newWindow(_:)), keyEquivalent: "")
    for doc in recentDocuments.prefix(5) {
        menu.addItem(withTitle: doc.name, action: #selector(openRecent(_:)), keyEquivalent: "")
    }
    return menu
}
```

### 12.2 — Spotlight Integration

```swift
import CoreSpotlight

let attributeSet = CSSearchableItemAttributeSet(contentType: .text)
attributeSet.title = document.title
attributeSet.contentDescription = document.summary

let item = CSSearchableItem(uniqueIdentifier: document.id, domainIdentifier: "documents", attributeSet: attributeSet)
CSSearchableIndex.default().indexSearchableItems([item])
```

### 12.3 — Share Menu

```swift
ShareLink(item: document.url) {
    Label("Share", systemImage: "square.and.arrow.up")
}
```

### 12.4 — App Intents for Shortcuts

```swift
struct CreateDocumentIntent: AppIntent {
    static var title: LocalizedStringResource = "Create Document"

    @Parameter(title: "Title")
    var title: String

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let doc = DocumentManager.shared.create(title: title)
        return .result(value: doc.title)
    }
}
```

### 12.5 — Services Menu

Register for Services to receive text, URLs, or files from other apps.

---

## 13. Printing
**MEDIUM**

### 13.1 — Cmd+P Convention

Windowed apps with printable content should expose Cmd+P. `DocumentGroup` / `NSDocument` wire much of this for document-based apps; otherwise provide an explicit print action that drives AppKit printing (`print:` or `NSPrintOperation`).

### 13.2 — NSPrintOperation Basics

```swift
// AppKit
func printContent() {
    let printInfo = NSPrintInfo.shared
    printInfo.horizontalPagination = .fit
    printInfo.verticalPagination = .automatic
    printInfo.isHorizontallyCentered = true

    let printView = PrintableContentView(frame: contentRect)
    printView.prepareForPrint(content: document.content)

    let operation = NSPrintOperation(view: printView, printInfo: printInfo)
    operation.showsPrintPanel = true
    operation.showsProgressPanel = true
    operation.run()
}
```

### 13.3 — Printable View Preparation

Create a dedicated view for printing — don't print the on-screen view directly. The print view should:

- Use black text on white background (ignore Dark Mode)
- Remove interactive controls, toolbar UI, and scroll indicators
- Paginate long content using `knowsPageRange(_:)` and `rectForPage(_:)`

```swift
class PrintableContentView: NSView {
    override func knowsPageRange(_ range: NSRangePointer) -> Bool {
        range.pointee = NSRange(location: 1, length: pageCount)
        return true
    }

    override func rectForPage(_ page: Int) -> NSRect {
        let pageHeight = NSPrintInfo.shared.paperSize.height
            - NSPrintInfo.shared.topMargin - NSPrintInfo.shared.bottomMargin
        return NSRect(x: 0, y: CGFloat(page - 1) * pageHeight, width: bounds.width, height: pageHeight)
    }
}
```

### 13.4 — SwiftUI Print Support

> **Note:** `ImageRenderer` produces rasterized bitmap output — text is not selectable and quality degrades at high DPI. For production-quality printing, use a dedicated `NSView` subclass with `NSPrintOperation` (see §13.2–13.3).

```swift
// SwiftUI — render a view for printing (rasterized output)
Button("Print") {
    let renderer = ImageRenderer(content: PrintableView(data: document.data))
    renderer.proposedSize = .init(width: 612, height: 792) // US Letter at 72 dpi
    if let nsImage = renderer.nsImage {
        let imageView = NSImageView(image: nsImage)
        let op = NSPrintOperation(view: imageView)
        op.run()
    }
}
.keyboardShortcut("p", modifiers: .command)
```

---

## 14. Services Menu
**MEDIUM**

### 14.1 — Consuming Services

Your app automatically participates in the Services menu when it uses standard `NSTextView` or `NSTextField` controls. For custom views, register pasteboard types:

```swift
class CustomContentView: NSView {
    override func validRequestor(forSendType sendType: NSPasteboard.PasteboardType?,
                                  returnType: NSPasteboard.PasteboardType?) -> Any? {
        if sendType == .string && selectedText != nil {
            return self
        }
        return super.validRequestor(forSendType: sendType, returnType: returnType)
    }

    override func writeSelection(to pboard: NSPasteboard, types: [NSPasteboard.PasteboardType]) -> Bool {
        pboard.declareTypes([.string], owner: nil)
        pboard.setString(selectedText ?? "", forType: .string)
        return true
    }
}
```

### 14.2 — Providing Services (NSServicesProvider)

Make your app a service provider so other apps can send content to it:

```swift
// 1. Register in Info.plist
// NSServices array with NSMenuItem, NSMessage, NSSendTypes, NSReturnTypes

// 2. Implement the service handler
class ServiceProvider: NSObject {
    @objc func processText(_ pboard: NSPasteboard, userData: String, error: AutoreleasingUnsafeMutablePointer<NSString?>) {
        guard let text = pboard.string(forType: .string) else { return }
        let result = transform(text)
        pboard.clearContents()
        pboard.setString(result, forType: .string)
    }
}

// 3. Register in app delegate
func applicationDidFinishLaunching(_ notification: Notification) {
    let provider = ServiceProvider()
    NSApp.servicesProvider = provider
    NSUpdateDynamicServices()
}
```

Info.plist entry for the service:

```xml
<key>NSServices</key>
<array>
    <dict>
        <key>NSMenuItem</key>
        <dict><key>default</key><string>MyApp: Process Text</string></dict>
        <key>NSMessage</key>
        <string>processText</string>
        <key>NSSendTypes</key>
        <array><string>public.utf8-plain-text</string></array>
        <key>NSReturnTypes</key>
        <array><string>public.utf8-plain-text</string></array>
    </dict>
</array>
```

---

## 15. Table View
**HIGH**

### 15.1 — SwiftUI Table (macOS 13+)

Multi-column data display with built-in sorting and selection:

```swift
@State private var selection: Set<Item.ID> = []
@State private var sortOrder: [KeyPathComparator<Item>] = [.init(\.name, order: .forward)]

var body: some View {
    Table(items.sorted(using: sortOrder), selection: $selection, sortOrder: $sortOrder) {
        TableColumn("Name", value: \.name) { item in
            Label(item.name, systemImage: item.icon)
        }
        TableColumn("Date Modified", value: \.dateModified) { item in
            Text(item.dateModified, style: .date)
        }
        .width(min: 100, ideal: 150)
        TableColumn("Size", value: \.size) { item in
            Text(item.formattedSize)
        }
        .width(80)
    }
    .contextMenu(forSelectionType: Item.ID.self) { ids in
        Button("Delete", role: .destructive) { delete(ids) }
    } primaryAction: { ids in
        open(ids)
    }
}
```

### 15.2 — Table Conventions

- Support column resizing and reordering (automatic in SwiftUI `Table`)
- Click column header to sort; click again to reverse
- Cmd+Click for non-contiguous multi-selection, Shift+Click for range
- Double-click a row for the primary action (open/edit)
- Right-click rows for context menu
- Alternating row colours: `.alternatingRowBackgrounds()` for readability in dense data

### 15.3 — Table with Sections (macOS 14+)

```swift
Table(of: Item.self) {
    TableColumn("Name", value: \.name)
    TableColumn("Status", value: \.status)
} rows: {
    ForEach(groups) { group in
        Section(group.title) {
            ForEach(group.items) { item in
                TableRow(item)
            }
        }
    }
}
```

---

## 16. Visual Design
**HIGH**

### 16.1 — System Fonts

SF Pro for UI, SF Mono for code. Semantic styles only.

```swift
Text("Title").font(.title)
Text("Headline").font(.headline)
Text("Body").font(.body)
Text("let x = 42").font(.system(.body, design: .monospaced))
```

### 16.2 — Vibrancy and Materials

```swift
// SwiftUI
List { ... }
    .listStyle(.sidebar)  // Automatic vibrancy

// AppKit
let visualEffect = NSVisualEffectView()
visualEffect.material = .sidebar
visualEffect.blendingMode = .behindWindow
visualEffect.state = .followsWindowActiveState
```

### 16.3 — System Accent Color

Never override with brand color on standard controls.

```swift
Button("Action") { doSomething() }
    .buttonStyle(.borderedProminent)  // Uses system accent
```

### 16.4 — Full Dark Mode Support

Use semantic colors. Never `Color.white` or `Color.black` for UI surfaces.

```swift
Text("Title").foregroundStyle(.primary)
Text("Subtitle").foregroundStyle(.secondary)

RoundedRectangle(cornerRadius: 8)
    .fill(Color(nsColor: .controlBackgroundColor))
```

### 16.5 — Respect Reduce Transparency

```swift
@Environment(\.accessibilityReduceTransparency) var reduceTransparency

var body: some View {
    if reduceTransparency {
        Color(nsColor: .windowBackgroundColor)
    } else {
        // .background(.ultraThinMaterial) is the native SwiftUI approach.
        // VisualEffectView is not built-in — it requires a custom
        // NSViewRepresentable wrapper around NSVisualEffectView.
        Color.clear.background(.ultraThinMaterial)
    }
}
```

### 16.6 — Spacing

20pt window margins, 8pt between related controls, 12pt between form controls, 20pt between groups. Align to 8pt grid.

---

## 17. Accessibility
**HIGH**

### 17.1 — VoiceOver

Labels, values, hints on all controls. Test with Cmd+F5.

```swift
ColorSwatch(color: selectedColor)
    .accessibilityLabel("Selected color")
    .accessibilityValue(selectedColor.name)
    .accessibilityHint("Opens color picker")
    .accessibilityAddTraits(.isButton)
```

### 17.2 — Keyboard Accessibility

Every element reachable via keyboard. `.focusable()` and `@FocusState`. No keyboard traps.

### 17.3 — High Contrast

Test with Increase Contrast. Semantic system colors adapt automatically. Add asset catalog variants for custom colors.

### 17.4 — Reduce Motion

```swift
@Environment(\.accessibilityReduceMotion) var reduceMotion

withAnimation(reduceMotion ? nil : .spring()) {
    isExpanded.toggle()
}
```

---

## Anti-Patterns

1. **No menu bar** — every Mac app needs one.
2. **Hamburger menus** — the menu bar exists for this.
3. **Tab bars at bottom** — Mac uses sidebars and toolbars.
4. **Large touch targets** — Mac controls: 22–28pt height. Precise pointer input.
5. **Floating action buttons** — Use toolbar, menu bar, or inline buttons.
6. **Sheet for every action** — use popovers for single-purpose edits.
7. **Custom window chrome** — don't replace title bar or traffic lights.
8. **Ignoring keyboard** — power users must not need the mouse for common actions.
9. **Single-window only** — support Cmd+N unless genuinely single-purpose.
10. **Fixed window size** — users have 13" to 32" displays.
11. **No Cmd+Z undo** — user-initiated modifications to content should be undoable. System-level or preference changes don't require undo.
12. **Notification spam** — excessive = permissions revoked.
13. **Ignoring Dark Mode** — test both appearances.
14. **Hardcoded colors** — use semantic system colors.
15. **No drag and drop** — if content is visible, users expect to drag it.

---

## Evaluation Checklist

### Menu Bar
- [ ] Standard menus appropriate for the app type (windowed app vs menu bar utility)
- [ ] Common actions have keyboard shortcuts
- [ ] Menu items dynamically update
- [ ] Context menus on content elements where secondary actions apply
- [ ] When the app menu is visible, it has About, Settings, Hide, Quit

### Windows
- [ ] Freely resizable with sensible minimums
- [ ] Fullscreen and Split View work
- [ ] Multiple windows supported (if appropriate)
- [ ] Window state persists across launches
- [ ] Traffic light buttons visible and functional

### Keyboard
- [ ] Full navigation (Tab, arrows, Enter, Esc)
- [ ] Cmd+Z undo for user-initiated content modifications
- [ ] Space for Quick Look
- [ ] Delete removes selected items
- [ ] No keyboard traps

### Pointer
- [ ] Hover states on interactive elements
- [ ] Right-click context menus on content elements
- [ ] Drag and drop for content manipulation
- [ ] Cmd+Click for multi-selection

### Visual
- [ ] System fonts at semantic sizes
- [ ] Dark Mode fully supported
- [ ] System accent color respected
- [ ] Accessibility: VoiceOver, reduce transparency, reduce motion, high contrast
- [ ] Consistent spacing on 8pt grid

### System
- [ ] Dock menu with quick actions
- [ ] Share menu works
- [ ] Settings window with tabbed layout
- [ ] Undo/redo wired for all modifications
