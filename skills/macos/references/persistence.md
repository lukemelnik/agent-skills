# macOS Data Persistence

## Table of Contents

1. [SwiftData](#1-swiftdata)
2. [SwiftData Schema Migration](#2-swiftdata-schema-migration)
3. [Core Data](#3-core-data)
4. [AppStorage and UserDefaults](#4-appstorage-and-userdefaults)
5. [Keychain](#5-keychain)
6. [Codable to File](#6-codable-to-file)
7. [Document-Based Persistence with NSDocument](#7-document-based-persistence-with-nsdocument)
8. [Security-Scoped Bookmarks Integration](#8-security-scoped-bookmarks-integration)
9. [SQLite/GRDB for High-Performance Needs](#9-sqlitegrdb-for-high-performance-needs)
10. [Decision Guide](#10-decision-guide)

---

## 1. SwiftData

### Model Definition

```swift
import SwiftData

@Model class Draft {
    var content: String = ""
    var creationDate: Date = Date()

    init(content: String) {
        self.content = content
        self.creationDate = Date()
    }
}

@Model class TagGroup: Equatable {
    var title: String = ""
    var symbolName: String = ""
    var tags: [String] = []
    var creationDate: Date = Date()

    init(title: String, symbolName: String, tags: [String]) {
        self.title = title
        self.symbolName = symbolName
        self.tags = tags
        self.creationDate = Date()
    }
}
```

### Relationships

```swift
@Model class Folder {
    var name: String = ""
    @Relationship(deleteRule: .cascade, inverse: \Item.folder)
    var items: [Item] = []
}

@Model class Item {
    var title: String = ""
    var folder: Folder?
}
```

Delete rules: `.cascade`, `.nullify` (default), `.deny`, `.noAction`.

### ModelContainer Setup

```swift
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [Draft.self, TagGroup.self])

        // Document-based SwiftData app
        DocumentGroup(editing: .myDocument, migrationPlan: MyMigrationPlan.self) {
            ContentView()
        }
    }
}
```

### @Query in Views

```swift
struct DraftsListView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Draft.creationDate, order: .reverse) var drafts: [Draft]

    var body: some View {
        List {
            ForEach(drafts) { draft in
                Text(draft.content)
            }
            .onDelete { indexes in
                if let index = indexes.first {
                    context.delete(drafts[index])
                }
            }
        }
    }
}
```

### Compound Predicates and Dynamic Queries

```swift
@Query(filter: #Predicate<Item> { item in
    item.isComplete == false && item.priority > 3
}, sort: \Item.dueDate)
var urgentItems: [Item]

// Dynamic predicate via init
init(searchText: String) {
    _items = Query(filter: #Predicate<Item> { item in
        searchText.isEmpty || item.title.localizedStandardContains(searchText)
    })
}
```

### CRUD in ModelContext

```swift
// Insert
let draft = Draft(content: "Hello")
context.insert(draft)

// Update — mutate directly
draft.content = "Updated"

// Delete
context.delete(draft)

// Manual fetch
var descriptor = FetchDescriptor<Draft>(
    predicate: #Predicate { $0.content.contains("search") },
    sortBy: [SortDescriptor(\.creationDate, order: .reverse)]
)
descriptor.fetchLimit = 20
let results = try context.fetch(descriptor)
```

---

## 2. SwiftData Schema Migration

### VersionedSchema

```swift
enum SchemaV1: VersionedSchema {
    static var versionIdentifier = Schema.Version(1, 0, 0)
    static var models: [any PersistentModel.Type] { [Item.self] }

    @Model class Item {
        var title: String = ""
    }
}

enum SchemaV2: VersionedSchema {
    static var versionIdentifier = Schema.Version(2, 0, 0)
    static var models: [any PersistentModel.Type] { [Item.self] }

    @Model class Item {
        var title: String = ""
        var priority: Int = 0
    }
}
```

### SchemaMigrationPlan

```swift
enum ItemMigrationPlan: SchemaMigrationPlan {
    static var schemas: [any VersionedSchema.Type] { [SchemaV1.self, SchemaV2.self] }
    static var stages: [MigrationStage] { [migrateV1toV2] }

    static let migrateV1toV2 = MigrationStage.lightweight(
        fromVersion: SchemaV1.self,
        toVersion: SchemaV2.self
    )
}
```

Custom migration with data transform:

```swift
static let migrateV1toV2 = MigrationStage.custom(
    fromVersion: SchemaV1.self,
    toVersion: SchemaV2.self,
    willMigrate: nil,
    didMigrate: { context in
        let items = try context.fetch(FetchDescriptor<SchemaV2.Item>())
        for item in items {
            item.priority = item.title.contains("urgent") ? 5 : 0
        }
        try context.save()
    }
)
```

- **Lightweight**: adding properties with defaults, renaming with `@Attribute(originalName:)`.
- **Custom**: data transforms, splitting/merging models, computed defaults.

---

## 3. Core Data

For existing apps or when SwiftData doesn't cover the use case.

### NSPersistentContainer Setup

```swift
final class CoreDataStore {
    private let persistentContainer: NSPersistentContainer

    init(modelName: String, appContainerURL: URL) async throws {
        guard let modelURL = Bundle.module.url(forResource: modelName, withExtension: "momd"),
              let model = NSManagedObjectModel(contentsOf: modelURL) else {
            throw StoreError.missingDataModel
        }

        let description = NSPersistentStoreDescription(
            url: appContainerURL.appendingPathComponent("\(modelName).sqlite")
        )
        description.setOption(true as NSNumber, forKey: NSMigratePersistentStoresAutomaticallyOption)
        description.setOption(true as NSNumber, forKey: NSInferMappingModelAutomaticallyOption)

        let container = NSPersistentContainer(name: modelName, managedObjectModel: model)
        container.persistentStoreDescriptions = [description]

        try await withCheckedThrowingContinuation { continuation in
            container.loadPersistentStores { _, error in
                if let error { continuation.resume(throwing: error) }
                else { continuation.resume() }
            }
        }

        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergeByPropertyStoreTrumpMergePolicy
        self.persistentContainer = container
    }

    var viewContext: NSManagedObjectContext { persistentContainer.viewContext }
    var newBackgroundContext: NSManagedObjectContext { persistentContainer.newBackgroundContext() }
}
```

### NSFetchRequest Pattern

```swift
func fetchOrCreate<T: NSManagedObject>(
    entityType: T.Type,
    predicate: NSPredicate?,
    in context: NSManagedObjectContext
) throws -> T {
    let request = NSFetchRequest<T>(entityName: NSStringFromClass(entityType))
    request.predicate = predicate
    request.fetchLimit = 1
    if let existing = try context.fetch(request).first {
        return existing
    }
    return T(context: context)
}
```

### Core Data Migration

Versioned `.xcdatamodeld` bundles handle schema evolution:

- **Lightweight**: add attributes with defaults, add/remove relationships, rename with renaming ID.
- **Heavy**: requires `NSMappingModel` + `NSMigrationManager` for data transforms.

Enable via persistent store description options (shown above).

---

## 4. AppStorage and UserDefaults

### Basic @AppStorage

```swift
struct SettingsView: View {
    @AppStorage("preferred_theme") var preferredTheme: ThemeMode = .system
    @AppStorage("show_sidebar") var showSidebar = true
}
```

### Custom Types with RawRepresentable

```swift
enum ThemeMode: String, CaseIterable {
    case system, light, dark
}

// Arrays via RawRepresentable
extension [String]: @retroactive RawRepresentable {
    public var rawValue: String {
        (try? JSONEncoder().encode(self)).flatMap { String(data: $0, encoding: .utf8) } ?? "[]"
    }
    public init?(rawValue: String) {
        self = (try? JSONDecoder().decode([String].self, from: Data(rawValue.utf8))) ?? []
    }
}
```

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

## 5. Keychain

### Protocol-Based Keychain Access

```swift
protocol KeychainStorage {
    func dataValue(service: String, key: String) throws -> Data
    func setDataValue(_ dataValue: Data, service: String, key: String) throws
    func removeValue(service: String, key: String) throws
}

final class KeychainStorageImpl: KeychainStorage {
    private func baseQuery(service: String, key: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
    }

    func dataValue(service: String, key: String) throws -> Data {
        var query = baseQuery(service: service, key: key)
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        query[kSecReturnData as String] = true

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        guard status == errSecSuccess else { throw KeychainError(status) }
        return item as! Data
    }

    func setDataValue(_ dataValue: Data, service: String, key: String) throws {
        let query = baseQuery(service: service, key: key)
        let attributes: [String: Any] = [
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
            kSecValueData as String: dataValue,
        ]

        let addQuery = query.merging(attributes) { _, new in new }
        let addStatus = SecItemAdd(addQuery as CFDictionary, nil)
        if addStatus == errSecSuccess { return }
        guard addStatus == errSecDuplicateItem else { throw KeychainError(addStatus) }

        let updateStatus = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        guard updateStatus == errSecSuccess else { throw KeychainError(updateStatus) }
    }

    func removeValue(service: String, key: String) throws {
        let query = baseQuery(service: service, key: key)
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError(status)
        }
    }
}
```

### When to Use Keychain

- OAuth tokens, API keys, passwords, cryptographic keys, database encryption keys.
- Data that should survive app reinstall (with correct accessibility setting).
- **Never** store large or frequently accessed data — it's slow.

---

## 6. Codable to File

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

## 7. Document-Based Persistence with NSDocument

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

## 8. Security-Scoped Bookmarks Integration

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

## 9. SQLite/GRDB for High-Performance Needs

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

## 10. Decision Guide

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
