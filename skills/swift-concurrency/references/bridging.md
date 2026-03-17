# Bridging Sync and Async Code

## Checked continuations

`withCheckedContinuation` and `withCheckedThrowingContinuation` wrap callback-based APIs into async functions. The critical rule: **the continuation must be resumed exactly once on every code path.**

- Resuming zero times: the caller hangs forever.
- Resuming twice: a runtime crash.

Audit every code path. If the callback might not fire (e.g., the object is deallocated), ensure you still resume the continuation.

```swift
func loadUser(id: String) async throws -> User {
    try await withCheckedThrowingContinuation { continuation in
        api.fetchUser(id: id) { result in
            continuation.resume(with: result)
        }
    }
}
```

Default to `withCheckedContinuation` / `withCheckedThrowingContinuation` everywhere, including production builds. The runtime checks catch double-resume and missing-resume bugs that are otherwise extremely hard to diagnose.

Only consider `withUnsafeContinuation` variants after profiling proves the checked version is a bottleneck in a hot path — this is rare in practice.


## Runtime actor assertions in callback code

Callback-based APIs are a common place for actor assumptions to fail at runtime.

- `MainActor.assertIsolated()` — halts debug builds if not on the main actor. Use to verify assumptions.
- `MainActor.assumeIsolated()` — use only when the callback is truly main-actor-bound and you are encoding a guarantee the compiler cannot see. If wrong, the app traps at runtime.


## `@unchecked Sendable`

This silences the compiler's Sendable checks entirely. It is a promise that you have verified thread safety yourself.

### Legitimate uses

- Types that use internal locking (`os_unfair_lock`, `NSLock`, `Mutex`) and are genuinely thread-safe.
- Reference types whose mutable state is protected by an actor in practice but can't express that to the compiler.

### Red flags

- Applied to silence a compiler error without understanding why the error exists.
- Applied to a class with mutable `var` properties and no synchronization.
- Used as a shortcut instead of restructuring to use value types or actors.

Before reaching for `@unchecked Sendable`, check whether Swift 6's region-based isolation already solves the problem — many cases that previously required it now compile cleanly.


## `nonisolated(nonsending)` (Swift 6.2)

Marks an async function so it stays on the caller's actor (the new default behavior) even when the function would otherwise hop executors. Use this when you want to explicitly document that a function should not be offloaded, or to override a protocol requirement that would otherwise be `@concurrent`.

```swift
protocol DataProvider {
    func fetchData() async throws -> Data
}

struct LocalProvider: DataProvider {
    nonisolated(nonsending) func fetchData() async throws -> Data {
        // Stays on whatever actor the caller is on
        return try loadFromDisk()
    }
}
```
