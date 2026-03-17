# SwiftUI Performance

## Audit Workflow

### Decision Tree

- If you have code: start with Code-First Review.
- If you only have symptoms: ask for minimal code/context, then Code-First Review.
- If code review is inconclusive: guide the user to profile with Instruments.

### Code-First Review

Collect:
- Target view/feature code.
- Data flow: state, environment, observable models.
- Symptoms and reproduction steps.

Focus on:
- View invalidation storms from broad state changes.
- Unstable identity in lists (`id` churn, `UUID()` per render).
- Top-level conditional view swapping (`if/else` returning different root branches).
- Heavy work in `body` (formatting, sorting, image decoding).
- Layout thrash (deep stacks, `GeometryReader`, preference chains).
- Large images without downsampling or resizing.
- Over-animated hierarchies (implicit animations on large trees).

### Profiling with Instruments

1. Profile via Product > Profile (Release build).
2. Choose the SwiftUI template (SwiftUI instrument + Time Profiler + Hangs/Hitches).
3. Reproduce the exact interaction (scroll, navigation, animation).
4. Inspect "Long View Body Updates" — orange >500us, red >1000us.
5. Set Inspection Range on a long update and correlate with Time Profiler.
6. Use Cause & Effect Graph to diagnose *why* updates occur.
7. Re-record after fixes to compare.

### SwiftUI Timeline Lanes

- **Update Groups**: overview of time SwiftUI spends calculating updates.
- **Long View Body Updates**: orange >500us, red >1000us.
- **Long Platform View Updates**: AppKit/UIKit hosting in SwiftUI.
- **Other Long Updates**: geometry/text/layout and other SwiftUI work.
- **Hitches**: frame misses where UI wasn't ready in time.

## Structural Identity and View Diffing

### Ternary over if/else for modifier toggling

Use ternary expressions when toggling modifier values. `if/else` branches create `_ConditionalContent`, which destroys structural identity and forces SwiftUI to tear down and recreate the underlying platform view on every toggle.

```swift
// Bad — creates _ConditionalContent, destroys view identity on each toggle
if isHighlighted {
    Text("Score").foregroundStyle(.yellow)
} else {
    Text("Score").foregroundStyle(.primary)
}

// Good — preserves structural identity, single view with changing parameter
Text("Score")
    .foregroundStyle(isHighlighted ? .yellow : .primary)
```

### Avoid `AnyView`

`AnyView` erases type information, preventing SwiftUI from diffing efficiently. Use `@ViewBuilder`, `Group`, or generics instead.

### View initializers must be minimal

Flag any non-trivial work in view `init()`. Move data fetching, parsing, or computation into `.task()`.

---

## Common Code Smells (and Fixes)

### Expensive formatters in `body`

```swift
// Bad: allocates on every body eval
var body: some View {
    let formatter = NumberFormatter()
    Text(formatter.string(from: value as NSNumber) ?? "")
}

// Good: cache the formatter
final class DistanceFormatter {
    static let shared = DistanceFormatter()
    let number = NumberFormatter()
    let measure = MeasurementFormatter()
}
```

### Computed properties that do heavy work

```swift
// Bad: runs on every body eval
var filtered: [Item] {
    items.filter { $0.isEnabled }
}

// Good: precompute on change
@State private var filtered: [Item] = []
// Update filtered when inputs change via .onChange or .task(id:)
```

**Caveat:** Do not cache derived collections in `@State` unless you own explicit invalidation logic. Stale `@State` caches cause UI that doesn't match the source of truth. Prefer deriving with `let` in `body` for simple transforms; only promote to `@State` when profiling shows the computation is expensive.

### Use `Text(date, format:)` directly

Avoid storing `DateFormatter` or `Date.FormatStyle` properties when SwiftUI can format inline:

```swift
// Bad: unnecessary formatter property
@State private var formatter: Date.FormatStyle = .dateTime.day().month().year()
Text(event.date.formatted(formatter))

// Good: SwiftUI handles caching internally
Text(event.date, format: .dateTime.day().month().year())
Text(price, format: .currency(code: "USD"))
```

### Sorting/filtering in ForEach

```swift
// Bad: sorts on every render
ForEach(items.sorted(by: sortRule)) { item in
    Row(item)
}

// Good: sort once before view updates
let sortedItems = items.sorted(by: sortRule)
```

### Unstable identity

```swift
// Bad: id: \.self for non-stable values
ForEach(items, id: \.self) { item in Row(item) }

// Good: use a stable ID
ForEach(items) { item in Row(item) }  // where Item: Identifiable
```

### Top-level conditional view swapping

```swift
// Bad: root identity churn
var content: some View {
    if isEditing { editingView } else { readOnlyView }
}

// Good: one stable base, localize conditions
var content: some View {
    baseView
        .overlay { if isEditing { editingOverlay } }
        .disabled(!isEditing)
}
```

### Image decoding on the main thread

```swift
// Bad
Image(uiImage: UIImage(data: data)!)

// Good: decode/downsample off the main thread and store the result
```

### Broad dependencies in observable models

```swift
// Bad: changing any item triggers all views
@Observable class Model {
    var items: [Item] = []
}
var body: some View {
    Row(isFavorite: model.items.contains(item))
}

// Good: per-item view models or scoped state
```

## Debugging Aids

- Use `Self._printChanges()` in debug only to inspect what triggers updates.
- Use Instruments for hangs and hitches.
- Profile early and often during feature development.

## Hangs

- A hang is a noticeable delay in a discrete interaction (typically >100ms).
- Hangs almost always come from long-running work on the main thread.
- The main run loop processes UI events, timers, and main-queue work sequentially.
- Hang detection typically flags busy periods >250ms.
- Keep main-thread work short; offload heavy work from event handlers.

## Scroll Performance

- For `ScrollView` with an opaque, static, solid background, use `scrollContentBackground(.visible)` to improve scroll-edge rendering efficiency.
- For large data sets in `ScrollView`, use `LazyVStack`/`LazyHStack`; flag eager stacks with many children.

## Key Principles

- View bodies must compute quickly to meet frame deadlines.
- Narrow state scope (`@State`/`@Observable` closer to leaf views).
- Stabilize identities for `ForEach` and lists.
- Move heavy work out of `body` (precompute, cache, `@State`).
- Use `equatable()` or value wrappers for expensive subtrees.
- Downsample images before rendering.
- Avoid placing fast-changing values (timers, geometry) in environment.
- Extract subviews into dedicated `View` structs — computed properties/methods do not give SwiftUI the same diffing boundaries.
- Prefer `task()` over `onAppear()` for async work — automatic cancellation on disappear.
- Store built `@ViewBuilder` results, not escaping closures, for generic container views.
- Profile with Instruments for hot paths before major optimizations.
