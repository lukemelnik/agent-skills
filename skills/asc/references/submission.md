# Submission Health & Review

Pre-flight checks, submission, and review monitoring.

## Preconditions
- Auth configured and app/version/build IDs resolved.
- Build is processed (not in processing state).
- All required metadata is complete.

## Pre-submission Checklist

### 1. Verify Build Status
```bash
asc builds info --build "BUILD_ID"
```
Check: `processingState` is `VALID`, `usesNonExemptEncryption` status.

### 2. Encryption Compliance
If `usesNonExemptEncryption: true`:
```bash
asc encryption declarations list --app "APP_ID"
asc encryption declarations create \
  --app "APP_ID" \
  --app-description "Uses standard HTTPS/TLS" \
  --contains-proprietary-cryptography=false \
  --contains-third-party-cryptography=true \
  --available-on-french-store=true
asc encryption declarations assign-builds --id "DECLARATION_ID" --build "BUILD_ID"
```
**Better approach:** Add `ITSAppUsesNonExemptEncryption = NO` to Info.plist and rebuild.

### 3. Content Rights Declaration
```bash
asc apps get --id "APP_ID" --output json | jq '.data.attributes.contentRightsDeclaration'
asc apps update --id "APP_ID" --content-rights "DOES_NOT_USE_THIRD_PARTY_CONTENT"
```
Valid values: `DOES_NOT_USE_THIRD_PARTY_CONTENT`, `USES_THIRD_PARTY_CONTENT`

### 4. Version Metadata
```bash
asc versions get --version-id "VERSION_ID" --include-build
asc versions update --version-id "VERSION_ID" --copyright "2026 Your Company"
```

### 5. Localizations Complete
```bash
asc localizations list --version "VERSION_ID"
```
Check required fields: description, keywords, whatsNew, supportUrl.

### 6. Screenshots Present
Each locale needs screenshots for the target platform.

### 7. App Info (Privacy Policy)
```bash
asc apps info list --app "APP_ID"
asc localizations list --app "APP_ID" --type app-info --app-info "APP_INFO_ID"
```

## Submit

### Using Review Submissions API (Recommended)
```bash
asc review submissions-create --app "APP_ID" --platform IOS
asc review items-add --submission "SUBMISSION_ID" --item-type appStoreVersions --item-id "VERSION_ID"
asc review submissions-submit --id "SUBMISSION_ID" --confirm
```

### Using Submit Command
```bash
asc submit create --app "APP_ID" --version "1.2.3" --build "BUILD_ID" --confirm
```

## Monitor
```bash
asc submit status --id "SUBMISSION_ID"
asc submit status --version-id "VERSION_ID"
asc review submissions-list --app "APP_ID" --paginate
```

## Cancel / Retry
```bash
asc submit cancel --id "SUBMISSION_ID" --confirm
asc review submissions-cancel --id "SUBMISSION_ID" --confirm
```

## Common Submission Errors

### "Version is not in valid state"
1. Build attached and VALID
2. Encryption declaration approved (or exempt)
3. Content rights declaration set
4. All localizations complete
5. Screenshots present for all locales

### "Export compliance must be approved"
Build has `usesNonExemptEncryption: true`. Rebuild with `ITSAppUsesNonExemptEncryption = NO` in Info.plist.

### "Multiple app infos found"
Use `--app-info` flag: `asc apps info list --app "APP_ID"`
