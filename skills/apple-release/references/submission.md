# App Store Submission Mechanics

Pre-submission audit (checklist, privacy manifests, common rejections and fixes) lives in the `app-review` skill.

## Table of Contents

1. [App Icons and Screenshots](#1-app-icons-and-screenshots)
2. [App Store Metadata](#2-app-store-metadata)
3. [App Review Gotchas](#3-app-review-gotchas)
4. [Expedited Review Requests](#4-expedited-review-requests)

---

## 1. App Icons and Screenshots

### App Icon Requirements

| Platform | Size (px) | Notes |
|----------|----------|-------|
| iOS | 1024x1024 | Single image, Xcode generates all sizes |
| macOS | 1024x1024 | Must include macOS-style rounded rect and depth |
| watchOS | 1024x1024 | Circular crop applied automatically |
| App Store | 1024x1024 | Used in App Store listing |

- No alpha channel / transparency
- No rounded corners (system applies them)
- sRGB or Display P3 color space
- PNG format

### Screenshot Requirements (iOS)

Only two screenshot sets are mandatory now. Apple automatically scales for smaller device sizes.

| Device | Required | Size (portrait) | Size (landscape) |
|--------|----------|-----------------|------------------|
| 6.9" (iPhone 16 Pro Max) | **Yes (mandatory)** | 1320x2868 | 2868x1320 |
| 6.7" (iPhone 15 Pro Max) | Optional (auto-scaled from 6.9") | 1290x2796 | 2796x1290 |
| 6.5" (iPhone 14 Plus) | Optional (auto-scaled) | 1284x2778 | 2778x1284 |
| 5.5" (iPhone 8 Plus) | Optional (auto-scaled) | 1242x2208 | 2208x1242 |
| iPad 13" | **Yes (mandatory for iPad apps)** | 2064x2752 | 2752x2064 |
| iPad 11" | Optional (auto-scaled from 13") | 1668x2388 | 2388x1668 |

- Minimum 2, maximum 10 screenshots per device size
- Provide the 6.9" iPhone and 13" iPad sets; smaller sizes are auto-generated
- No device bezels required (App Store Connect adds them)

### Screenshot Requirements (macOS)

| Size | Notes |
|------|-------|
| 1280x800 minimum | At least one required |
| 2880x1800 maximum | Retina preferred |

Up to 10 screenshots. Show the app in use, not just the icon.


---

## 2. App Store Metadata

### Required Fields

| Field | Limit | Notes |
|-------|-------|-------|
| App Name | 30 chars | Unique on the App Store |
| Subtitle | 30 chars | Shown below the name |
| Description | 4000 chars | First 3 lines visible without "more" |
| Keywords | 100 chars | Comma-separated, no spaces after commas |
| What's New | 4000 chars | Release notes for this version |
| Support URL | Required | Must be a working URL |
| Privacy Policy URL | Required | Must be a working URL |
| Category | Primary + optional secondary | Choose carefully, affects discoverability |

- **Keywords**: Don't repeat the app name (already indexed) or use competitor names; no spaces after commas.

### Localization

- Use `fastlane deliver` to manage localized metadata in files:

```
fastlane/metadata/
  en-US/
    name.txt
    subtitle.txt
    description.txt
    keywords.txt
    release_notes.txt
  ja/
    name.txt
    ...
```

---

## 3. App Review Gotchas

### Demo Accounts

If your app requires login, provide credentials in the **App Review Information** section:
- Use a stable test account (not a production account)
- Pre-populate the account with meaningful data
- If 2FA is required, provide instructions or a bypass for review

### Background Capabilities

If your app uses background modes, explain why in the review notes. Apple will reject apps that declare background modes without a clear reason.

### App Extensions

Extensions are reviewed independently. A bug in a widget can block the entire app update.

### Push Notifications

- Must implement `application(_:didRegisterForRemoteNotificationsWithDeviceToken:)`
- Must handle push gracefully (don't crash if permission denied)
- Don't send marketing pushes without user consent

### In-App Purchases

- All IAP products must be submitted for review alongside the app
- Products must work during review (sandbox environment)
- Restore purchases button is **required**
- Subscription apps must clearly show pricing and terms before purchase

### IPv6 Compatibility

Apple's review network is IPv6-only. Apps that hardcode IPv4 addresses or use low-level IPv4-only networking will fail.

```swift
// Wrong
let address = "192.168.1.1"

// Right — use hostnames
let url = URL(string: "https://api.example.com/endpoint")!
```

---

## 4. Expedited Review Requests

### When to Request

Apple allows expedited reviews for:
- **Critical bug fixes** (crashes affecting many users, security vulnerabilities)
- **Time-sensitive events** (holiday tie-in, legal compliance deadline)

Do **not** request expedited review for feature launches, marketing deadlines, or minor improvements.

### How to Request

1. Submit the app for review normally
2. Go to [developer.apple.com/contact/app-store](https://developer.apple.com/contact/app-store/)
3. Select "Request an Expedited App Review"
4. Explain the urgency clearly and specifically
5. Include evidence (crash reports, affected user counts, legal deadline documentation)

### Tips

- Be honest and specific about the impact
- Apple tracks your history — frequent requests reduce credibility
- Normal review times are typically 24-48 hours; expedited can be same-day
- You can request expedited review for an app already in review (it won't reset your place in queue)
- If rejected on expedited review, fix the issue and request expedited again with an explanation
