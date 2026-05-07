# App Store Submission & Review

## Table of Contents

1. [Privacy Manifests](#1-privacy-manifests)
2. [App Icons and Screenshots](#2-app-icons-and-screenshots)
3. [App Store Metadata](#3-app-store-metadata)
4. [Common Rejection Reasons](#4-common-rejection-reasons)
5. [App Review Gotchas](#5-app-review-gotchas)
6. [Pre-Submission Checklist](#6-pre-submission-checklist)
7. [Expedited Review Requests](#7-expedited-review-requests)

---

## 1. Privacy Manifests

Starting spring 2024, Apple requires a **PrivacyInfo.xcprivacy** file declaring your app's data collection and API usage. Apps and third-party SDKs without this will generate warnings and eventually be rejected.

### File Location

- Main app: `MyApp/PrivacyInfo.xcprivacy`
- Frameworks/SDKs: Inside the framework bundle
- Add to the target's **Copy Bundle Resources** build phase

### Required API Declarations

If your app or any dependency uses these APIs, you must declare the reason:

| API Category | Examples | Reason Codes |
|-------------|----------|--------------|
| File timestamp APIs | `NSFileCreationDate`, `NSFileModificationDate`, `stat.st_mtime` | `DDA9.1`, `C617.1`, `3B52.1` |
| System boot time | `systemUptime`, `mach_absolute_time` | `35F9.1`, `8FFB.1` |
| Disk space APIs | `volumeAvailableCapacityKey`, `statfs` | `E174.1`, `85F4.1` |
| User defaults | `UserDefaults` (accessing other app's defaults) | `1C8F.1`, `C56D.1` |
| Active keyboard APIs | `activeInputModes` | `3EC4.1`, `54BD.1` |

### PrivacyInfo.xcprivacy Template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Privacy Nutrition Label: data collected by the app -->
    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeEmailAddress</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
    </array>

    <!-- Tracking: does the app track users? -->
    <key>NSPrivacyTracking</key>
    <false/>

    <!-- Required reason APIs used -->
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>DDA9.1</string>
            </array>
        </dict>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategorySystemBootTime</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>35F9.1</string>
            </array>
        </dict>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>1C8F.1</string>
            </array>
        </dict>
    </array>

    <!-- Tracking domains (if NSPrivacyTracking is true) -->
    <key>NSPrivacyTrackingDomains</key>
    <array/>
</dict>
</plist>
```

### Third-Party SDK Privacy Manifests

SDKs listed on Apple's "third-party SDK list" must include their own privacy manifest and be signed. Check your dependencies:

```bash
# After archiving, inspect PrivacyInfo.xcprivacy files directly in the archive:
find MyApp.xcarchive -name "PrivacyInfo.xcprivacy" -exec echo "=== {} ===" \; -exec plutil -p {} \;

# The Xcode Organizer generates a consolidated privacy report before upload:
# Organizer > Archives > select archive > Distribute App > Generate Privacy Report
```

---

## 2. App Icons and Screenshots

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

### Automating Screenshots

```bash
# Fastlane snapshot (iOS)
fastlane snapshot --scheme "UITests" --devices "iPhone 16 Pro Max"

# Manual: Xcode UI tests + XCTAttachment
```

```swift
// In UI tests
let screenshot = XCUIScreen.main.screenshot()
let attachment = XCTAttachment(screenshot: screenshot)
attachment.lifetime = .keepAlways
add(attachment)
```

---

## 3. App Store Metadata

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

### Metadata Best Practices

- **Keywords**: Don't repeat the app name (it's already indexed). Don't use competitor names. Use singular forms. Separate with commas, no spaces.
- **Description**: Lead with the value proposition. First 3 lines are critical. Use short paragraphs. Don't stuff keywords.
- **What's New**: Be specific about changes. Users read this to decide whether to update.
- **Screenshots**: Show the app doing something valuable. Add contextual text overlays. First screenshot is most important.

### Localization

- Localize at minimum: name, subtitle, description, keywords, screenshots
- Languages with the highest ROI: English, Japanese, Chinese (Simplified), Korean, German, French, Spanish
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

## 4. Common Rejection Reasons

### Guideline 4.3 — Spam / Copycat

**What triggers it**: App is too similar to existing apps (including your own), thin wrapper around a website, template app with minimal customization.

**How to avoid**:
- Ensure unique value proposition and UI
- Don't submit multiple apps that do the same thing
- WebView-only apps will be rejected — add native functionality
- If building multiple apps from a template, differentiate substantially

### Guideline 2.1 — Performance: App Completeness

**What triggers it**: Crashes, broken features, placeholder content, missing functionality described in metadata.

**How to avoid**:
- Test on actual devices, not just simulators
- Test with no network / slow network
- Remove all placeholder content and test accounts
- If features require login, provide a demo account in App Review notes
- Test on the oldest supported iOS/macOS version

### Guideline 5.1.1 — Data Collection and Storage

**What triggers it**: Collecting data without purpose strings, no privacy policy, requesting unnecessary permissions, tracking without ATT consent.

**How to avoid**:
- Add `NSUsageDescription` strings for every permission (camera, location, contacts, etc.)
- Provide a privacy policy URL (required)
- Only request permissions when the user triggers a feature that needs them
- Implement App Tracking Transparency if you track across apps:

```swift
import AppTrackingTransparency

func requestTrackingPermission() {
    ATTrackingManager.requestTrackingAuthorization { status in
        switch status {
        case .authorized: // Can track
        case .denied, .restricted: // Cannot track
        case .notDetermined: break
        @unknown default: break
        }
    }
}
```

### Guideline 2.5.1 — Software Requirements

**What triggers it**: Using private APIs, deprecated APIs flagged by Apple, linking against private frameworks.

**How to avoid**:
- Never use private APIs (methods prefixed with `_`, undocumented frameworks)
- Run `nm` or `otool` on your binary to check for private symbol references
- Remove any jailbreak detection that uses private APIs
- Keep Xcode and SDKs up to date

### Guideline 4.2 — Minimum Functionality

**What triggers it**: App is too simple — a single screen, no meaningful interaction, could be a website.

**How to avoid**:
- Ensure the app provides a genuine native experience
- Include enough features to justify being a standalone app
- Don't just wrap an RSS feed or a single web page

### Other Common Rejections

| Guideline | Issue | Fix |
|-----------|-------|-----|
| 1.2 | User-generated content without moderation | Add reporting and blocking |
| 2.3.3 | Screenshots don't match actual app | Update screenshots |
| 3.1.1 | In-app purchase for physical goods | Use Apple Pay, not IAP |
| 3.1.1 | Not using Apple's IAP for digital content | Must use StoreKit |
| 4.0 | App name includes "free", price, or platform | Remove from name |
| 5.1.2 | No way to delete account | Add account deletion |
| 5.6.1 | App Store review manipulation | Don't gate features behind reviews |

---

## 5. App Review Gotchas

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

### Minimum OS Version

Apps must run correctly on all iOS versions they claim to support. Don't declare iOS 16 support if you only test on iOS 18.

### IPv6 Compatibility

Apple's review network is IPv6-only. Apps that hardcode IPv4 addresses or use low-level IPv4-only networking will fail.

```swift
// Wrong
let address = "192.168.1.1"

// Right — use hostnames
let url = URL(string: "https://api.example.com/endpoint")!
```

---

## 6. Pre-Submission Checklist

### Build Verification

- [ ] App runs on the oldest supported OS version
- [ ] App runs on all supported device sizes (iPhone SE, iPad, etc.)
- [ ] No crashes on launch, during navigation, or on rotation
- [ ] All features described in metadata are functional
- [ ] No placeholder content, lorem ipsum, or test data
- [ ] Build number is incremented from the last upload
- [ ] Archive built with Release configuration, not Debug

### Signing and Entitlements

- [ ] Signed with distribution certificate (not development)
- [ ] Provisioning profile is valid and not expired
- [ ] Entitlements match App ID capabilities
- [ ] Hardened Runtime enabled (macOS)
- [ ] Notarization completed (macOS Developer ID)

### Privacy and Permissions

- [ ] `PrivacyInfo.xcprivacy` included with required API reasons
- [ ] All `NSUsageDescription` keys have meaningful descriptions
- [ ] Privacy policy URL is set and accessible
- [ ] App Tracking Transparency prompt shown before tracking (if applicable)
- [ ] Account deletion available (if account creation exists)

### Metadata

- [ ] App name is unique and within 30 characters
- [ ] Description accurately reflects current functionality
- [ ] Screenshots match the current app version
- [ ] Screenshots provided for all required device sizes
- [ ] App icon is 1024x1024, no transparency, PNG
- [ ] Support URL works and is relevant
- [ ] Category is appropriate
- [ ] What's New text is updated for this version

### App Store Connect

- [ ] App record exists with correct bundle ID
- [ ] Pricing and availability configured
- [ ] Age rating questionnaire completed
- [ ] Review notes include any necessary instructions or demo credentials
- [ ] IAP products submitted and approved (if applicable)
- [ ] Content rights verified (if app contains third-party content)

### macOS-Specific

- [ ] Sandbox entitlements minimal and justified
- [ ] App runs correctly in sandboxed mode
- [ ] Menu bar menus work (File, Edit, Window, Help at minimum)
- [ ] Drag and drop works where expected
- [ ] Keyboard shortcuts follow platform conventions

### Final Steps

- [ ] Generate privacy report in Xcode Organizer (Distribute > Generate Privacy Report)
- [ ] Validate app in Organizer before uploading
- [ ] Upload and wait for processing (usually 15-30 minutes)
- [ ] Select build in App Store Connect version
- [ ] Submit for review

---

## 7. Expedited Review Requests

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
