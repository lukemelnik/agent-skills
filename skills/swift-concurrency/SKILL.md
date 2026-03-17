---
name: swift-concurrency
description: Swift Concurrency review, writing, and remediation for Swift 6.2+. Use when asked to review Swift Concurrency usage, write concurrent code, fix concurrency compiler errors, adopt approachable concurrency, migrate legacy patterns, or offload work to the background.
---

# Swift Concurrency Expert

## Overview

Review, write, and fix Swift Concurrency code in Swift 6.2+ codebases. Covers actor isolation, Sendable safety, structured/unstructured concurrency, async streams, legacy migration, and modern concurrency patterns.

## Which references to load

Load only the references relevant to the task. Do not load all files for every task.

| Task | Load these references |
|------|----------------------|
| **Review existing concurrency code** | `bug-patterns.md`, `actors.md`, `diagnostics.md` |
| **Fix compiler errors** | `diagnostics.md`, `swift-6-2-concurrency.md`, `bridging.md` |
| **Write new concurrent code** | `structured.md`, `actors.md`, `async-streams.md` |
| **Adopt Swift 6.2 / approachable concurrency** | `swift-6-2-concurrency.md`, `approachable-concurrency.md` |
| **Migrate from GCD/Combine/delegates** | `interop.md`, `bridging.md`, `async-streams.md` |
| **SwiftUI concurrency** | `swiftui-concurrency.md`, `cancellation.md`, `unstructured.md` |
| **Background/offloading work** | `swift-6-2-concurrency.md`, `structured.md`, `unstructured.md` |
| **Write or fix concurrency tests** | `testing.md`, `actors.md` |
| **Task lifecycle and cancellation** | `cancellation.md`, `unstructured.md`, `structured.md` |

## Workflow

### 1. Understand the context

- Check project concurrency settings: Swift language version (6.2+), strict concurrency level, and whether approachable concurrency (main-actor-by-default) is enabled.
- Identify the current actor context (`@MainActor`, `actor`, `nonisolated`) and any default actor isolation mode.
- Confirm whether the code is UI-bound or intended to run off the main actor.
- For compiler errors, capture the exact diagnostic message and look it up in `diagnostics.md`.

### 2. Scan for hotspots

When reviewing existing code, search for these patterns and inspect each carefully:

- **`DispatchQueue`** — In app-level code, `DispatchQueue.main.async`, `DispatchQueue.global()`, and custom serial queues usually have a Swift concurrency equivalent (see `interop.md`). GCD can still be appropriate in low-level libraries and performance-critical synchronous sections.
- **`Task.detached`** — Rarely correct. Usually means the author wanted background execution but should use `@concurrent` (Swift 6.2) or a task group. Check whether shedding actor isolation and priority is truly intentional.
- **`Task {}` inside a loop** — Should almost always be a task group instead.
- **`withCheckedContinuation` / `withCheckedThrowingContinuation`** — Audit every code path to ensure the continuation is resumed exactly once. Watch for early returns, thrown errors, and callbacks that might never fire.
- **`AsyncStream` (closure-based initializer)** — Prefer the modern `AsyncStream.makeStream(of:)` factory. If using the closure form, verify the continuation is finished in all cleanup paths.
- **`@unchecked Sendable`** — Should be very rare. Check whether the type actually provides thread safety. Check whether Swift 6 region-based isolation makes it unnecessary.
- **`MainActor.run {}`** — Often unnecessary. If the surrounding code is already `@MainActor`, this is a no-op. If hopping from background, check whether the function should just be `@MainActor`.
- **Actors with `await` between state reads/writes** — Check for reentrancy bugs: any method that reads state, awaits, then writes state is suspect.
- **Force unwraps after `await` inside actors** — Another caller may have set the value to `nil` during the suspension.

### 3. Apply fixes

Prefer edits that preserve existing behavior while satisfying data-race safety. Use the smallest safe fix.

**Common fixes by category:**

**Isolation:**
- UI-bound types: annotate with `@MainActor` (or let main-actor-by-default handle it).
- Protocol conformance on main actor types: use isolated conformance (`extension Foo: @MainActor SomeProtocol`).
- Global/static state: protect with `@MainActor` or move into an actor.

**Background work:**
- Move expensive work into a `@concurrent` async function on a `nonisolated` type.
- Use an `actor` to guard mutable state accessed from multiple isolation domains.
- Use task groups for parallel batch work, not loops of unstructured tasks.

**Sendable:**
- Prefer immutable/value types.
- Add `Sendable` conformance only when correct.
- Avoid `@unchecked Sendable` unless you can prove thread safety.
- Check if region-based isolation eliminates the need.

**Cancellation:**
- Use `.task()` modifier in SwiftUI, not `onAppear` + `Task {}`.
- Filter `CancellationError` before handling other errors.
- Add `try Task.checkCancellation()` in CPU-bound loops.
- Cancel stored tasks on teardown.

### 4. Swift 6.2 key changes

These are the major changes from Swift 6.2 approachable concurrency:

- **Async functions stay on the caller's actor by default.** They no longer hop to a global concurrent executor. This eliminates most "sending risks data races" errors.
- **Isolated conformances** (`extension Foo: @MainActor SomeProtocol`). The compiler ensures the conformance is only used on the correct actor.
- **Main-actor-by-default mode.** Opt-in per target. All declarations are implicitly `@MainActor`, eliminating annotation noise for UI-heavy code.
- **`@concurrent` attribute.** Explicitly offloads an async function to the concurrent thread pool. Use for CPU-intensive work that should not block the actor.
- **`Task.immediate`.** Starts running synchronously up to the first suspension point.
- **`isolated deinit`.** Run deinitializer on the class's actor to access isolated state during teardown.
- **`nonisolated(nonsending)`.** Explicitly marks an async function to stay on the caller's actor.

### 5. Offloading work pattern

```swift
nonisolated struct PhotoProcessor {
    @concurrent
    func process(data: Data) async -> ProcessedPhoto? { ... }
}

processedPhotos[item.id] = await PhotoProcessor().process(data: data)
```

To offload:
1. Make the struct/class `nonisolated`
2. Add `@concurrent` to the function
3. Add `async` if not already
4. Add `await` at call sites

## Reference Material

### Core concepts
- `references/swift-6-2-concurrency.md` — Full walkthrough of Swift 6.2 changes with code examples.
- `references/approachable-concurrency.md` — Quick guide for projects opted into approachable concurrency mode.
- `references/actors.md` — Actor reentrancy, global actor inference, `isolated` parameters, runtime assertions.

### Task management
- `references/structured.md` — `async let` vs task groups, `withDiscardingTaskGroup`, concurrency limiting, error handling with partial results.
- `references/unstructured.md` — `Task` vs `Task.detached`, `Task.immediate`, anti-patterns, cancellation management.
- `references/cancellation.md` — Cooperative cancellation, propagation rules, `withTaskCancellationHandler`, SwiftUI `.task()` auto-cancellation.

### Async patterns
- `references/async-streams.md` — `AsyncStream.makeStream(of:)`, continuation lifecycle, buffering policies, delegate wrapping.
- `references/bridging.md` — Checked continuations (resume exactly once), `@unchecked Sendable`, `nonisolated(nonsending)`, runtime actor assertions.

### Migration and debugging
- `references/interop.md` — Completion handlers -> async/await, delegates -> AsyncStream, DispatchQueue -> @MainActor/@concurrent, serial queue -> actor, locks vs Mutex, Combine -> AsyncSequence.
- `references/diagnostics.md` — Compiler error messages mapped to prioritized fix strategies.
- `references/bug-patterns.md` — Catalog of 9 specific failure modes LLMs commonly produce with fixes.

### Platform-specific
- `references/swiftui-concurrency.md` — SwiftUI actor isolation, Sendable closures, structuring async work.
- `references/testing.md` — Async tests with Swift Testing, `confirmation()`, actor isolation in tests, test scoping traits, cancellation testing, TSan.
