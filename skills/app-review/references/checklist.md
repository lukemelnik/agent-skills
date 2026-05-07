# Pre-Submission Audit Checklist

Work through each category in order. For every item, inspect the actual project files and report PASS / FAIL / WARNING / N/A.

---

## 1. Privacy & Data Collection (Guideline 5.1)

### 1.1 PrivacyInfo.xcprivacy Exists

**What to check**: Search for `PrivacyInfo.xcprivacy` in the project. Verify it is included in the main app target's "Copy Bundle Resources" build phase.

**Why it matters**: Guideline 5.1 / Apple privacy manifest requirement (enforced since spring 2024). Apps without this file will be rejected.

**How to fix**: Create `PrivacyInfo.xcprivacy` in the app target directory. Add it to the target's Copy Bundle Resources phase. Use Xcode's File > New > File > App Privacy template, or create the plist manually with keys: `NSPrivacyCollectedDataTypes`, `NSPrivacyTracking`, `NSPrivacyAccessedAPITypes`, `NSPrivacyTrackingDomains`.

### 1.2 Required API Reason Declarations

**What to check**: Search the codebase (including dependencies) for usage of required-reason APIs:

- **File timestamp APIs**: `NSFileCreationDate`, `NSFileModificationDate`, `st_mtime`, `st_ctime`, `getattrlist`, `getattrlistbulk`, `stat(`, `fstat(`
- **System boot time**: `systemUptime`, `mach_absolute_time`, `ProcessInfo.processInfo.systemUptime`
- **Disk space APIs**: `volumeAvailableCapacityKey`, `volumeAvailableCapacityForImportantUsageKey`, `volumeAvailableCapacityForOpportunisticUsageKey`, `volumeTotalCapacityKey`, `statfs`, `statvfs`
- **User defaults**: `UserDefaults` (specifically accessing another app's defaults via suite name or `init(suiteName:)` with a non-app-group suite)
- **Active keyboard**: `activeInputModes`

Then verify each used API has a corresponding entry in `NSPrivacyAccessedAPITypes` with appropriate reason codes.

**Why it matters**: Guideline 5.1. Apple rejects apps that use required-reason APIs without declaring why.

**How to fix**: Add each API category used to the `NSPrivacyAccessedAPITypes` array in `PrivacyInfo.xcprivacy` with the appropriate reason code. Common reason codes:
- File timestamps: `DDA9.1` (display to user), `C617.1` (within app container), `3B52.1` (file management)
- System boot time: `35F9.1` (elapsed time), `8FFB.1` (timer calculation)
- Disk space: `E174.1` (write/download decisions), `85F4.1` (display to user)
- User defaults: `1C8F.1` (access app's own defaults), `C56D.1` (third-party SDK)

### 1.3 NSUsageDescription Strings for All Used Permissions

**What to check**: Search source code for each permission framework/API and verify a corresponding `NSUsageDescription` key exists in Info.plist:

| Permission | Code to search for | Info.plist key |
|-----------|-------------------|----------------|
| Camera | `AVCaptureDevice`, `UIImagePickerController` (sourceType: .camera), `.camera` | `NSCameraUsageDescription` |
| Photo Library | `PHPhotoLibrary`, `UIImagePickerController`, `.photoLibrary` | `NSPhotoLibraryUsageDescription` |
| Photo Library Add | `PHPhotoLibrary.shared().performChanges`, `UIImageWriteToSavedPhotosAlbum` | `NSPhotoLibraryAddUsageDescription` |
| Location (in use) | `CLLocationManager`, `requestWhenInUseAuthorization` | `NSLocationWhenInUseUsageDescription` |
| Location (always) | `requestAlwaysAuthorization` | `NSLocationAlwaysAndWhenInUseUsageDescription` |
| Microphone | `AVAudioSession`, `AVAudioRecorder`, `.microphone` | `NSMicrophoneUsageDescription` |
| Contacts | `CNContactStore`, `CNContact` | `NSContactsUsageDescription` |
| Calendar | `EKEventStore`, `EKEvent` | `NSCalendarsUsageDescription` (iOS 17: `NSCalendarsFullAccessUsageDescription`) |
| Reminders | `EKEventStore` (entity type: .reminder) | `NSRemindersUsageDescription` (iOS 17: `NSRemindersFullAccessUsageDescription`) |
| Health | `HKHealthStore` | `NSHealthShareUsageDescription`, `NSHealthUpdateUsageDescription` |
| Motion | `CMMotionManager`, `CMPedometer` | `NSMotionUsageDescription` |
| Tracking | `ATTrackingManager` | `NSUserTrackingUsageDescription` |
| Bluetooth | `CBCentralManager`, `CBPeripheralManager` | `NSBluetoothAlwaysUsageDescription` |
| Local Network | `NWBrowser`, Bonjour | `NSLocalNetworkUsageDescription` |
| Face ID | `LAContext`, `evaluatePolicy` (biometry) | `NSFaceIDUsageDescription` |
| Speech Recognition | `SFSpeechRecognizer` | `NSSpeechRecognitionUsageDescription` |

**Why it matters**: Guideline 5.1.1. Missing usage description strings cause an immediate crash when the permission is requested, which triggers rejection under 2.1 (Performance) and 5.1.1 (Data Collection).

**How to fix**: Add the missing `NS...UsageDescription` key to Info.plist with a human-readable explanation of why the app needs the permission. The string must clearly explain the purpose (e.g., "We need camera access to scan QR codes" not "Camera access needed").

### 1.4 Unused Permission Strings

**What to check**: For every `NS...UsageDescription` key in Info.plist, verify the app actually uses that permission. Search for the corresponding framework imports and API calls.

**Why it matters**: Guideline 5.1.1. Declaring permissions you don't use signals potential data harvesting to Apple reviewers and causes rejection.

**How to fix**: Remove unused `NS...UsageDescription` keys from Info.plist.

### 1.5 App Tracking Transparency

**What to check**: Search for `ASIdentifierManager`, `advertisingIdentifier`, `IDFA`, or analytics SDKs that access the IDFA (AdMob, Facebook SDK, Adjust, AppsFlyer, Branch, etc.). If any are found, verify:
1. `import AppTrackingTransparency` is present
2. `ATTrackingManager.requestTrackingAuthorization` is called BEFORE accessing the identifier
3. `NSUserTrackingUsageDescription` is in Info.plist

**Why it matters**: Guideline 5.1.2. Accessing IDFA without ATT prompt is an automatic rejection.

**How to fix**: Add ATT prompt before any tracking. Call `ATTrackingManager.requestTrackingAuthorization` at an appropriate time (not on app launch — after onboarding or before a feature that requires it). Respect the user's choice — if denied, do not access `advertisingIdentifier`.

### 1.6 Data Collection Declarations Match Code

**What to check**: Search for analytics/crash reporting SDKs:
- Firebase Analytics, Crashlytics
- Amplitude, Mixpanel, Segment
- Sentry, Bugsnag
- Custom analytics endpoints

Verify that `NSPrivacyCollectedDataTypes` in the privacy manifest declares all data types these SDKs collect.

**Why it matters**: Guideline 5.1. Apple cross-references your privacy nutrition labels with known SDK behaviors.

**How to fix**: Update `NSPrivacyCollectedDataTypes` to declare all collected data types, purposes, and whether data is linked to the user or used for tracking.

### 1.7 Third-Party SDK Privacy Manifests

**What to check**: Inspect `Pods/` or `.build/` (SPM) directories for `PrivacyInfo.xcprivacy` files within third-party dependencies. Apple's required SDK list includes: Alamofire, Firebase, Facebook SDK, Google Sign-In, SDWebImage, Kingfisher, and others.

**Why it matters**: Guideline 5.1. Third-party SDKs on Apple's list must include their own privacy manifests. Outdated versions may not have them.

**How to fix**: Update dependencies to their latest versions which include privacy manifests. If a dependency doesn't have one, consider filing an issue with the maintainer or adding one manually.

---

## 2. Sign in with Apple (Guideline 4.8)

### 2.1 Sign in with Apple Offered if Third-Party Login Exists

**What to check**: Search for third-party authentication:
- `GoogleSignIn`, `GIDSignIn`
- `FBSDKLoginKit`, `LoginManager`, `FBLoginButton`
- `ASWebAuthenticationSession` (for OAuth flows)
- Email/password registration forms
- `FirebaseAuth`, `Auth.auth().signIn`

If ANY third-party login is found, verify `AuthenticationServices` is imported and `ASAuthorizationAppleIDProvider` or `SignInWithAppleButton` is used.

**Why it matters**: Guideline 4.8. Any app offering third-party or social login MUST also offer Sign in with Apple as an equivalent option. This is one of the most common rejections.

**How to fix**: Add Sign in with Apple using `AuthenticationServices` framework. Use `ASAuthorizationAppleIDButton` (UIKit) or `SignInWithAppleButton` (SwiftUI). It must be the same size and prominence as other login options.

### 2.2 Sign in with Apple Button Prominence

**What to check**: If Sign in with Apple is present, verify it appears on the same screen as other login options and is the same size. It should not be hidden on a secondary screen or made smaller than Google/Facebook login buttons.

**Why it matters**: Guideline 4.8. Apple requires equal prominence, not just presence.

**How to fix**: Place the Sign in with Apple button alongside other login options with equal styling and sizing.

---

## 3. In-App Purchases (Guideline 3.1)

### 3.1 Digital Content Uses StoreKit

**What to check**: Search for payment SDKs that handle digital content:
- `Stripe`, `STPPaymentContext`, `PaymentSheet`
- `PayPal`, `BraintreeCore`
- `RevenueCat` (OK — this wraps StoreKit)
- Direct API calls to payment processors

Determine what is being sold. If it's digital content, features, or subscriptions consumed within the app, it must use StoreKit/IAP.

**Why it matters**: Guideline 3.1.1. Digital goods and services MUST use Apple's In-App Purchase. External payment for digital content is grounds for rejection.

**How to fix**: Implement StoreKit 2 (`Product`, `Transaction`) for all digital purchases. Stripe/PayPal may only be used for physical goods and services consumed outside the app.

### 3.2 No External Payment Links for Digital Goods

**What to check**: Search for URLs or deep links that direct users to external payment pages for digital content. Look for strings containing "subscribe", "upgrade", "premium" combined with URL schemes or `openURL`.

**Why it matters**: Guideline 3.1.1. Apps cannot direct users to external mechanisms to avoid IAP commissions (the "reader app" entitlement is a narrow exception).

**How to fix**: Remove external payment links for digital goods. Implement all digital purchases through StoreKit.

### 3.3 Restore Purchases Button Exists

**What to check**: Search for "restore" in the UI layer (button titles, labels). Verify there is a restore mechanism calling `Transaction.currentEntitlements` (StoreKit 2) or `SKPaymentQueue.restoreCompletedTransactions()` (StoreKit 1).

**Why it matters**: Guideline 3.1.1. A restore purchases mechanism is required for all apps with non-consumable or subscription IAP.

**How to fix**: Add a "Restore Purchases" button in settings or on the paywall screen. Connect it to `Transaction.currentEntitlements` iteration or `AppStore.sync()`.

### 3.4 Subscription Terms Displayed

**What to check**: If the app has subscriptions, verify that before any purchase flow:
- Price is clearly shown
- Duration/renewal period is visible
- Free trial length is stated (if applicable)
- What happens after trial ends is clear
- Link to Terms of Use and Privacy Policy is accessible

Search for `SubscriptionStoreView` or custom paywall views.

**Why it matters**: Guideline 3.1.2. Subscription terms must be clear before purchase. Misleading or hidden terms cause rejection.

**How to fix**: Display all subscription details prominently on the paywall screen. Use `SubscriptionStoreView` (iOS 17+) which handles this automatically, or add clear labels for each term detail.

### 3.5 No References to Other Store Pricing

**What to check**: Search strings/localizations for references to "Android", "Google Play", "web price", or competitive pricing language.

**Why it matters**: Guideline 3.1.1. Mentioning pricing available on other platforms is not allowed.

**How to fix**: Remove all references to other platforms' pricing or availability.

---

## 4. App Completeness (Guideline 2.1)

### 4.1 No Placeholder or Lorem Ipsum Text

**What to check**: Search all strings, `.strings` files, `.xcstrings` catalogs, and SwiftUI views for:
- `"Lorem ipsum"`, `"Lorem"`
- `"placeholder"`, `"TODO"`, `"FIXME"`, `"HACK"`
- `"test"`, `"sample"`, `"dummy"` (in user-visible strings only)
- `"TBD"`, `"Coming soon"`, `"Under construction"`

**Why it matters**: Guideline 2.1. Placeholder content makes the app appear incomplete.

**How to fix**: Replace all placeholder text with real content.

### 4.2 No "Coming Soon" Features

**What to check**: Search the UI for disabled buttons or sections labeled "Coming Soon", "In development", or "Beta". Check for views that show but don't function.

**Why it matters**: Guideline 2.1. Features visible in the UI must work. Advertising unfinished features causes rejection.

**How to fix**: Either complete the feature or remove it entirely from the UI. Do not ship features that aren't functional.

### 4.3 No Broken Links or Dead-End Navigation

**What to check**: Trace the navigation graph. Look for:
- Buttons with empty actions (`{ }` or `// TODO`)
- Navigation links pointing to `EmptyView` or placeholder destinations
- URLs in the app (support, privacy policy, terms) that might 404

**Why it matters**: Guideline 2.1. Dead ends signal an incomplete app.

**How to fix**: Implement all navigation targets or remove the buttons/links that lead to them.

### 4.4 No Debug UI Visible in Production

**What to check**: Search for:
- `#if DEBUG` blocks that contain UI elements — verify they're properly wrapped
- `#if targetEnvironment(simulator)` exposing test UI
- `isTestMode`, `isDebug`, `debugMode` flags that could expose debug controls
- `print(`, `debugPrint(`, `dump(` in production paths (not a rejection issue, but unprofessional)
- Debug menus, hidden gesture recognizers for debug

**Why it matters**: Guideline 2.1. Debug interfaces confuse reviewers and suggest the app isn't production-ready.

**How to fix**: Ensure all debug UI is wrapped in `#if DEBUG`. Check that the Release build configuration does not define `DEBUG`. Remove or gate all test/debug features.

### 4.5 No Hardcoded Test Credentials

**What to check**: Search for:
- `"test@"`, `"test123"`, `"password"`, `"admin"`
- Hardcoded API keys, tokens, or secrets in source files
- Commented-out credential strings

**Why it matters**: Guideline 2.1. Test credentials in production are a security issue and signal incompleteness.

**How to fix**: Remove all test credentials from source code. Use environment variables, keychain, or server-side configuration for real credentials.

### 4.6 No TestFlight/Beta References

**What to check**: Search for strings like "beta", "TestFlight", "testflight", "test build", "internal build" in user-visible strings and UI.

**Why it matters**: Guideline 2.1. References to TestFlight or beta status in an App Store build suggest it's not ready for production.

**How to fix**: Remove all beta/TestFlight references from user-visible text. Use build configuration to conditionally include these only in non-production builds.

### 4.7 No Force-Unwrap Crashes on Launch Path

**What to check**: Trace the app launch sequence — `@main` App struct, initial view, any `init()` methods called at launch. Search for:
- `!` force unwraps on optionals that could be nil
- `fatalError(`, `preconditionFailure(` in the launch path
- `try!` on operations that could fail (network, file reads, decoding)

**Why it matters**: Guideline 2.1. Crashing on launch is an immediate rejection.

**How to fix**: Replace force unwraps with safe unwrapping (`guard let`, `if let`, nil coalescing). Replace `try!` with proper error handling. Ensure no fatal errors can be triggered on the initial launch path.

---

## 5. Minimum Functionality (Guideline 4.2)

### 5.1 Not a Web Wrapper

**What to check**: Determine the ratio of native UI to web content. Search for:
- `WKWebView`, `WebView`, `UIViewRepresentable` wrapping web views
- Is the entire app a single web view pointing to a URL?
- Does the app have any native screens besides a web view?

**Why it matters**: Guideline 4.2. Apps that are merely repackaged websites with no native functionality will be rejected.

**How to fix**: Add meaningful native features: native navigation, push notifications, offline support, device feature integration (camera, location, etc.).

### 5.2 Meaningful Functionality

**What to check**: Count the number of distinct screens/features. Evaluate whether the app provides value beyond what a bookmark could offer.

**Why it matters**: Guideline 4.2. Single-screen apps with trivial functionality are rejected. The app must justify its existence.

**How to fix**: Ensure the app has multiple meaningful interactions and provides genuine value to the user.

---

## 6. Content and Legal (Guidelines 1.x, 5.x)

### 6.1 Terms of Service and Privacy Policy Accessible

**What to check**: Search for URLs containing "privacy", "terms", "tos", "legal" in the source code. Verify these URLs:
1. Exist in the app (typically in Settings/About screen)
2. Are not hardcoded to `example.com` or localhost
3. Are accessible (not 404)

**Why it matters**: Guideline 5.1.1. A privacy policy URL is required. Terms of Service are required for apps with accounts or subscriptions.

**How to fix**: Add a Settings/About screen with tappable links to Privacy Policy and Terms of Service. Ensure the URLs resolve to real, maintained pages.

### 6.2 User-Generated Content Has Reporting Mechanism

**What to check**: If the app allows users to post content (text, images, videos) visible to other users, verify:
- Block/mute user functionality exists
- Report content functionality exists
- Method to remove objectionable content

Search for: `TextField` or text editors in social/posting contexts, image upload flows, comment systems.

**Why it matters**: Guideline 1.2. Apps with UGC must have a mechanism to report offensive content and block abusive users.

**How to fix**: Add "Report" and "Block" actions accessible from user-generated content. These can be as simple as a context menu that sends a report to your server.

### 6.3 Age Rating Matches Content

**What to check**: Review the app's content for:
- Profanity or mature language
- Violence or graphic content
- Gambling (real or simulated)
- Alcohol, tobacco, or drug references
- Sexual content or nudity
- Horror or fear themes

Compare with the age rating set in App Store Connect.

**Why it matters**: Guideline 5.x. Mismatched age rating can cause rejection or post-launch removal.

**How to fix**: Complete the age rating questionnaire in App Store Connect honestly. If the app has user-generated content, select "Unrestricted Web Access" — this typically requires 17+.

### 6.4 No Copyrighted Material Without License

**What to check**: Audit assets for:
- Stock photos (verify license)
- Fonts (verify license for distribution)
- Icons from third-party icon packs (verify commercial use license)
- Third-party logos, trademarks, or brand names

**Why it matters**: Guideline 5.2. Using copyrighted material without proper authorization causes rejection and potential legal action.

**How to fix**: Replace unlicensed assets with originals, properly licensed stock, or SF Symbols. Keep license documentation on file.

---

## 7. UI and Design Quality (Guideline 4.x)

### 7.1 App Icon Present for All Required Sizes

**What to check**: Open `Assets.xcassets/AppIcon.appiconset/Contents.json`. Verify:
- A 1024x1024 image is present
- The image has no alpha channel (transparency)
- The image is PNG format
- For macOS: icon follows macOS design guidelines (rounded rect with depth/shadow)

**Why it matters**: Guideline 4.0. Missing or invalid app icons cause build upload failure or rejection.

**How to fix**: Create a 1024x1024 PNG with no transparency. Xcode 15+ generates all sizes from this single image. Flatten any alpha channel.

### 7.2 Launch Screen Configured

**What to check**: Look for:
- `UILaunchStoryboardName` in Info.plist (should reference a storyboard or `LaunchScreen`)
- `LaunchScreen.storyboard` file
- SwiftUI apps: ensure a launch screen is configured in the target's General > App Icons and Launch Screen

Static launch images (`UILaunchImages`) are no longer accepted on iOS 14+.

**Why it matters**: Guideline 4.0. Missing launch screen causes layout issues and potential rejection.

**How to fix**: Create a `LaunchScreen.storyboard` with Auto Layout constraints (or use the launch screen configuration in the target). Do not use static launch images.

### 7.3 Supports Required Screen Sizes

**What to check**: Verify the app builds and runs on:
- For iOS: iPhone SE (small screen), standard iPhone, iPhone Pro Max (large screen)
- For universal apps: iPad as well
- Check for hardcoded frame sizes that would break on different screens

Search for: `UIScreen.main.bounds` hardcoded values, fixed frame sizes without adaptation.

**Why it matters**: Guideline 2.1 / 4.1. The app must work on all supported device sizes.

**How to fix**: Use Auto Layout / SwiftUI adaptive layouts. Replace hardcoded sizes with relative sizing or geometry readers.

### 7.4 Dark Mode Compatibility

**What to check**: Search for hardcoded colors:
- `.black`, `.white` used for backgrounds or text (these don't adapt to Dark Mode)
- Hex color initializers: `Color(hex:`, `UIColor(red:`, `#colorLiteral`
- Check if the app defines an `AccentColor` in the asset catalog
- Look for colors in `Assets.xcassets` that have both "Any" and "Dark" appearances

**Why it matters**: Guideline 4.0. While Dark Mode isn't strictly required, hardcoded colors that become invisible in Dark Mode (black text on black background) will cause rejection under 2.1 (unusable app).

**How to fix**: Use semantic colors: `.primary`, `.secondary`, `.background`, or custom colors in the asset catalog with Dark Mode variants. Replace hardcoded `.black`/`.white` with adaptive system colors.

### 7.5 Dynamic Type Support

**What to check**: Search for:
- Fixed font sizes: `Font.system(size:` or `UIFont.systemFont(ofSize:` without text style
- Verify at least some use of `Font.body`, `Font.title`, `.font(.headline)` or `UIFont.preferredFont(forTextStyle:)`
- Check for `@ScaledMetric` usage for custom spacing/sizing
- Layouts that would break with larger text (fixed-height containers for text)

**Why it matters**: Guideline 4.0 / Accessibility. While not every element must scale, core content should support Dynamic Type. Apps that are completely unreadable at larger text sizes may be rejected.

**How to fix**: Use text styles (`Font.body`, `Font.title`, etc.) instead of fixed sizes for primary content. Use `@ScaledMetric` for spacing that should scale with text. Ensure ScrollViews are used where content might overflow.

### 7.6 Safe Area Compliance

**What to check**: Search for:
- `.edgesIgnoringSafeArea(.all)` or `.ignoresSafeArea()` used broadly
- Content that could be obscured by the notch, Dynamic Island, or home indicator
- `UIView` constraints pinned to superview edges instead of safe area layout guides

**Why it matters**: Guideline 4.0. Content obscured by hardware elements makes the app unusable.

**How to fix**: Use safe area insets. Only ignore safe areas for backgrounds or decorative elements, not interactive content.

### 7.7 iPad Support for Universal Apps

**What to check**: If the app declares iPad support (check `TARGETED_DEVICE_FAMILY` — `1,2` means universal):
- Does it have an iPad-specific layout or just stretched iPhone layout?
- Are there multitasking layouts (Split View, Slide Over)?
- Does it handle pointer (trackpad/mouse) input?
- Are navigation patterns appropriate for iPad (sidebar vs tab bar)?

**Why it matters**: Guideline 4.1. Universal apps must provide a good iPad experience. Stretched iPhone layouts are rejected.

**How to fix**: Either add proper iPad layouts (sidebar navigation, adaptive layouts) or remove iPad from the supported devices if iPad is not a priority.

---

## 8. Network and Performance

### 8.1 Handles Airplane Mode Gracefully

**What to check**: Search for network request code. Verify there are error handling paths for:
- `URLError.notConnectedToInternet`
- `URLError.networkConnectionLost`
- Empty state views or error views for failed network requests

Check that the app doesn't crash or show a blank screen with no internet.

**Why it matters**: Guideline 2.1. Crashing or showing a blank screen without network is a common rejection cause.

**How to fix**: Add network reachability detection (`NWPathMonitor` or `URLSession` error handling). Show meaningful error messages and retry options.

### 8.2 Handles Slow/Failed Requests

**What to check**: Look for:
- Loading states (progress indicators, skeleton views) during network operations
- Timeout configuration on `URLSession` tasks
- Error handling for HTTP 4xx/5xx responses
- Retry logic or error messages for failed requests

**Why it matters**: Guideline 2.1. Apple tests on imperfect networks. Hanging indefinitely or crashing on timeout causes rejection.

**How to fix**: Add loading indicators for all network operations. Set reasonable timeouts (30-60 seconds). Handle error responses with user-facing messages.

### 8.3 No Plain HTTP Connections Without ATS Exception

**What to check**: Search for `http://` URLs in source code (not `https://`). Check Info.plist for:
- `NSAppTransportSecurity` dictionary
- `NSAllowsArbitraryLoads` set to `true` (overly permissive)
- Per-domain exceptions via `NSExceptionDomains`

**Why it matters**: Guideline 2.1 / Apple's App Transport Security. Unencrypted HTTP is blocked by default. Overly broad ATS exceptions (`NSAllowsArbitraryLoads: true`) will trigger review questions.

**How to fix**: Use HTTPS for all connections. If HTTP is unavoidable for a specific domain (e.g., a local device), use `NSExceptionDomains` for only that domain, not `NSAllowsArbitraryLoads`.

### 8.4 No Overly Broad ATS Exceptions

**What to check**: Specifically look for `NSAllowsArbitraryLoads` set to `true` without `NSExceptionDomains` narrowing it down.

**Why it matters**: Guideline 2.1. Apple requires justification for disabling ATS. Broad exceptions without explanation trigger rejection or requests for explanation.

**How to fix**: Remove `NSAllowsArbitraryLoads`. Use per-domain exceptions with justification. If the app uses web views that load arbitrary content, use `NSAllowsArbitraryLoadsInWebContent` instead (more targeted).

---

## 9. Technical Requirements (Guideline 2.5)

### 9.1 No Private API Usage

**What to check**: Search for:
- Method names with leading underscore calling into Apple frameworks: `_UINavigationBar`, `_setStatusBarHidden`, `_statusBarHeight`
- `dlopen`, `dlsym` used to load private frameworks
- `objc_msgSend` with string selectors for private methods
- `@objc` exposed methods calling private APIs
- Known private frameworks: `UIKit.UIWebView` (deprecated), `GraphicsServices`, `IOKit` (some APIs)

**Why it matters**: Guideline 2.5.1. Private API usage is detected by automated scanning during upload and causes immediate rejection.

**How to fix**: Replace private API calls with public alternatives. If no public API exists, file a Feedback with Apple and use a workaround.

### 9.2 Required Device Capabilities

**What to check**: Check `UIRequiredDeviceCapabilities` in Info.plist. Verify each listed capability is actually required for the app to function. Common unnecessary entries:
- `armv7` (very old, unnecessary on modern apps)
- `metal` (unless the app truly requires Metal)
- `nfc` (unless core to functionality)

**Why it matters**: Guideline 2.5. Over-declaring device capabilities limits your audience unnecessarily and may cause rejection if the capability isn't actually used.

**How to fix**: Only list capabilities the app absolutely cannot function without. For optional features (NFC, ARKit), handle unavailability gracefully instead of requiring the capability.

### 9.3 Deployment Target Set Correctly

**What to check**: Verify `IPHONEOS_DEPLOYMENT_TARGET` or `MACOSX_DEPLOYMENT_TARGET` in build settings matches what you actually test against. Check that no code uses APIs above the deployment target without availability checks (`if #available`).

**Why it matters**: Guideline 2.1. If you declare iOS 16 support, Apple may test on iOS 16. Crashes there cause rejection.

**How to fix**: Set deployment target to the minimum version you've actually tested on. Use `@available` and `if #available` for newer APIs.

### 9.4 Entitlements Match Capabilities

**What to check**: Compare the `.entitlements` file with the capabilities configured in the App ID (developer portal) and Xcode target:
- Every entitlement in the file should have a corresponding capability enabled
- Every capability enabled should have a corresponding entitlement
- No extra entitlements left from removed features

Search for the `.entitlements` file and review its contents.

**Why it matters**: Guideline 2.5. Mismatched entitlements cause code signing failures or rejection.

**How to fix**: Sync entitlements with capabilities. In Xcode: Target > Signing & Capabilities. Remove capabilities you're not using.

### 9.5 No Embedded Provisioning Profiles for Distribution

**What to check**: Verify the project doesn't have manually embedded `.mobileprovision` files in the bundle. Distribution builds should use Xcode-managed signing.

**Why it matters**: Guideline 2.5. Incorrect provisioning profiles cause signing validation failure.

**How to fix**: Use automatic signing for distribution or ensure the correct distribution provisioning profile is selected.

---

## 10. Metadata Readiness

### 10.1 Screenshots Match Current App UI

**What to check**: If screenshots exist in the project or fastlane directory, compare them with the current UI. Look for:
- Outdated navigation patterns
- Different color schemes
- Features in screenshots that no longer exist
- UI elements that have been redesigned

**Why it matters**: Guideline 2.3.3. Screenshots must accurately represent the app. Misleading screenshots cause rejection.

**How to fix**: Regenerate screenshots from the current build. Use Fastlane snapshot or Xcode UI tests for automation.

### 10.2 App Description Accuracy

**What to check**: If app description or metadata files exist in the project (`fastlane/metadata/`), review them for:
- References to features that don't exist
- Mentions of other platforms ("also available on Android")
- Outdated functionality descriptions
- Claims about performance or capabilities that can't be verified

**Why it matters**: Guideline 2.3.3. Description must accurately reflect current app functionality.

**How to fix**: Update the description to match current features. Remove cross-platform references.

### 10.3 Keywords Don't Include Competitor Names

**What to check**: Check `fastlane/metadata/*/keywords.txt` or App Store Connect keywords for competitor app names, brand names, or trademarks.

**Why it matters**: Guideline 2.3.7. Using competitor names as keywords causes rejection and potential trademark complaints.

**How to fix**: Replace competitor names with descriptive keywords about your app's functionality.

### 10.4 Support URL Accessible

**What to check**: Find the support URL in the metadata/project. Verify it's not a placeholder and points to a real page.

**Why it matters**: Required metadata. Non-functional support URL blocks submission.

**How to fix**: Set up a working support page or use a contact email page.

### 10.5 Demo Account Credentials Ready

**What to check**: If the app requires login to access functionality, verify:
- Demo credentials are prepared for the review notes
- The demo account is preloaded with meaningful data
- The credentials work (test them)
- If 2FA is enabled, there's a way for reviewers to get past it

**Why it matters**: Guideline 2.1. If Apple reviewers can't access the app's functionality, they reject it.

**How to fix**: Create a stable test account, preload it with data, and document the credentials. If 2FA is required, either provide a bypass for the review account or include detailed 2FA instructions.

---

## 11. macOS-Specific (if applicable)

Skip this section for iOS-only apps.

### 11.1 Hardened Runtime Enabled

**What to check**: Check build settings for `ENABLE_HARDENED_RUNTIME = YES`. Verify in the `.entitlements` file that Hardened Runtime exceptions are minimal.

**Why it matters**: Required for macOS App Store and notarization. Apps without Hardened Runtime are rejected.

**How to fix**: Enable Hardened Runtime in Xcode: Target > Signing & Capabilities > + Hardened Runtime. Only add exceptions you truly need.

### 11.2 Notarization Configured

**What to check**: For Developer ID distribution (outside App Store), verify notarization is set up:
- `notarytool` or `altool` in build scripts
- Xcode Organizer set to notarize on export

**Why it matters**: macOS apps distributed outside the App Store must be notarized or Gatekeeper blocks them.

**How to fix**: Add notarization to the build pipeline: `xcrun notarytool submit MyApp.zip --apple-id ... --team-id ... --password ...`

### 11.3 Sandbox Entitlements Appropriate

**What to check**: Review `*.entitlements` for sandbox entitlements:
- `com.apple.security.app-sandbox` should be `true` for App Store
- Only necessary entitlements should be enabled (network, file access, etc.)
- No entitlements for unused features

**Why it matters**: Guideline 2.4.5. Mac App Store apps must be sandboxed. Overly broad sandbox exceptions raise review flags.

**How to fix**: Enable sandbox and request only the minimum entitlements needed. Remove unused entitlements.

### 11.4 Menu Bar Items Functional

**What to check**: Verify standard menu items work:
- Cmd+Q quits the app
- Cmd+W closes the current window
- Cmd+C/Cmd+V copy/paste work where expected
- Edit menu has expected items (Undo, Redo, Cut, Copy, Paste, Select All)
- Help menu exists (even if it just opens a support page)

**Why it matters**: Guideline 4.0 (macOS HIG). Standard keyboard shortcuts and menus are expected.

**How to fix**: Use SwiftUI's default menu infrastructure or add `NSMenu` items for standard commands.

### 11.5 Window Resizing Works

**What to check**: Verify:
- Window can be resized (unless there's a good reason for fixed size)
- Content adapts to window size (no clipping, no empty space)
- Minimum window size is reasonable
- Full screen mode works if supported

**Why it matters**: Guideline 4.0 (macOS HIG). macOS apps should handle window management properly.

**How to fix**: Set `.windowResizability(.contentSize)` or appropriate minimum/maximum sizes in SwiftUI. Ensure layout adapts with `GeometryReader` or adaptive stacks.
