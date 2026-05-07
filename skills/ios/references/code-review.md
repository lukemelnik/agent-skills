# Code Review Checklist

Flag these issues during code review and suggest the modern replacement.

## Table of Contents

1. [Review Output Contract](#1-review-output-contract)
2. [Deprecated & Outdated APIs](#2-deprecated--outdated-apis)
3. [High-Signal Correctness Checks](#3-high-signal-correctness-checks)
4. [Swift Idioms](#4-swift-idioms)
5. [View Organization](#5-view-organization)

---

## 1. Review Output Contract

Use this structure when the user asks for a review:

1. Organize findings by file.
2. For each issue: include line(s), violated rule, and a concise before/after fix.
3. Skip files with no issues.
4. End with a prioritized short summary (highest-impact fixes first).

Review only real defects or maintainability risks; do not invent speculative issues.

---

## 2. Deprecated & Outdated APIs

### `cornerRadius()` → `clipShape(.rect(cornerRadius:))`

```swift
// Bad
RoundedRectangle(cornerRadius: 12)
    .cornerRadius(12)

// Good
RoundedRectangle(cornerRadius: 12)
    .clipShape(.rect(cornerRadius: 12))
```

### `foregroundColor()` → `foregroundStyle()`

```swift
// Bad
Text("Hello").foregroundColor(.blue)

// Good
Text("Hello").foregroundStyle(.blue)
```

### 1-parameter `onChange()` → 2-parameter or 0-parameter variant

```swift
// Bad (deprecated)
.onChange(of: searchText) { newValue in
    performSearch(newValue)
}

// Good (2-parameter)
.onChange(of: searchText) { oldValue, newValue in
    performSearch(newValue)
}

// Good (0-parameter, when you don't need old/new)
.onChange(of: searchText) {
    performSearch(searchText)
}
```

### `overlay(_:alignment:)` → `overlay(alignment:content:)`

```swift
// Bad
.overlay(Text("Badge"), alignment: .topTrailing)

// Good
.overlay(alignment: .topTrailing) { Text("Badge") }
```

### `NavigationView` → `NavigationStack` / `NavigationSplitView`

Flag all uses of `NavigationView`. Use `NavigationStack` for push-based navigation, `NavigationSplitView` for multi-column layouts.

### `NavigationLink(destination:)` → `NavigationLink(value:)` + `.navigationDestination`

```swift
// Bad
NavigationLink(destination: DetailView(item: item)) {
    ItemRow(item: item)
}

// Good
NavigationLink(value: item) {
    ItemRow(item: item)
}
// with .navigationDestination(for: Item.self) registered at the NavigationStack root
```

Never mix `NavigationLink(destination:)` and `navigationDestination(for:)` in the same hierarchy.

### `tabItem()` → `Tab` API (iOS 18+)

```swift
// Pre-iOS 18
TabView {
    HomeView().tabItem { Label("Home", systemImage: "house") }
}

// iOS 18+
TabView {
    Tab("Home", systemImage: "house") { HomeView() }
}
```

### `.navigationBarLeading` / `.navigationBarTrailing` → `.topBarLeading` / `.topBarTrailing`

```swift
// Bad
ToolbarItem(placement: .navigationBarTrailing) { ... }

// Good
ToolbarItem(placement: .topBarTrailing) { ... }
```

### `PreviewProvider` → `#Preview`

```swift
// Bad
struct MyView_Previews: PreviewProvider {
    static var previews: some View { MyView() }
}

// Good
#Preview { MyView() }
```

### `animation()` without value parameter

```swift
// Bad — implicit animation on entire subtree
.animation(.bouncy)

// Good — scoped to specific state change
.animation(.bouncy, value: score)
```

### `GeometryReader` → modern alternatives

Flag `GeometryReader` and suggest:
- `containerRelativeFrame()` — sizing relative to scroll container or screen
- `visualEffect()` — position/size-dependent visual transformations
- `Layout` protocol — custom layout logic

Only keep `GeometryReader` when no modern alternative works.

### `ObservableObject` requires explicit `import Combine`

`Combine` is no longer re-exported from SwiftUI. If `ObservableObject` is unavoidable, add `import Combine` explicitly.

### `AnyView` → `@ViewBuilder`, `Group`, or generics

```swift
// Bad
func makeView() -> AnyView {
    if condition { return AnyView(ViewA()) }
    return AnyView(ViewB())
}

// Good
@ViewBuilder
func makeView() -> some View {
    if condition { ViewA() } else { ViewB() }
}
```

### `Image("name")` → `Image(.name)` (generated asset symbols)

```swift
// Bad
Image("avatar")

// Good — uses generated asset symbol, compiler-checked
Image(.avatar)
```

### `String(format:)` → `FormatStyle` APIs

```swift
// Bad
Text(String(format: "%.2f", price))

// Good
Text(price, format: .number.precision(.fractionLength(2)))
Text(price, format: .currency(code: "USD"))
```

### `Text` concatenation with `+`

```swift
// Bad
Text("Hello").foregroundStyle(.red) + Text("World").foregroundStyle(.blue)

// Good
let red = Text("Hello").foregroundStyle(.red)
let blue = Text("World").foregroundStyle(.blue)
Text("\(red)\(blue)")
```

### Other deprecated patterns

- `sensoryFeedback()` over `UIImpactFeedbackGenerator` and other UIKit haptic APIs
- `@Entry` macro over manual `EnvironmentKey` boilerplate (iOS 18+)
- `scrollIndicators(.hidden)` over `showsIndicators: false` in `ScrollView` initializer
- Fill + stroke with chained modifiers, not overlay (iOS 17+)
- `ForEach(items.enumerated(), id: \.element.id)` — no need to convert to array first
- `ImageRenderer` over `UIGraphicsImageRenderer` for rendering SwiftUI views to images

### Cramped form sheets

Flag sheets that default to `.medium` when they present a real form with multiple sections, multiline input, keyboard entry, or dynamic validation/errors. These often look clipped near the home indicator even when technically scrollable.

```swift
// Bad
.sheet(isPresented: $showEditor) {
    EditorSheet()
        .presentationDetents([.medium, .large])
}

// Good
.sheet(isPresented: $showEditor) {
    EditorSheet()
        .presentationDetents([.large])
        .presentationContentInteraction(.scrolls)
}
```

Also check the sheet content itself:
- add bottom inset or bottom padding for scrollable form content
- prefer `.height(...)` only for short action sheets, not full forms
- remember `.medium` / `.large` are presets; `.height(...)` / `.fraction(...)` are explicit detents

---

## 3. High-Signal Correctness Checks

These checks catch common SwiftUI correctness bugs quickly:

- `@State` and `@FocusState` should be `private`.
- Never declare injected values as `@State`/`@StateObject` — these wrappers are for view-owned state.
- Use `@StateObject` for view-owned reference types and `@ObservedObject` for injected reference types.
- `ForEach` identity must be stable (avoid `.indices` for mutable collections).
- Keep a constant number of rendered children per `ForEach` element where possible.
- Always use `.animation(_:value:)` with an explicit `value:` trigger.
- Prefer `Button` for tappable actions rather than `onTapGesture` on non-semantic views.

---

## 4. Swift Idioms

### Prefer modern Foundation APIs

| Legacy | Modern |
|--------|--------|
| `Date()` | `Date.now` |
| `filter { ... }.count` | `count(where: { ... })` |
| `replacingOccurrences(of:with:)` | `replacing("a", with: "b")` |
| `FileManager` directory lookups | `URL.documentsDirectory` |
| `Task.sleep(nanoseconds:)` | `Task.sleep(for: .seconds(1))` |
| `DateFormatter` for parsing | `Date(myString, strategy: .iso8601)` |
| `if let value = value {` | `if let value {` |

### `localizedStandardContains()` for user-facing text search

```swift
// Bad — no locale awareness, no diacritics handling
items.filter { $0.name.contains(searchText) }

// Good — locale-aware, handles diacritics and case
items.filter { $0.name.localizedStandardContains(searchText) }
```

### Single-expression returns with `if`/`switch` as expressions

```swift
// Bad
var tileColor: Color {
    if isCorrect {
        return .green
    } else {
        return .red
    }
}

// Good
var tileColor: Color {
    if isCorrect { .green } else { .red }
}
```

### Static member lookup over initializer

```swift
// Bad
.clipShape(RoundedRectangle(cornerRadius: 8))
.buttonStyle(BorderedProminentButtonStyle())

// Good
.clipShape(.rect(cornerRadius: 8))
.buttonStyle(.borderedProminent)
```

### Prefer `Double` over `CGFloat`

Swift bridges `Double` and `CGFloat` freely except for optionals and `inout`. Use `Double` by default.

### No `import UIKit` when `import SwiftUI` is present

`SwiftUI` already imports `UIKit` (iOS) / `AppKit` (macOS) on the appropriate platform.

### Flag silent error swallowing

```swift
// Bad — user sees nothing, error is lost
} catch {
    print(error.localizedDescription)
}

// Good — surface to the user
} catch {
    errorMessage = error.localizedDescription
    showError = true
}
```

### Person names

Use `PersonNameComponents` with modern formatting over string interpolation like `"\(firstName) \(lastName)"`.

### Sorting

If a type is repeatedly sorted with the same closure, make it conform to `Comparable` to centralize the sort order.

### Force unwraps

Avoid `!` and force `try` unless failure is truly unrecoverable. Prefer `if let`, `guard let`, nil-coalescing, or `do`/`catch`. If a crash is intentional, use `fatalError()` with a clear description.

---

## 5. View Organization

### Never break view bodies into computed properties/methods

Extract reusable pieces into separate `View` structs, each in its own file. `@ViewBuilder` on a computed property does not solve the problem — it still recalculates on every body evaluation and hurts performance.

```swift
// Bad
struct ContentView: View {
    var header: some View { ... }
    var body: some View { header }
}

// Good — separate file: HeaderView.swift
struct HeaderView: View {
    var body: some View { ... }
}
```

### Each type in its own file

Flag files containing multiple type definitions (struct, class, enum). Small private helpers nested inside their parent are acceptable.

### Button actions in separate methods

```swift
// Bad
Button("Save") {
    let data = prepareData()
    try? await apiClient.save(data)
    dismiss()
}

// Good
Button("Save", action: save)

private func save() {
    let data = prepareData()
    Task {
        try? await apiClient.save(data)
        dismiss()
    }
}
```

### Store built `@ViewBuilder` results, not escaping closures

```swift
// Bad — stores escaping closure
struct CardView<Content: View>: View {
    let content: () -> Content
    var body: some View {
        VStack { content() }
    }
}

// Good — stores built view value
struct CardView<Content: View>: View {
    @ViewBuilder let content: Content
    var body: some View {
        VStack { content }
    }
}
```

### `TabView(selection:)` should bind to enum, not int/string

```swift
// Bad
@State private var selectedTab = 0
TabView(selection: $selectedTab) {
    Tab("Home", systemImage: "house", value: 0) { ... }
}

// Good
enum AppTab { case home, search, profile }
@State private var selectedTab = AppTab.home
TabView(selection: $selectedTab) {
    Tab("Home", systemImage: "house", value: .home) { ... }
}
```

### Business logic out of `body`, `task()`, `onAppear()`

Move logic into view models or dedicated methods. `body` is for layout; methods are for logic.
