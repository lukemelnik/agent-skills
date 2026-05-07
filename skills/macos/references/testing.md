# macOS Testing

## Table of Contents

1. [Swift Testing Framework](#1-swift-testing-framework)
2. [XCTest Essentials](#2-xctest-essentials)
3. [Testing @Observable ViewModels](#3-testing-observable-viewmodels)
4. [Async Test Patterns](#4-async-test-patterns)
5. [Protocol-Based Mocking](#5-protocol-based-mocking)
6. [Snapshot Testing](#6-snapshot-testing)
7. [UI Testing with XCUIApplication](#7-ui-testing-with-xcuiapplication)
8. [Menu Testing](#8-menu-testing)
9. [Multi-Window Testing](#9-multi-window-testing)
10. [Testing AppKit Bridges](#10-testing-appkit-bridges)
11. [Testing Document-Based Apps](#11-testing-document-based-apps)
12. [Accessibility-Based UI Tests](#12-accessibility-based-ui-tests)
13. [Preview-Based Testing](#13-preview-based-testing)

---

## 1. Swift Testing Framework

Preferred for new unit tests (macOS 14+/Xcode 16+). CodeEdit uses Swift Testing for newer tests.

### @Test and #expect

```swift
import Testing
@testable import MyApp

@MainActor
@Suite(.serialized)
class TaskManagerTests {
    var taskManager: TaskManager!

    init() throws {
        let settings = try JSONDecoder().decode(WorkspaceSettings.self, from: Data("{}".utf8))
        taskManager = TaskManager(workspaceSettings: settings, workspaceURL: nil)
    }

    @Test
    func executeTaskInZsh() async throws {
        Settings.shared.preferences.terminal.shell = .zsh
        let task = CETask(name: "Test", command: "echo 'Hello World'")
        taskManager.executeActiveTask()

        // waitForExpectation is a CodeEdit custom helper (not a standard Swift Testing API).
        // The standard Swift Testing approach for async callbacks is `confirmation`:
        //
        //   await confirmation("task finished", expectedCount: 1) { confirm in
        //       taskManager.onStatusChange { status in
        //           if status == .finished { confirm() }
        //       }
        //       taskManager.executeActiveTask()
        //   }
        //
        await waitForExpectation(timeout: .seconds(10)) {
            self.taskManager.activeTasks[task.id]?.status == .finished
        } onTimeout: {
            Issue.record("Status never changed to finished.")
        }

        let output = try #require(taskManager.activeTasks[task.id]?.output?.getBufferAsString())
        #expect(output.contains("Hello World"))
    }
}
```

### `confirmation` — Standard Async Verification

Swift Testing's built-in API for verifying async callbacks:

```swift
@Test
func callbackInvoked() async {
    let sut = MyService()
    await confirmation("callback invoked") { confirm in
        sut.onComplete { confirm() }
        sut.start()
    }
}

// With expected count
@Test
func multipleCallbacks() async {
    await confirmation("events received", expectedCount: 3) { confirm in
        sut.onEvent { _ in confirm() }
        sut.sendEvents(count: 3)
    }
}
```

### Key Differences from XCTest

- `@Test` instead of `func test...` naming convention
- `#expect(condition)` instead of `XCTAssert*`
- `#require(optional)` instead of `XCTUnwrap` (throws on nil)
- `@Suite("Name")` for grouping, replaces class inheritance
- `struct` test types allowed (prefer for value semantics)
- Test types using `init`/`deinit` for setup/teardown must be classes (`deinit` is not available on structs). Prefer structs for stateless test suites

### Traits

```swift
@Test(.disabled("Tasks in shells don't receive signals in CI"))
func terminateSelectedTask() async throws { }

@Suite(.serialized)  // Run tests sequentially (CodeEdit pattern for stateful tests)
class TaskManagerTests { }
```

### Parameterized Tests

```swift
@Test(arguments: [Shell.zsh, Shell.bash])
func executeTask(shell: Shell) async throws {
    Settings.shared.preferences.terminal.shell = shell
    // Test with each shell
}
```

---

## 2. XCTest Essentials

Still required for UI tests. Used extensively in CodeEdit, NetNewsWire, and mature macOS projects.

### Basic Structure

```swift
import XCTest
@testable import MyApp

final class FuzzySearchTests: XCTestCase {
    private var directory: URL!
    private var mockWorkspace: WorkspaceDocument!

    override func setUp() async throws {
        directory = try FileManager.default.url(
            for: .developerApplicationDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )
        .appending(path: "MyApp/Tests", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    }

    override func tearDown() async throws {
        try? FileManager.default.removeItem(at: directory)
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
let unwrapped = try XCTUnwrap(optional)
```

---

## 3. Testing @Observable ViewModels

### Direct State Mutation Testing

CodeEdit pattern -- construct, call methods, assert:

```swift
@MainActor
final class UtilityAreaViewModelTests: XCTestCase {
    func testInitialization() {
        let vm = UtilityAreaViewModel()
        XCTAssertFalse(vm.isMaximized)
        XCTAssertTrue(vm.selectedTerminals.isEmpty)
    }

    func testToggleMaximize() {
        let vm = UtilityAreaViewModel()
        vm.toggleMaximized()
        XCTAssertTrue(vm.isMaximized)
        vm.toggleMaximized()
        XCTAssertFalse(vm.isMaximized)
    }
}
```

### Testing with Workspace Documents

CodeEdit pattern -- create real temp workspace, test against it:

```swift
override func setUp() async throws {
    directory = tempDirectoryURL()
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    try "content".write(to: directory.appending(path: "file.txt"), atomically: true, encoding: .utf8)

    mockWorkspace = try await WorkspaceDocument(
        for: directory,
        withContentsOf: directory,
        ofType: ""
    )
}
```

---

## 4. Async Test Patterns

### Polling-Based Wait Helper (Swift Testing)

CodeEdit custom helper -- repeatedly check condition, fail on timeout. Note: `waitForExpectation` is a CodeEdit custom utility, not a standard Swift Testing API. `Issue.record()` is a Swift Testing call.

```swift
await waitForExpectation(timeout: .seconds(10)) {
    self.taskManager.activeTasks[task.id]?.status == .finished
} onTimeout: {
    Issue.record("Status never changed to finished.")  // Swift Testing
}
```

### Waiting for Indexing / Background Work (XCTest)

CodeEdit pattern -- poll for async indexing completion. Uses `XCTFail` (XCTest).

```swift
let startTime = Date()
let timeoutInSeconds = 2.0
while searchState.indexStatus != .done {
    try? await Task.sleep(nanoseconds: 100_000_000)
    if Date().timeIntervalSince(startTime) > timeoutInSeconds {
        XCTFail("TIMEOUT: Indexing took too long or did not complete.")  // XCTest
        return
    }
}
```

### Predicate-Based Expectations (XCTest)

CodeEdit UI test pattern -- wait for window state changes. Uses `expectation(for:)` and `wait(for:timeout:)` (XCTest).

```swift
let notExistsPredicate = NSPredicate(format: "exists == false")
let expectation = expectation(for: notExistsPredicate, evaluatedWith: window)
application.typeKey("w", modifierFlags: .command)
wait(for: [expectation], timeout: 5.0)
```

---

## 5. Protocol-Based Mocking

### AppKit Mock Objects

CodeEdit pattern -- mock NSHapticFeedbackPerformer:

```swift
final class NSHapticFeedbackPerformerMock: NSObject, NSHapticFeedbackPerformer {
    var invokedPerform: Bool { invokedPerformCount > 0 }
    var invokedPerformCount = 0

    func perform(
        _ pattern: NSHapticFeedbackManager.FeedbackPattern,
        performanceTime: NSHapticFeedbackManager.PerformanceTime
    ) {
        invokedPerformCount += 1
    }

    func reset() { invokedPerformCount = 0 }
}
```

### In-Memory Database Mock

Signal-iOS pattern -- swap persistent store for in-memory:

```swift
final class CallRecordStoreTest: XCTestCase {
    private var inMemoryDB: InMemoryDB!
    private var callRecordStore: ExplainingCallRecordStoreImpl!

    override func setUp() {
        inMemoryDB = InMemoryDB()
        callRecordStore = ExplainingCallRecordStoreImpl(
            deletedCallRecordStore: MockDeletedCallRecordStore()
        )
    }

    func testInsertAndFetch() throws {
        let record = makeCallRecord()
        try inMemoryDB.write { tx in
            try callRecordStore._insert(callRecord: record, tx: tx)
        }
        let fetched = inMemoryDB.read { tx in
            callRecordStore.fetch(callId: record.callId, tx: tx)
        }
        XCTAssertNotNil(fetched)
    }
}
```

### Simulating Mock

wikipedia-ios pattern -- mock wraps and simulates system type:

```swift
class MockCLLocationManager {
    var isUpdatingLocation = false
    var isUpdatingHeading = false

    func simulate(authorizationStatus: CLAuthorizationStatus) {
        simulatedAuthStatus = authorizationStatus
        delegate?.locationManagerDidChangeAuthorization(self)
    }

    func simulateUpdate(location: CLLocation) {
        delegate?.locationManager?(self, didUpdateLocations: [location])
    }
}
```

### Tracking Mock with Invocation Counts

```swift
class MockNotificationManager: NotificationManagerProtocol {
    var requestAuthorizationCalled = false
    var scheduledNotifications = 0

    func requestAuthorization(completion: @escaping (Bool, Error?) -> Void) {
        requestAuthorizationCalled = true
        completion(true, nil)
    }
}
```

---

## 6. Snapshot Testing

Uses [swift-snapshot-testing](https://github.com/pointfreeco/swift-snapshot-testing). CodeEdit uses it for macOS component testing.

### NSHostingView Snapshots

```swift
import SnapshotTesting
import SwiftUI
import XCTest
@testable import MyApp

final class ComponentTests: XCTestCase {
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
}
```

### macOS-Specific Considerations

- Set `hosting.appearance` explicitly to `.aqua` or `.darkAqua` -- avoids system appearance leaking into tests
- Set `hosting.frame` before snapshotting -- NSHostingView needs explicit sizing
- Use `.image(size:)` for explicit output dimensions
- Test both light and dark appearances side by side
- Snapshot directory: `__Snapshots__/` alongside test file

### Recording and Comparing

> **Note:** `isRecording = true` is deprecated since swift-snapshot-testing 1.17. Use the new `withSnapshotTesting` API or per-assertion `record` parameter instead.

```swift
// Preferred (1.17+): scoped recording
func testRecordBaselines() {
    withSnapshotTesting(record: .all) {
        assertSnapshot(matching: hosting, as: .image)
    }
}

// Per-assertion recording
assertSnapshot(matching: hosting, as: .image, record: .all)

// Legacy (deprecated)
// isRecording = true
```

---

## 7. UI Testing with XCUIApplication

### Launch Configuration

CodeEdit pattern -- centralized launch helpers:

```swift
enum App {
    static func launchWithWorkspace() -> XCUIApplication {
        let application = XCUIApplication()
        application.launchArguments = ["-ApplePersistenceIgnoreState", "YES", "--open", projectPath()]
        application.launch()
        return application
    }

    static func launchWithTempDir() throws -> (XCUIApplication, String) {
        let tempDirURL = try tempProjectPath()
        let application = XCUIApplication()
        application.launchArguments = ["-ApplePersistenceIgnoreState", "YES", "--open", tempDirURL]
        application.launch()
        return (application, tempDirURL)
    }

    static func launch() -> XCUIApplication {
        let application = XCUIApplication()
        application.launchArguments = ["-ApplePersistenceIgnoreState", "YES"]
        application.launch()
        return application
    }
}
```

### Element Query Helpers

CodeEdit pattern -- organize queries by UI section:

```swift
enum Query {
    static func getWindow(_ app: XCUIApplication) -> XCUIElement {
        app.windows.element(matching: .window, identifier: "workspace")
    }
    static func getSettingsWindow(_ app: XCUIApplication) -> XCUIElement {
        app.windows.element(matching: .window, identifier: "settings")
    }

    enum Window {
        static func getProjectNavigator(_ window: XCUIElement) -> XCUIElement {
            window.descendants(matching: .any).matching(identifier: "ProjectNavigator").element
        }
        static func getTabBar(_ window: XCUIElement) -> XCUIElement {
            window.descendants(matching: .any).matching(identifier: "TabBar").element
        }
        static func getFirstEditor(_ window: XCUIElement) -> XCUIElement {
            window.descendants(matching: .any)
                .matching(NSPredicate(format: "label CONTAINS[c] 'Text Editor'"))
                .firstMatch
        }
    }
}
```

### Testing Navigator Interactions

```swift
func testNavigatorOpenFilesAndFolder() {
    let window = Query.getWindow(application)
    XCTAssertTrue(window.exists)
    window.toolbars.firstMatch.click()

    let navigator = Query.Window.getProjectNavigator(window)
    let readmeRow = Query.Navigator.getProjectNavigatorRow(fileTitle: "README.md", navigator)
    readmeRow.click()

    let tabBar = Query.Window.getTabBar(window)
    let readmeTab = Query.TabBar.getTab(labeled: "README.md", tabBar)
    XCTAssertTrue(readmeTab.exists)

    // Open a folder disclosure
    let folderRow = Query.Navigator.getProjectNavigatorRow(fileTitle: "Sources", navigator)
    Query.Navigator.disclosureIndicatorForRow(folderRow).click()

    let newRowCount = navigator.descendants(matching: .outlineRow).count
    XCTAssertTrue(newRowCount > initialRowCount)
}
```

---

## 8. Menu Testing

### Testing Menu Commands via Keyboard Shortcuts

CodeEdit pattern -- trigger menu items with `typeKey`:

```swift
func testSettingsWindowOpensAndCloses() {
    let app = App.launch()
    let settingsWindow = Query.getSettingsWindow(app)

    // Open Settings via Cmd+,
    app.typeKey(",", modifierFlags: .command)
    XCTAssertTrue(settingsWindow.waitForExistence(timeout: 5.0))

    // Close via Cmd+W
    let expectation = expectation(for: NSPredicate(format: "exists == false"), evaluatedWith: settingsWindow)
    app.typeKey("w", modifierFlags: .command)
    wait(for: [expectation], timeout: 5.0)
}
```

### Testing Menu Item State

```swift
func testUndoMenuDisabledWhenEmpty() {
    let app = App.launchWithWorkspace()
    let undoMenuItem = app.menuItems["Undo"]
    XCTAssertFalse(undoMenuItem.isEnabled)

    // Type something to enable undo
    let editor = Query.Window.getFirstEditor(Query.getWindow(app))
    editor.typeText("Hello")
    XCTAssertTrue(undoMenuItem.isEnabled)
}
```

### Testing Menu Bar Item Actions

> **Note:** `app.statusItems` is not a standard `XCUIApplication` query. Testing `NSStatusItem` from UI tests is limited -- XCUI does not provide direct access to status bar items. Use `app.menuBars` to query the app's menu bar, or test status item logic via unit tests instead.

```swift
func testMenuBarItemToggles() {
    let app = XCUIApplication()
    app.launch()

    // Access via menu bars (status items are not reliably queryable via XCUI)
    let menuBar = app.menuBars.firstMatch
    let appMenu = menuBar.menuBarItems["MyApp"]
    appMenu.click()

    let toggleItem = app.menuItems["Toggle Feature"]
    XCTAssertTrue(toggleItem.exists)
    toggleItem.click()
}
```

---

## 9. Multi-Window Testing

### Testing Window Lifecycle

CodeEdit pattern -- open, interact with, and close multiple windows:

```swift
func testWorkspaceWindowCloses() {
    let app = App.launchWithWorkspace()
    let window = Query.getWindow(app)
    XCTAssertTrue(window.waitForExistence(timeout: 5.0))
    window.toolbars.firstMatch.click()

    let expectation = expectation(for: NSPredicate(format: "exists == false"), evaluatedWith: window)
    app.typeKey("w", modifierFlags: .command)
    wait(for: [expectation], timeout: 5.0)
}

func testTabClosesThenWindowCloses() {
    let app = App.launchWithWorkspace()
    let window = Query.getWindow(app)
    XCTAssertTrue(window.waitForExistence(timeout: 5.0))

    // Open a file tab
    let navigator = Query.Window.getProjectNavigator(window)
    Query.Navigator.getProjectNavigatorRow(fileTitle: "README.md", navigator).click()

    let tabBar = Query.Window.getTabBar(window)
    let tab = Query.TabBar.getTab(labeled: "README.md", tabBar)
    XCTAssertTrue(tab.exists)

    // Cmd+W closes the tab first
    let tabClose = expectation(for: NSPredicate(format: "exists == false"), evaluatedWith: tab)
    app.typeKey("w", modifierFlags: .command)
    wait(for: [tabClose], timeout: 5.0)

    // Cmd+W again closes the window
    let windowClose = expectation(for: NSPredicate(format: "exists == false"), evaluatedWith: window)
    app.typeKey("w", modifierFlags: .command)
    wait(for: [windowClose], timeout: 5.0)
}
```

### Testing Different Window Types

```swift
func testAboutWindowOpensAndCloses() {
    let app = App.launch()
    let aboutWindow = Query.getAboutWindow(app)

    app.typeKey("2", modifierFlags: [.shift, .command])
    XCTAssertTrue(aboutWindow.waitForExistence(timeout: 5.0))

    let expectation = expectation(for: NSPredicate(format: "exists == false"), evaluatedWith: aboutWindow)
    app.typeKey("w", modifierFlags: .command)
    wait(for: [expectation], timeout: 5.0)
}
```

### Close All via Shift+Cmd+W

```swift
func testShiftCmdWClosesWindowWithOpenTab() {
    let app = App.launchWithWorkspace()
    let window = Query.getWindow(app)
    // Open a tab...

    let expectation = expectation(for: NSPredicate(format: "exists == false"), evaluatedWith: window)
    app.typeKey("w", modifierFlags: [.shift, .command])
    wait(for: [expectation], timeout: 5.0)
}
```

---

## 10. Testing AppKit Bridges

### Strategy: Test the Model, Not the View

For `NSViewRepresentable` bridges, focus tests on the underlying model/state rather than the AppKit view itself. Unit-test the coordinator logic and state transformations separately.

### Testing NSViewRepresentable Coordinator

```swift
@MainActor
final class TextEditorBridgeTests: XCTestCase {
    func testCoordinatorUpdatesOnTextChange() {
        let binding = Binding<String>(get: { "initial" }, set: { _ in })
        let representable = SourceEditorRepresentable(text: binding)
        let coordinator = representable.makeCoordinator()

        // Test coordinator logic directly
        coordinator.textDidChange(newText: "updated")
        XCTAssertEqual(coordinator.lastText, "updated")
    }
}
```

### Snapshot Test the Rendered Bridge

Use `NSHostingView` snapshots to verify the visual output of bridged views:

```swift
func testSourceEditorAppearance() {
    let view = SourceEditorRepresentableWrapper(text: .constant("let x = 42"))
    let hosting = NSHostingView(rootView: view)
    hosting.frame = CGRect(origin: .zero, size: .init(width: 400, height: 200))
    hosting.appearance = .init(named: .aqua)
    assertSnapshot(matching: hosting, as: .image)
}
```

---

## 11. Testing Document-Based Apps

### Workspace Document Lifecycle Testing

CodeEdit pattern -- create temp directories, init documents, tear down:

```swift
final class DocumentTests: XCTestCase {
    private var directory: URL!
    private var workspace: WorkspaceDocument!

    override func setUp() async throws {
        directory = try FileManager.default.url(
            for: .developerApplicationDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )
        .appending(path: "MyApp/WorkspaceTests", directoryHint: .isDirectory)
        try? FileManager.default.removeItem(at: directory)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)

        // Create test files
        try "content".write(
            to: directory.appending(path: "file.txt"),
            atomically: true,
            encoding: .utf8
        )

        workspace = try await WorkspaceDocument(
            for: directory,
            withContentsOf: directory,
            ofType: ""
        )
    }

    override func tearDown() async throws {
        try? FileManager.default.removeItem(at: directory)
    }
}
```

### Testing File Indexing

```swift
func testSearchIndexFindsContent() async {
    await workspace.searchState?.addProjectToIndex()

    // Wait for indexing to complete
    let startTime = Date()
    while searchState.indexStatus != .done {
        try? await Task.sleep(nanoseconds: 100_000_000)
        if Date().timeIntervalSince(startTime) > 2.0 {
            XCTFail("Indexing timed out")
            return
        }
    }

    await searchState.search("content")
    await waitForExpectation {
        searchState.searchResult.count == 1
    } onTimeout: {
        XCTFail("Search did not find expected results")
    }
}
```

### Testing File Type Detection

```swift
func testUTTypeDetection() {
    let swiftFile = CodeFileDocument(fileURL: URL(filePath: "test.swift"))
    XCTAssertEqual(swiftFile.utType, .swiftSource)

    let markdownFile = CodeFileDocument(fileURL: URL(filePath: "README.md"))
    XCTAssertEqual(markdownFile.utType, .markdown)
}
```

---

## 12. Accessibility-Based UI Tests

### Using Accessibility Identifiers

Set identifiers in production code, query in tests:

```swift
// Production code
struct SidebarView: View {
    var body: some View {
        List { /* ... */ }
            .accessibilityIdentifier("ProjectNavigator")
    }
}

// Test code
let navigator = window.descendants(matching: .any)
    .matching(identifier: "ProjectNavigator").element
XCTAssertTrue(navigator.exists)
```

### Querying by Element Type and Predicate

```swift
// By type
let rows = navigator.descendants(matching: .outlineRow)
let selectedRows = rows.matching(NSPredicate(format: "selected = true"))

// By label predicate
let editor = window.descendants(matching: .any)
    .matching(NSPredicate(format: "label CONTAINS[c] 'Text Editor'"))
    .firstMatch

// Disclosure indicators
let disclosure = row.descendants(matching: .disclosureTriangle).element
```

### Testing AppleScript Commands

NetNewsWire pattern -- run compiled AppleScript and verify results:

```swift
@MainActor
final class ScriptingTests: AppleScriptXCTestCase {
    func testGetUrlScript() {
        let scriptResult = doIndividualScript(filename: "testGetURL")
        // Test helper loads .scpt from bundle, executes, verifies test_result == true
    }
}

class AppleScriptXCTestCase: XCTestCase {
    func doIndividualScript(filename: String) -> NSAppleEventDescriptor? {
        var errorDict: NSDictionary?
        let testBundle = Bundle(for: type(of: self))
        guard let url = testBundle.url(forResource: filename, withExtension: "scpt"),
              let script = NSAppleScript(contentsOf: url, error: &errorDict) else {
            XCTFail("Failed loading script")
            return nil
        }

        let result = script.executeAndReturnError(&errorDict)
        if errorDict != nil { XCTFail("Script execution failed") }

        let dict = result.usrfDictionary()
        XCTAssert(dict["test_result"]?.booleanValue == true)
        return dict["script_result"]
    }
}
```

---

## 13. Preview-Based Testing

Use `#Preview` as a lightweight validation layer alongside snapshot tests.

### Key States to Cover

```swift
#Preview("Sidebar - Normal") {
    SidebarView()
        .environment(WorkspaceModel.mock)
}

#Preview("Sidebar - Empty Project") {
    SidebarView()
        .environment(WorkspaceModel.empty)
}

#Preview("Editor - Dark Mode") {
    SourceEditorView(document: .mockSwiftFile)
        .preferredColorScheme(.dark)
}
```

### macOS-Specific Preview Considerations

- Test both `.aqua` and `.darkAqua` appearances
- Verify toolbar rendering in preview
- Check window-size-dependent layouts at different frame sizes
- Previews should cover: light/dark, empty/loaded states, sidebar collapsed/expanded

---

## 14. Scenario-Based State Machine Testing

For stateful systems that process events over time (gesture recognizers, hotkey processors, animation state machines, multi-step workflows), use a declarative scenario pattern:

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
func pressAndHold_startsAndStops() {
    runScenario(
        config: .init(hotkey: .init(key: .a, modifiers: [.command])),
        steps: [
            ScenarioStep(time: 0.0, input: .keyDown(.a, [.command]), expectedOutput: .startRecording),
            ScenarioStep(time: 0.5, input: .keyUp(.a, [.command]), expectedOutput: .stopRecording),
        ]
    )
}
```

Key design decisions:
- Steps are **time-stamped** (absolute), not sequential delays — avoids flaky timing
- Time is controlled via **dependency injection**, not `Task.sleep`
- Each step declares **expected output AND expected state** (both optional)
- Failure messages include the **timestamp** for easy debugging
- The harness sorts steps by time, so test readability isn't order-dependent

Use this pattern for any stateful system with >3 interacting dimensions (timing, input type, prior state).
