# iOS Testing

Swift Testing is preferred for new unit tests; it does NOT support UI tests (use XCTest/XCUIApplication).

### Critical Rules

These are the most common mistakes agents make with Swift Testing:

- **Never negate with `!` in `#expect`** -- `#expect(value == false)` not `#expect(!value)`. The `!` defeats Swift Testing's macro expansion and produces unhelpful failure messages.
- **`@Suite` is optional** -- only add it when you need a display name or traits. Any struct/class with `@Test` methods is auto-discovered as a suite. Do not add `@Suite` unnecessarily.
- **`init()` replaces `setUp()`/`tearDown()`** -- use `init()` for structs, `init()`/`deinit` for classes. No setUp/tearDown in Swift Testing.
- **`.serialized` only affects parameterized tests** -- it does NOT make all tests in a suite run sequentially. It serializes parameterized test cases only.
- **`@available` works on individual tests but NOT on suites** -- place `@available(iOS 18, *)` on each `@Test` method, not on the suite struct.
- **No `test` prefix needed** -- use `func userCanLogOut()` rather than `func testUserCanLogOut()`.
- **Random, parallel execution is the default** -- each test must work in any order at any time.
- **A test with no `#expect` or `#require` is assumed to pass.**

### Other gotchas

- Mark tests or suites `@MainActor` for main-actor code; `confirmation()` and `withKnownIssue()` take an `isolation:` parameter.
- No built-in float tolerance; Swift Numerics `isApproximatelyEqual` needs user approval as a dependency.
- Isolate `UserDefaults` with a UUID suite name and `removePersistentDomain` in `defer`; inject `UserDefaults`/`URLSession` behind protocols with defaults.
- Swift 6.2+: exit tests (`await #expect(processExitsWith: .failure) { ... }`), `Attachment.record`, `TestScoping` traits with `@TaskLocal`. Raw-identifier test names only if the project already uses them.
- `ActorIsolated` and `withMainSerialExecutor` come from Point-Free packages (`swift-dependencies`, `swift-concurrency-extras`), not Apple APIs; do not add them without approval.
- Test `@Observable` models by mutating state directly and asserting; test protocol customization through the abstraction the app uses.
- Mocks: verify call counts and arguments; prefer protocol/closure-based DI over mocking frameworks.
- Snapshot tests (swift-snapshot-testing, requires approval): `perceptualPrecision: 0.98`, `isRecording = true` only temporarily, register custom fonts or skip.
- Cover Loading/Loaded/Empty/Error with `#Preview` states and pair them with snapshots when visual regressions matter.

## UI testing

- Set `continueAfterFailure = false`; launch with `-ApplePersistenceIgnoreState YES`.
- Target controls by stable accessibility identifiers (supplement, do not replace, labels), especially repeated, icon-only, or ambiguous controls. Never use coordinates.
- Use `waitForExistence(timeout:)` or `XCTNSPredicateExpectation`, not sleeps.
- Attach screenshots with `XCTAttachment(screenshot:)`.

## Scenario-based state machine testing

For stateful systems that process events over time (gesture recognizers, multi-step workflows, input handling state machines), use a declarative scenario pattern:

```swift
struct ScenarioStep {
    let time: TimeInterval
    let input: InputEvent
    let expectedOutput: Output?
    let expectedState: State?
}

func runScenario(config: Config, steps: [ScenarioStep]) {
    var processor = Processor(config: config)
    for step in steps.sorted(by: { $0.time < $1.time }) {
        // Control time via dependency injection
        withDependencies {
            $0.date.now = Date(timeIntervalSince1970: step.time)
        } operation: {
            let output = processor.process(step.input)
            if let expected = step.expectedOutput {
                #expect(output == expected, "\(step.time)s: expected \(expected), got \(String(describing: output))")
            } else {
                #expect(output == nil, "\(step.time)s: expected no output, got \(String(describing: output))")
            }
            if let expectedState = step.expectedState {
                #expect(processor.state == expectedState, "\(step.time)s: wrong state")
            }
        }
    }
}
```

Each test becomes a readable sequence of events:

```swift
@Test
func longPress_startsAndCompletes() {
    runScenario(
        config: .init(threshold: 0.5),
        steps: [
            ScenarioStep(time: 0.0, input: .touchDown, expectedOutput: .began),
            ScenarioStep(time: 0.5, input: .holdCheck, expectedOutput: .recognized),
        ]
    )
}
```

Key design decisions:
- Steps are **time-stamped** (absolute), not sequential delays — avoids flaky timing
- Time is controlled via **dependency injection**, not `Task.sleep`
- Each step declares **expected output AND expected state** (both optional)
- Failure messages include the **timestamp** for easy debugging

Use this pattern for any stateful system with >3 interacting dimensions (timing, input type, prior state).
