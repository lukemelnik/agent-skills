# AppKit-SwiftUI Bridge

## Table of Contents

1. [When to Bridge](#when-to-bridge)
2. [NSViewRepresentable](#nsviewrepresentable)
3. [NSHostingView and NSHostingController](#nshosting)
4. [State Management Across Frameworks](#state-management)
5. [MTKView Bridging (Metal)](#mtkview-bridging-metal)
6. [WKWebView Bridging](#wkwebview-bridging)
7. [NSOutlineView / Tree View Bridging](#nsoutlineview--tree-view-bridging)
8. [Undo Manager Bridging](#undo-manager-bridging)
9. [First Responder Management](#first-responder-management)

---

## When to Bridge

### Use NSViewRepresentable when:
- SwiftUI lacks a native equivalent (e.g., `NSTextView` rich text, `MTKView` for Metal rendering)
- You need fine-grained control over AppKit view lifecycle
- Performance-critical views need AppKit (e.g., `NSTableView` with 100k+ rows)

### Use NSHostingView/Controller when:
- Incrementally adopting SwiftUI in an existing AppKit app
- A SwiftUI view is more concise for the job
- Building new features in SwiftUI within an AppKit shell

### Go pure SwiftUI when:
- Starting a new project targeting macOS 14+
- Full SwiftUI API coverage exists for the feature
- No AppKit-specific behavior is needed

---

## NSViewRepresentable

### Full Protocol Implementation

```swift
struct MyAppKitView: NSViewRepresentable {
    @Binding var text: String

    func makeNSView(context: Context) -> NSTextField {
        let textField = NSTextField()
        textField.delegate = context.coordinator
        return textField
    }

    func updateNSView(_ nsView: NSTextField, context: Context) {
        context.coordinator.parent = self  // Keep parent reference fresh
        nsView.stringValue = text
    }

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    static func dismantleNSView(_ nsView: NSTextField, coordinator: Coordinator) {
        coordinator.observation?.invalidate()
        NotificationCenter.default.removeObserver(coordinator)
    }

    // macOS 13+ — control sizing
    func sizeThatFits(_ proposal: ProposedViewSize, nsView: NSTextField, context: Context) -> CGSize? {
        let width = proposal.width ?? nsView.intrinsicContentSize.width
        return CGSize(width: width, height: nsView.intrinsicContentSize.height)
    }

    class Coordinator: NSObject, NSTextFieldDelegate {
        var parent: MyAppKitView
        var observation: NSKeyValueObservation?

        init(_ parent: MyAppKitView) { self.parent = parent }

        func controlTextDidChange(_ obj: Notification) {
            guard let textField = obj.object as? NSTextField else { return }
            parent.text = textField.stringValue
        }
    }
}
```

### Common Pitfalls

**Coordinator lifecycle** — never create a new coordinator in `updateNSView`. Use `context.coordinator`.

```swift
// Wrong
func updateNSView(_ nsView: NSTextField, context: Context) {
    let coordinator = Coordinator()  // New instance each time!
    nsView.delegate = coordinator
}

// Right
func updateNSView(_ nsView: NSTextField, context: Context) {
    nsView.delegate = context.coordinator
}
```

**Missing dismantling** — always clean up observers and timers in `dismantleNSView`.

**Layout in wrong phase** — don't set frames in `makeNSView` (SwiftUI ignores them). Use `sizeThatFits` or `intrinsicContentSize`.

### Rich Text Editor (NSTextView)

```swift
struct RichTextEditor: NSViewRepresentable {
    @Binding var attributedText: NSAttributedString

    func makeNSView(context: Context) -> NSScrollView {
        let scrollView = NSTextView.scrollableTextView()
        let textView = scrollView.documentView as! NSTextView
        textView.isRichText = true
        textView.allowsUndo = true
        textView.delegate = context.coordinator
        textView.textStorage?.setAttributedString(attributedText)
        return scrollView
    }

    func updateNSView(_ scrollView: NSScrollView, context: Context) {
        guard let textView = scrollView.documentView as? NSTextView else { return }
        context.coordinator.parent = self
        if textView.textStorage?.string != attributedText.string {
            textView.textStorage?.setAttributedString(attributedText)
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    class Coordinator: NSObject, NSTextViewDelegate {
        var parent: RichTextEditor
        init(_ parent: RichTextEditor) { self.parent = parent }

        func textDidChange(_ notification: Notification) {
            guard let textView = notification.object as? NSTextView,
                  let storage = textView.textStorage else { return }
            parent.attributedText = NSAttributedString(attributedString: storage)
        }
    }
}
```

### High-Performance List (NSTableView)

Use when SwiftUI `List` or `Table` performance is insufficient (100k+ rows):

```swift
struct HighPerformanceList: NSViewRepresentable {
    let items: [ListItem]
    var onSelect: (ListItem) -> Void

    func makeNSView(context: Context) -> NSScrollView {
        let scrollView = NSScrollView()
        let tableView = NSTableView()

        let column = NSTableColumn(identifier: NSUserInterfaceItemIdentifier("main"))
        tableView.addTableColumn(column)
        tableView.headerView = nil
        tableView.style = .plain
        tableView.dataSource = context.coordinator
        tableView.delegate = context.coordinator

        scrollView.documentView = tableView
        scrollView.hasVerticalScroller = true
        return scrollView
    }

    func updateNSView(_ scrollView: NSScrollView, context: Context) {
        context.coordinator.parent = self
        (scrollView.documentView as? NSTableView)?.reloadData()
    }

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    class Coordinator: NSObject, NSTableViewDataSource, NSTableViewDelegate {
        var parent: HighPerformanceList
        init(_ parent: HighPerformanceList) { self.parent = parent }

        func numberOfRows(in tableView: NSTableView) -> Int { parent.items.count }

        func tableView(_ tableView: NSTableView, viewFor tableColumn: NSTableColumn?, row: Int) -> NSView? {
            let cell = tableView.makeView(withIdentifier: tableColumn!.identifier, owner: nil) as? NSTextField
                ?? NSTextField(labelWithString: "")
            cell.identifier = tableColumn!.identifier
            cell.stringValue = parent.items[row].title
            return cell
        }

        func tableViewSelectionDidChange(_ notification: Notification) {
            guard let tableView = notification.object as? NSTableView,
                  tableView.selectedRow >= 0 else { return }
            parent.onSelect(parent.items[tableView.selectedRow])
        }
    }
}
```

### AppKit Drag and Drop via NSViewRepresentable

```swift
struct DragDropView: NSViewRepresentable {
    var onDrop: ([URL]) -> Void

    func makeNSView(context: Context) -> NSView {
        let view = DropTargetView()
        view.coordinator = context.coordinator
        view.registerForDraggedTypes([.fileURL])
        return view
    }

    func updateNSView(_ nsView: NSView, context: Context) {
        context.coordinator.parent = self
    }

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    class DropTargetView: NSView {
        weak var coordinator: Coordinator?
        override func draggingEntered(_ sender: NSDraggingInfo) -> NSDragOperation { .copy }
        override func performDragOperation(_ sender: NSDraggingInfo) -> Bool {
            guard let urls = sender.draggingPasteboard.readObjects(forClasses: [NSURL.self]) as? [URL] else { return false }
            coordinator?.parent.onDrop(urls)
            return true
        }
    }

    class Coordinator: NSObject {
        var parent: DragDropView
        init(_ parent: DragDropView) { self.parent = parent }
    }
}
```

---

## NSHostingView and NSHostingController

### NSHostingView — Embed SwiftUI in an NSView hierarchy

```swift
let hostingView = NSHostingView(rootView: MySwiftUIView(viewModel: viewModel))

// Auto Layout
hostingView.translatesAutoresizingMaskIntoConstraints = false
parentView.addSubview(hostingView)
NSLayoutConstraint.activate([
    hostingView.leadingAnchor.constraint(equalTo: parentView.leadingAnchor),
    hostingView.trailingAnchor.constraint(equalTo: parentView.trailingAnchor),
    hostingView.topAnchor.constraint(equalTo: parentView.topAnchor),
    hostingView.bottomAnchor.constraint(equalTo: parentView.bottomAnchor)
])
```

### Sizing Options (macOS 13+)

```swift
hostingView.sizingOptions = .intrinsicContentSize  // Default
hostingView.sizingOptions = .minSize               // Constrains to the SwiftUI content's minimum size
hostingView.sizingOptions = [.intrinsicContentSize, .minSize]  // Most flexible
```

### NSHostingController — Embed SwiftUI as a view controller

Use in NSSplitViewController, tab views, or sheets:

```swift
let hostingController = NSHostingController(rootView: SettingsView())

// Present as sheet
parentViewController.presentAsSheet(hostingController)

// Add as child
parentVC.addChild(hostingController)
parentVC.view.addSubview(hostingController.view)
```

### Updating the Root View

With `@Observable` (macOS 14+), changes propagate automatically. Without it, manually update:

```swift
hostingView.rootView = MySwiftUIView(updatedData: newData)
```

---

## State Management Across Frameworks

### @Observable (Recommended, macOS 14+)

Both AppKit and SwiftUI observe the same `@Observable` class:

```swift
@Observable class AppState {
    var currentDocument: Document?
    var statusMessage = ""
}
```

**SwiftUI side** — automatic:
```swift
struct ContentView: View {
    var appState: AppState
    var body: some View {
        Text(appState.statusMessage)
    }
}
```

**AppKit side** — use `withObservationTracking`. Annotate with `@MainActor` for Swift 6 strict concurrency (the `DispatchQueue.main.async` closure captures `self`):
```swift
@MainActor
class AppKitController: NSViewController {
    let appState: AppState
    private var isObserving = true

    override func viewDidLoad() {
        super.viewDidLoad()
        observeState()
    }

    private func observeState() {
        guard isObserving else { return }
        withObservationTracking {
            let message = appState.statusMessage
            updateStatusBar(message)
        } onChange: {
            DispatchQueue.main.async { [weak self] in
                self?.observeState()
            }
        }
    }

    deinit { isObserving = false }
}
```

### Best Practices

- Prefer `@Observable` over `ObservableObject` for macOS 14+
- Update `coordinator.parent` in every `updateNSView` call
- Always clean up in `dismantleNSView` — remove observers, invalidate timers, cancel tasks
- Guard against redundant updates in `updateNSView` — check if values actually changed
- Use `sizeThatFits` for layout, not manual frames
- Avoid storing state in coordinators — use `@Binding` and `@State` in the parent

---

## MTKView Bridging (Metal)

Embed Metal rendering in SwiftUI for GPU-accelerated content (3D scenes, image processing, video filters).

```swift
import MetalKit

struct MetalView: NSViewRepresentable {
    let device: MTLDevice
    @Binding var drawableSize: CGSize

    func makeNSView(context: Context) -> MTKView {
        let mtkView = MTKView(frame: .zero, device: device)
        mtkView.delegate = context.coordinator
        mtkView.colorPixelFormat = .bgra8Unorm
        mtkView.clearColor = MTLClearColor(red: 0, green: 0, blue: 0, alpha: 1)
        mtkView.enableSetNeedsDisplay = true  // Draw on demand, not continuously
        return mtkView
    }

    func updateNSView(_ mtkView: MTKView, context: Context) {
        context.coordinator.parent = self
        mtkView.setNeedsDisplay(mtkView.bounds)
    }

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    class Coordinator: NSObject, MTKViewDelegate {
        var parent: MetalView
        var commandQueue: MTLCommandQueue?
        var pipelineState: MTLRenderPipelineState?

        init(_ parent: MetalView) {
            self.parent = parent
            self.commandQueue = parent.device.makeCommandQueue()
            super.init()
        }

        func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {
            parent.drawableSize = size
        }

        func draw(in view: MTKView) {
            guard let drawable = view.currentDrawable,
                  let descriptor = view.currentRenderPassDescriptor,
                  let commandBuffer = commandQueue?.makeCommandBuffer(),
                  let encoder = commandBuffer.makeRenderCommandEncoder(descriptor: descriptor) else { return }

            // Encode your render commands here
            encoder.endEncoding()
            commandBuffer.present(drawable)
            commandBuffer.commit()
        }
    }
}
```

Key considerations:
- Set `enableSetNeedsDisplay = true` for on-demand rendering; set `isPaused = false` for continuous animation
- Use `preferredFramesPerSecond` to control update rate for continuous rendering
- Clean up Metal resources in `dismantleNSView` if needed

---

## WKWebView Bridging

Embed web content in SwiftUI. Used by IINA for plugin overlays and by many apps for rendering HTML content.

```swift
import WebKit

struct WebView: NSViewRepresentable {
    let url: URL?
    let htmlString: String?
    var onNavigationFinished: (() -> Void)?

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        // Add script message handlers for JS-to-Swift communication
        config.userContentController.add(context.coordinator, name: "appHandler")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        if #available(macOS 13.3, *) {
            webView.isInspectable = true  // Enable Web Inspector in debug
        }
        return webView
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
        context.coordinator.parent = self
        // Guard against reloading on every SwiftUI update
        if let url, url != context.coordinator.previousURL {
            context.coordinator.previousURL = url
            webView.load(URLRequest(url: url))
        } else if let htmlString, htmlString != context.coordinator.previousHTML {
            context.coordinator.previousHTML = htmlString
            webView.loadHTMLString(htmlString, baseURL: nil)
        }
    }

    static func dismantleNSView(_ webView: WKWebView, coordinator: Coordinator) {
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "appHandler")
    }

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        var parent: WebView
        var previousURL: URL?
        var previousHTML: String?

        init(_ parent: WebView) { self.parent = parent }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.onNavigationFinished?()
        }

        func userContentController(_ controller: WKUserContentController,
                                    didReceive message: WKScriptMessage) {
            // Handle messages from JavaScript: window.webkit.messageHandlers.appHandler.postMessage(...)
            guard let body = message.body as? [String: Any] else { return }
            print("Received from JS:", body)
        }
    }
}
```

IINA pattern — transparent overlay WKWebView for plugin UI:

```swift
// Make web view transparent for overlay use
// Warning: setValue(false, forKey: "drawsBackground") is private API.
// Public alternative (macOS 12+): webView.underPageBackgroundColor = .clear
webView.underPageBackgroundColor = .clear
webView.isHidden = true  // Show only when content is loaded
```

---

## NSOutlineView / Tree View Bridging

For hierarchical data (file trees, project navigators), `NSOutlineView` provides superior performance and native feel compared to SwiftUI `OutlineGroup`. CodeEdit uses this pattern for its project navigator.

### NSViewControllerRepresentable Approach (CodeEdit Pattern)

Wrap the outline view controller rather than the view directly — this gives better lifecycle management:

```swift
struct TreeView: NSViewControllerRepresentable {
    @Binding var selection: TreeNode?
    let rootNodes: [TreeNode]

    func makeNSViewController(context: Context) -> TreeViewController {
        let controller = TreeViewController()
        controller.rootNodes = rootNodes
        controller.onSelect = { node in selection = node }
        return controller
    }

    func updateNSViewController(_ controller: TreeViewController, context: Context) {
        controller.rootNodes = rootNodes
        controller.updateSelection(selection)
    }
}

class TreeViewController: NSViewController, NSOutlineViewDataSource, NSOutlineViewDelegate {
    var outlineView: NSOutlineView!
    var rootNodes: [TreeNode] = []
    var onSelect: ((TreeNode?) -> Void)?

    override func loadView() {
        let scrollView = NSScrollView()
        outlineView = NSOutlineView()
        outlineView.dataSource = self
        outlineView.delegate = self
        outlineView.headerView = nil
        outlineView.autosaveExpandedItems = true

        let column = NSTableColumn(identifier: .init("Cell"))
        outlineView.addTableColumn(column)
        outlineView.outlineTableColumn = column

        scrollView.documentView = outlineView
        scrollView.hasVerticalScroller = true
        self.view = scrollView
    }

    // NSOutlineViewDataSource
    func outlineView(_ outlineView: NSOutlineView, numberOfChildrenOfItem item: Any?) -> Int {
        guard let node = item as? TreeNode else { return rootNodes.count }
        return node.children.count
    }

    func outlineView(_ outlineView: NSOutlineView, child index: Int, ofItem item: Any?) -> Any {
        guard let node = item as? TreeNode else { return rootNodes[index] }
        return node.children[index]
    }

    func outlineView(_ outlineView: NSOutlineView, isItemExpandable item: Any) -> Bool {
        (item as? TreeNode)?.children.isEmpty == false
    }

    // NSOutlineViewDelegate
    func outlineViewSelectionDidChange(_ notification: Notification) {
        let node = outlineView.item(atRow: outlineView.selectedRow) as? TreeNode
        onSelect?(node)
    }
}
```

Key patterns from CodeEdit:
- Use `autosaveExpandedItems = true` with `autosaveName` to persist expand state
- Track expanded items in a `Set` to restore state after filtering
- Support drag and drop via `registerForDraggedTypes([.fileURL])` and `setDraggingSourceOperationMask`
- Defer reloads when a text field inside the outline view is editing (check `window?.firstResponder`)

---

## Undo Manager Bridging

Connect `NSUndoManager` with SwiftUI state for consistent undo/redo across hybrid apps.

### Per-File Undo Registration (CodeEdit Pattern)

CodeEdit stores undo managers per file, independent of the document or view lifecycle:

```swift
final class UndoManagerRegistration: ObservableObject {
    private var managerMap: [String: NSUndoManager] = [:]

    func manager(forFile url: URL) -> NSUndoManager {
        if let existing = managerMap[url.path] { return existing }
        let manager = NSUndoManager()
        managerMap[url.path] = manager
        return manager
    }
}
```

Inject into SwiftUI via environment:

```swift
// In workspace setup
ContentView()
    .environmentObject(undoRegistration)

// In editor view
struct EditorView: View {
    @EnvironmentObject var undoRegistration: UndoManagerRegistration

    var body: some View {
        TextEditorView(undoManager: undoRegistration.manager(forFile: fileURL))
    }
}
```

### Bridging SwiftUI's UndoManager to AppKit

SwiftUI provides `@Environment(\.undoManager)` but this is scoped to the SwiftUI view hierarchy. `NSView.undoManager` is read-only (computed from the responder chain), so you cannot assign to it directly. Instead, register undo actions through the SwiftUI undo manager passed to the coordinator:

```swift
struct BridgedEditorView: NSViewRepresentable {
    @Binding var text: String
    @Environment(\.undoManager) var swiftUIUndoManager

    func makeNSView(context: Context) -> MyEditorView {
        let editor = MyEditorView()
        editor.delegate = context.coordinator
        return editor
    }

    func updateNSView(_ editor: MyEditorView, context: Context) {
        context.coordinator.undoManager = swiftUIUndoManager
        editor.stringValue = text
    }

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    class Coordinator: NSObject {
        var parent: BridgedEditorView
        var undoManager: UndoManager?
        init(_ parent: BridgedEditorView) { self.parent = parent }

        func editorDidChange(_ newText: String) {
            let oldText = parent.text
            parent.text = newText
            undoManager?.registerUndo(withTarget: self) { target in
                target.editorDidChange(oldText)
            }
        }
    }
}
```

Key considerations:
- `NSView.undoManager` is read-only — never attempt to assign to it
- Undo managers are tied to windows in AppKit — when a view moves between windows, the undo manager changes
- For document apps, the `NSDocument` owns the undo manager; access it via `document.undoManager`
- Group related edits: `undoManager.beginUndoGrouping()` / `endUndoGrouping()` for atomic operations

---

## First Responder Management

Control keyboard focus and first responder from SwiftUI in hybrid apps.

### Observing First Responder (CodeEdit Pattern)

A property wrapper that tracks the current first responder. Note: KVO on `\.keyWindow?.firstResponder` is unreliable across window changes because the chained optional key path does not re-establish observation when the key window changes. Instead, observe `NSWindow.didBecomeKeyNotification` to re-establish KVO on the new key window:

```swift
@propertyWrapper
struct FirstResponder: DynamicProperty {
    @StateObject private var helper = HelperClass()

    var wrappedValue: NSResponder? { helper.responder }

    class HelperClass: ObservableObject {
        @Published var responder: NSResponder? = NSApp.keyWindow?.firstResponder
        private var kvoObservation: NSKeyValueObservation?
        private var windowObserver: Any?

        init() {
            observeKeyWindow()
            windowObserver = NotificationCenter.default.addObserver(
                forName: NSWindow.didBecomeKeyNotification,
                object: nil, queue: .main
            ) { [weak self] _ in
                self?.observeKeyWindow()
            }
        }

        private func observeKeyWindow() {
            kvoObservation?.invalidate()
            responder = NSApp.keyWindow?.firstResponder
            kvoObservation = NSApp.keyWindow?.observe(\.firstResponder, options: .new) { [weak self] _, change in
                self?.responder = change.newValue ?? nil
            }
        }

        deinit {
            if let windowObserver { NotificationCenter.default.removeObserver(windowObserver) }
            kvoObservation?.invalidate()
        }
    }
}

// Usage in a SwiftUI view
struct CommandView: View {
    @FirstResponder var responder

    var body: some View {
        Button("Bold") {
            responder?.tryToPerform(#selector(NSText.toggleBoldface(_:)), with: nil)
        }
        .disabled(responder?.responds(to: #selector(NSText.toggleBoldface(_:))) != true)
    }
}
```

### Setting First Responder from SwiftUI

Use `NSViewRepresentable` to programmatically make an AppKit view first responder:

```swift
struct FocusableTextField: NSViewRepresentable {
    @Binding var text: String
    @Binding var isFocused: Bool

    func makeNSView(context: Context) -> NSTextField {
        let field = NSTextField()
        field.delegate = context.coordinator
        return field
    }

    func updateNSView(_ field: NSTextField, context: Context) {
        field.stringValue = text
        if isFocused && field.window?.firstResponder !== field.currentEditor() {
            field.window?.makeFirstResponder(field)
        }
    }
}
```

### Routing Actions via Responder Chain

The responder chain lets menu commands and toolbar actions reach the correct target automatically. Ensure AppKit views in your hybrid app participate correctly:

```swift
// In an NSViewController hosting SwiftUI content
override func supplementalTarget(forAction action: Selector, sender: Any?) -> Any? {
    // Forward actions to the SwiftUI-hosted content if this controller can't handle them
    if let target = hostingController?.view.superview?.supplementalTarget(forAction: action, sender: sender) {
        return target
    }
    return super.supplementalTarget(forAction: action, sender: sender)
}
```
