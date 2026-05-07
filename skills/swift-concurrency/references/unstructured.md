# Unstructured Concurrency

## `Task` vs `Task.detached`

`Task {}` inherits the caller's actor isolation. `Task.detached {}` does not.

```swift
@MainActor
func example() {
    Task {
        // Still on MainActor — safe to update UI
        label.text = "Done"
    }

    Task.detached {
        // Not on MainActor — updating UI here is a bug
    }
}
```

`Task.detached` is rarely the right choice. It sheds the caller's actor context and priority. Prefer `Task {}` with explicit isolation changes, or structured concurrency. Only use `Task.detached` when you specifically need to abandon the caller's context, and even then verify there isn't a better option.

In Swift 6.2, prefer `@concurrent` functions for background offloading instead of `Task.detached`.


## `Task.immediate` (Swift 6.2)

`Task.immediate` starts running synchronously on the caller's executor up to the first suspension point, instead of merely queuing the task for later:

```swift
Task.immediate {
    // Runs synchronously until the first await
    setupState()
    await fetchData()
}
```

Use it only when that immediate start matters. After the first suspension point, it behaves like a regular unstructured task.


## Cancellation is cooperative

Cancelling a task does not stop its code. The task body must check for cancellation explicitly.

```swift
func processItems(_ items: [Item]) async throws {
    for item in items {
        try Task.checkCancellation()
        await process(item)
    }
}
```

- `Task.checkCancellation()` throws `CancellationError` if cancelled.
- `Task.isCancelled` returns a `Bool` for non-throwing contexts.
- `task.cancel()` only sets the flag — it does not interrupt execution.

For legacy APIs with their own cancel mechanism, use `withTaskCancellationHandler` — see `cancellation.md`.


## Anti-patterns

### `Task` inside `onAppear()`

Never create a `Task` inside SwiftUI's `onAppear()`. Use the `.task()` modifier instead — it handles cancellation on disappear automatically.

```swift
// Wrong
.onAppear {
    Task { await viewModel.load() }
}

// Correct
.task {
    await viewModel.load()
}
```

### `Task` to bridge sync-to-async when the function could be async

If the calling function can itself be made `async`, do that instead of wrapping in `Task {}`.

### Ignoring errors in throwing tasks

`Task { try await riskyWork() }` silently swallows errors if `riskyWork` throws. The user sees nothing; the operation just doesn't happen.

```swift
// Wrong
Task { try await riskyWork() }

// Correct
Task {
    do {
        try await riskyWork()
    } catch is CancellationError {
        // Normal lifecycle — view disappeared or task was cancelled
    } catch {
        self.errorMessage = error.localizedDescription
    }
}
```

### Storing tasks without cancellation management

```swift
// Wrong — the task keeps running after the object is done with it
class ViewModel {
    var loadTask: Task<Void, Never>?

    func load() {
        loadTask = Task { await fetchData() }
    }
}

// Correct — cancel previous task, cancel on teardown
class ViewModel {
    var loadTask: Task<Void, Never>?

    func load() {
        loadTask?.cancel()
        loadTask = Task { await fetchData() }
    }

    deinit {
        loadTask?.cancel()
    }
}
```
