# UIKit-SwiftUI Bridge

## Table of Contents

1. [When to Bridge](#when-to-bridge)
2. [UIViewRepresentable](#uiviewrepresentable)
3. [UIViewControllerRepresentable](#uiviewcontrollerrepresentable)
4. [Common Bridges](#common-bridges)
5. [State Bridging Patterns](#state-bridging-patterns)
6. [UIHostingController (Reverse Direction)](#uihostingcontroller-reverse-direction)
7. [Sizing and Layout](#sizing-and-layout)
8. [Swift 6 Considerations](#swift-6-considerations)
9. [Common Mistakes](#common-mistakes)

---

## When to Bridge

### Use UIViewRepresentable when:
- SwiftUI lacks a native equivalent (e.g., `UITextView` rich text, `WKWebView`, `MKMapView` with overlays)
- You need fine-grained control over a UIKit view's lifecycle or delegate callbacks
- Performance-critical views need UIKit (e.g., `PKCanvasView`, camera preview layers)

### Use UIHostingController when:
- Incrementally adopting SwiftUI in an existing UIKit app
- Embedding SwiftUI views inside `UITableViewCell` / `UICollectionViewCell`
- Building new features in SwiftUI within a UIKit navigation shell

### Go pure SwiftUI when:
- Starting a new project targeting iOS 17+
- Full SwiftUI API coverage exists for the feature
- No UIKit-specific behavior is needed

---

## UIViewRepresentable

### Full Protocol

```swift
struct MyUIKitView: UIViewRepresentable {
    @Binding var text: String

    func makeUIView(context: Context) -> UITextField {
        let textField = UITextField()
        textField.delegate = context.coordinator
        return textField
    }

    func updateUIView(_ uiView: UITextField, context: Context) {
        context.coordinator.parent = self  // Keep parent reference fresh
        guard uiView.text != text else { return }  // Guard against redundant updates
        uiView.text = text
    }

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    static func dismantleUIView(_ uiView: UITextField, coordinator: Coordinator) {
        uiView.delegate = nil  // Prevent dangling delegate
    }

    // iOS 16+ — propose size to SwiftUI
    func sizeThatFits(_ proposal: ProposedViewSize, uiView: UITextField, context: Context) -> CGSize? {
        let width = proposal.width ?? uiView.intrinsicContentSize.width
        return CGSize(width: width, height: uiView.intrinsicContentSize.height)
    }

    class Coordinator: NSObject, UITextFieldDelegate {
        var parent: MyUIKitView

        init(_ parent: MyUIKitView) { self.parent = parent }

        func textFieldDidChangeSelection(_ textField: UITextField) {
            parent.text = textField.text ?? ""
        }
    }
}
```

### Context Properties

- `context.coordinator` — the coordinator instance created by `makeCoordinator()`
- `context.environment` — the SwiftUI environment (access color scheme, locale, etc.)
- `context.transaction` — current transaction (check `context.transaction.animation` to apply animations)

---

## UIViewControllerRepresentable

Same pattern but wraps a `UIViewController` instead of a `UIView`.

### When to use
- Camera (`UIImagePickerController`, `AVCaptureSession` setup)
- Mail composer (`MFMailComposeViewController`)
- Document picker (`UIDocumentPickerViewController`)
- Safari (`SFSafariViewController`)
- Any UIKit controller with complex lifecycle management

### Protocol Methods

```swift
struct DocumentPicker: UIViewControllerRepresentable {
    @Binding var selectedURL: URL?

    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.pdf, .plainText])
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ controller: UIDocumentPickerViewController, context: Context) {
        context.coordinator.parent = self
    }

    static func dismantleUIViewController(_ controller: UIDocumentPickerViewController, coordinator: Coordinator) {
        controller.delegate = nil
    }

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    class Coordinator: NSObject, UIDocumentPickerDelegate {
        var parent: DocumentPicker
        init(_ parent: DocumentPicker) { self.parent = parent }

        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            parent.selectedURL = urls.first
        }
    }
}
```

---

## Common Bridges

### UITextView (Rich Text)

```swift
struct RichTextEditor: UIViewRepresentable {
    @Binding var text: NSAttributedString

    func makeUIView(context: Context) -> UITextView {
        let textView = UITextView()
        textView.isEditable = true
        textView.allowsEditingTextAttributes = true
        textView.delegate = context.coordinator
        textView.attributedText = text
        return textView
    }

    func updateUIView(_ uiView: UITextView, context: Context) {
        context.coordinator.parent = self
        // Guard against update loops — only set if content actually changed
        if uiView.attributedText != text {
            uiView.attributedText = text
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    static func dismantleUIView(_ uiView: UITextView, coordinator: Coordinator) {
        uiView.delegate = nil
    }

    class Coordinator: NSObject, UITextViewDelegate {
        var parent: RichTextEditor
        init(_ parent: RichTextEditor) { self.parent = parent }

        func textViewDidChange(_ textView: UITextView) {
            parent.text = NSAttributedString(attributedString: textView.attributedText)
        }
    }
}
```

### MKMapView (Advanced Maps)

Use when SwiftUI `Map` is insufficient (custom annotations, overlays, region tracking).

```swift
import MapKit

struct AdvancedMapView: UIViewRepresentable {
    @Binding var region: MKCoordinateRegion
    let annotations: [MKAnnotation]
    let overlays: [MKOverlay]

    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView()
        mapView.delegate = context.coordinator
        return mapView
    }

    func updateUIView(_ mapView: MKMapView, context: Context) {
        context.coordinator.parent = self

        // Update region only if it meaningfully changed
        let current = mapView.region
        if abs(current.center.latitude - region.center.latitude) > 0.0001 ||
           abs(current.center.longitude - region.center.longitude) > 0.0001 {
            mapView.setRegion(region, animated: context.transaction.animation != nil)
        }

        // Diff annotations
        let existing = Set(mapView.annotations.compactMap { $0 as? MKPointAnnotation })
        let new = Set(annotations.compactMap { $0 as? MKPointAnnotation })
        mapView.removeAnnotations(Array(existing.subtracting(new)))
        mapView.addAnnotations(Array(new.subtracting(existing)))

        // Overlays
        mapView.removeOverlays(mapView.overlays)
        mapView.addOverlays(overlays)
    }

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    class Coordinator: NSObject, MKMapViewDelegate {
        var parent: AdvancedMapView
        init(_ parent: AdvancedMapView) { self.parent = parent }

        func mapView(_ mapView: MKMapView, regionDidChangeAnimated animated: Bool) {
            parent.region = mapView.region
        }

        func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            if let polyline = overlay as? MKPolyline {
                let renderer = MKPolylineRenderer(polyline: polyline)
                renderer.strokeColor = .systemBlue
                renderer.lineWidth = 3
                return renderer
            }
            return MKOverlayRenderer(overlay: overlay)
        }
    }
}
```

### WKWebView

```swift
import WebKit

struct WebView: UIViewRepresentable {
    let url: URL?
    let htmlString: String?
    var onNavigationFinished: (() -> Void)?

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.userContentController.add(context.coordinator, name: "appHandler")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
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

    static func dismantleUIView(_ webView: WKWebView, coordinator: Coordinator) {
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

        // JS calls: window.webkit.messageHandlers.appHandler.postMessage({...})
        func userContentController(_ controller: WKUserContentController,
                                    didReceive message: WKScriptMessage) {
            guard let body = message.body as? [String: Any] else { return }
            print("Received from JS:", body)
        }
    }
}
```

### PKCanvasView (PencilKit)

```swift
import PencilKit

struct DrawingCanvas: UIViewRepresentable {
    @Binding var drawing: PKDrawing
    @Binding var toolPickerVisible: Bool

    func makeUIView(context: Context) -> PKCanvasView {
        let canvas = PKCanvasView()
        canvas.delegate = context.coordinator
        canvas.drawingPolicy = .anyInput
        canvas.drawing = drawing

        // Tool picker
        let toolPicker = PKToolPicker()
        toolPicker.setVisible(toolPickerVisible, forFirstResponder: canvas)
        toolPicker.addObserver(canvas)
        context.coordinator.toolPicker = toolPicker
        canvas.becomeFirstResponder()
        return canvas
    }

    func updateUIView(_ canvas: PKCanvasView, context: Context) {
        context.coordinator.parent = self
        if canvas.drawing != drawing {
            canvas.drawing = drawing
        }
        context.coordinator.toolPicker?.setVisible(toolPickerVisible, forFirstResponder: canvas)
    }

    static func dismantleUIView(_ canvas: PKCanvasView, coordinator: Coordinator) {
        coordinator.toolPicker?.removeObserver(canvas)
        coordinator.toolPicker = nil
    }

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    class Coordinator: NSObject, PKCanvasViewDelegate {
        var parent: DrawingCanvas
        var toolPicker: PKToolPicker?
        init(_ parent: DrawingCanvas) { self.parent = parent }

        func canvasViewDrawingDidChange(_ canvasView: PKCanvasView) {
            parent.drawing = canvasView.drawing
        }
    }
}
```

### AVCaptureVideoPreviewLayer (Camera Preview)

Use `UIViewControllerRepresentable` for camera — session management fits the VC lifecycle.

```swift
import AVFoundation

struct CameraPreview: UIViewControllerRepresentable {
    let session: AVCaptureSession

    func makeUIViewController(context: Context) -> CameraPreviewController {
        let controller = CameraPreviewController()
        controller.session = session
        return controller
    }

    func updateUIViewController(_ controller: CameraPreviewController, context: Context) {}
}

class CameraPreviewController: UIViewController {
    var session: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?

    override func viewDidLoad() {
        super.viewDidLoad()
        guard let session else { return }
        let layer = AVCaptureVideoPreviewLayer(session: session)
        layer.videoGravity = .resizeAspectFill
        view.layer.addSublayer(layer)
        previewLayer = layer
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        previewLayer?.frame = view.bounds
    }
}
```

---

## State Bridging Patterns

### @Binding for Two-Way Data Flow

- Declare `@Binding` properties on the representable struct
- Coordinator reads/writes bindings to forward UIKit delegate changes back to SwiftUI

### Coordinator as Delegate Relay

```swift
// UIKit delegate fires -> Coordinator updates binding -> SwiftUI re-renders
func textViewDidChange(_ textView: UITextView) {
    parent.text = textView.text  // Write to @Binding
}
```

### Preventing Update Loops

Always guard in `updateUIView` — otherwise a binding write triggers `updateUIView`, which writes again, causing an infinite loop:

```swift
func updateUIView(_ uiView: UITextView, context: Context) {
    // Only update if the value actually changed
    guard uiView.text != text else { return }
    uiView.text = text
}
```

### Using Transaction Animation

```swift
func updateUIView(_ uiView: MKMapView, context: Context) {
    let animated = context.transaction.animation != nil
    uiView.setRegion(region, animated: animated)
}
```

---

## UIHostingController (Reverse Direction)

Embed SwiftUI views inside UIKit view hierarchies.

### Basic Embedding

```swift
let hostingController = UIHostingController(rootView: MySwiftUIView(viewModel: viewModel))

// Add as child view controller
addChild(hostingController)
view.addSubview(hostingController.view)
hostingController.view.translatesAutoresizingMaskIntoConstraints = false
NSLayoutConstraint.activate([
    hostingController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
    hostingController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
    hostingController.view.topAnchor.constraint(equalTo: view.topAnchor),
    hostingController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
])
hostingController.didMove(toParent: self)
```

### Updating rootView When Data Changes

With `@Observable` (iOS 17+), changes propagate automatically. Without it, manually update:

```swift
hostingController.rootView = MySwiftUIView(updatedData: newData)
```

### Sizing

```swift
// Let SwiftUI content determine size
hostingController.sizingOptions = .intrinsicContentSize  // iOS 16+

// Get preferred size for a given width
let fittingSize = hostingController.sizeThatFits(in: CGSize(width: 320, height: .greatestFiniteMagnitude))

// Set as preferredContentSize for popovers / form sheets
hostingController.preferredContentSize = fittingSize
```

### In UITableViewCell / UICollectionViewCell

```swift
class SwiftUITableCell: UITableViewCell {
    private var hostingController: UIHostingController<CellContent>?

    func configure(with item: Item, parentController: UIViewController) {
        if let hostingController {
            hostingController.rootView = CellContent(item: item)
        } else {
            let hc = UIHostingController(rootView: CellContent(item: item))
            hc.view.backgroundColor = .clear
            hc.view.translatesAutoresizingMaskIntoConstraints = false

            parentController.addChild(hc)
            contentView.addSubview(hc.view)
            NSLayoutConstraint.activate([
                hc.view.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
                hc.view.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
                hc.view.topAnchor.constraint(equalTo: contentView.topAnchor),
                hc.view.bottomAnchor.constraint(equalTo: contentView.bottomAnchor)
            ])
            hc.didMove(toParent: parentController)
            hostingController = hc
        }
    }

    override func prepareForReuse() {
        super.prepareForReuse()
        // Update rootView in configure(), not here — avoid removing the hosting controller
    }
}
```

---

## Sizing and Layout

### sizeThatFits (iOS 16+)

```swift
func sizeThatFits(_ proposal: ProposedViewSize, uiView: MyView, context: Context) -> CGSize? {
    let width = proposal.width ?? uiView.intrinsicContentSize.width
    let height = uiView.systemLayoutSizeFitting(
        CGSize(width: width, height: UIView.layoutFittingCompressedSize.height),
        withHorizontalFittingPriority: .required,
        verticalFittingPriority: .fittingSizeLevel
    ).height
    return CGSize(width: width, height: height)
}
```

- Return `nil` to let SwiftUI use default sizing
- Use `proposal.width` / `proposal.height` (may be `nil` for flexible axes)

### intrinsicContentSize

- UIKit views that report `intrinsicContentSize` integrate well without `sizeThatFits`
- Override in custom UIView subclasses for automatic sizing

### Fixed vs Flexible Sizing

```swift
// Fixed: apply .frame() on the SwiftUI side
MyUIKitView()
    .frame(width: 300, height: 200)

// Flexible: let the UIKit view determine its own size via sizeThatFits or intrinsicContentSize
MyUIKitView()
    .frame(maxWidth: .infinity)
```

### Compression Resistance and Content Hugging

Set priorities in `makeUIView` — they influence how `sizeThatFits` behaves:

```swift
func makeUIView(context: Context) -> UILabel {
    let label = UILabel()
    label.setContentCompressionResistancePriority(.required, for: .vertical)
    label.setContentHuggingPriority(.defaultHigh, for: .horizontal)
    return label
}
```

---

## Swift 6 Considerations

### @MainActor on Coordinators

In Swift 6 strict concurrency, coordinators that interact with UIKit must be `@MainActor`:

```swift
@MainActor
class Coordinator: NSObject, UITextViewDelegate {
    var parent: RichTextEditor
    init(_ parent: RichTextEditor) { self.parent = parent }

    func textViewDidChange(_ textView: UITextView) {
        parent.text = NSAttributedString(attributedString: textView.attributedText)
    }
}
```

### Sendable Considerations

- Delegate callbacks run on the main thread but the compiler may not know that
- Mark closures passed across isolation boundaries as `@Sendable`
- Use `sending` parameter annotation when passing data from coordinator to async contexts

### nonisolated for Protocol Conformances

UIKit delegate methods already run on the main thread. Use `nonisolated` to satisfy the compiler when the protocol is not annotated `@MainActor`:

```swift
@MainActor
class Coordinator: NSObject, WKNavigationDelegate {
    var parent: WebView
    init(_ parent: WebView) { self.parent = parent }

    nonisolated func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        MainActor.assumeIsolated {
            parent.onNavigationFinished?()
        }
    }
}
```

---

## Common Mistakes

- **Not guarding `updateUIView`** — every SwiftUI state change calls `updateUIView`. Without a guard comparing old vs new values, you get infinite loops or unnecessary work (e.g., reloading a web view on every render).
- **Forgetting to nil the delegate in `dismantleUIView`** — the UIKit view may outlive the coordinator, causing crashes when the delegate is called on a deallocated object.
- **Creating new UIKit objects in `updateUIView`** — only create views in `makeUIView`. The `updateUIView` method is for updating existing views with new state.
- **Not updating `coordinator.parent`** — the parent struct is a value type. If you don't refresh `context.coordinator.parent = self` in `updateUIView`, the coordinator holds stale binding references.
- **Storing mutable state in coordinators** — prefer `@Binding` and `@State` in the parent struct. Coordinators should relay delegate events, not own state.
- **Missing `didMove(toParent:)` for UIHostingController** — when adding as a child view controller, always call `addChild()` before adding the view and `didMove(toParent:)` after.
