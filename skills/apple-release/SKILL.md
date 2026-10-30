---
name: apple-release
description: Sign, archive, notarize, package, and upload iOS/macOS apps, and diagnose code signing, entitlements, Hardened Runtime, Gatekeeper, and notarization failures. Use for certificates and profiles, xcodebuild archive/export, notarytool, DMG/pkg, Sparkle, Fastlane, CI, and TestFlight/App Store upload. For pre-submission review audits use app-review.
---

# Apple Release & Distribution

## Diagnosing Signing and Notarization Failures

Inspect the artifact first (the `.app` or exported bundle; main binary is in `Contents/MacOS/`):

```bash
codesign -dvvv --entitlements :- <app-or-binary>
spctl -a -vv <app-or-binary>      # Gatekeeper
plutil -p <Info.plist or entitlements>
```

Classify: unsigned/ad hoc, wrong identity, entitlement mismatch, Hardened Runtime, App Sandbox, nested code signature, or a distribution prerequisite. Give the minimum fix, and separate local-debug problems from distribution-only ones.

- Never invent entitlements. If the cause is a build setting or provisioning profile, say so.
- Notarization is not required for local debug runs.
- If you lack the exported artifact and are inferring from project settings, say so.

## References

### `references/signing.md`

Certificates, provisioning profiles, automatic vs manual signing, entitlements, Hardened Runtime, embedded-binary signing order, CI keychain, common signing errors.

### `references/distribution.md`

App Store Connect/TestFlight upload, xcodebuild archive and exportArchive, notarytool, Developer ID, DMG/pkg, Sparkle, Fastlane match, GitHub Actions (macOS), API key auth, Xcode Cloud.

### `references/submission.md`

Submission mechanics: icon and screenshot specs, metadata fields, review-notes gotchas (demo accounts, background modes, extensions, IAP, IPv6), expedited review requests. For the pre-submission audit, privacy manifests, and rejection fixes use the `app-review` skill.
