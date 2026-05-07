---
name: apple-release
description: Release and distribute Apple apps. Covers code signing (certificates, provisioning profiles, entitlements, Hardened Runtime, CI keychain), distribution (App Store, TestFlight, xcodebuild archive/export, notarization, DMG/installer creation, Sparkle updates, Fastlane, GitHub Actions CI/CD), and App Store submission (privacy manifests, metadata, review guidelines, common rejections, submission checklist). Use when signing, archiving, uploading, notarizing, or submitting iOS/macOS apps.
---

# Apple Release & Distribution

## Core Principles

- Automate everything: manual signing and uploading breaks in CI and across teams.
- Keep certificates and profiles in a single source of truth (Fastlane match or Xcode Cloud).
- Test the exact artifact you ship — archive once, distribute the same binary to TestFlight and production.
- Notarize every macOS build distributed outside the App Store.
- Submit early and often — shorter review cycles catch rejection issues faster.

## References

Read the relevant reference based on the task:

### `references/signing.md`

Read when setting up code signing, managing certificates and provisioning profiles, configuring entitlements, enabling Hardened Runtime, fixing signing errors, or setting up keychain access in CI.

Covers: certificates (development, distribution, Developer ID), provisioning profiles, App IDs, automatic vs manual signing, capabilities and entitlements, Hardened Runtime (macOS), keychain management for CI, team management, common signing errors and fixes.

### `references/distribution.md`

Read when archiving builds, uploading to App Store Connect or TestFlight, creating DMGs or installer packages, setting up notarization, configuring Sparkle auto-updates, or automating builds with Fastlane or GitHub Actions.

Covers: App Store Connect overview, TestFlight (internal vs external, beta groups), xcodebuild archive and exportArchive, notarytool notarization, Developer ID distribution, DMG and installer creation, Sparkle framework, Fastlane (match, deliver, pilot), GitHub Actions CI/CD patterns, App Store Connect API key authentication, Xcode Cloud.

### `references/submission.md`

Read when preparing an app for App Store review, creating privacy manifests, gathering metadata and screenshots, or diagnosing a rejection.

Covers: privacy manifests (PrivacyInfo.xcprivacy), required API declarations, app icons and screenshots, metadata best practices, common rejection reasons (4.3, 2.1, 5.1.1, 2.5.1, 4.2), App Review gotchas, pre-submission checklist, expedited review requests.
