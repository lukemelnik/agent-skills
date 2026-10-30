# macOS Data Persistence

## Table of Contents

1. [UserDefaults with @Observable](#1-userdefaults-with-observable)
2. [Codable to File](#2-codable-to-file)
3. [Document-Based Persistence with NSDocument](#3-document-based-persistence-with-nsdocument)
4. [Security-Scoped Bookmarks Integration](#4-security-scoped-bookmarks-integration)
5. [SQLite/GRDB for High-Performance Needs](#5-sqlitegrdb-for-high-performance-needs)
6. [Decision Guide](#6-decision-guide)

---

## 1. UserDefaults with @Observable

### @Observable + UserDefaults Bridge

`@AppStorage` is a `DynamicProperty` designed for SwiftUI views -- it does not work correctly in `@Observable` classes. Use direct `UserDefaults` access with `didSet` for change tracking:

```swift
@MainActor
@Observable final class UserPreferences {
    private let defaults: UserDefaults

    var themeMode: ThemeMode {
        didSet { defaults.set(themeMode.rawValue, forKey: "theme_mode") }
    }

    var fontSize: Int {
        didSet { defaults.set(fontSize, forKey: "font_size") }
    }

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        themeMode = ThemeMode(rawValue: defaults.string(forKey: "theme_mode") ?? "") ?? .system
        fontSize = defaults.object(forKey: "font_size") as? Int ?? 14
    }
}
```

This works well when the current process owns those keys. If helpers, extensions, or imported settings can update them, reload from `UserDefaults` when the scene becomes active or after receiving an explicit sync signal.

### Workspace-Specific State via UserDefaults

Pattern from CodeEdit: store per-workspace state keyed by URL:

```swift
private var workspaceState: [String: Any] {
    get {
        let key = "workspaceState-\(fileURL?.absoluteString ?? "")"
        return UserDefaults.standard.object(forKey: key) as? [String: Any] ?? [:]
    }
    set {
        let key = "workspaceState-\(fileURL?.absoluteString ?? "")"
        UserDefaults.standard.set(newValue, forKey: key)
    }
}
```

---

## 2. Codable to File

### JSON Settings to Application Support

Pattern from CodeEdit: persist settings as JSON in Application Support.

```swift
final class Settings: ObservableObject {
    @Published var preferences: SettingsData
    @Published private(set) var lastSaveError: Error?

    private var storeTask: AnyCancellable!
    private let settingsURL: URL

    init(
        settingsURL: URL = FileManager.default.homeDirectoryForCurrentUser
            .appending(path: "Library/Application Support/MyApp/settings.json")
    ) {
        self.settingsURL = settingsURL
        self.preferences = .init()
        self.preferences = loadSettings()

        // Auto-save throttled to avoid excessive writes
        self.storeTask = $preferences
            .throttle(for: 2, scheduler: RunLoop.main, latest: true)
            .sink { [weak self] preferences in
                guard let self else { return }
                do {
                    try self.savePreferences(preferences)
                    self.lastSaveError = nil
                } catch {
                    self.lastSaveError = error
                }
            }
    }

    private func loadSettings() -> SettingsData {
        guard let data = try? Data(contentsOf: settingsURL),
              let decoded = try? JSONDecoder().decode(SettingsData.self, from: data) else {
            return SettingsData()
        }
        return decoded
    }

    private func savePreferences(_ data: SettingsData) throws {
        let dir = settingsURL.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let encoded = try JSONEncoder().encode(data)
        let json = try JSONSerialization.jsonObject(with: encoded)
        let pretty = try JSONSerialization.data(withJSONObject: json, options: .prettyPrinted)
        try pretty.write(to: settingsURL, options: .atomic)
    }
}
```

Own this at the app/window root and inject it where needed; avoid hiding mutable settings behind a global singleton.

### Actor-Based Cache

```swift
actor ContentCache {
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    private func cacheURL(for key: String) -> URL {
        FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!
            .appendingPathComponent("content/\(key).json")
    }

    func set<T: Encodable>(items: T, for key: String) async throws {
        let url = cacheURL(for: key)
        try FileManager.default.createDirectory(
            at: url.deletingLastPathComponent(), withIntermediateDirectories: true
        )
        try encoder.encode(items).write(to: url, options: .atomic)
    }

    func get<T: Decodable>(for key: String, as type: T.Type) async -> T? {
        guard let data = try? Data(contentsOf: cacheURL(for: key)) else { return nil }
        return try? decoder.decode(T.self, from: data)
    }

    func clear(for key: String) async {
        try? FileManager.default.removeItem(at: cacheURL(for: key))
    }
}
```

### Versioned Settings with Migration Testing

When persisting Codable settings that evolve across app versions, use a versioned schema with stored fixtures to test migrations:

```swift
struct AppSettings: Codable {
    static let currentVersion = 3

    var version: Int = Self.currentVersion
    var theme: String = "system"
    var fontSize: Int = 14
    // v3: added field with default
    var autoSave: Bool = true

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let version = try container.decode(Int.self, forKey: .version)
        self.version = Self.currentVersion

        // Migrate based on stored version
        self.theme = try container.decodeIfPresent(String.self, forKey: .theme) ?? "system"
        self.fontSize = try container.decodeIfPresent(Int.self, forKey: .fontSize) ?? 14
        self.autoSave = (version >= 3)
            ? try container.decodeIfPresent(Bool.self, forKey: .autoSave) ?? true
            : true  // default for pre-v3
    }
}
```

Test migrations using stored JSON fixtures from each prior version:

```
Tests/Fixtures/AppSettings/
    v1.json   ← actual serialized output from v1
    v2.json   ← actual serialized output from v2
```

```swift
@Test(arguments: ["v1", "v2"])
func settingsMigration(version: String) throws {
    let url = Bundle.module.url(forResource: version, withExtension: "json", subdirectory: "Fixtures/AppSettings")!
    let data = try Data(contentsOf: url)
    let settings = try JSONDecoder().decode(AppSettings.self, from: data)
    #expect(settings.version == AppSettings.currentVersion)
    // Assert migrated values are sensible
}
```

The fixtures are real serialized output captured from each version — not hand-written JSON. This catches regressions that unit tests on migration code alone would miss (e.g., a renamed field that breaks deserialization of v1 data).

---

## 3. Document-Based Persistence with NSDocument

macOS document architecture manages file reading, writing, autosave, and dirty state.

### NSDocument Subclass

```swift
@objc(WorkspaceDocument)
final class WorkspaceDocument: NSDocument, ObservableObject {
    override static var autosavesInPlace: Bool { false }
    override var isDocumentEdited: Bool { false }  // override if tracking manually

    override func read(from url: URL, ofType typeName: String) throws {
        // Initialize workspace state from the URL
        // Note: NSDocument manages fileURL and displayName automatically — do not set them here.
        // Load workspace-specific models, file trees, etc.
    }

    override func write(to url: URL, ofType typeName: String) throws {
        // Serialize workspace state if needed
    }

    override func makeWindowControllers() {
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1400, height: 900),
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered, defer: false
        )
        let controller = MyWindowController(window: window, workspace: self)
        addWindowController(controller)
        window.makeKeyAndOrderFront(nil)
    }

    override func close() {
        super.close()
        // Save restoration state, clean up resources
    }
}
```

### File-Based Document (Read/Write Data)

```swift
@objc(CodeFileDocument)
final class CodeFileDocument: NSDocument, ObservableObject {
    var content: NSTextStorage?
    var sourceEncoding: FileEncoding?

    override static var autosavesInPlace: Bool {
        Settings.shared.preferences.general.isAutoSaveOn
    }

    override func data(ofType _: String) throws -> Data {
        guard let encoding = sourceEncoding,
              let data = (content?.string as NSString?)?.data(using: encoding.nsValue) else {
            throw CodeFileError.failedToEncode
        }
        return data
    }

    override func read(from data: Data, ofType _: String) throws {
        // Detect encoding, parse content
        let nsString = // ... detect and decode
        self.content = NSTextStorage(string: nsString as String)
    }

    // Handle external file changes
    // Note: use async to avoid deadlock (sync can deadlock if called from main).
    // Prefer revert(toContentsOf:ofType:) over calling read(from:ofType:) directly,
    // as revert properly updates document state (undo manager, change count, etc.).
    override func presentedItemDidChange() {
        guard !isDocumentEdited, let fileURL, let fileType else { return }
        DispatchQueue.main.async {
            try? self.revert(toContentsOf: fileURL, ofType: fileType)
        }
    }
}
```

### NSDocumentController Customization

```swift
final class MyDocumentController: NSDocumentController {
    override func openDocument(
        withContentsOf url: URL,
        display displayDocument: Bool,
        completionHandler: @escaping (NSDocument?, Bool, Error?) -> Void
    ) {
        // Check if file is already open in existing workspace
        guard !openFileInExistingWorkspace(url: url) else { return }

        super.openDocument(withContentsOf: url, display: displayDocument) { doc, wasOpen, error in
            if let doc {
                RecentsStore.documentOpened(at: url)
            }
            completionHandler(doc, wasOpen, error)
        }
    }
}
```

### Undo Integration

NSDocument provides undo managers automatically. Register mutations for external changes:

```swift
override func updateChangeCount(_ change: NSDocument.ChangeType) {
    super.updateChangeCount(change)
    // Notify observers of edit state change
}
```

### Key Lifecycle Points

| Method | When |
|--------|------|
| `read(from:ofType:)` | Opening file/directory |
| `write(to:ofType:)` / `data(ofType:)` | Saving |
| `makeWindowControllers()` | Creating UI |
| `close()` | Closing document |
| `presentedItemDidChange()` | External file modification |
| `shouldCloseWindowController(_:delegate:shouldClose:contextInfo:)` | User attempts close with unsaved changes |

---

## 4. Security-Scoped Bookmarks Integration

Persist access to user-selected files/folders across app launches. See `references/capabilities.md` for full bookmark save/restore code.

### Bookmarks + SwiftData

Store bookmark data alongside SwiftData models:

```swift
@Model class RecentProject {
    var name: String = ""
    var bookmarkData: Data = Data()
    var lastOpened: Date = Date()

    init(url: URL) throws {
        self.name = url.lastPathComponent
        self.bookmarkData = try url.bookmarkData(
            options: .withSecurityScope,
            includingResourceValuesForKeys: nil,
            relativeTo: nil
        )
        self.lastOpened = Date()
    }

    /// Resolves the security-scoped bookmark to a URL.
    /// **Important:** After calling this, you must call `url.startAccessingSecurityScopedResource()`
    /// before accessing the file, and `url.stopAccessingSecurityScopedResource()` when done.
    func resolveURL() -> URL? {
        var isStale = false
        guard let url = try? URL(
            resolvingBookmarkData: bookmarkData,
            options: .withSecurityScope,
            relativeTo: nil,
            bookmarkDataIsStale: &isStale
        ) else { return nil }

        if isStale {
            // Re-save bookmark
            bookmarkData = (try? url.bookmarkData(
                options: .withSecurityScope,
                includingResourceValuesForKeys: nil,
                relativeTo: nil
            )) ?? bookmarkData
        }

        return url
    }
}
```

### Access Pattern

Always pair `startAccessingSecurityScopedResource()` with `stopAccessingSecurityScopedResource()`:

```swift
func openProject(_ project: RecentProject) throws {
    guard let url = project.resolveURL() else { throw ProjectError.bookmarkStale }
    guard url.startAccessingSecurityScopedResource() else { throw ProjectError.accessDenied }
    defer { url.stopAccessingSecurityScopedResource() }

    // Read files within the scope
    let contents = try FileManager.default.contentsOfDirectory(at: url, includingPropertiesForKeys: nil)
}
```

### Bookmarks with UserDefaults

Simpler approach for a small set of recent items:

```swift
func saveBookmark(for url: URL, key: String) throws {
    let data = try url.bookmarkData(options: .withSecurityScope)
    UserDefaults.standard.set(data, forKey: key)
}

func resolveBookmark(key: String) -> URL? {
    guard let data = UserDefaults.standard.data(forKey: key) else { return nil }
    var isStale = false
    let url = try? URL(resolvingBookmarkData: data, options: .withSecurityScope, bookmarkDataIsStale: &isStale)
    if isStale, let url { try? saveBookmark(for: url, key: key) }
    return url
}
```

---

## 5. SQLite/GRDB for High-Performance Needs

When Core Data/SwiftData overhead is unacceptable or you need full SQL control.

### When to Use GRDB over SwiftData/Core Data

- Hundreds of thousands of rows with complex queries.
- Need encrypted databases (SQLCipher integration).
- Need precise control over schema, indexes, WAL checkpointing.
- Cross-platform Swift code sharing (GRDB works on Linux/server).
- Migration system that maps cleanly to SQL ALTER TABLE statements.

### GRDB Record Pattern

Records conform to `Codable`, `FetchableRecord`, and `PersistableRecord`:

```swift
import GRDB

struct UsernameLookupRecord: Codable, FetchableRecord, PersistableRecord {
    static let databaseTableName = "UsernameLookupRecord"

    enum CodingKeys: String, CodingKey, ColumnExpression, CaseIterable {
        case aci
        case username
    }

    let aci: UUID
    let username: String
}
```

### Database Setup with Encryption

Pattern from Signal: GRDB + SQLCipher with keychain-stored encryption key.

```swift
class DatabaseStorageAdapter {
    let pool: DatabasePool

    init(databaseFileUrl: URL, keyFetcher: KeyFetcher) throws {
        var config = Configuration()
        config.prepareDatabase { db in
            let key = try keyFetcher.fetchDatabaseKey()
            try db.usePassphrase(key)
        }
        self.pool = try DatabasePool(path: databaseFileUrl.path, configuration: config)
    }
}
```

### Actor-Based SQLite Wrapper

Pattern from NetNewsWire: actor wrapping raw SQLite via FMDB.

```swift
actor SyncDatabase {
    private var database: FMDatabase?
    private let databasePath: String

    init(databasePath: String) {
        let database = FMDatabase.openAndSetUpDatabase(path: databasePath)
        database.runCreateStatements("""
            CREATE TABLE IF NOT EXISTS syncStatus (
                articleID TEXT NOT NULL,
                key TEXT NOT NULL,
                flag BOOL NOT NULL DEFAULT 0,
                PRIMARY KEY (articleID, key)
            );
        """)
        self.database = database
        self.databasePath = databasePath
    }

    func insertStatuses(_ statuses: Set<SyncStatus>) throws {
        guard let database else { throw DatabaseError.isSuspended }
        SyncStatusTable.insertStatuses(statuses, database: database)
    }

    // iOS-only: close DB when backgrounded to avoid SQLite lock issues.
    // Not needed on macOS — apps are not suspended the same way.
    // On macOS, handle cleanup in response to NSApplication.willTerminateNotification instead.
    func suspend() {
        database?.close()
        database = nil
    }

    func resume() {
        if database == nil {
            database = FMDatabase.openAndSetUpDatabase(path: databasePath)
        }
    }
}
```

### GRDB Migration System

Incremental, enumeration-based migrations:

```swift
class SchemaMigrator {
    private enum MigrationId: String, CaseIterable {
        case createInitialSchema
        case addPriorityColumn
        case addSearchIndex
        // ... add new cases at the end, never reorder
    }

    static func migrateDatabase(writer: some DatabaseWriter) throws {
        var migrator = DatabaseMigrator()

        migrator.registerMigration(MigrationId.createInitialSchema.rawValue) { db in
            try db.create(table: "items") { t in
                t.autoIncrementedPrimaryKey("id")
                t.column("title", .text).notNull()
                t.column("createdAt", .datetime).notNull()
            }
        }

        migrator.registerMigration(MigrationId.addPriorityColumn.rawValue) { db in
            try db.alter(table: "items") { t in
                t.add(column: "priority", .integer).notNull().defaults(to: 0)
            }
        }

        migrator.registerMigration(MigrationId.addSearchIndex.rawValue) { db in
            try db.create(index: "items_on_priority", on: "items", columns: ["priority"])
        }

        try migrator.migrate(writer)
    }
}
```

### Read/Write Separation

```swift
// Reads can use any connection (concurrent)
let items = try pool.read { db in
    try Item.filter(Column("priority") > 3).order(Column("createdAt").desc).fetchAll(db)
}

// Writes are serialized
try pool.write { db in
    var item = Item(title: "New", priority: 5)
    try item.insert(db)
}
```

---

## 6. Decision Guide

| Approach | Best For | Size | Queryable | Encrypted | Survives Reinstall |
|----------|----------|------|-----------|-----------|-------------------|
| **SwiftData** | Structured app data, relationships | Large | Yes | No | No |
| **Core Data** | Legacy apps, complex migration | Large | Yes | No | No |
| **@AppStorage** | User preferences, simple flags | Small | No | No | No |
| **Keychain** | Tokens, passwords, credentials | Tiny | No | Yes | Configurable |
| **Codable to file** | Settings files, offline caches | Medium | No | No | No |
| **NSDocument** | File-based/document apps | Any | No | No | N/A (user files) |
| **SQLite/GRDB** | High-perf queries, encryption, custom schemas | Large | Yes | Optional | No |

### Quick Decision Tree

1. **Document-based app editing user files?** -> NSDocument
2. **Need persistent file/folder access across launches?** -> Security-scoped bookmarks (+ any storage for bookmark data)
3. **Sensitive credential?** -> Keychain
4. **Simple preference/flag?** -> @AppStorage
5. **Structured data with relationships?** -> SwiftData (new) or Core Data (existing)
6. **Need encryption, 100k+ rows, or custom SQL?** -> GRDB/SQLite
7. **Offline cache or config file?** -> Codable to JSON/plist file
