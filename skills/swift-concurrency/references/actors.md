# Actors

## Reentrancy

This is the most common concurrency bug LLMs produce. After every `await` inside an actor, all assumptions about the actor's state are invalidated because other calls may have run during the suspension.

### The bug

```swift
actor VideoCache {
    var items: [URL: Video] = [:]

    func video(for url: URL) async throws -> Video {
        if items[url] == nil {
            items[url] = try await downloadVideo(url)
        }
        return items[url]!
    }
}
```

Two callers can both see `nil` and both download. The force unwrap crashes if another caller clears the cache during the suspension.

### The fix

Capture the async result in a local, then assign. Never assume state is unchanged after `await`.

```swift
actor VideoCache {
    var items: [URL: Video] = [:]

    func video(for url: URL) async throws -> Video {
        if let cached = items[url] { return cached }
        let video = try await downloadVideo(url)
        items[url] = video
        return video
    }
}
```

### Deduplicating in-flight work

To prevent two callers from both downloading the same URL, store in-flight tasks:

```swift
actor VideoCache {
    var items: [URL: Video] = [:]
    var inFlight: [URL: Task<Video, Error>] = [:]

    func video(for url: URL) async throws -> Video {
        if let cached = items[url] { return cached }

        if let task = inFlight[url] {
            return try await task.value
        }

        let task = Task {
            try await downloadVideo(url)
        }

        inFlight[url] = task

        do {
            let video = try await task.value
            items[url] = video
            inFlight[url] = nil
            return video
        } catch {
            inFlight[url] = nil
            throw error
        }
    }
}
```


## Global and static state protection

Global and static mutable variables need an explicit isolation plan.

- `@MainActor` when the symbol belongs to main-actor code and callers should keep synchronous access there.
- `@unchecked Sendable` when safety comes from locks, queues, or another manual scheme the compiler cannot prove. This requires a high standard of correctness — check carefully.
- If neither applies, the shared global likely has an isolation problem.

```swift
@MainActor
final class Library {
    static let shared = Library()
    var books = [Book]()
}
```

With main-actor-by-default enabled for the target, this annotation may be implicit — check the build settings.


## Global actor inference rules

`@MainActor` propagates automatically in these cases (don't redundantly annotate):

- A subclass of a `@MainActor` class is also `@MainActor`.
- Values stored through actor-isolated property wrapper storage inherit that isolation (includes `@StateObject`, `@ObservedObject`).
- Conforming to a `@MainActor` protocol infers `@MainActor` on the entire conforming type, including members unrelated to the protocol. SwiftUI's `View` is a `@MainActor` protocol.
- Extensions of a `@MainActor` type inherit that isolation. Members defined in the extension are `@MainActor` without separate annotation.

`@MainActor` does **not** propagate to closures passed to non-isolated functions (unless the parameter is explicitly `@MainActor`).


## `isolated` parameters

Use `isolated` to accept any actor instance and run on its executor, without the function itself being tied to a specific actor:

```swift
func updateUI(on actor: isolated MainActor) {
    // Runs on the main actor
}
```

This is useful for code that needs to work with the caller's isolation context generically.


## `isolated deinit`

By default, a deinitializer on an actor-isolated class is not isolated — it runs outside the actor, even if the class itself is `@MainActor`. Accessing isolated state from `deinit` is a compile error.

Mark the deinitializer `isolated` to run it on the class's actor:

```swift
@MainActor
class Session {
    let user: User

    init(user: User) {
        self.user = user
        user.isLoggedIn = true
    }

    isolated deinit {
        user.isLoggedIn = false
    }
}
```

Without `isolated`, the deinit fails to compile because `user` is main-actor-isolated. Use this whenever teardown logic needs to touch actor-protected state.


## Runtime assertions

`MainActor.assertIsolated()` halts debug builds if the current task is not on the main actor's executor. Useful for verifying assumptions in code where the compiler cannot prove isolation statically.

```swift
func refresh() {
    MainActor.assertIsolated()
    // Safe to access main-actor state
}
```

This is compiled out of release builds and has no performance impact on shipping code.

`MainActor.assumeIsolated()` is for callback-based APIs where you know the callback runs on the main actor but the type system doesn't reflect it. Use only when the guarantee is real — if wrong, the app traps at runtime.


## When to use a custom actor

A custom actor introduces a separate serialized access boundary. External callers must use `await`, values crossing the boundary must satisfy `Sendable`, and reentrancy rules apply after every suspension point.

Consider an actor when:
- A type owns mutable state accessed from multiple isolation domains
- The state mutations require serialized access

Avoid actors when:
- The type mostly forwards work or owns little mutable state
- A value type or `@MainActor` annotation would be simpler
- The API must stay synchronous (use `Mutex` or locks instead)
