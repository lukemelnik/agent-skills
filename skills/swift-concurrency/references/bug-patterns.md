# Bug Patterns

Concurrency failure modes that LLMs produce frequently, with the preferred fix for each.

## 1. Actor reentrancy: check-then-act across `await`

**Failure:** Actor method checks state, awaits, then acts on the stale check. Other callers may have mutated state during the suspension.

```swift
actor Cache {
    var data: [String: Data] = [:]

    func load(_ key: String) async throws -> Data {
        if data[key] == nil {
            data[key] = try await download(key)
        }
        return data[key]!
    }
}
```

Two callers can both see `nil` and both download. The force unwrap crashes if a third caller clears the cache mid-flight.

**Fix:** Capture the async result into a local before writing. For deduplication, store in-flight `Task` handles. See `actors.md` for the full pattern.


## 2. Continuation resumed zero times

**Failure:** A `withCheckedThrowingContinuation` callback never fires (object deallocated, network timeout with no callback, early return before registering the handler). The caller hangs forever.

**Fix:** Audit every code path to confirm the continuation is resumed. If the underlying API can silently drop the callback, add a timeout or restructure. Always use `withCheckedThrowingContinuation` (not the unsafe variant) for easier diagnostics.


## 3. Continuation resumed twice

**Failure:** Two callbacks (e.g., a success handler and a cancellation handler) both resume the same continuation. `CheckedContinuation` traps at runtime; `UnsafeContinuation` causes undefined behavior.

**Fix:** Restructure callback wiring so only one path can reach the continuation. If not possible, guard with a `Bool` flag or use an `actor` to serialize access. Always default to `CheckedContinuation` so double resumes surface immediately.


## 4. Unstructured tasks in a loop

**Failure:** `for item in items { Task { await process(item) } }` creates fire-and-forget tasks with no cancellation propagation, no error collection, and no way to await completion.

**Fix:** Use `withTaskGroup` or `withThrowingTaskGroup`. See `structured.md`.


## 5. Swallowed errors in Task closures

**Failure:** `Task { try await riskyWork() }` — if `riskyWork` throws, the error is silently lost. The user sees nothing; the operation just doesn't happen.

**Fix:** Handle the error inside the closure.

```swift
Task {
    do {
        try await riskyWork()
    } catch is CancellationError {
        // Normal lifecycle
    } catch {
        self.errorMessage = error.localizedDescription
    }
}
```


## 6. Blocking the main actor with synchronous work

**Failure:** CPU-intensive work runs on `@MainActor` (or inside `Task {}` called from `@MainActor`), causing UI freezes. In Swift 6.2 this is more likely because `nonisolated` async functions now stay on the caller's executor by default.

**Fix:** Move expensive work into a `@concurrent` function, or use `Task.detached` as a last resort.


## 7. Unbounded AsyncStream buffer

**Failure:** A high-throughput producer yields values faster than the consumer processes them. With the default `.unbounded` buffering policy, memory grows without limit.

**Fix:** Specify `.bufferingNewest(n)` or `.bufferingOldest(n)`. See `async-streams.md`.


## 8. Ignoring `CancellationError` in catch blocks

**Failure:** A `catch` block retries or shows an error alert for `CancellationError`, which is a normal lifecycle event (e.g., user navigated away).

**Fix:** Check for cancellation before handling other errors.

```swift
do {
    try await loadData()
} catch is CancellationError {
    // Normal — view disappeared or task was cancelled
} catch {
    self.errorMessage = error.localizedDescription
}
```


## 9. `@unchecked Sendable` hiding real races

**Failure:** A class is marked `@unchecked Sendable` to suppress compiler errors, but its mutable `var` properties have no synchronization. The data race still exists at runtime.

**Fix:** Restructure to use value types, use an `actor`, or move state behind a lock (`Mutex`). Check whether Swift 6 region-based isolation makes `@unchecked Sendable` unnecessary. See `bridging.md`.
