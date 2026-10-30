# Pre-Submission Audit Checklist

Work through each category in order. For every item, inspect the actual project files and report PASS / FAIL / WARNING / N/A. Each item gives what to check, then the fix.

---

## 1. Privacy & Data Collection (Guideline 5.1)

### 1.1 PrivacyInfo.xcprivacy exists
Search for `PrivacyInfo.xcprivacy`; confirm it is in the app target's Copy Bundle Resources. Fix: Xcode File > New > App Privacy template (keys: `NSPrivacyCollectedDataTypes`, `NSPrivacyTracking`, `NSPrivacyAccessedAPITypes`, `NSPrivacyTrackingDomains`).

### 1.2 Required-reason API declarations
Search app code and dependencies for these APIs; each used category needs an `NSPrivacyAccessedAPITypes` entry with a reason code:

- File timestamps (`NSFileCreationDate`, `NSFileModificationDate`, `st_mtime`, `getattrlist`, `stat(`, `fstat(`): `DDA9.1` (show to user), `C617.1` (app container), `3B52.1` (user-granted files)
- System boot time (`systemUptime`, `mach_absolute_time`): `35F9.1` (elapsed time), `8FFB.1` (timer)
- Disk space (`volumeAvailableCapacity*Key`, `volumeTotalCapacityKey`, `statfs`, `statvfs`): `E174.1` (write/download decisions), `85F4.1` (show to user)
- User defaults (`UserDefaults`): `CA92.1` (app's own defaults), `1C8F.1` (app group), `C56D.1` (third-party SDK)
- Active keyboard (`activeInputModes`): `3EC4.1`, `54BD.1`

### 1.3 Usage description strings for used permissions
For each API found in code, the Info.plist key must exist; a missing key crashes at request time (2.1 and 5.1.1 rejection). Strings must state the purpose.

| Code | Key |
|------|-----|
| `AVCaptureDevice`, camera `UIImagePickerController` | `NSCameraUsageDescription` |
| `PHPhotoLibrary`, `.photoLibrary` | `NSPhotoLibraryUsageDescription` |
| `performChanges`, `UIImageWriteToSavedPhotosAlbum` | `NSPhotoLibraryAddUsageDescription` |
| `CLLocationManager` when-in-use / always | `NSLocationWhenInUseUsageDescription` / `NSLocationAlwaysAndWhenInUseUsageDescription` |
| `AVAudioSession`, `AVAudioRecorder` | `NSMicrophoneUsageDescription` |
| `CNContactStore` | `NSContactsUsageDescription` |
| `EKEventStore` events / reminders | `NSCalendarsUsageDescription` (iOS 17: `NSCalendarsFullAccessUsageDescription`) / `NSRemindersUsageDescription` (iOS 17: `NSRemindersFullAccessUsageDescription`) |
| `HKHealthStore` | `NSHealthShareUsageDescription`, `NSHealthUpdateUsageDescription` |
| `CMMotionManager`, `CMPedometer` | `NSMotionUsageDescription` |
| `ATTrackingManager` | `NSUserTrackingUsageDescription` |
| `CBCentralManager`, `CBPeripheralManager` | `NSBluetoothAlwaysUsageDescription` |
| `NWBrowser`, Bonjour | `NSLocalNetworkUsageDescription` |
| `LAContext` biometry | `NSFaceIDUsageDescription` |
| `SFSpeechRecognizer` | `NSSpeechRecognitionUsageDescription` |

### 1.4 No unused permission strings
Every `NS...UsageDescription` key must have matching framework use. Remove unused keys (looks like data harvesting).

### 1.5 App Tracking Transparency
If `ASIdentifierManager`/`advertisingIdentifier` or an IDFA-reading SDK (AdMob, Facebook, Adjust, AppsFlyer, Branch) is present: `ATTrackingManager.requestTrackingAuthorization` must run before any identifier access, at a sensible moment (not first launch), `NSUserTrackingUsageDescription` set, and no IDFA access when denied.

### 1.6 Data collection declarations match code
Find analytics/crash SDKs (Firebase, Crashlytics, Amplitude, Mixpanel, Segment, Sentry, Bugsnag, custom endpoints); `NSPrivacyCollectedDataTypes` must declare their data types, purposes, linked and tracking flags. Also check the privacy policy URL is set.

### 1.7 Third-party SDK privacy manifests
Apple's required-SDK list (Alamofire, Firebase, Facebook SDK, Google Sign-In, SDWebImage, Kingfisher, ...) must ship their own manifest and signature. Check `Pods/`/`.build/`, or inspect the archive:

```bash
find MyApp.xcarchive -name "PrivacyInfo.xcprivacy" -exec echo "=== {} ===" \; -exec plutil -p {} \;
```

Organizer > Archives > Distribute App > Generate Privacy Report gives a consolidated report. Fix outdated SDKs by updating.

### 1.8 Account deletion
If the app supports account creation, in-app account deletion must exist (5.1.1(v)).

---

## 2. Sign in with Apple (Guideline 4.8)

### 2.1 Offered if third-party/social login exists
Search for `GoogleSignIn`/`GIDSignIn`, `FBSDKLoginKit`, `ASWebAuthenticationSession` OAuth flows, `FirebaseAuth` social providers. If any, `ASAuthorizationAppleIDProvider` / `SignInWithAppleButton` must be present. Not triggered by purely first-party email/password, or by organization-managed enterprise SSO; if flagged for those, explain in review notes.

### 2.2 Equal prominence
Apple button must be on the same screen and the same size as other login buttons.

---

## 3. In-App Purchases (Guideline 3.1)

### 3.1 Digital content uses StoreKit
Search for `Stripe`/`PaymentSheet`, `PayPal`/`Braintree`, processor API calls (RevenueCat wraps StoreKit and is fine). Digital goods/features/subscriptions consumed in-app must use StoreKit; external processors only for physical goods or services consumed outside the app.

### 3.2 No external payment links for digital goods
Search `openURL`/links near "subscribe", "upgrade", "premium". Only the narrow reader-app entitlement is exempt.

### 3.3 Restore Purchases exists
Required for non-consumables and subscriptions: UI button wired to `AppStore.sync()` / `Transaction.currentEntitlements` (SK2) or `restoreCompletedTransactions()` (SK1).

### 3.4 Subscription terms displayed before purchase
Price, renewal period, trial length and post-trial behavior, and links to Terms and Privacy Policy (3.1.2). `SubscriptionStoreView` (iOS 17+) handles this.

### 3.5 No other-platform pricing references
Search strings for "Android", "Google Play", "web price".

---

## 4. App Completeness (Guideline 2.1)

### 4.1 No placeholder text
Search strings, `.strings`/`.xcstrings`, SwiftUI views for "Lorem", "placeholder", "TODO", "FIXME", "TBD", and user-visible "test"/"sample"/"dummy".

### 4.2 No "Coming soon" features
Disabled or non-functional UI sections, "In development" labels: complete or remove.

### 4.3 No dead ends
Empty button actions, nav links to `EmptyView`, support/privacy/terms URLs that 404.

### 4.4 No debug UI in production
Check `#if DEBUG` wrapping, `#if targetEnvironment(simulator)`, `isTestMode`/`debugMode` flags, hidden debug gestures/menus, and that Release config does not define `DEBUG`.

### 4.5 No hardcoded test credentials
Search `"test@"`, `"test123"`, `"password"`, `"admin"`, hardcoded keys/tokens, commented-out credentials.

### 4.6 No TestFlight/beta references
Search user-visible strings for "beta", "TestFlight", "test build", "internal build".

### 4.7 No launch-path crashes
Trace `@main`, initial view, launch-time `init()`s for force unwraps, `try!`, `fatalError`, `preconditionFailure`.

---

## 5. Minimum Functionality (Guideline 4.2 / 4.3)

### 5.1 Not a web wrapper
Is the app a single `WKWebView`/`WebView` pointing at a URL with no native screens? If so add real native functionality (offline, push, device features).

### 5.2 Meaningful functionality
Single-screen or bookmark-equivalent apps fail 4.2. Also check the app is not a template clone or near-duplicate of the developer's other apps (4.3).

---

## 6. Content and Legal (Guidelines 1.x, 5.x)

### 6.1 Terms and Privacy Policy accessible
Links in Settings/About, not `example.com`/localhost, not 404. Privacy policy URL required; Terms required for accounts/subscriptions.

### 6.2 UGC has reporting and blocking (1.2)
If users post content visible to others: report content, block user, and a way to remove objectionable content. A context menu sending a report to the server suffices.

### 6.3 Age rating matches content
Compare profanity, violence, gambling, alcohol/drugs, sexual content, horror against the App Store Connect questionnaire. Unrestricted web access/UGC typically means 17+.

### 6.4 No unlicensed material (5.2)
Stock photos, fonts, icon packs, third-party logos/trademarks.

---

## 7. UI and Design Quality (Guideline 4.x)

### 7.1 App icon
`AppIcon.appiconset/Contents.json` has a 1024x1024 PNG with no alpha. macOS icons follow the macOS rounded-rect style.

### 7.2 Launch screen (iOS)
`UILaunchScreen`/`UILaunchStoryboardName` configured; static `UILaunchImages` not accepted on iOS 14+.

### 7.3 Screen sizes
Hardcoded frames or `UIScreen.main.bounds` values that break on iPhone SE / Pro Max / iPad.

### 7.4 Dark Mode
Hardcoded `.black`/`.white`/hex colors that become invisible in Dark Mode (2.1 unusable) instead of semantic or asset-catalog colors.

### 7.5 Dynamic Type
Fixed `Font.system(size:)` / `systemFont(ofSize:)` for primary content, fixed-height text containers; prefer text styles and `@ScaledMetric`.

### 7.6 Safe area
Broad `.ignoresSafeArea()` over interactive content; constraints pinned to superview instead of safe area.

### 7.7 iPad for universal apps
`TARGETED_DEVICE_FAMILY = 1,2` must have a real iPad layout (not stretched iPhone); otherwise drop iPad.

---

## 8. Network and Performance

### 8.1 Offline handling
Network code handles `URLError.notConnectedToInternet`/`networkConnectionLost` with error or empty states, never a blank screen or crash.

### 8.2 Slow/failed requests
Loading states, `URLSession` timeouts, 4xx/5xx handling with user-facing messages and retry.

### 8.3 ATS
No `http://` URLs without a per-domain `NSExceptionDomains` entry.

### 8.4 No broad ATS exceptions
`NSAllowsArbitraryLoads = true` needs justification; use `NSAllowsArbitraryLoadsInWebContent` for web views or per-domain exceptions.

---

## 9. Technical Requirements (Guideline 2.5)

### 9.1 No private API usage
Detected by automated scanning at upload. Search source and dependencies:

```bash
grep -rn "dlopen\|dlsym\|objc_msgSend\|NSSelectorFromString\|performSelector" --include="*.swift" --include="*.m" .
grep -rn "UIWebView" --include="*.swift" --include="*.m" --include="*.xib" --include="*.storyboard" .
nm -u YourApp.app/YourApp | grep "_OBJC_CLASS_\$_.*_"
for f in YourApp.app/Frameworks/*.framework; do nm -u "$f/$(basename "$f" .framework)" 2>/dev/null | grep "_OBJC_CLASS_\$__"; done
```

Also look for KVC on private keys (e.g. `value(forKey: "statusBarFrame")`). If an SDK is the cause, update it; if a flagged symbol is your own underscore-named code, say so in the reply.

### 9.2 UIRequiredDeviceCapabilities
Only capabilities the app cannot run without (watch `armv7`, `metal`, `nfc`); handle optional hardware gracefully instead.

### 9.3 Deployment target
Matches what is actually tested; newer APIs behind `#available`.

### 9.4 Entitlements match capabilities
`.entitlements` vs App ID capabilities and Xcode target: no missing, no leftover entitlements from removed features.

### 9.5 No manually embedded provisioning profiles
Distribution should use the right profile or automatic signing, not stray `.mobileprovision` files.

### 9.6 IPv6
Review network is IPv6-only: no hardcoded IPv4 addresses or IPv4-only networking.

---

## 10. Metadata Readiness

### 10.1 Screenshots match current UI (2.3.3)
Compare fastlane/project screenshots with the current UI: outdated navigation, removed features, redesigned elements.

### 10.2 Description accuracy
Check `fastlane/metadata/` for nonexistent features, other-platform mentions, unverifiable claims.

### 10.3 No competitor names in keywords (2.3.7)
Check `keywords.txt`/App Store Connect keywords; also no "free", price, or platform in the app name (4.0).

### 10.4 Support URL works
Not a placeholder; reaches a real page.

### 10.5 Demo account ready
If login is required: stable preloaded test account, tested credentials in review notes, and a 2FA bypass or instructions. If background modes are declared, explain why in review notes.

---

## 11. macOS-Specific (if applicable)

Skip for iOS-only apps.

### 11.1 Hardened Runtime
`ENABLE_HARDENED_RUNTIME = YES` with minimal exceptions in `.entitlements`.

### 11.2 Notarization (Developer ID builds)
`notarytool` in the pipeline or Organizer notarize-on-export; otherwise Gatekeeper blocks the app. See `apple-release`.

### 11.3 Sandbox entitlements (2.4.5)
Mac App Store requires `com.apple.security.app-sandbox = true`; only needed entitlements, no leftovers.

### 11.4 Standard menus and shortcuts
Cmd+Q, Cmd+W, Edit menu (Undo/Redo/Cut/Copy/Paste/Select All), Help menu.

### 11.5 Window resizing
Resizable unless fixed size is justified; sensible minimum size; content adapts; full screen works if supported.

---

## 12. Rejection Response Tips

- If a crash is not reproducible, ask for the reviewer's device model, OS version, and crash log; attach a screen recording and your deployment target.
- When appealing 4.8 or 2.5.1 false positives, state specifically why the guideline does not apply (organization-managed SSO, first-party auth, own-code symbol, fixed SDK version and new build number).
