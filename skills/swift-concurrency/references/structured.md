# Structured Concurrency

## `async let` vs task groups

Use `async let` when you have a **fixed number** of independent operations that may return **different types**:

```swift
async let news = fetchNews()
async let weather = fetchWeather()
async let update = checkForUpdate()

let (newsResult, weatherResult, updateResult) = try await (news, weather, update)
```

Use task groups when you have a **dynamic number** of operations of the **same type**:

```swift
let results = try await withThrowingTaskGroup(of: Data.self) { group in
    for url in urls {
        group.addTask { try await fetch(url) }
    }

    var collected = [Data]()
    for try await result in group {
        collected.append(result)
    }
    return collected
}
```


## Task groups over loops

Never use unstructured tasks in a loop. This creates fire-and-forget tasks with no cancellation propagation, no error collection, and no way to await all results.

```swift
// Wrong
for url in urls {
    Task { try await fetch(url) }
}

// Correct
let results = try await withThrowingTaskGroup(of: Data.self) { group in
    for url in urls {
        group.addTask { try await fetch(url) }
    }

    var collected = [Data]()
    for try await result in group {
        collected.append(result)
    }
    return collected
}
```


## `withDiscardingTaskGroup`

When child tasks don't return meaningful results (fire-and-forget side effects), use `withDiscardingTaskGroup` instead of `withTaskGroup`. It avoids accumulating unused results in memory.

```swift
await withDiscardingTaskGroup { group in
    for connection in connections {
        group.addTask { await connection.sendHeartbeat() }
    }
}
```


## Limiting concurrency

Task groups launch all child tasks eagerly. For resource-constrained work (network requests, file I/O), limit concurrency with a sliding-window pattern:

```swift
try await withThrowingTaskGroup(of: ProcessedImage.self) { group in
    let maxConcurrent = 4
    var iterator = urls.makeIterator()

    for _ in 0..<maxConcurrent {
        guard let url = iterator.next() else { break }
        group.addTask { try await fetchAndProcess(url) }
    }

    for try await result in group {
        process(result)
        if let url = iterator.next() {
            group.addTask { try await fetchAndProcess(url) }
        }
    }
}
```


## Error handling with partial results

When one child task throws, the group cancels all remaining children. If you need partial results, catch errors inside each child task:

```swift
await withTaskGroup(of: (URL, Result<Data, Error>).self) { group in
    for url in urls {
        group.addTask {
            do {
                return (url, .success(try await fetch(url)))
            } catch {
                return (url, .failure(error))
            }
        }
    }

    for await (url, result) in group {
        switch result {
        case .success(let data): handle(data)
        case .failure(let error): log(error, for: url)
        }
    }
}
```


## Immediate child tasks (Swift 6.2)

Task groups support `addImmediateTask()` and `addImmediateTaskUnlessCancelled()` for children that should start running synchronously up to their first suspension point, matching the behavior of `Task.immediate`.


## Type inference

Swift usually infers task group types automatically, but complex return types (tuples, `Result` types) require explicit type specification:

```swift
await withTaskGroup(of: (URL, Result<Data, Error>).self) { group in
    // ...
}
```
