# Metadata Sync

## Two Types of Localizations

### 1. Version Localizations (per-release)
Fields: `description`, `keywords`, `whatsNew`, `supportUrl`, `marketingUrl`, `promotionalText`

```bash
asc localizations list --version "VERSION_ID"
asc localizations download --version "VERSION_ID" --path "./localizations"
asc localizations upload --version "VERSION_ID" --path "./localizations"
```

### 2. App Info Localizations (app-level)
Fields: `name`, `subtitle`, `privacyPolicyUrl`, `privacyChoicesUrl`, `privacyPolicyText`

```bash
asc apps info list --app "APP_ID"
asc localizations list --app "APP_ID" --type app-info --app-info "APP_INFO_ID"
asc localizations upload --app "APP_ID" --type app-info --app-info "APP_INFO_ID" --path "./app-info-localizations"
```

**Note:** If you get "multiple app infos found", specify `--app-info` with the correct ID.

## Quick Field Updates

### Version-specific fields
```bash
asc apps info edit --app "APP_ID" --locale "en-US" --whats-new "Bug fixes and improvements"
asc apps info edit --app "APP_ID" --locale "en-US" --description "Your app description here"
asc apps info edit --app "APP_ID" --locale "en-US" --keywords "keyword1,keyword2,keyword3"
asc apps info edit --app "APP_ID" --locale "en-US" --support-url "https://support.example.com"
```

### Version metadata
```bash
asc versions update --version-id "VERSION_ID" --copyright "2026 Your Company"
asc versions update --version-id "VERSION_ID" --release-type AFTER_APPROVAL
```

### TestFlight notes
```bash
asc build-localizations create --build "BUILD_ID" --locale "en-US" --whats-new "TestFlight notes here"
```

## Legacy Metadata Format

```bash
asc migrate export --app "APP_ID" --output "./metadata"
asc migrate validate --help
asc migrate import --help
```

## Canonical Metadata (pull/push)

```bash
asc metadata pull --app "APP_ID" --version "1.2.3" --dir "./metadata"
asc metadata push --app "APP_ID" --version "1.2.3" --dir "./metadata" --dry-run
asc metadata push --app "APP_ID" --version "1.2.3" --dir "./metadata"
```

## .strings File Format

```
// en-US.strings
"description" = "Your app description";
"keywords" = "keyword1,keyword2,keyword3";
"whatsNew" = "What's new in this version";
"supportUrl" = "https://support.example.com";
```

## Character Limits

| Field | Limit |
|-------|-------|
| Name | 30 |
| Subtitle | 30 |
| Keywords | 100 (comma-separated) |
| Description | 4000 |
| What's New | 4000 |
| Promotional Text | 170 |

## Notes
- Version localizations and app info localizations are different — use the right `--type` flag.
- Privacy Policy URL is in app info localizations, not version localizations.
- Use `asc localizations list` to confirm available locales and IDs.
