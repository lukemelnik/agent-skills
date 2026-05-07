# Concurrent Programming Updates in Swift 6.2

## Data-race Safety

Data-race safety in Swift 6 prevents mistakes at compile time, but the most natural code to write was often prone to data races, leading to compiler errors. Swift 6.2 changes this philosophy to stay single-threaded by default until you choose to introduce concurrency.

## Async Functions Stay on Caller's Actor

Instead of eagerly offloading async functions to the concurrent pool, the function continues to run on the actor it was called from. This eliminates data races because values passed into the async function are never sent outside the actor.

```swift
class PhotoProcessor {
  func extractSticker(data: Data, with id: String?) async -> Sticker? { }
}

@MainActor
final class StickerModel {
  let photoProcessor = PhotoProcessor()

  func extractSticker(_ item: PhotosPickerItem) async throws -> Sticker? {
    guard let data = try await item.loadTransferable(type: Data.self) else {
      return nil
    }
    // No longer a data race error in Swift 6.2
    return await photoProcessor.extractSticker(data: data, with: item.itemIdentifier)
  }
}
```

## Isolated Conformances

A conformance that needs main actor state is called an *isolated* conformance. The compiler ensures it is only used on the main actor.

```swift
protocol Exportable {
  func export()
}

// Isolated conformance — safe because compiler enforces main actor usage
extension StickerModel: @MainActor Exportable {
  func export() {
    photoProcessor.exportAsPNG()
  }
}
```

Using an isolated conformance off the main actor produces a compile error:

```swift
nonisolated struct ImageExporter {
  var items: [any Exportable]

  mutating func add(_ item: StickerModel) {
    // error: Main actor-isolated conformance of 'StickerModel' to 'Exportable'
    // cannot be used in nonisolated context
    items.append(item)
  }
}
```

## Global State Protection

Global and static variables are prone to data races. Protect with `@MainActor`:

```swift
@MainActor
final class StickerLibrary {
  static let shared: StickerLibrary = .init()
}
```

## Main-Actor-by-Default Mode

Infer `@MainActor` for all declarations in a module. Opt-in per target:

**Xcode:** Swift Compiler > Concurrency > Default Actor Isolation
**SwiftPM:**
```swift
swiftSettings: [
  .swiftLanguageMode(.v6),
  .defaultIsolation(MainActor.self)
]
```

This eliminates data-race safety errors about unsafe global/static variables and reduces concurrency annotations. Recommended for apps, scripts, and executable targets.

## Offloading Work with @concurrent

`@concurrent` ensures a function always runs on the concurrent thread pool, freeing the actor for other tasks:

```swift
class PhotoProcessor {
  var cachedStickers: [String: Sticker]

  func extractSticker(data: Data, with id: String) async -> Sticker {
    if let sticker = cachedStickers[id] {
      return sticker
    }
    let sticker = await Self.extractSubject(from: data)
    cachedStickers[id] = sticker
    return sticker
  }

  @concurrent
  static func extractSubject(from data: Data) async -> Sticker { }
}
```

To offload a function:
1. Make the struct/class `nonisolated`
2. Add `@concurrent` to the function
3. Add `async` if not already
4. Add `await` at call sites

```swift
nonisolated struct PhotoProcessor {
    @concurrent
    func process(data: Data) async -> ProcessedPhoto? { ... }
}
```

## `Task.immediate`

`Task.immediate` starts running synchronously on the caller's executor up to the first suspension point, instead of merely queuing the task for later:

```swift
print("Starting")

Task {
    print("In Task")
}

Task.immediate {
    print("In Immediate Task")
}

print("Done")
```

Output order: "Starting", "In Immediate Task", "Done", "In Task".

Use it only when that immediate start is the point. It is still an unstructured task after the first synchronous stretch.

Task groups also gained `addImmediateTask()` and `addImmediateTaskUnlessCancelled()` for the same immediate-start behavior with child tasks.


## `isolated deinit`

By default, a deinitializer on an actor-isolated class is not isolated — it runs outside the actor, even if the class is `@MainActor`. Accessing isolated state from `deinit` is a compile error.

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

Use this whenever teardown logic needs to touch actor-protected state.


## Task priority escalation

Swift 6.2 exposes priority escalation directly. Tasks can observe escalation, and code can request a higher priority:

```swift
let newsFetcher = Task(priority: .medium) {
    try await withTaskPriorityEscalationHandler {
        let url = URL(string: "https://hws.dev/messages.json")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return data
    } onPriorityEscalated: { oldPriority, newPriority in
        print("Priority escalated to \(newPriority)")
    }
}

newsFetcher.escalatePriority(to: .high)
```

Priority escalation is usually automatic when a higher-priority task waits on lower-priority work. Manual escalation exists but most code should leave this to the runtime.


## Task naming

Tasks and task-group children can carry names for debugging:

```swift
let task = Task(name: "FetchProfile") {
    print("Current task: \(Task.name ?? "Unknown")")
}
```

Task groups support naming too:

```swift
let stories = await withTaskGroup(of: [NewsStory].self) { group in
    for i in 1...5 {
        group.addTask(name: "Stories \(i)") {
            do {
                let url = URL(string: "https://example.com/news-\(i).json")!
                let (data, _) = try await URLSession.shared.data(from: url)
                return try JSONDecoder().decode([NewsStory].self, from: data)
            } catch {
                print("Loading \(Task.name ?? "Unknown") failed.")
                return []
            }
        }
    }

    var allStories = [NewsStory]()
    for await stories in group {
        allStories.append(contentsOf: stories)
    }
    return allStories
}
```

Task names are debugging aids, not correctness features. Worth keeping when logs, tracing, or failure diagnosis matter.


## `nonisolated(nonsending)`

Explicitly marks an async function to stay on the caller's actor (the Swift 6.2 default behavior). Use this to document intent or to override a protocol requirement that would otherwise be `@concurrent`:

```swift
nonisolated(nonsending) func fetchData() async throws -> Data {
    // Stays on whatever actor the caller is on
    return try await loadFromDisk()
}
```


## Summary

1. Start with code on the main actor by default — no data race risk.
2. Async functions run wherever they're called from — still no data race risk.
3. When ready for parallelism, offload specific work with `@concurrent`.

Enable approachable concurrency settings in Xcode under Swift Compiler > Concurrency. Swift 6.2 includes migration tooling at swift.org/migration.
