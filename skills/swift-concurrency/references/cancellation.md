# Cancellation

Cancellation in Swift concurrency is cooperative. Setting the cancelled flag does nothing unless the running code checks it.

## How cancellation propagates

- Cancelling a parent task cancels all its children (structured concurrency).
- Cancelling a task group cancels all child tasks in that group.
- `Task {}` and `Task.detached {}` are unstructured — they must be cancelled explicitly by storing and calling `.cancel()` on the task handle.
- SwiftUI's `.task()` modifier cancels its task automatically when the view disappears. This is the primary reason to prefer `.task()` over `onAppear()` with a loose `Task {}`.


## Checking for cancellation

Use these inside long-running or looping async work, but only when it's safe to actually exit:

- `try Task.checkCancellation()` — throws `CancellationError` if cancelled. Preferred in throwing contexts.
- `Task.isCancelled` — returns `Bool`. Use in non-throwing contexts or when you need cleanup before exiting.

```swift
func processAll(_ items: [Item]) async throws {
    for item in items {
        try Task.checkCancellation()
        try await process(item)
    }
}
```

Functions that call other async functions get implicit cancellation checks at each `await` suspension point — but only if the called function itself checks. CPU-bound loops with no `await` will never see cancellation unless you check explicitly.


## `withTaskCancellationHandler`

Bridges Swift cancellation to legacy APIs that have their own cancel mechanism. The `onCancel` closure fires immediately when cancellation is requested — even while the async body is suspended — and may run on any thread.

```swift
func observe() async throws -> [Change] {
    let query = CKQuery(recordType: "Item", predicate: NSPredicate(value: true))
    let operation = CKQueryOperation(query: query)

    return try await withTaskCancellationHandler {
        try await performOperation(operation)
    } onCancel: {
        operation.cancel()
    }
}
```


## SwiftUI `.task()` auto-cancellation

The `.task()` modifier creates a structured task tied to the view's lifecycle. When the view disappears, the task is automatically cancelled. This is why `.task()` is always preferred over `onAppear()` with a manual `Task {}`.

```swift
.task {
    await viewModel.load()
}

.task(id: selectedItemId) {
    await viewModel.loadDetails(for: selectedItemId)
}
```

The `id:` variant cancels and restarts the task whenever the identity value changes.


## Broken cancellation patterns

### Catching and ignoring `CancellationError`

```swift
// Wrong — retries or shows an alert for a normal lifecycle event
catch {
    showAlert(error.localizedDescription)
}

// Correct — filter out CancellationError
do {
    try await loadData()
} catch is CancellationError {
    // Normal — do nothing
} catch {
    showAlert(error.localizedDescription)
}
```

### Forgetting to cancel stored tasks

```swift
// Wrong — task keeps running after the object is done with it
class ViewModel {
    var loadTask: Task<Void, Never>?

    func load() {
        loadTask = Task { await fetchData() }
    }
}

// Correct
func load() {
    loadTask?.cancel()
    loadTask = Task { await fetchData() }
}

deinit {
    loadTask?.cancel()
}
```

### No cancellation checks in CPU-bound work

A tight computational loop with no `await` points runs to completion even if cancelled. Insert periodic `try Task.checkCancellation()` calls:

```swift
func crunchNumbers(_ data: [Double]) async throws -> Double {
    var result = 0.0
    for (index, value) in data.enumerated() {
        if index % 1000 == 0 {
            try Task.checkCancellation()
        }
        result += expensiveComputation(value)
    }
    return result
}
```
