# iOS Data Persistence

## Table of Contents

1. [SwiftData](#1-swiftdata)
2. [SwiftData Schema Migration](#2-swiftdata-schema-migration)
3. [Core Data](#3-core-data)
4. [AppStorage and UserDefaults](#4-appstorage-and-userdefaults)
5. [Keychain](#5-keychain)
6. [Codable to File](#6-codable-to-file)
7. [Decision Guide](#7-decision-guide)

---

## 1. SwiftData

### Model Definition

Use `@Model` for persistent types. All stored properties get default values.

> **Warning:** Property observers (`didSet`/`willSet`) are silently ignored on `@Model` properties. SwiftData's macro rewrites property access, so observers never fire. Use `modelContext.save()` callbacks or explicit methods instead.

> **Warning:** `description` cannot be used as a property name in `@Model` classes — it conflicts with the inherited `description` property and is explicitly disallowed.

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
    var tags: [String] = []       // arrays of value types work directly
    var creationDate: Date = Date()

    init(title: String, symbolName: String, tags: [String]) {
        self.title = title
        self.symbolName = symbolName
        self.tags = tags
        self.creationDate = Date()
    }
}
```

Enum properties stored in a model must conform to `Codable`. Enums with associated values are supported — they work fine as long as they are `Codable`.

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

> **Warning:** Place `@Relationship` on ONE side only. Using it on both sides of a relationship causes a circular reference.

> **Warning:** SwiftData frequently gets inverse relationships wrong — always specify the inverse explicitly in `@Relationship` (e.g., `inverse: \Item.folder`) rather than relying on SwiftData to infer it.

> **Warning:** The default delete rule `.nullify` sets the related model's reference to `nil` when the parent is deleted. This can leave orphaned objects or crash if the property is non-optional. Always specify an explicit delete rule — `.cascade` is most common.

### Property Attributes

Use `@Attribute` and `@Transient` macros to customize how SwiftData stores properties:

- `@Attribute(.unique)` — enforces uniqueness; upserts on conflict.
- `@Attribute(.externalStorage)` — stores large data (images, blobs) as external files instead of inline in the database. Note: this is a *suggestion*, not a requirement — SwiftData may store data inline if it decides that's better. Only applies to `Data` properties.
- `@Attribute(originalName: "old_name")` — maps to a previous property name, enabling lightweight migration renames.
- `@Transient` — excludes the property from persistence entirely (must have a default value). Resets to its default on every fetch from the store. If the value is derived from other stored properties, prefer a computed property instead — use `@Transient` only for expensive-to-produce values.
- `#Unique` — declares uniqueness constraints (distinct from `@Attribute(.unique)`). Only one `#Unique` per model; for multiple constraints, pass separate key path arrays: `#Unique<Foo>([\.email], [\.username])`. Not compatible with CloudKit.

```swift
@Model class Article {
    @Attribute(.unique) var slug: String = ""
    @Attribute(.externalStorage) var imageData: Data?
    @Attribute(originalName: "body") var content: String = ""
    @Transient var isExpanded: Bool = false
}
```

### ModelContainer Setup

Register all model types at the app level. Use `.modelContainer(for:)` on the top-level scene or view.

```swift
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [
            Draft.self,
            TagGroup.self,
            RecentTag.self,
        ])
    }
}
```

For extensions or previews that need a separate container:

```swift
let container = try ModelContainer(
    for: TagGroup.self,
    configurations: ModelConfiguration(isStoredInMemoryOnly: true)
)
```

### @Query in Views

`@Query` drives SwiftUI views from the database. Supports sort descriptors, predicates, and animation.

> **Warning:** `@Query` only works inside SwiftUI views. It will not operate correctly in view models, `@Observable` classes, or other non-view types. For non-view fetching, use `ModelContext.fetch()` directly.

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

### Compound Predicates

```swift
@Query(filter: #Predicate<Item> { item in
    item.isComplete == false && item.priority > 3
}, sort: \Item.dueDate)
var urgentItems: [Item]
```

Dynamic predicates via init:

```swift
init(searchText: String) {
    _items = Query(filter: #Predicate<Item> { item in
        searchText.isEmpty || item.title.localizedStandardContains(searchText)
    })
}
```

### Predicate Pitfalls

SwiftData predicates support only a subset of Swift. Some unsupported operations fail to compile, but others compile cleanly and then **crash at runtime**. This section is critical to avoid silent failures.

**String matching — use the right methods:**

- Always use `localizedStandardContains()` for case/diacritic-insensitive search. Never use `lowercased().contains()` — `lowercased()` is not supported in predicates.
- Use `starts(with:)` instead of `hasPrefix()` — `hasPrefix()` is not supported.

```swift
// Correct
#Predicate<Movie> { $0.name.localizedStandardContains("titanic") }
#Predicate<Website> { $0.url.starts(with: "https://apple.com") }

// Wrong — will not compile
#Predicate<Movie> { $0.name.lowercased().contains("titanic") }
#Predicate<Website> { $0.url.hasPrefix("https://apple.com") }
```

**Operations that will NOT compile:**

- `String.hasSuffix()`, `String.lowercased()`
- `Sequence.map()`, `Sequence.reduce()`, `Sequence.count(where:)`
- `Collection.first`
- Custom operators

**Operations that COMPILE but CRASH at runtime:**

- `x.isEmpty == false` — use `!x.isEmpty` instead. The `== false` form crashes.

```swift
// Correct — works
#Predicate<Movie> { !$0.cast.isEmpty }

// CRASHES at runtime despite compiling
#Predicate<Movie> { $0.cast.isEmpty == false }
```

- **Computed properties** in predicates — compiles, crashes at runtime.
- **`@Transient` properties** in predicates — compiles, crashes at runtime.
- **Custom Codable structs** in predicates — compiles, crashes at runtime.
- **Regular expressions** in predicates — compiles, crashes at runtime.

```swift
// CRASHES — regex in predicate
#Predicate<Movie> { $0.name.contains(/Titanic/) }
```

All predicates must rely only on stored `@Model` properties that map directly to database columns.

### CRUD in ModelContext

> **Warning:** `ModelContext` and model instances must NEVER cross actor boundaries. They are not `Sendable`. If you need a model on another actor, send its `PersistentIdentifier` (which is `Sendable`) and re-fetch in the destination context.

> **Warning:** Persistent identifiers are temporary before the first save — temporary IDs start with `"t"` and change after `save()`. Always save before relying on an object's ID.

```swift
// Insert
let draft = Draft(content: "Hello")
context.insert(draft)

// Update — mutate properties directly, changes auto-tracked
draft.content = "Updated"

// Delete
context.delete(draft)

// Explicit save — prefer this over relying on autosave
try context.save()

// Fetch manually
var descriptor = FetchDescriptor<Draft>(
    predicate: #Predicate { $0.content.contains("search") },
    sortBy: [SortDescriptor(\.creationDate, order: .reverse)]
)
descriptor.fetchLimit = 20
let results = try context.fetch(descriptor)
```

> **Note:** Autosave timing is unpredictable — it was aggressive at launch but is now infrequent. Prefer explicit `save()` calls when correctness matters. There is no need to check `hasChanges` before saving; just call `save()` directly.

### Performance

**Efficient counting:** Use `ModelContext.fetchCount()` with a `FetchDescriptor` when you only need a count. This avoids fetching full objects into memory. Note that the count does not live-update unless something else (like `@Query`) triggers a refresh.

```swift
let count = try context.fetchCount(FetchDescriptor<Draft>(
    predicate: #Predicate { $0.content.contains("search") }
))
```

**Selective fetching:** Set `propertiesToFetch` on a `FetchDescriptor` to load only the properties you need (all properties are fetched by default).

**Relationship prefetching:** Set `relationshipKeyPathsForPrefetching` when you know certain relationships will be accessed — it's more efficient to fetch them upfront than to fault them in one by one.

```swift
var descriptor = FetchDescriptor<Folder>()
descriptor.propertiesToFetch = [\.name]
descriptor.relationshipKeyPathsForPrefetching = [\.items]
```

### Indexing (iOS 18+)

Use the `#Index` macro to speed up queries on frequently read properties. Indexes have a small write cost, so avoid them on properties that are updated much more often than they are queried.

```swift
@Model class Article {
    #Index<Article>([\.type], [\.author])

    var type: String = ""
    var author: String = ""
    var publishDate: Date = Date()
}
```

Compound indexes group properties often queried together:

```swift
#Index<Article>([\.type], [\.type, \.author])
```

### CloudKit Considerations

When using SwiftData with CloudKit:

- Never use `@Attribute(.unique)` or `#Unique` — not supported with CloudKit and will cause local data failures.
- All model properties must have default values or be optional.
- All relationships must be optional.
- Indexes and subclasses are supported (with correct OS release).
- Design for eventual consistency — data may not have synced yet.

### Class Inheritance (iOS 26+)

SwiftData supports `@Model` class inheritance starting with iOS 26. Both parent and child classes must use `@Model`, and child classes must be marked `@available(iOS 26, *)` even if iOS 26 is the minimum deployment target. Both parent and child classes must be listed in the `ModelContainer` schema — SwiftData cannot infer the connection.

```swift
@Model class Article {
    var type: String = ""
}

@available(iOS 26, *)
@Model class Tutorial: Article {
    var difficulty: Int = 0
}
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
        var priority: Int = 0    // new field
    }
}
```

### SchemaMigrationPlan

```swift
enum ItemMigrationPlan: SchemaMigrationPlan {
    static var schemas: [any VersionedSchema.Type] {
        [SchemaV1.self, SchemaV2.self]
    }

    static var stages: [MigrationStage] {
        [migrateV1toV2]
    }

    // Lightweight — just adding a column with default
    static let migrateV1toV2 = MigrationStage.lightweight(
        fromVersion: SchemaV1.self,
        toVersion: SchemaV2.self
    )
}
```

Custom migration for data transforms:

```swift
static let migrateV1toV2 = MigrationStage.custom(
    fromVersion: SchemaV1.self,
    toVersion: SchemaV2.self,
    willMigrate: { context in
        // pre-migration: modify old schema objects
    },
    didMigrate: { context in
        // post-migration: populate new fields
        let items = try context.fetch(FetchDescriptor<SchemaV2.Item>())
        for item in items {
            item.priority = item.title.contains("urgent") ? 5 : 0
        }
        try context.save()
    }
)
```

Apply to container:

```swift
.modelContainer(for: SchemaV2.Item.self, migrationPlan: ItemMigrationPlan.self)
```

### When to Use Which Migration

- **Lightweight**: adding properties with defaults, renaming with `@Attribute(originalName:)`.
- **Custom**: data transforms, splitting/merging models, computed defaults from existing data.

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
func fetchArticles(matching predicate: NSPredicate? = nil) throws -> [Article] {
    let request = NSFetchRequest<Article>(entityName: "Article")
    request.predicate = predicate
    request.sortDescriptors = [NSSortDescriptor(key: "date", ascending: false)]
    request.fetchLimit = 50
    return try viewContext.fetch(request)
}

// Fetch-or-create
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

- **Lightweight migration** (automatic): add attributes with defaults, add/remove relationships, rename with renaming ID.
- **Heavy migration**: requires `NSMappingModel` + `NSMigrationManager` for data transforms.

Enable automatic migration via store description options (shown above) or programmatically.

---

## 4. AppStorage and UserDefaults

### Basic @AppStorage

```swift
struct SettingsView: View {
    @AppStorage("preferred_browser") var preferredBrowser: PreferredBrowser = .inAppSafari
    @AppStorage("haptic_enabled") var hapticEnabled = true
    @AppStorage("max_indent") var maxIndent: UInt = 7
}
```

### Custom Types with RawRepresentable

`@AppStorage` supports `String`, `Int`, `Double`, `Bool`, `URL`, `Data`, and any `RawRepresentable` type.

```swift
enum PreferredBrowser: String, CaseIterable {
    case inAppSafari, safari, chrome
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

@AppStorage("recent_languages") var recentLanguages: [String] = []
```

### App Group Shared Defaults

Share data between app and extensions:

```swift
let sharedDefaults = UserDefaults(suiteName: "group.com.example.myapp")

@AppStorage("setting_key", store: sharedDefaults)
var settingValue: String = ""
```

### @Observable + UserDefaults Bridge

`@AppStorage` is a `DynamicProperty` and only works inside SwiftUI views. For `@Observable` classes, use `UserDefaults` directly with stored properties and `didSet`:

```swift
@MainActor
@Observable final class UserPreferences {
    private let defaults: UserDefaults

    var themeMode: ThemeMode = {
        .system
    }() {
        didSet { defaults.set(themeMode.rawValue, forKey: "theme_mode") }
    }

    var fontSize: Int = 14 {
        didSet { defaults.set(fontSize, forKey: "font_size") }
    }

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        themeMode = ThemeMode(rawValue: defaults.string(forKey: "theme_mode") ?? "") ?? .system
        fontSize = defaults.object(forKey: "font_size") as? Int ?? 14
    }
}
```

Using stored properties with `didSet` ensures `@Observable` change tracking works automatically. Computed properties would require manual `access(keyPath:)` / `withMutation(keyPath:)` calls.

This pattern is best when the current process owns the writes. If widgets, extensions, or other processes can update the same keys, reload from `UserDefaults` when the scene becomes active or after receiving an explicit sync signal; do not assume a cached `@Observable` instance stays fresh forever.

---

## 5. Keychain

### Using Security Framework Directly

Protocol-based approach for testability:

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

        // Try insert first
        let addQuery = query.merging(attributes) { _, new in new }
        let addStatus = SecItemAdd(addQuery as CFDictionary, nil)
        if addStatus == errSecSuccess { return }
        guard addStatus == errSecDuplicateItem else { throw KeychainError(addStatus) }

        // Update if duplicate
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

### Storing Codable Objects in Keychain

> **Note:** The following pattern uses [KeychainSwift](https://github.com/evgenyneu/keychain-swift) (a third-party wrapper library), not the raw Security framework. The `keychain.set(...)`, `keychain.getData(...)`, `keychain.delete(...)`, and `keychain.allKeys` APIs come from that library.

Pattern from IceCubesApp — encode Codable accounts and save to keychain:

```swift
struct AppAccount: Codable, Identifiable {
    let id: String
    let server: String
    var oauthToken: OauthToken?

    func save() throws {
        let data = try JSONEncoder().encode(self)
        keychain.set(data, forKey: id, withAccess: .accessibleAfterFirstUnlock)
    }

    func delete() {
        keychain.delete(id)
    }

    static func retrieveAll() -> [AppAccount] {
        let decoder = JSONDecoder()
        return keychain.allKeys.compactMap { key in
            keychain.getData(key).flatMap { try? decoder.decode(AppAccount.self, from: $0) }
        }
    }
}
```

### When to Use Keychain

- OAuth tokens, API keys, passwords, cryptographic keys.
- Data that should survive app reinstall (with correct accessibility setting).
- **Never** store large data or frequently accessed data in keychain — it's slow.

---

## 6. Codable to File

### JSON Settings to Application Support

```swift
final class Settings: ObservableObject {
    @Published var preferences: SettingsData
    private let settingsURL: URL

    init(
        settingsURL: URL = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
            .appendingPathComponent("MyApp/settings.json")
    ) {
        self.settingsURL = settingsURL
        self.preferences = loadSettings()
    }

    private func loadSettings() -> SettingsData {
        guard let data = try? Data(contentsOf: settingsURL),
              let decoded = try? JSONDecoder().decode(SettingsData.self, from: data) else {
            return SettingsData()
        }
        return decoded
    }

    func save() throws {
        let dir = settingsURL.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let data = try JSONEncoder().encode(preferences)
        try data.write(to: settingsURL, options: .atomic)
    }
}
```

Own this at the app/scene root and inject it where needed; do not hide mutable settings behind a global singleton.

### Actor-Based Cache with Codable

```swift
actor TimelineCache {
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    private func cacheURL(for key: String) -> URL {
        FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!
            .appendingPathComponent("timeline/\(key).json")
    }

    func set(items: [CachedItem], for key: String) async throws {
        let data = try encoder.encode(items)
        let url = cacheURL(for: key)
        try FileManager.default.createDirectory(
            at: url.deletingLastPathComponent(), withIntermediateDirectories: true
        )
        try data.write(to: url, options: .atomic)
    }

    func get(for key: String) async -> [CachedItem]? {
        guard let data = try? Data(contentsOf: cacheURL(for: key)) else { return nil }
        return try? decoder.decode([CachedItem].self, from: data)
    }

    func clear(for key: String) async {
        try? FileManager.default.removeItem(at: cacheURL(for: key))
    }
}
```

---

## 7. Decision Guide

| Approach | Best For | Size | Queryable | Encrypted | Survives Reinstall |
|----------|----------|------|-----------|-----------|-------------------|
| **SwiftData** | Structured app data, relationships, lists | Large | Yes | No | No |
| **Core Data** | Legacy apps, complex migration needs | Large | Yes | No | No |
| **@AppStorage** | User preferences, simple flags | Small | No | No | No |
| **Keychain** | Tokens, passwords, credentials | Tiny | No | Yes | Configurable |
| **Codable to file** | Settings files, offline caches | Medium | No | No | No |
| **SQLite/GRDB** | High-performance queries, custom schemas | Large | Yes | Optional | No |

### Quick Decision Tree

1. **Sensitive credential?** -> Keychain
2. **Simple preference/flag?** -> @AppStorage
3. **Structured data with relationships?** -> SwiftData (new apps) or Core Data (existing)
4. **Large dataset, complex queries, need fine-grained SQL control?** -> GRDB/SQLite
5. **Offline cache or config file?** -> Codable to JSON/plist file
