# CloudKit Gotchas

## SwiftData + CloudKit schema restrictions

- No `@Attribute(.unique)`.
- Every stored property needs a default value (records can arrive partial).
- Relationships must be optional and unordered.
- Safe changes: add properties with defaults, add models, add optional relationships.
- Breaking: removing/renaming/retyping properties (CloudKit sees a new field; `originalName` is local only), adding required relationships, optional-to-required.
- CloudKit schema is additive and must be deployed from the dev to the production environment in CloudKit Dashboard before release.
- Debug sync with launch args `-com.apple.CoreData.CloudKitDebug 1` (3 for verbose).

## UX

- Initial sync can take seconds to minutes: do not show an empty state implying no data; show "Syncing from iCloud" first.

## Direct CloudKit

- `CKError.serverRecordChanged`: merge field-level from the error's server record, then retry.
- Honor `retryAfterSeconds` on `.networkUnavailable`, `.requestRateLimited`, `.zoneBusy`.
- `.partialFailure`: inspect `partialErrorsByItemID` per record.
- `.limitExceeded`: split batch into smaller operations.
- `.zoneNotFound`: recreate zone and retry. `.quotaExceeded` cannot be retried; tell the user.
- Persist server change tokens per zone/database for differential sync.
- `NSUbiquitousKeyValueStore` is limited to 1 MB total / 1024 keys; observe `didChangeExternallyNotification`.
