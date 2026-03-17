---
name: asc
description: App Store Connect CLI workflows for iOS app releases. Covers metadata (name, description, keywords), screenshots (capture, frame, upload), TestFlight distribution, App Store submission, pricing, signing, builds, release notes, and ASO audits. Use when asked to upload a build, manage TestFlight, submit to App Store, update metadata, capture or upload screenshots, set pricing, write release notes, audit ASO keywords, resolve ASC IDs, or run any `asc` CLI command.
---

# App Store Connect CLI (`asc`)

Unified skill for all `asc` CLI workflows. Load the relevant reference file based on the task.

## Preconditions

- Auth configured: `asc auth login` or `ASC_*` env vars
- Prefer `ASC_APP_ID` or pass `--app` explicitly
- Always verify flags with `--help` before running commands
- Use `--output json` for machine steps, `--output table` for human display

## Routing

| Task | Reference |
|------|-----------|
| Upload build, distribute to TestFlight, submit to App Store | [references/release-flow.md](references/release-flow.md) |
| Capture, frame, upload screenshots | [references/screenshots.md](references/screenshots.md) |
| App name, description, keywords, localizations | [references/metadata.md](references/metadata.md) |
| Pre-submission checks, review monitoring | [references/submission.md](references/submission.md) |
| TestFlight groups, testers, build distribution | [references/testflight.md](references/testflight.md) |
| Write What's New / release notes | [references/release-notes.md](references/release-notes.md) |
| Territory pricing, PPP, IAP pricing | [references/pricing.md](references/pricing.md) |
| Certificates, profiles, bundle IDs, capabilities | [references/signing.md](references/signing.md) |
| Build processing, cleanup, expiration | [references/builds.md](references/builds.md) |
| Keyword audit, ASO optimization | [references/aso-audit.md](references/aso-audit.md) |
| CLI conventions, flags, output, auth, ID resolution | [references/cli.md](references/cli.md) |

## Quick Reference

### Common ID resolution
```bash
asc apps list --bundle-id "com.example.app"       # App ID
asc builds latest --app "APP_ID" --platform IOS    # Build ID
asc versions list --app "APP_ID"                   # Version ID
asc testflight groups list --app "APP_ID"          # Group IDs
```

### End-to-end release (most common)
```bash
# TestFlight
asc publish testflight --app "APP_ID" --ipa "./app.ipa" --group "GROUP_ID" --wait --notify

# App Store
asc publish appstore --app "APP_ID" --ipa "./app.ipa" --version "1.0.0" --wait --submit --confirm
```

### Metadata quick update
```bash
asc apps info edit --app "APP_ID" --locale "en-US" --description "Your description"
asc apps info edit --app "APP_ID" --locale "en-US" --keywords "keyword1,keyword2"
asc apps info edit --app "APP_ID" --locale "en-US" --whats-new "Release notes here"
```

## CLI Conventions

- Use explicit long flags (`--app`, `--output`, `--confirm`)
- Destructive operations require `--confirm`
- Use `--paginate` for complete list results
- Output defaults are TTY-aware: `table` interactive, `json` piped
- Timeouts: `ASC_TIMEOUT`, `ASC_UPLOAD_TIMEOUT` env vars
