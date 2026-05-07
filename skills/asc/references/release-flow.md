# Release Flow (TestFlight and App Store)

## Preconditions
- New build number for each upload
- Build must have encryption compliance resolved (see submission.md)

## iOS Release

### Preferred end-to-end commands
- TestFlight:
  - `asc publish testflight --app <APP_ID> --ipa <PATH> --group <GROUP_ID>[,<GROUP_ID>]`
  - Optional: `--wait`, `--notify`, `--platform`, `--poll-interval`, `--timeout`
- App Store:
  - `asc publish appstore --app <APP_ID> --ipa <PATH> --version <VERSION>`
  - Optional: `--wait`, `--submit --confirm`, `--platform`, `--poll-interval`, `--timeout`

### Manual sequence (when you need more control)
1. Upload the build:
   - `asc builds upload --app <APP_ID> --ipa <PATH>`
2. Find the build ID if needed:
   - `asc builds latest --app <APP_ID> [--version <VERSION>] [--platform <PLATFORM>]`
3. TestFlight distribution:
   - `asc builds add-groups --build <BUILD_ID> --group <GROUP_ID>[,<GROUP_ID>]`
4. App Store attach + submit:
   - `asc versions attach-build --version-id <VERSION_ID> --build <BUILD_ID>`
   - `asc submit create --app <APP_ID> --version <VERSION> --build <BUILD_ID> --confirm`
5. Check or cancel submission:
   - `asc submit status --id <SUBMISSION_ID>` or `--version-id <VERSION_ID>`
   - `asc submit cancel --id <SUBMISSION_ID> --confirm`

## macOS Release

macOS apps are distributed as `.pkg` files, not `.ipa`.

### Upload PKG
```bash
asc builds upload \
  --app <APP_ID> \
  --pkg <PATH_TO_PKG> \
  --version <VERSION> \
  --build-number <BUILD_NUMBER> \
  --wait
```

### Attach and Submit
Same as iOS, but use `--platform MAC_OS`:
```bash
asc builds list --app <APP_ID> --platform MAC_OS --limit 5
asc versions attach-build --version-id <VERSION_ID> --build <BUILD_ID>
asc review submissions-create --app <APP_ID> --platform MAC_OS
asc review items-add --submission <SUBMISSION_ID> --item-type appStoreVersions --item-id <VERSION_ID>
asc review submissions-submit --id <SUBMISSION_ID> --confirm
```

## visionOS / tvOS Release

Same as iOS flow, use appropriate `--platform`: `VISION_OS`, `TV_OS`.

## Pre-submission Checklist
- [ ] Build status is `VALID` (not processing)
- [ ] Encryption compliance resolved
- [ ] Content rights declaration set
- [ ] Copyright field populated
- [ ] All localizations complete
- [ ] Screenshots present

See submission.md for detailed preflight checks.
