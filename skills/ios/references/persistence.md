# iOS Data Persistence

## 1. SwiftData gotchas

- `@Attribute(.externalStorage)` is a suggestion, only for `Data`.
- `@Transient` resets to its default on every fetch; prefer computed properties for derived values.
- `#Unique` allows one macro per model (pass multiple key-path arrays); not CloudKit-compatible, nor is `@Attribute(.unique)`.
- `ModelContext` and models are not `Sendable`: pass `PersistentIdentifier` across actors and re-fetch.
- IDs are temporary (start with `"t"`) until the first `save()`.
- Autosave timing is unpredictable; call `try context.save()` explicitly when correctness matters. No need to check `hasChanges`.
- Use `fetchCount()` for counts; `propertiesToFetch` and `relationshipKeyPathsForPrefetching` for large fetches.
- `#Index<T>([\.a], [\.a, \.b])` (iOS 18+) speeds frequent queries; costs writes. Subclassing needs iOS 26+.
- Extensions/previews needing a separate container: `ModelConfiguration(isStoredInMemoryOnly: true)`.
- With CloudKit: defaults or optionals on all properties, optional relationships, design for eventual consistency (see `cloudkit.md`).

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

## 3. Keychain

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

## 4. Decision Guide

1. Sensitive credential: Keychain (never large or hot data).
2. Simple preference/flag: `@AppStorage`. App-extension sharing: `UserDefaults(suiteName: "group...")` with `@AppStorage(_, store:)`.
3. Structured data with relationships: SwiftData.
4. Heavy SQL control: GRDB/SQLite.
5. Offline cache or config: Codable JSON file in Application Support.
