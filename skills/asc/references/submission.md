# Submission & Review

## Pre-submission checks
Audit (metadata, screenshots, privacy, permissions, IAP) belongs to `app-review`; run `asc validate --app "APP_ID" --version "VERSION"` for the CLI readiness report. CLI fixes for common blockers:

### Encryption Compliance
If `usesNonExemptEncryption: true`:
```bash
asc encryption declarations list --app "APP_ID"
asc encryption declarations create \
  --app "APP_ID" \
  --app-description "Uses standard HTTPS/TLS" \
  --contains-proprietary-cryptography=false \
  --contains-third-party-cryptography=true \
  --available-on-french-store=true
asc encryption declarations assign-builds --id "DECLARATION_ID" --build-id "BUILD_ID"
```
**Better approach:** Add `ITSAppUsesNonExemptEncryption = NO` to Info.plist and rebuild.

### Content Rights Declaration
```bash
asc apps get --id "APP_ID" --output json | jq '.data.attributes.contentRightsDeclaration'
asc apps update --id "APP_ID" --content-rights "DOES_NOT_USE_THIRD_PARTY_CONTENT"
```
Valid values: `DOES_NOT_USE_THIRD_PARTY_CONTENT`, `USES_THIRD_PARTY_CONTENT`

## Submit

Ship with `asc publish appstore --submit --confirm`, or for an already-prepared version:
```bash
asc review submit --app "APP_ID" --version "1.2.3" --build-id "BUILD_ID" --confirm
```

## Monitor / cancel
```bash
asc review status --app "APP_ID"
asc review doctor --app "APP_ID"      # why it cannot be submitted
asc submit status --id "SUBMISSION_ID"
asc submit cancel --id "SUBMISSION_ID" --confirm
```

## Common Submission Errors

### "Version is not in valid state"
Run `asc review doctor` / `asc validate`; usual causes are missing build, encryption declaration, content rights, localizations, or screenshots.

### "Export compliance must be approved"
Build has `usesNonExemptEncryption: true`. Rebuild with `ITSAppUsesNonExemptEncryption = NO` in Info.plist.

### "Multiple app infos found"
Use `--app-info` flag: `asc apps info list --app "APP_ID"`
