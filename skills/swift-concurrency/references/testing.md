# Testing Concurrent Code

## Async tests with Swift Testing

Swift Testing supports async test functions natively. No special setup required:

```swift
@Test func userLoads() async throws {
    let user = try await UserService().load(id: "123")
    #expect(user.name == "Alice")
}
```

Do not wrap async work in `Task {}` or use expectations/semaphores inside Swift Testing tests — just make the test function `async`.


## Testing actor state

Access actor properties through `await` in tests, just like production code. Do not add `nonisolated` accessors just for testing.

```swift
@Test func cachingWorks() async throws {
    let cache = ImageCache()
    let image = try await cache.image(for: testURL)
    let cached = try await cache.image(for: testURL)
    #expect(image == cached)
}
```


## The `.serialized` trait

`.serialized` only affects parameterized tests. It tells Swift Testing to run that test's argument cases one at a time rather than in parallel. Applying `.serialized` to a non-parameterized test does nothing.

```swift
@Test(.serialized, arguments: ["alice", "bob", "charlie"])
func accountCreation(username: String) async throws {
    let account = try await AccountService().create(username: username)
    #expect(account.isActive)
}
```


## Confirmation for async events

When testing that an async event fires, use `confirmation()`:

```swift
@Test func notificationFires() async {
    await confirmation { confirmed in
        let task = Task {
            for await _ in NotificationCenter.default.notifications(named: .dataDidChange) {
                confirmed()
                break
            }
        }

        await Task.yield()
        NotificationCenter.default.post(name: .dataDidChange, object: nil)
        await task.value
    }
}
```

`confirmation()` fails the test if the closure is never called. All async work being confirmed must complete before the `confirmation()` closure returns. If the code under test spawns a `Task` internally and the test cannot await it, `confirmation()` will finish early and the test will fail.


## Actor isolation in tests

Swift Testing runs tests on any executor by default. Constrain when needed:

```swift
@MainActor
@Test func viewModelUpdatesOnMainActor() async {
    let vm = ViewModel()
    await vm.refresh()
    #expect(vm.items.isEmpty == false)
}
```

For finer control, `confirmation()` accepts an `isolation` parameter:

```swift
@Test func loadingUpdatesUI() async {
    await confirmation(isolation: MainActor.shared) { confirmed in
        let vm = ViewModel(onUpdate: { confirmed() })
        await vm.load()
    }
}
```

Check whether test targets have default actor isolation enabled at the module level — this affects which tests run on which executor.


## Test scoping traits with `@TaskLocal`

When multiple tests need shared configuration (mock environment, injected dependency), use test scoping traits with task-local values:

```swift
struct MockEnvironmentTrait: TestTrait, TestScoping {
    func provideScope(
        for test: Test,
        testCase: Test.Case?,
        performing function: () async throws -> Void
    ) async throws {
        let env = Environment(apiBase: URL(string: "https://test.example.com")!)
        try await Environment.$current.withValue(env) {
            try await function()
        }
    }
}

extension Trait where Self == MockEnvironmentTrait {
    static var mockEnvironment: Self { Self() }
}

@Test(.mockEnvironment) func fetchUsesTestAPI() async throws {
    let users = try await UserService().fetchAll()
    #expect(users.isEmpty == false)
}
```

Each test's configuration lives in the task-local, so parallel tests get independent values automatically.


## Avoid timing-based tests

Never use `Task.sleep`, `Thread.sleep`, or fixed delays to wait for results. These tests are flaky.

```swift
// Wrong
@Test func dataLoads() async throws {
    viewModel.load()
    try await Task.sleep(for: .seconds(1))
    #expect(viewModel.items.isEmpty == false)
}

// Correct
@Test func dataLoads() async throws {
    await viewModel.load()
    #expect(viewModel.items.isEmpty == false)
}
```

If the API is callback-based, wrap it with `withCheckedContinuation` or use `confirmation()`.


## Testing cancellation

Verify that the code under test checks for cancellation — not just that `Task.checkCancellation()` works.

```swift
@Test func processorRespectsCancel() async throws {
    let processor = Processor(items: Array(repeating: .stub, count: 1_000))

    let task = Task {
        try await processor.run()
    }

    try await Task.sleep(for: .zero)
    task.cancel()

    await #expect(throws: CancellationError.self) {
        try await task.value
    }
}
```

The key: the test exercises a cancellation check that lives in production code, not one added to the test itself.


## Race detection

Enable Thread Sanitizer (TSan) in your test scheme to catch data races at runtime. TSan finds races that static checks miss, particularly in code using `@unchecked Sendable` or unsafe pointers.

In Xcode: Product -> Scheme -> Edit Scheme -> Diagnostics -> Thread Sanitizer.

TSan adds overhead — consider enabling it for a dedicated CI job rather than every local run.
