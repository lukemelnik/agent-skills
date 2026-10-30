# Release Flow (TestFlight and App Store)

Pre-submission audit: use `app-review`; run `asc validate --app <APP_ID> --version <VERSION>` for the CLI readiness report. Signing and archive/export: `apple-release`.

## Preconditions
- New build number for each upload
- Encryption compliance resolved (see submission.md)

## Preferred end-to-end commands
- TestFlight: `asc publish testflight --app <APP_ID> --ipa <PATH> --group <GROUP_ID>[,<GROUP_ID>] [--wait] [--notify]`
- App Store: `asc publish appstore --app <APP_ID> --ipa <PATH> --version <VERSION> [--wait] [--submit --confirm]`
- Use `--dry-run` to preview. `asc submit` is lower-level; `asc publish appstore --submit` is the canonical ship path.

## Manual sequence
1. `asc builds upload --app <APP_ID> --ipa <PATH>` (prepares upload only)
2. Find the build: `asc builds info --app <APP_ID> --latest [--version <VERSION>] [--platform <PLATFORM>]`; `asc builds wait --build-id <BUILD_ID>` for processing
3. TestFlight: `asc builds add-groups --build-id <BUILD_ID> --group <GROUP_ID>[,<GROUP_ID>]`
4. App Store attach + submit: `asc review submit --app <APP_ID> --version <VERSION> --build-id <BUILD_ID> --confirm` (wraps attach-build, submissions-create, items-add, submissions-submit)
5. Check/cancel: `asc review status --app <APP_ID>`, `asc review doctor --app <APP_ID>`, `asc submit status|cancel`

## macOS
macOS apps ship as `.pkg`, not `.ipa`:
```bash
asc builds upload --app <APP_ID> --pkg <PATH_TO_PKG> --version <VERSION> --build-number <BUILD_NUMBER> --wait
asc versions attach-build --version-id <VERSION_ID> --build-id <BUILD_ID> --platform MAC_OS
asc review submit --app <APP_ID> --version <VERSION> --build-id <BUILD_ID> --confirm
```
For visionOS/tvOS use `--platform VISION_OS` / `TV_OS`.

## Build cleanup
`asc builds expire-all --app <APP_ID> --older-than 90d --dry-run` first, then `--confirm`.
