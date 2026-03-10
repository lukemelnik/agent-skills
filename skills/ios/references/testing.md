# iOS Testing

## Table of Contents

1. [Swift Testing Framework](#1-swift-testing-framework)
2. [XCTest Essentials](#2-xctest-essentials)
3. [Testing @Observable ViewModels](#3-testing-observable-viewmodels)
4. [Async Test Patterns](#4-async-test-patterns)
5. [Protocol-Based Mocking](#5-protocol-based-mocking)
6. [Snapshot Testing](#6-snapshot-testing)
7. [UI Testing with XCUIApplication](#7-ui-testing-with-xcuiapplication)
8. [Preview-Based Testing](#8-preview-based-testing)

---

## 1. Swift Testing Framework

Preferred for new unit tests (iOS 17+/Xcode 16+). IceCubesApp and CodeEdit use it for new tests.

### @Test and #expect

```swift
import Testing
@testable import MyFeature

@MainActor
@Suite("Timeline View Model tests")
struct TimelineViewModelTests {
    @Test
    func duplicateStatusIsNotInserted() async throws {
        let subject = makeSubject()
        let status = Status.placeholder()
        await subject.datasource.append(status)
        await subject.handleEvent(event: StreamEventUpdate(status: status))
        let count = await subject.datasource.count()
        #expect(count == 1)
    }
}
```

### Key Differences from XCTest

- `@Test` instead of `func test...` naming convention
- `#expect(condition)` instead of `XCTAssert*`
- `#require(optional)` instead of `XCTUnwrap` (throws on nil):
  ```swift
  let value = try #require(optionalValue)  // fails the test if nil
  ```
- `@Suite("Name")` for grouping, replaces class inheritance
- `struct` test types allowed (prefer for value semantics)

### Traits

```swift
@Test(.disabled("Reason for disabling"))
func flaky() { }

@Suite(.serialized)  // Run tests sequentially
class StatefulTests { }
```

### Parameterized Tests

```swift
@Test(arguments: [".home", ".local", ".federated"])
func timelineLoads(filter: String) async throws {
    // Runs once per argument
}
```

### Issue Recording

```swift
// In async wait loops (replaces XCTFail in callbacks)
Issue.record("Status never changed to finished.")
```

### Confirmation (Replacing XCTestExpectation)

Use `confirmation` to verify that a callback or closure is invoked (replacement for `XCTestExpectation`):

```swift
@Test
func callbackIsInvoked() async {
    await confirmation("callback invoked") { confirm in
        sut.onComplete { confirm() }
        sut.start()
    }
}
```

`confirmation` fails the test if `confirm()` is never called (or called more than the expected count). Pass `expectedCount:` for multiple invocations:

```swift
await confirmation("event received", expectedCount: 3) { confirm in
    sut.onEvent { _ in confirm() }
    sut.sendEvents(count: 3)
}
```

---

## 2. XCTest Essentials

Still required for UI tests and used in most existing codebases. IceCubesApp, firefox-ios, Signal-iOS, NetNewsWire, wikipedia-ios all use XCTest extensively.

### Basic Structure

```swift
import XCTest
@testable import MyFeature

@MainActor
final class EditorStoreTests: XCTestCase {
    override func setUp() async throws {
        // Per-test setup; async variant available
    }

    override func tearDown() async throws {
        // Cleanup
    }

    func testConfigureSetsInitialText() {
        let store = EditorStore(mode: .new(text: "Hello", visibility: .pub))
        store.configure(client: MockClient())
        XCTAssertEqual(store.statusText.string, "Hello")
    }
}
```

### Common Assertions

```swift
XCTAssertEqual(actual, expected)
XCTAssertTrue(condition)
XCTAssertFalse(condition)
XCTAssertNil(optional)
XCTAssertNotNil(optional)
XCTAssertThrowsError(try expression())
let unwrapped = try XCTUnwrap(optional)  // Fails test if nil
```

### Expectations for Async Work

```swift
func testShareExtensionLoadsText() async {
    let expectation = XCTestExpectation(description: "Wait for share text")
    Task {
        for _ in 0..<20 {
            let text = await MainActor.run { store.statusText.string }
            if text == expectedText {
                expectation.fulfill()
                return
            }
            try? await Task.sleep(nanoseconds: 50_000_000)
        }
    }
    await fulfillment(of: [expectation], timeout: 3.0)
}
```

---

## 3. Testing @Observable ViewModels

### Direct State Mutation Testing

IceCubesApp pattern -- construct ViewModel, call methods, assert state changes:

```swift
@MainActor
@Suite("Editor Store")
struct EditorStoreTests {
    @Test
    func configureSetsTextAndVisibility() {
        let store = StatusEditor.EditorStore(mode: .new(text: "Hello", visibility: .priv))
        store.configureIfNeeded(client: MockClient(), currentAccount: nil, theme: .shared)
        #expect(store.statusText.string == "Hello")
        #expect(store.visibility == .priv)
    }

    @Test
    func configureRunsOnce() {
        let store = StatusEditor.EditorStore(mode: .new(text: "Hello", visibility: .pub))
        store.configureIfNeeded(client: MockClient(), currentAccount: nil, theme: .shared)
        store.statusText = NSMutableAttributedString(string: "Changed")
        store.configureIfNeeded(client: MockClient(), currentAccount: nil, theme: .shared)
        #expect(store.statusText.string == "Changed")  // Not reset
    }
}
```

### Testing Actor-Backed Datasources

IceCubesApp tests datasource operations through the actor boundary:

```swift
@Test
func streamEventRemovesStatus() async throws {
    let subject = makeSubject()
    let status = Status.placeholder()
    await subject.datasource.append(status)
    var count = await subject.datasource.count()
    #expect(count == 1)
    await subject.handleEvent(event: StreamEventDelete(status: status.id))
    count = await subject.datasource.count()
    #expect(count == 0)
}
```

### Testing State Reducers

firefox-ios pattern -- pure reducer state testing:

```swift
@MainActor
func testReceivedThemeManagerValues() {
    let initialState = ThemeSettingsState(windowUUID: .testDefault)
    let reducer = ThemeSettingsState.reducer

    let newState = ThemeSettingsState(
        windowUUID: .testDefault,
        useSystemAppearance: true,
        manualThemeSelected: .dark,
        userBrightnessThreshold: 0.7
    )
    let action = ThemeSettingsMiddlewareAction(
        themeSettingsState: newState,
        windowUUID: .testDefault,
        actionType: .receivedThemeManagerValues
    )

    let result = reducer(initialState, action)
    XCTAssertTrue(result.useSystemAppearance)
    XCTAssertEqual(result.manualThemeSelected, .dark)
}
```

---

## 4. Async Test Patterns

### Native async/await Tests

```swift
@Test
func fetchTimeline() async throws {
    let viewModel = TimelineViewModel()
    await viewModel.fetchNewestStatuses(pullToRefresh: false)
    let items = await viewModel.datasource.getFilteredItems()
    #expect(!items.isEmpty)
}
```

### ActorIsolated for Capturing Side Effects

> **Note:** `ActorIsolated` is from the [pointfreeco/swift-dependencies](https://github.com/pointfreeco/swift-dependencies) package (used by TCA), not a standard Apple API.

isowords pattern -- thread-safe capture of values set by closures:

```swift
let didRegisterForRemoteNotifications = ActorIsolated(false)

// In dependency setup:
dependencies.remoteNotifications.register = {
    await didRegisterForRemoteNotifications.setValue(true)
}

// After action:
await didRegisterForRemoteNotifications.withValue { XCTAssert($0) }
```

### Polling-Based Wait Helpers

CodeEdit pattern -- wait for async conditions without blocking:

```swift
await waitForExpectation(timeout: .seconds(10)) {
    self.taskManager.activeTasks[task.id]?.status == .finished
} onTimeout: {
    Issue.record("Status never changed to finished.")
}
```

### withMainSerialExecutor

isowords pattern -- deterministic ordering for complex async flows:

```swift
@MainActor
func testNewGame() async throws {
    try await withMainSerialExecutor {
        let store = TestStore(initialState: AppReducer.State()) {
            AppReducer()
        } withDependencies: { /* ... */ }

        await store.send(.home(.task))
        await store.receive(\.home.authenticationResponse)
        // Deterministic ordering guaranteed
    }
}
```

---

## 5. Protocol-Based Mocking

### Protocol + Mock Implementation

IceCubesApp pattern -- define protocol for client, mock all methods:

```swift
// Protocol (in production code)
protocol TimelineStatusFetching: Sendable {
    func fetchFirstPage(client: Client?, timeline: TimelineFilter) async throws -> [Status]
    func fetchNextPage(client: Client?, timeline: TimelineFilter, lastId: String, offset: Int) async throws -> [Status]
}

// Mock (in test code)
actor MockTimelineStatusFetcher: TimelineStatusFetching {
    private let firstPage: [Status]
    private let nextPages: [[Status]]
    private var nextPageCalls: Int = 0

    init(firstPage: [Status], nextPages: [[Status]]) {
        self.firstPage = firstPage
        self.nextPages = nextPages
    }

    func fetchFirstPage(client: Client?, timeline: TimelineFilter) async throws -> [Status] {
        firstPage
    }

    func fetchNextPage(client: Client?, timeline: TimelineFilter, lastId: String, offset: Int) async throws -> [Status] {
        defer { nextPageCalls += 1 }
        guard nextPageCalls < nextPages.count else { return [] }
        return nextPages[nextPageCalls]
    }

    func nextPageCallCount() -> Int { nextPageCalls }
}
```

### Multi-Protocol Mock

IceCubesApp pattern -- one mock conforms to multiple client protocols:

```swift
@MainActor
private final class MockEditorClient:
    StatusEditor.AutocompleteService.Client,
    StatusEditor.MediaUploadService.Client,
    StatusEditor.PostingService.Client
{
    struct DummyError: Error {}
    func searchHashtags(query: String) async throws -> [Tag] { [] }
    func searchAccounts(query: String) async throws -> [Account] { [] }
    func uploadMedia(data: Data, mimeType: String, progressHandler: @escaping @Sendable (Double) -> Void) async throws -> MediaAttachment? { nil }
    func postStatus(data: StatusData) async throws -> Status { throw DummyError() }
}
```

### Tracking Mock with Invocation Counts

firefox-ios pattern -- booleans and counters for verifying calls:

```swift
class MockNotificationManager: NotificationManagerProtocol {
    var requestAuthorizationCalled = false
    var shouldGrantPermission = true
    var scheduledNotifications = 0

    func requestAuthorization(completion: @escaping @Sendable (Bool, Error?) -> Void) {
        requestAuthorizationCalled = true
        completion(shouldGrantPermission, nil)
    }

    var removeAllPendingNotificationsWasCalled = false
    func removeAllPendingNotifications() {
        removeAllPendingNotificationsWasCalled = true
        scheduledNotifications = 0
    }
}
```

### Simulating Mock (wikipedia-ios)

Mock wraps real system type and simulates state transitions:

```swift
class MockCLLocationManager {
    var isUpdatingLocation = false
    var isUpdatingHeading = false
    private var simulatedAuthStatus: CLAuthorizationStatus = .notDetermined

    func simulate(authorizationStatus: CLAuthorizationStatus) {
        simulatedAuthStatus = authorizationStatus
        delegate?.locationManagerDidChangeAuthorization(self)
    }

    func simulateUpdate(location: CLLocation) {
        delegate?.locationManager?(self, didUpdateLocations: [location])
    }
}
```

### Closure-Based Dependency Mocking (TCA / isowords)

For apps using TCA, dependencies are mocked inline via closures:

```swift
let store = TestStore(initialState: Settings.State()) {
    Settings()
} withDependencies: {
    $0.apiClient.currentPlayer = { .some(.mock) }
    $0.userNotifications.getNotificationSettings = {
        .init(authorizationStatus: .notDetermined)
    }
    $0.userNotifications.requestAuthorization = { _ in true }
    $0.remoteNotifications.register = {
        await didRegisterForRemoteNotifications.setValue(true)
    }
    $0.audioPlayer.setGlobalVolumeForMusic = {
        await setMusicVolume.setValue($0)
    }
}
```

---

## 6. Snapshot Testing

Uses [swift-snapshot-testing](https://github.com/pointfreeco/swift-snapshot-testing) (Point-Free). Found in isowords and CodeEdit.

### iOS View Snapshots (isowords)

```swift
import SnapshotTesting
import XCTest

class SettingsViewTests: XCTestCase {
    override func setUpWithError() throws {
        try super.setUpWithError()
        try XCTSkipIf(!Styleguide.registerFonts())
        // isRecording = true  // Uncomment to record new baselines
    }

    func testDefaultSettings() {
        assertSnapshot(
            matching: SettingsView(
                store: .init(initialState: .init()) { }
            ),
            as: .image(
                perceptualPrecision: 0.98,
                layout: .device(config: .iPhoneXsMax)
            )
        )
    }
}
```

### macOS View Snapshots (CodeEdit)

```swift
func testHelpButtonLight() throws {
    let view = HelpButton(action: {})
    let hosting = NSHostingView(rootView: view)
    hosting.frame = CGRect(origin: .zero, size: .init(width: 40, height: 40))
    hosting.appearance = .init(named: .aqua)
    assertSnapshot(matching: hosting, as: .image(size: .init(width: 40, height: 40)))
}

func testHelpButtonDark() throws {
    let view = HelpButton(action: {})
    let hosting = NSHostingView(rootView: view)
    hosting.appearance = .init(named: .darkAqua)
    hosting.frame = CGRect(origin: .zero, size: .init(width: 40, height: 40))
    assertSnapshot(matching: hosting, as: .image)
}
```

### Key Practices

- **perceptualPrecision**: `0.98` tolerates minor rendering differences across runs
- **Recording mode**: set `isRecording = true` to create/update baselines, then comment out
- **Font registration**: register custom fonts before snapshot tests or skip if unavailable
- **Snapshot directory**: `__Snapshots__/` created alongside test files automatically
- **Layout modes**: `.device(config:)` for full-screen, `.fixed(width:height:)` for components

---

## 7. UI Testing with XCUIApplication

### Launch and Configuration

```swift
final class UrlBarTests: XCTestCase {
    var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments += ["-ApplePersistenceIgnoreState", "YES"]
        app.launch()
    }
}
```

### Querying Elements by Accessibility Identifier

firefox-ios and wikipedia-ios pattern:

```swift
// Tap by accessibility identifier
app.textFields[AccessibilityIdentifiers.Browser.AddressToolbar.searchTextField].tap()
app.buttons[AccessibilityIdentifiers.Browser.UrlBar.cancelButton].tap()

// Assert element state
let url = app.textFields["searchTextField"]
XCTAssertEqual(url.value as? String, "Search or enter address")

// Check keyboard focus
XCTAssertTrue(urlBar.value(forKey: "hasKeyboardFocus") as? Bool ?? false)
```

### Wait Helpers

```swift
// Wait for element to exist
func waitAndTap(_ element: XCUIElement, timeout: TimeInterval = 5.0) {
    XCTAssertTrue(element.waitForExistence(timeout: timeout))
    element.tap()
}

// Wait for value
func waitForValue(_ element: XCUIElement, value: String, timeout: TimeInterval = 5.0) {
    let predicate = NSPredicate(format: "value CONTAINS[c] %@", value)
    let expectation = XCTNSPredicateExpectation(predicate: predicate, object: element)
    XCTWaiter().wait(for: [expectation], timeout: timeout)
}
```

### Screenshots as Test Attachments

wikipedia-ios pattern:

```swift
let attachment = XCTAttachment(screenshot: app.screenshot())
attachment.name = "Source Editor Initial"
add(attachment)
```

### Custom Query Helpers

CodeEdit pattern -- centralize element queries in an enum:

```swift
enum Query {
    static func getWindow(_ app: XCUIApplication) -> XCUIElement {
        app.windows.element(matching: .window, identifier: "workspace")
    }

    enum Window {
        static func getProjectNavigator(_ window: XCUIElement) -> XCUIElement {
            window.descendants(matching: .any).matching(identifier: "ProjectNavigator").element
        }
    }
}

// Usage:
let window = Query.getWindow(application)
let navigator = Query.Window.getProjectNavigator(window)
```

---

## 8. Preview-Based Testing

Use `#Preview` as a lightweight validation layer. Not a substitute for unit tests, but catches visual regressions during development.

### Key States to Cover

```swift
#Preview("Loading") {
    FeedView(viewModel: .init(state: .loading))
}

#Preview("Loaded") {
    FeedView(viewModel: .init(state: .loaded(items: .mock)))
}

#Preview("Empty") {
    FeedView(viewModel: .init(state: .empty))
}

#Preview("Error") {
    FeedView(viewModel: .init(state: .error(AppError.networkUnavailable)))
}
```

### Mock Environment for Previews

```swift
#Preview {
    NavigationStack {
        AccountView()
    }
    .environment(MockAccountService())
}
```

### When to Pair with Snapshot Tests

- Previews for interactive iteration during development
- Snapshot tests in CI to catch regressions automatically
- Both should cover: loading, loaded, empty, error states
