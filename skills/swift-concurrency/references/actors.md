# Actors

## Reentrancy

After every `await` inside an actor, state may have changed. Read-await-write sequences and force unwraps after `await` are bugs: two callers can both see `nil` and both do the work, or another call can clear the value mid-suspension. Re-check state after the `await`, or dedupe in-flight work by storing a `Task` per key (remove it on both success and failure).

## Global and static state

Mutable globals/statics need an explicit plan: `@MainActor`, an actor, or `@unchecked Sendable` backed by a real lock. With main-actor-by-default, the annotation may be implicit.

## Global actor inference

- Conforming to a `@MainActor` protocol (e.g. SwiftUI `View`) makes the whole type `@MainActor`, including unrelated members.
- Subclasses, extensions, and actor-isolated property-wrapper storage inherit isolation.
- `@MainActor` does not propagate into closures passed to non-isolated functions unless the parameter is annotated.

## `isolated deinit` (Swift 6.2)

A deinit of a `@MainActor` class is not isolated; touching isolated state there is a compile error. Mark it `isolated deinit`.

## Runtime assertions

- `MainActor.assertIsolated()` traps in debug builds only.
- `MainActor.assumeIsolated()` traps at runtime if wrong; use only when the guarantee is real (callbacks documented to run on main).

## When to use an actor

Avoid actors for types with little mutable state, or when the API must stay synchronous (use `Mutex`).
