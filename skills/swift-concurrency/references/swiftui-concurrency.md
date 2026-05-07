# SwiftUI Concurrency

SwiftUI-specific concurrency patterns, actor isolation, and Sendable closures.

## Main-Actor Default in SwiftUI

- `View` is `@MainActor` isolated by default; members and `body` inherit isolation.
- Swift 6.2 can infer `@MainActor` for all types in a module (main-actor-by-default mode).
- This aligns with UIKit/AppKit `@MainActor` APIs.

## Where SwiftUI Runs Code Off the Main Thread

SwiftUI may evaluate some view logic on background threads for performance:
- `Shape` path generation
- `Layout` methods
- `visualEffect` closures
- `onGeometryChange` closures

These APIs often require `Sendable` closures to reflect their runtime semantics.

## Sendable Closures and Data-Race Safety

- Accessing `@MainActor` state from a `Sendable` closure is unsafe and flagged by the compiler.
- Prefer capturing value copies in the closure capture list (e.g., copy a `Bool`).
- Avoid sending `self` into a sendable closure just to read a single property.

```swift
// Bad: captures self
.visualEffect { content, proxy in
    content.offset(y: self.isExpanded ? 0 : -20) // error
}

// Good: capture the value
let isExpanded = isExpanded
.visualEffect { [isExpanded] content, proxy in
    content.offset(y: isExpanded ? 0 : -20)
}
```

## Structuring Async Work

- SwiftUI action callbacks are synchronous so UI updates (like loading states) can be immediate.
- Use `Task` to bridge into async contexts; keep async bodies minimal.
- Use state as the boundary: async work updates model/state; UI reacts synchronously.

```swift
Button("Load") {
    isLoading = true  // Synchronous — immediate UI update
    Task {
        await viewModel.load()
        isLoading = false
    }
}
```

## Performance-Driven Concurrency

- Offload expensive work from the main actor to avoid hitches.
- Keep time-sensitive UI logic (animations, gesture responses) synchronous.
- Separate UI code from long-running async work to improve responsiveness and testability.
