# macOS Platform Capabilities

## Table of Contents

1. [Sandboxing and Entitlements](#1-sandboxing-and-entitlements)
2. [Security-Scoped Bookmarks](#2-security-scoped-bookmarks)
3. [Login Items](#3-login-items)
4. [Background Operations](#4-background-operations)
5. [File System Monitoring](#5-file-system-monitoring)
6. [AppleScript and Automation](#6-applescript-and-automation)
7. [XPC Services](#7-xpc-services)
8. [Keychain Services](#8-keychain-services)
9. [Entitlements Quick Reference](#entitlements-quick-reference)

---

## 1. Sandboxing and Entitlements

The App Sandbox restricts your app to a container directory and limits access to system resources. **Required** for Mac App Store distribution.

### What the Sandbox Restricts

| Resource | Default Access | Entitlement |
|----------|---------------|-------------|
| File system | App container only | `files.user-selected.read-write` + user consent |
| Network | None | `network.client` / `network.server` |
| Camera | None | `device.camera` + usage description |
| Microphone | None | `device.microphone` + usage description |
| Location | None | `personal-information.location` |
| USB | None | `device.usb` |
| Apple Events | None | `automation.apple-events` |

### Container Directory

Sandboxed apps write to `~/Library/Containers/<bundle-id>/`:

```swift
// These resolve to the container automatically
let appSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
```

### User-Selected Files (Open/Save Panels)

The sandbox grants temporary access to files the user explicitly selects:

```swift
let panel = NSOpenPanel()
panel.allowedContentTypes = [.png, .jpeg, .pdf]
panel.allowsMultipleSelection = true

let response = await withCheckedContinuation { continuation in
    panel.begin { response in continuation.resume(returning: response) }
}
if response == .OK {
    for url in panel.urls {
        // Access granted for this session only
        let data = try Data(contentsOf: url)
    }
}
```

### Common App Store Rejection Reasons

| Issue | Solution |
|-------|----------|
| Accessing files without user consent | Use NSOpenPanel or security-scoped bookmarks |
| Network access without entitlement | Add `network.client` entitlement |
| Writing outside container | Use Powerbox (panels) or bookmarks |
| Apple Events without entitlement | Add `automation.apple-events` + target in Info.plist |
| Hardcoded paths (e.g., `~/Desktop`) | Use system APIs (`FileManager.urls(for:)`) |

---

## 2. Security-Scoped Bookmarks

Persist access to user-selected files/folders across app launches.

### Save a Bookmark

```swift
func saveBookmark(for url: URL) throws {
    let bookmarkData = try url.bookmarkData(
        options: .withSecurityScope,
        includingResourceValuesForKeys: nil,
        relativeTo: nil
    )
    var bookmarks = UserDefaults.standard.dictionary(forKey: "bookmarks") ?? [:]
    bookmarks[url.path] = bookmarkData
    UserDefaults.standard.set(bookmarks, forKey: "bookmarks")
}
```

### Restore a Bookmark

```swift
func restoreBookmark(for path: String) -> URL? {
    guard let bookmarks = UserDefaults.standard.dictionary(forKey: "bookmarks"),
          let data = bookmarks[path] as? Data else { return nil }

    var isStale = false
    guard let url = try? URL(
        resolvingBookmarkData: data,
        options: .withSecurityScope,
        relativeTo: nil,
        bookmarkDataIsStale: &isStale
    ) else { return nil }

    if isStale {
        try? saveBookmark(for: url)  // Re-save refreshed bookmark
    }
    return url
}
```

### Critical: Start/Stop Access Pairing

Always balance `startAccessingSecurityScopedResource()` with `stopAccessingSecurityScopedResource()`:

```swift
// Wrong — leaked security scope
url.startAccessingSecurityScopedResource()
let data = try Data(contentsOf: url)

// Right — use defer
guard url.startAccessingSecurityScopedResource() else { return }
defer { url.stopAccessingSecurityScopedResource() }
let data = try Data(contentsOf: url)
```

### Folder Access Pattern

```swift
func selectWorkingFolder() async -> URL? {
    let panel = NSOpenPanel()
    panel.canChooseDirectories = true
    panel.canChooseFiles = false
    panel.message = "Select a folder to grant access"

    let response = await withCheckedContinuation { continuation in
        panel.begin { response in continuation.resume(returning: response) }
    }
    guard response == .OK, let url = panel.url else { return nil }

    try? saveBookmark(for: url)
    return url
}

func listFiles(in folderURL: URL) throws -> [URL] {
    guard folderURL.startAccessingSecurityScopedResource() else {
        throw SandboxError.accessDenied
    }
    defer { folderURL.stopAccessingSecurityScopedResource() }

    return try FileManager.default.contentsOfDirectory(
        at: folderURL,
        includingPropertiesForKeys: [.isRegularFileKey],
        options: .skipsHiddenFiles
    )
}
```

---

## 3. Login Items

### SMAppService (macOS 13+)

```swift
import ServiceManagement

func enableLoginItem() throws {
    try SMAppService.mainApp.register()
}

func disableLoginItem() throws {
    try SMAppService.mainApp.unregister()
}

func isLoginItemEnabled() -> Bool {
    SMAppService.mainApp.status == .enabled
}
```

### Settings Toggle

```swift
struct GeneralSettingsView: View {
    @State private var launchAtLogin = SMAppService.mainApp.status == .enabled

    var body: some View {
        Form {
            Toggle("Launch at Login", isOn: $launchAtLogin)
                .onChange(of: launchAtLogin) { _, newValue in
                    do {
                        if newValue {
                            try SMAppService.mainApp.register()
                        } else {
                            try SMAppService.mainApp.unregister()
                        }
                    } catch {
                        launchAtLogin = SMAppService.mainApp.status == .enabled
                    }
                }
        }
    }
}
```

### Status Handling

```swift
switch SMAppService.mainApp.status {
case .notRegistered: // Not a login item
case .enabled:       // Will launch at login
case .requiresApproval: // User needs to approve in System Settings
case .notFound:      // App not found
@unknown default: break
}
```

---

## 4. Background Operations

### ProcessInfo for Critical Work

Keep the app alive for critical work when the user switches away:

```swift
func performCriticalWork() async {
    let activity = ProcessInfo.processInfo.beginActivity(
        options: [.userInitiated, .idleSystemSleepDisabled],
        reason: "Processing export"
    )
    defer { ProcessInfo.processInfo.endActivity(activity) }

    await exportLargeFile()
}
```

### BGTaskScheduler (Mac Catalyst only)

> **Note:** `BGTaskScheduler` is primarily an iOS/Mac Catalyst API. It is **not** available in native macOS (AppKit/SwiftUI) apps. For native macOS background scheduling, use `NSBackgroundActivityScheduler` (shown in the next section).

```swift
import BackgroundTasks

// Register in app init
BGTaskScheduler.shared.register(
    forTaskWithIdentifier: "com.example.myapp.refresh",
    using: nil
) { task in
    handleRefresh(task as! BGAppRefreshTask)
}

// Schedule
func scheduleRefresh() {
    let request = BGAppRefreshTaskRequest(identifier: "com.example.myapp.refresh")
    request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60)
    try? BGTaskScheduler.shared.submit(request)
}
```

Info.plist requirement:
```xml
<key>BGTaskSchedulerPermittedIdentifiers</key>
<array>
    <string>com.example.myapp.refresh</string>
</array>
```

### Periodic Background Sync (Native macOS)

```swift
class BackgroundScheduler {
    private var activity: NSBackgroundActivityScheduler?

    func startPeriodicSync() {
        activity = NSBackgroundActivityScheduler(identifier: "com.example.myapp.sync")
        activity?.repeats = true
        activity?.interval = 30 * 60  // 30 minutes
        activity?.tolerance = 5 * 60
        activity?.qualityOfService = .utility

        activity?.schedule { completion in
            Task {
                do {
                    try await self.performSync()
                    completion(.finished)
                } catch {
                    completion(.deferred)
                }
            }
        }
    }

    func stop() {
        activity?.invalidate()
        activity = nil
    }
}
```

### Preventing System Sleep

```swift
import IOKit.pwr_mgt

class SleepPreventer {
    private var assertionID: IOPMAssertionID = 0
    private var isActive = false

    func preventSleep(reason: String) {
        guard !isActive else { return }
        let result = IOPMAssertionCreateWithName(
            kIOPMAssertionTypeNoDisplaySleep as CFString,
            IOPMAssertionLevel(kIOPMAssertionLevelOn),
            reason as CFString,
            &assertionID
        )
        isActive = (result == kIOReturnSuccess)
    }

    func allowSleep() {
        guard isActive else { return }
        IOPMAssertionRelease(assertionID)
        isActive = false
    }

    deinit { allowSleep() }
}
```

---

## 5. File System Monitoring

### DispatchSource File Watcher

```swift
class FileWatcher {
    private var source: DispatchSourceFileSystemObject?
    private var fileDescriptor: Int32 = -1

    func watch(url: URL, events: DispatchSource.FileSystemEvent = [.write, .delete, .rename],
               handler: @escaping () -> Void) {
        fileDescriptor = open(url.path, O_EVTONLY)
        guard fileDescriptor >= 0 else { return }

        source = DispatchSource.makeFileSystemObjectSource(
            fileDescriptor: fileDescriptor,
            eventMask: events,
            queue: .main
        )
        source?.setEventHandler { handler() }
        source?.setCancelHandler { [weak self] in
            if let fd = self?.fileDescriptor, fd >= 0 { close(fd) }
        }
        source?.resume()
    }

    func stop() {
        source?.cancel()
        source = nil
    }

    deinit { stop() }
}
```

### FSEventStream for Directory Trees

```swift
class DirectoryWatcher {
    private var stream: FSEventStreamRef?

    func watch(paths: [String], handler: @escaping ([String]) -> Void) {
        let callback: FSEventStreamCallback = { _, clientCallBackInfo, numEvents, eventPaths, _, _ in
            let box = Unmanaged<WatcherBox>.fromOpaque(clientCallBackInfo!).takeUnretainedValue()
            let paths = Unmanaged<CFArray>.fromOpaque(eventPaths).takeUnretainedValue() as! [String]
            box.handler(paths)
        }

        let box = WatcherBox(handler: handler)
        let retainedBox = Unmanaged.passRetained(box)
        var context = FSEventStreamContext(
            version: 0,
            info: retainedBox.toOpaque(),
            retain: nil,
            release: { ptr in
                guard let ptr else { return }
                Unmanaged<WatcherBox>.fromOpaque(ptr).release()
            },
            copyDescription: nil
        )

        stream = FSEventStreamCreate(
            nil, callback, &context,
            paths as CFArray,
            FSEventStreamEventId(kFSEventStreamEventIdSinceNow),
            1.0,
            FSEventStreamCreateFlags(kFSEventStreamCreateFlagUseCFTypes | kFSEventStreamCreateFlagFileEvents)
        )

        // Preferred: use GCD dispatch queue (FSEventStreamScheduleWithRunLoop is deprecated)
        FSEventStreamSetDispatchQueue(stream!, DispatchQueue.main)
        FSEventStreamStart(stream!)
    }

    func stop() {
        if let stream {
            FSEventStreamStop(stream)
            FSEventStreamInvalidate(stream)
            FSEventStreamRelease(stream)
        }
        stream = nil
    }

    class WatcherBox {
        let handler: ([String]) -> Void
        init(handler: @escaping ([String]) -> Void) { self.handler = handler }
    }
}
```

---

## 6. AppleScript and Automation

Make your app scriptable so power users and other apps can automate it. NetNewsWire is a strong reference implementation.

### Scripting Definition File (.sdef)

The `.sdef` file is an XML dictionary that defines your app's scriptable classes, properties, elements, and commands. Add it to your target and reference it in Info.plist:

```xml
<!-- Info.plist -->
<key>NSAppleScriptEnabled</key>
<true/>
<key>OSAScriptingDefinition</key>
<string>MyApp.sdef</string>
```

The sdef defines suites containing classes and commands:

```xml
<dictionary title="MyApp Terminology">
    <!-- Include the Standard Suite for basic commands -->
    <suite name="Standard Suite" code="core">
        <command name="count" code="corecnte">
            <cocoa class="NSCountCommand"/>
            <direct-parameter type="specifier"/>
            <result type="integer"/>
        </command>
    </suite>

    <suite name="MyApp Suite" code="MyAp">
        <class name="document" code="docu" plural="documents">
            <cocoa class="ScriptableDocument"/>
            <property name="name" code="pnam" type="text" access="r">
                <cocoa key="scriptingName"/>
            </property>
            <property name="id" code="ID  " type="text" access="r">
                <cocoa key="uniqueId"/>
            </property>
            <element type="item">
                <cocoa key="items"/>
            </element>
        </class>
    </suite>
</dictionary>
```

### Scriptable Wrapper Classes (NetNewsWire Pattern)

Create `@objc` wrapper classes that bridge your model objects to the scripting runtime. The `cocoa class` attribute in the sdef points to these:

```swift
@objc(ScriptableDocument)
final class ScriptableDocument: NSObject {
    let document: Document

    init(_ document: Document) { self.document = document }

    // Object specifier — tells AppleScript how to reference this object
    @objc(objectSpecifier)
    override var objectSpecifier: NSScriptObjectSpecifier? {
        let appDescription = NSApplication.shared.classDescription as! NSScriptClassDescription
        return NSUniqueIDSpecifier(
            containerClassDescription: appDescription,
            containerSpecifier: nil,
            key: "documents",
            uniqueID: document.id
        )
    }

    // Scriptable properties — match the sdef property declarations
    @objc(scriptingName) var scriptingName: String { document.name }
    @objc(uniqueId) var scriptingUniqueID: String { document.id }

    // Scriptable elements — indexed accessor pattern for collections
    @objc(items) var items: NSArray {
        document.items.map { ScriptableItem($0, container: self) } as NSArray
    }
    @objc(countOfItems) func countOfItems() -> Int { document.items.count }
    @objc(objectInItemsAtIndex:) func objectInItems(atIndex index: Int) -> ScriptableItem? {
        guard index >= 0 && index < document.items.count else { return nil }
        return ScriptableItem(document.items[index], container: self)
    }
    @objc(valueInItemsWithUniqueID:) func valueInItems(withUniqueID id: String) -> ScriptableItem? {
        guard let item = document.items.first(where: { $0.id == id }) else { return nil }
        return ScriptableItem(item, container: self)
    }
}
```

### Exposing the Application Object

Extend `NSApplication` with the top-level scriptable elements:

```swift
extension NSApplication {
    @objc(documents)
    func scriptableDocuments() -> NSArray {
        DocumentManager.shared.documents.map { ScriptableDocument($0) } as NSArray
    }
}
```

### Custom Script Commands

For commands beyond get/set (e.g., `make`, `delete`), subclass `NSScriptCommand`:

```swift
class CreateItemCommand: NSScriptCommand {
    override func performDefaultImplementation() -> Any? {
        guard let arguments = evaluatedArguments,
              let properties = arguments["KeyDictionary"] as? [String: Any] else { return nil }

        // For async operations, suspend and resume later
        suspendExecution()
        createItem(properties: properties) { result in
            self.resumeExecution(withResult: result.objectSpecifier)
        }
        return nil
    }
}
```

### Sandboxing Requirement

Sandboxed apps that send Apple Events need the entitlement:

```xml
<key>com.apple.security.automation.apple-events</key>
<true/>
```

### SwiftUI Lifecycle Limitation

Pure SwiftUI-lifecycle apps (`@main struct MyApp: App`) have difficulty with AppleScript support because `NSApplication.shared.delegate` is managed by SwiftUI internally. For full scripting support, use `NSApplicationDelegateAdaptor` to provide your own delegate that can participate in the scripting infrastructure.

---

## 7. XPC Services

XPC services run in a separate process with their own sandbox, ideal for privileged operations, crash isolation, or resource-intensive tasks.

### Creating an XPC Service

1. Add an XPC Service target to your Xcode project. It embeds in `MyApp.app/Contents/XPCServices/`.
2. Define a protocol for the service interface:

```swift
// Shared between app and XPC service
@objc protocol MyServiceProtocol {
    func processFile(at path: String, withReply reply: @escaping (Data?, Error?) -> Void)
    func performPrivilegedOperation(withReply reply: @escaping (Bool) -> Void)
}
```

### XPC Service Implementation

```swift
// In the XPC service target
class MyService: NSObject, MyServiceProtocol {
    func processFile(at path: String, withReply reply: @escaping (Data?, Error?) -> Void) {
        do {
            let data = try Data(contentsOf: URL(fileURLWithPath: path))
            let result = processData(data)
            reply(result, nil)
        } catch {
            reply(nil, error)
        }
    }

    func performPrivilegedOperation(withReply reply: @escaping (Bool) -> Void) {
        // Runs in separate sandbox with its own entitlements
        reply(true)
    }
}

// Service delegate
class ServiceDelegate: NSObject, NSXPCListenerDelegate {
    func listener(_ listener: NSXPCListener, shouldAcceptNewConnection connection: NSXPCConnection) -> Bool {
        connection.exportedInterface = NSXPCInterface(with: MyServiceProtocol.self)
        connection.exportedObject = MyService()
        connection.resume()
        return true
    }
}

// main.swift for the XPC service
let delegate = ServiceDelegate()
let listener = NSXPCListener.service()
listener.delegate = delegate
listener.resume()
RunLoop.main.run()  // Keep the XPC service process alive
```

### Connecting from the App

```swift
class ServiceClient {
    private var connection: NSXPCConnection?

    func connect() -> MyServiceProtocol {
        let connection = NSXPCConnection(serviceName: "com.example.myapp.MyService")
        connection.remoteObjectInterface = NSXPCInterface(with: MyServiceProtocol.self)
        connection.invalidationHandler = { [weak self] in self?.connection = nil }
        connection.resume()
        self.connection = connection

        return connection.remoteObjectProxyWithErrorHandler { error in
            print("XPC error: \(error)")
        } as! MyServiceProtocol
    }
}

// Usage
let service = ServiceClient().connect()
service.processFile(at: "/path/to/file") { data, error in
    if let data {
        handleResult(data)
    }
}
```

### Best Practices

- XPC connections are lightweight — create one per operation or keep a persistent connection
- Use `invalidationHandler` and `interruptionHandler` for error recovery
- The XPC service has its own Info.plist and entitlements — grant it only what it needs
- For async/await, wrap XPC calls with `withCheckedContinuation`

---

## 8. Keychain Services

Store credentials, tokens, and sensitive data securely using the Security framework.

### Saving a Password

```swift
import Security

func saveCredential(service: String, account: String, password: Data) throws {
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: service,
        kSecAttrAccount as String: account,
        kSecValueData as String: password
    ]

    // Delete existing item first (update = delete + add)
    SecItemDelete(query as CFDictionary)

    let status = SecItemAdd(query as CFDictionary, nil)
    guard status == errSecSuccess else {
        throw KeychainError.unhandled(status: status)
    }
}
```

### Retrieving a Password

```swift
func loadCredential(service: String, account: String) throws -> Data? {
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: service,
        kSecAttrAccount as String: account,
        kSecReturnData as String: true,
        kSecMatchLimit as String: kSecMatchLimitOne
    ]

    var result: AnyObject?
    let status = SecItemCopyMatching(query as CFDictionary, &result)

    switch status {
    case errSecSuccess:
        return result as? Data
    case errSecItemNotFound:
        return nil
    default:
        throw KeychainError.unhandled(status: status)
    }
}
```

### Deleting a Credential

```swift
func deleteCredential(service: String, account: String) throws {
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: service,
        kSecAttrAccount as String: account
    ]

    let status = SecItemDelete(query as CFDictionary)
    guard status == errSecSuccess || status == errSecItemNotFound else {
        throw KeychainError.unhandled(status: status)
    }
}
```

### Keychain Wrapper Pattern

Wrap the C API for cleaner Swift usage:

```swift
enum KeychainError: Error {
    case unhandled(status: OSStatus)
    case encodingError
}

struct KeychainManager {
    let service: String

    func save(_ value: String, for account: String) throws {
        guard let data = value.data(using: .utf8) else { throw KeychainError.encodingError }
        try saveCredential(service: service, account: account, password: data)
    }

    func load(for account: String) throws -> String? {
        guard let data = try loadCredential(service: service, account: account) else { return nil }
        return String(data: data, encoding: .utf8)
    }

    func delete(for account: String) throws {
        try deleteCredential(service: service, account: account)
    }
}

// Usage
let keychain = KeychainManager(service: "com.example.myapp")
try keychain.save("api_token_value", for: "api-token")
let token = try keychain.load(for: "api-token")
```

### Sandboxing and Keychain

- Sandboxed apps access keychain items scoped to their `keychain-access-groups` entitlement
- App Group keychain sharing: use `kSecAttrAccessGroup` with your App Group identifier
- Items persist across app updates **and** app deletion on macOS (they remain in the user's login keychain). This differs from iOS, where non-shared items are removed on app deletion

```xml
<!-- For sharing keychain between app and extensions -->
<key>keychain-access-groups</key>
<array>
    <string>$(AppIdentifierPrefix)com.example.shared</string>
</array>
```

---

## Entitlements Quick Reference

```xml
<!-- File access -->
<key>com.apple.security.files.user-selected.read-write</key><true/>
<key>com.apple.security.files.bookmarks.app-scope</key><true/>

<!-- Network -->
<key>com.apple.security.network.client</key><true/>
<key>com.apple.security.network.server</key><true/>

<!-- Hardware -->
<key>com.apple.security.device.camera</key><true/>
<key>com.apple.security.device.microphone</key><true/>

<!-- Automation -->
<key>com.apple.security.automation.apple-events</key><true/>

<!-- App Groups -->
<key>com.apple.security.application-groups</key>
<array><string>$(TeamIdentifierPrefix)com.example.shared</string></array>
```

### Best Practices

1. **Enable sandbox early** — retrofitting is painful
2. **Request minimal entitlements** — only what you actually need
3. **Always use security-scoped bookmarks** for persistent file access
4. **Balance start/stop calls** — use `defer` to prevent resource leaks
5. **Handle access failures gracefully** — `startAccessingSecurityScopedResource` can return false
6. **Use SMAppService for login items** — don't use deprecated `SMLoginItemSetEnabled`
7. **Test in sandboxed mode** — don't disable sandbox for debugging
