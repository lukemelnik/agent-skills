# CloudKit & iCloud Sync

## Table of Contents

1. [SwiftData + CloudKit](#1-swiftdata--cloudkit)
2. [NSUbiquitousKeyValueStore](#2-nsubiquitouskeyvaluestore)
3. [Direct CloudKit API](#3-direct-cloudkit-api)
4. [Subscriptions and Push](#4-subscriptions-and-push)
5. [Sharing](#5-sharing)
6. [Conflict Resolution](#6-conflict-resolution)
7. [Error Handling](#7-error-handling)
8. [Testing](#8-testing)
9. [Decision Guide](#9-decision-guide)

---

## 1. SwiftData + CloudKit

### Setup

Enable **iCloud** capability with **CloudKit** checked, plus a container (`iCloud.com.example.myapp`). Use `ModelConfiguration` with `.automatic` to sync all models to the user's private database.

```swift
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [Note.self, Folder.self]) {
            let config = ModelConfiguration(cloudKitDatabase: .automatic)
            return try ModelContainer(for: Note.self, Folder.self, configurations: config)
        }
    }
}
```

Or build the container directly:

```swift
let config = ModelConfiguration(
    "MyStore",
    cloudKitDatabase: .automatic
)
let container = try ModelContainer(for: Note.self, configurations: config)
```

### Schema Restrictions

CloudKit imposes stricter rules than local-only SwiftData:

- **No `@Attribute(.unique)`** — CloudKit doesn't support unique constraints. Remove them or use local-only containers for dedup.
- **All properties must have defaults** — every stored property needs a default value (CloudKit records can arrive partially populated).
- **No optional-to-required migration** — once a field is optional, it cannot become required in a later schema version.
- **Relationships must be optional** — required relationships break sync. Use optional references: `var folder: Folder?`.
- **No ordered relationships** — CloudKit doesn't preserve array ordering in relationships.

### Allowed Schema Changes

- Adding new properties with default values.
- Adding new model types.
- Adding optional relationships.

### Breaking Schema Changes (avoid)

- Removing properties or model types.
- Renaming properties (use `@Attribute(originalName:)` for local, but CloudKit sees a new field).
- Changing a property type.
- Adding required (non-optional) relationships.

### Debugging

Add launch arguments in Xcode scheme:

- `-com.apple.CoreData.CloudKitDebug 1` — basic sync logging.
- `-com.apple.CoreData.CloudKitDebug 3` — verbose (shows every record push/pull).

### Handling "Waiting for First Sync" UX

Initial sync can take seconds to minutes. Don't show an empty state that implies no data exists.

```swift
struct NoteListView: View {
    @Query(sort: \Note.createdAt, order: .reverse) var notes: [Note]
    @State private var hasSynced = false

    var body: some View {
        Group {
            if notes.isEmpty && !hasSynced {
                ProgressView("Syncing from iCloud...")
            } else if notes.isEmpty {
                ContentUnavailableView("No Notes", systemImage: "note.text")
            } else {
                List(notes) { note in
                    NoteRow(note: note)
                }
            }
        }
        .task {
            // Give initial sync a reasonable window
            try? await Task.sleep(for: .seconds(3))
            hasSynced = true
        }
    }
}
```

---

## 2. NSUbiquitousKeyValueStore

Lightweight key-value sync for preferences and small state. No CloudKit container needed — just enable **iCloud > Key-Value Storage** capability.

### Limits

- **1 MB** total storage.
- **1024 keys** maximum.
- Values: `String`, `Int`, `Double`, `Bool`, `Data`, `Date`, `Array`, `Dictionary`.

### Reading and Writing

```swift
let store = NSUbiquitousKeyValueStore.default

// Write
store.set(true, forKey: "pro_unlocked")
store.set(3, forKey: "theme_index")
store.synchronize() // hint to sync soon (not required, but good practice)

// Read
let isPro = store.bool(forKey: "pro_unlocked")
let theme = store.longLong(forKey: "theme_index")
```

### Observing External Changes

```swift
@MainActor
@Observable class SyncedPreferences {
    var proUnlocked: Bool = NSUbiquitousKeyValueStore.default.bool(forKey: "pro_unlocked")

    init() {
        NotificationCenter.default.addObserver(
            forName: NSUbiquitousKeyValueStore.didChangeExternallyNotification,
            object: NSUbiquitousKeyValueStore.default,
            queue: .main
        ) { [weak self] notification in
            guard let self else { return }
            guard let userInfo = notification.userInfo,
                  let reason = userInfo[NSUbiquitousKeyValueStoreChangeReasonKey] as? Int else { return }

            // reason: 0 = server change, 1 = initial sync, 2 = quota violation
            if reason == NSUbiquitousKeyValueStoreServerChange ||
               reason == NSUbiquitousKeyValueStoreInitialSyncChange {
                if let keys = userInfo[NSUbiquitousKeyValueStoreChangedKeysKey] as? [String] {
                    for key in keys {
                        if key == "pro_unlocked" {
                            self.proUnlocked = NSUbiquitousKeyValueStore.default.bool(forKey: key)
                        }
                    }
                }
            }
        }
    }
}
```

### When to Use

- User preferences that should roam across devices (theme, last-read position, feature flags).
- Small state like "has seen onboarding" or "selected tab index".
- **Not for**: structured data, large files, anything over 1 MB.

---

## 3. Direct CloudKit API

### Containers and Databases

```swift
// Default container (matches iCloud container ID in entitlements)
let container = CKContainer.default()

// Custom named container
let container = CKContainer(identifier: "iCloud.com.example.myapp")

// Three databases
let privateDB = container.privateCloudDatabase   // user's private data
let publicDB = container.publicCloudDatabase      // visible to all users
let sharedDB = container.sharedCloudDatabase      // shared-with-me data
```

### CKRecord — CRUD

```swift
// Create
let record = CKRecord(recordType: "Note")
record["title"] = "My Note" as CKRecordValue
record["content"] = "Hello world" as CKRecordValue
record["createdAt"] = Date() as CKRecordValue

try await privateDB.save(record)

// Fetch by ID
let recordID = CKRecord.ID(recordName: "unique-id-123")
let fetched = try await privateDB.record(for: recordID)

// Update — modify fields on fetched record and save
fetched["title"] = "Updated Title" as CKRecordValue
try await privateDB.save(fetched)

// Delete
try await privateDB.deleteRecord(withID: recordID)
```

### CKQuery — Querying Records

```swift
let predicate = NSPredicate(format: "title CONTAINS %@", "Swift")
let query = CKQuery(recordType: "Note", predicate: predicate)
query.sortDescriptors = [NSSortDescriptor(key: "createdAt", ascending: false)]

let (results, _) = try await privateDB.records(matching: query, resultsLimit: 50)

let notes: [CKRecord] = results.compactMap { _, result in
    try? result.get()
}
```

### CKRecord.Reference — Relationships

```swift
// Parent reference (cascade delete when parent deleted)
let folderRef = CKRecord.Reference(recordID: folderRecord.recordID, action: .deleteSelf)
noteRecord["folder"] = folderRef

// Weak reference (nullify when target deleted)
let tagRef = CKRecord.Reference(recordID: tagRecord.recordID, action: .none)
noteRecord["tag"] = tagRef
```

### CKAsset — Binary Data

```swift
// Save image as asset
let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent("photo.jpg")
try imageData.write(to: tempURL)
record["photo"] = CKAsset(fileURL: tempURL)
try await privateDB.save(record)

// Read asset
if let asset = fetchedRecord["photo"] as? CKAsset,
   let fileURL = asset.fileURL {
    let data = try Data(contentsOf: fileURL)
}
```

### Batch Operations

```swift
// Batch save
let operation = CKModifyRecordsOperation(recordsToSave: records, recordIDsToDelete: idsToDelete)
operation.savePolicy = .changedKeys  // only upload changed fields
operation.isAtomic = true            // all-or-nothing

operation.modifyRecordsResultBlock = { result in
    switch result {
    case .success:
        print("Batch complete")
    case .failure(let error):
        print("Batch failed: \(error)")
    }
}

privateDB.add(operation)

// Batch fetch
let fetchOp = CKFetchRecordsOperation(recordIDs: recordIDs)
fetchOp.perRecordResultBlock = { recordID, result in
    switch result {
    case .success(let record):
        print("Fetched: \(record)")
    case .failure(let error):
        print("Failed for \(recordID): \(error)")
    }
}

privateDB.add(fetchOp)
```

---

## 4. Subscriptions and Push

Enable **Remote Notifications** in Background Modes capability.

### CKDatabaseSubscription

Fires when any record type changes in a database.

```swift
let subscription = CKDatabaseSubscription(subscriptionID: "private-db-changes")

let notificationInfo = CKSubscription.NotificationInfo()
notificationInfo.shouldSendContentAvailable = true // silent push
subscription.notificationInfo = notificationInfo

try await privateDB.save(subscription)
```

### CKQuerySubscription

Fires when records matching a predicate are created, updated, or deleted.

```swift
let predicate = NSPredicate(format: "priority >= %d", 3)
let subscription = CKQuerySubscription(
    recordType: "Task",
    predicate: predicate,
    subscriptionID: "high-priority-tasks",
    options: [.firesOnRecordCreation, .firesOnRecordUpdate]
)

let notificationInfo = CKSubscription.NotificationInfo()
notificationInfo.titleLocalizationKey = "New high-priority task"
notificationInfo.shouldBadge = true
subscription.notificationInfo = notificationInfo

try await privateDB.save(subscription)
```

### Processing Push Notifications

```swift
func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any]
) async -> UIBackgroundFetchResult {
    let notification = CKNotification(fromRemoteNotificationDictionary: userInfo)

    guard let notification else { return .noData }

    switch notification.notificationType {
    case .database:
        // Fetch changes using CKFetchDatabaseChangesOperation
        await fetchDatabaseChanges()
        return .newData
    case .query:
        if let queryNotification = notification as? CKQueryNotification,
           let recordID = queryNotification.recordID {
            await fetchRecord(recordID)
            return .newData
        }
        return .noData
    default:
        return .noData
    }
}
```

### Silent Push for Background Sync

Set `shouldSendContentAvailable = true` on the subscription's `notificationInfo`. The system delivers a silent push that wakes your app briefly for a background fetch — no user-visible alert.

---

## 5. Sharing

### Creating a Share

```swift
// Create a share rooted on a record
let share = CKShare(rootRecord: noteRecord)
share[CKShare.SystemFieldKey.title] = "Shared Note" as CKRecordValue
share.publicPermission = .none  // invite-only

// Save both record and share together
let operation = CKModifyRecordsOperation(recordsToSave: [noteRecord, share])
operation.modifyRecordsResultBlock = { result in
    // handle result
}
privateDB.add(operation)
```

### UICloudSharingController (UIKit)

```swift
let sharingController = UICloudSharingController(share: share, container: CKContainer.default())
sharingController.availablePermissions = [.allowReadWrite, .allowPrivate]
sharingController.delegate = self
present(sharingController, animated: true)
```

### ShareLink (SwiftUI, iOS 16+)

For SwiftData + CloudKit sharing, use `ShareLink` with a `CKShare` or use `UICloudSharingController` via `UIViewControllerRepresentable`.

### Participant Roles

- **Owner** — created the share, full control.
- **Private User** — invited participant, read or read/write per share permissions.
- **Public User** — anyone with the share link (if `publicPermission` is set).

### Accepting a Share

```swift
// In SceneDelegate or SwiftUI
func windowScene(
    _ windowScene: UIWindowScene,
    userDidAcceptCloudKitShareWith cloudKitShareMetadata: CKShare.Metadata
) {
    let acceptOp = CKAcceptSharesOperation(shareMetadatas: [cloudKitShareMetadata])
    acceptOp.acceptSharesResultBlock = { result in
        // Shared records now accessible in sharedCloudDatabase
    }
    CKContainer(identifier: cloudKitShareMetadata.containerIdentifier).add(acceptOp)
}
```

### Share Zones

Shared records live in custom zones. Use `CKFetchRecordZoneChangesOperation` on `sharedCloudDatabase` to pull shared content.

---

## 6. Conflict Resolution

### Default Behavior

CloudKit uses **last-writer-wins** by default — the most recent `save()` overwrites the server record.

### Field-Level Merge

When `CKError.serverRecordChanged` occurs, the error provides three versions:

```swift
func resolveConflict(_ error: CKError) -> CKRecord? {
    guard error.code == .serverRecordChanged,
          let clientRecord = error.clientRecord,
          let serverRecord = error.serverRecord,
          let ancestor = error.ancestorRecord else { return nil }

    // Merge changed fields from client into server record
    for key in clientRecord.changedKeys() {
        serverRecord[key] = clientRecord[key]
    }
    return serverRecord  // retry save with this merged record
}
```

### Server Change Tokens

Track sync position to fetch only new changes:

```swift
actor SyncEngine {
    private var serverChangeToken: CKServerChangeToken?

    func fetchChanges(in database: CKDatabase, zoneID: CKRecordZone.ID) async throws -> [CKRecord] {
        var config = CKFetchRecordZoneChangesOperation.ZoneConfiguration()
        config.previousServerChangeToken = serverChangeToken

        let operation = CKFetchRecordZoneChangesOperation(
            recordZoneIDs: [zoneID],
            configurationsByRecordZoneID: [zoneID: config]
        )

        var changedRecords: [CKRecord] = []

        operation.recordWasChangedBlock = { _, result in
            if case .success(let record) = result {
                changedRecords.append(record)
            }
        }

        operation.recordZoneChangeTokensUpdatedBlock = { _, token, _ in
            Task { await self.updateToken(token) }
        }

        operation.recordZoneFetchResultBlock = { _, result in
            if case .success(let (token, _, _)) = result {
                Task { await self.updateToken(token) }
            }
        }

        database.add(operation)
        return changedRecords
    }

    private func updateToken(_ token: CKServerChangeToken?) {
        self.serverChangeToken = token
        // Persist token to disk for next launch
    }
}
```

### Differential Sync Pattern

1. Subscribe to database changes (`CKDatabaseSubscription`).
2. On push notification, call `CKFetchDatabaseChangesOperation` to get changed zone IDs.
3. For each zone, call `CKFetchRecordZoneChangesOperation` with saved `CKServerChangeToken`.
4. Apply changes locally, save new token.

---

## 7. Error Handling

### Common CKError Codes

```swift
func handleCloudKitError(_ error: Error) {
    guard let ckError = error as? CKError else { return }

    switch ckError.code {
    case .networkUnavailable, .networkFailure:
        // Queue operation for retry when network returns
        scheduleRetry(after: ckError.retryAfterSeconds ?? 3.0)

    case .serverRecordChanged:
        // Conflict — merge client and server records
        if let resolved = resolveConflict(ckError) {
            retrySave(resolved)
        }

    case .quotaExceeded:
        // User's iCloud is full — show alert, cannot retry
        showStorageFullAlert()

    case .zoneNotFound:
        // Zone was deleted — recreate and retry
        createZone(then: retryOperation)

    case .partialFailure:
        // Some records failed — check individual errors
        if let partialErrors = ckError.partialErrorsByItemID {
            for (itemID, itemError) in partialErrors {
                handleCloudKitError(itemError)
            }
        }

    case .notAuthenticated:
        // User not signed into iCloud
        showSignInPrompt()

    case .limitExceeded:
        // Too many records in one operation — split into smaller batches
        splitAndRetry()

    default:
        break
    }
}
```

### Retry with retryAfterSeconds

```swift
func scheduleRetry(after seconds: Double?) {
    let delay = seconds ?? 3.0
    Task {
        try await Task.sleep(for: .seconds(delay))
        await retryOperation()
    }
}
```

Always check `CKError.retryAfterSeconds` before choosing your own delay — CloudKit provides this when it wants you to back off.

---

## 8. Testing

### CloudKit Dashboard

- **Web console**: [https://icloud.developer.apple.com](https://icloud.developer.apple.com)
- Inspect records, zones, subscriptions in both development and production environments.
- Manually create/edit/delete records for testing.
- Reset development environment to start fresh.

### Simulating Sync Conflicts

1. Run app on two devices (or simulator + device) with the same iCloud account.
2. Put one device in airplane mode.
3. Edit the same record on both devices.
4. Restore network on the offline device — triggers `serverRecordChanged`.

### Testing with Different iCloud Accounts

- Use separate Apple IDs for testing sharing features.
- Simulator supports signing into iCloud via Settings.
- For CI: mock CloudKit with a protocol layer — CloudKit APIs are not testable in unit tests without a real account.

```swift
protocol CloudStore {
    func save(_ record: CKRecord) async throws -> CKRecord
    func fetch(recordID: CKRecord.ID) async throws -> CKRecord
    func delete(recordID: CKRecord.ID) async throws
}

// Production
struct CloudKitStore: CloudStore {
    let database: CKDatabase
    func save(_ record: CKRecord) async throws -> CKRecord { try await database.save(record) }
    func fetch(recordID: CKRecord.ID) async throws -> CKRecord { try await database.record(for: recordID) }
    func delete(recordID: CKRecord.ID) async throws { try await database.deleteRecord(withID: recordID) }
}

// Tests
actor MockCloudStore: CloudStore {
    var records: [CKRecord.ID: CKRecord] = [:]
    func save(_ record: CKRecord) async throws -> CKRecord { records[record.recordID] = record; return record }
    func fetch(recordID: CKRecord.ID) async throws -> CKRecord {
        guard let record = records[recordID] else { throw CKError(.unknownItem) }
        return record
    }
    func delete(recordID: CKRecord.ID) async throws { records.removeValue(forKey: recordID) }
}
```

---

## 9. Decision Guide

| Approach | Best For | Complexity | Limitations |
|----------|----------|------------|-------------|
| **SwiftData + CloudKit** | Simple model sync, private data | Low | No `@Attribute(.unique)`, no sharing, schema restrictions |
| **NSUbiquitousKeyValueStore** | Preferences, settings, small flags | Very Low | 1 MB limit, 1024 keys, no queries |
| **Direct CKRecord** | Custom sync, sharing, public data | High | Manual conflict resolution, more boilerplate |

### Quick Decision Tree

1. **Syncing user preferences/settings?** -> NSUbiquitousKeyValueStore
2. **Simple structured data, private only, no sharing?** -> SwiftData + CloudKit
3. **Need sharing, public database, or custom sync logic?** -> Direct CloudKit API
4. **Need both local persistence and sync?** -> SwiftData (local) + Direct CloudKit (sync layer)
