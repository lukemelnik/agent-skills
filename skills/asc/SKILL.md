---
name: asc
description: App Store Connect CLI (`asc`) operations - upload builds, TestFlight, submit and monitor review, metadata and localizations, screenshot upload, pricing, signing resources, ASO keyword audits, and "What's New" release notes drafted from git history. Use when running or scripting `asc` commands or writing release notes from git tags.
---

# App Store Connect CLI (`asc`)

Load the relevant reference for the task. Pre-submission audit lives in `app-review`; signing/archive/upload mechanics in `apple-release`; screenshot creative in `aso-screenshots`.

## Preconditions

- Auth: `asc auth login` or `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_PRIVATE_KEY_PATH` env vars (CI: `--bypass-keychain`); check with `asc auth status --validate` / `asc auth doctor`
- Prefer `ASC_APP_ID` or pass `--app` explicitly
- Always verify flags with `asc <cmd> --help` before running; flags change between versions (`asc docs list` / `asc docs show <guide>` has embedded guides)
- Destructive operations need `--confirm`; use `--paginate` for complete lists; `--output json` for machine steps
- Timeouts: `ASC_TIMEOUT`, `ASC_UPLOAD_TIMEOUT`

## Routing

| Task | Reference |
|------|-----------|
| Upload build, TestFlight, App Store release | [references/release-flow.md](references/release-flow.md) |
| Submission, review monitoring, encryption/content rights | [references/submission.md](references/submission.md) |
| Capture, frame, upload screenshots | [references/screenshots.md](references/screenshots.md) |
| Name, description, keywords, localizations | [references/metadata.md](references/metadata.md) |
| TestFlight groups and testers | [references/testflight.md](references/testflight.md) |
| What's New / release notes (incl. from git) | [references/release-notes.md](references/release-notes.md) |
| Territory pricing, PPP, IAP pricing | [references/pricing.md](references/pricing.md) |
| Certificates, profiles, bundle IDs, capabilities | [references/signing.md](references/signing.md) |
| Keyword audit | [references/aso-audit.md](references/aso-audit.md) |

## ID resolution

```bash
asc apps list --bundle-id "com.example.app"                  # App ID
asc builds info --app "APP_ID" --latest --platform IOS       # Build ID
asc versions list --app "APP_ID"                             # Version ID
asc testflight groups list --app "APP_ID"                    # Group IDs
```

`asc builds upload` only prepares an upload; use `asc publish` for end-to-end flows.
