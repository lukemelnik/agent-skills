# Top 10 App Store Rejection Fixes

For each rejection, the exact guideline text, common triggers, code-level fixes, and how to respond if you disagree.

---

## 1. Guideline 2.1 — Performance: App Completeness

### Guideline Text

> "App completeness: We found that your app crashed on launch or displayed incomplete content. We have attached detailed crash logs to help troubleshoot this issue."

### What Triggers It

- Force-unwrapped nil values on the launch path
- Missing required resources (images, data files, fonts)
- Network requests that block the main thread on launch
- Placeholder/lorem ipsum text visible in the UI
- Features mentioned in the description or visible in the UI that don't work
- Test accounts, debug menus, or "beta" references visible
- Crashes during normal usage on the reviewer's device/OS version

### Code-Level Fix

**Crash on launch** — find and eliminate force unwraps in the startup chain:

```swift
// BEFORE — crashes if config.json is missing
let data = try! Data(contentsOf: Bundle.main.url(forResource: "config", withExtension: "json")!)
let config = try! JSONDecoder().decode(Config.self, from: data)

// AFTER — graceful fallback
guard let url = Bundle.main.url(forResource: "config", withExtension: "json"),
      let data = try? Data(contentsOf: url),
      let config = try? JSONDecoder().decode(Config.self, from: data) else {
    // Use default config or show an error screen
    return Config.default
}
```

**Placeholder content** — search and replace:

```bash
# Find placeholder text across the project
grep -rn "Lorem ipsum\|TODO\|FIXME\|placeholder\|coming soon\|TBD" --include="*.swift" --include="*.strings" .
```

**Network-dependent launch** — never block the UI on a network call:

```swift
// BEFORE — blank screen until request completes
struct ContentView: View {
    @State private var items: [Item] = []

    var body: some View {
        List(items) { item in Text(item.name) }
            .task {
                items = try! await api.fetchItems() // crashes if offline
            }
    }
}

// AFTER — loading and error states
struct ContentView: View {
    @State private var items: [Item] = []
    @State private var isLoading = true
    @State private var error: Error?

    var body: some View {
        Group {
            if isLoading {
                ProgressView("Loading...")
            } else if let error {
                ContentUnavailableView("Couldn't Load",
                    systemImage: "wifi.slash",
                    description: Text(error.localizedDescription))
            } else {
                List(items) { item in Text(item.name) }
            }
        }
        .task {
            do {
                items = try await api.fetchItems()
            } catch {
                self.error = error
            }
            isLoading = false
        }
    }
}
```

### How to Respond if You Disagree

If the crash is not reproducible on your end:

- Ask for the specific device model and OS version the reviewer tested on
- Provide crash logs from TestFlight/Crashlytics showing the issue doesn't occur widely
- If the crash only happens on specific OS versions you don't support, clarify your deployment target
- Offer to provide a screen recording of the app working correctly

Template response:

> We were unable to reproduce the crash described. We tested on [devices/OS versions]. Could you provide the specific device and OS version, along with the crash log? We've also attached a screen recording showing the app functioning correctly on [device].

---

## 2. Guideline 2.3.3 — Accurate Metadata

### Guideline Text

> "We noticed that your screenshots do not sufficiently reflect your app in use. Specifically, your [X] screenshot(s) do not accurately reflect the app."

### What Triggers It

- Screenshots showing a different version of the UI than what's shipping
- Screenshots with features that don't exist in the current build
- Heavily edited screenshots that misrepresent the experience
- Wrong device frames (showing iPhone screenshots for iPad, or vice versa)
- Screenshots in a language that doesn't match the localization

### Code-Level Fix

Automate screenshot generation so they always match the current build:

```swift
// UITest target: ScreenshotTests.swift
import XCTest

final class ScreenshotTests: XCTestCase {
    let app = XCUIApplication()

    override func setUp() {
        continueAfterFailure = false
        app.launchArguments = ["--screenshot-mode"]
        app.launch()
    }

    func testHomeScreen() {
        let screenshot = app.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = "01-HomeScreen"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    func testFeatureScreen() {
        app.buttons["Feature"].tap()
        let screenshot = app.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = "02-Feature"
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
```

```bash
# Fastlane Snapfile
devices([
  "iPhone 16 Pro Max",
  "iPad Pro 13-inch (M4)"
])
languages(["en-US"])
scheme("UITests")
output_directory("./fastlane/screenshots")
```

### How to Respond if You Disagree

> The screenshots accurately represent the app's current functionality. [Screenshot X] shows [specific feature], which is accessible via [navigation path]. We'd like to understand which specific aspect appears inaccurate so we can address it. We've attached a screen recording showing the flow depicted in each screenshot.

---

## 3. Guideline 3.1.1 — In-App Purchase

### Guideline Text

> "We noticed that your app uses a third-party payment mechanism for digital content, which is not appropriate for the App Store. In-App Purchase must be used for all digital content, subscriptions, and unlockable features."

### What Triggers It

- Using Stripe, PayPal, or other payment processors for premium features, content, or subscriptions consumed within the app
- Linking to an external website for purchasing digital content
- Mentioning that users can buy subscriptions on the website
- "Web reader" apps not enrolled in the appropriate entitlement still linking externally

### Code-Level Fix

Replace external payment with StoreKit 2:

```swift
import StoreKit

// Product IDs configured in App Store Connect
enum ProductID: String {
    case premium = "com.yourapp.premium"
    case monthlySubscription = "com.yourapp.monthly"
}

class PurchaseManager: ObservableObject {
    @Published var products: [Product] = []
    @Published var purchasedProductIDs: Set<String> = []

    func loadProducts() async {
        do {
            products = try await Product.products(for: [
                ProductID.premium.rawValue,
                ProductID.monthlySubscription.rawValue
            ])
        } catch {
            print("Failed to load products: \(error)")
        }
    }

    func purchase(_ product: Product) async throws -> Transaction? {
        let result = try await product.purchase()
        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            await transaction.finish()
            purchasedProductIDs.insert(transaction.productID)
            return transaction
        case .userCancelled, .pending:
            return nil
        @unknown default:
            return nil
        }
    }

    func restorePurchases() async {
        for await result in Transaction.currentEntitlements {
            if let transaction = try? checkVerified(result) {
                purchasedProductIDs.insert(transaction.productID)
            }
        }
    }

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified: throw StoreError.failedVerification
        case .verified(let value): return value
        }
    }
}
```

### How to Respond if You Disagree

If you're selling physical goods or real-world services (not digital content):

> The purchases in our app are for [physical goods/real-world services] — specifically [describe what is purchased and how it's consumed outside the app]. Per App Store Review Guideline 3.1.5, physical goods and services performed outside the app may use payment methods other than In-App Purchase. We've documented the purchase flow in the attached screenshots showing that [description of the physical/real-world nature of the transaction].

---

## 4. Guideline 4.3 — Design: Spam / Copycat

### Guideline Text

> "Your app duplicates the content and functionality of other apps submitted by you or another developer, which is considered a form of spam."

### What Triggers It

- App looks and functions identically to another app already on the store (yours or someone else's)
- Built from a template with minimal customization (reskinned apps)
- Multiple submissions of similar apps targeting different regions or demographics
- App is a thin wrapper around a website with no native value
- UI that closely mimics Apple's own apps or well-known third-party apps

### Code-Level Fix

There is no single code fix — this requires differentiating the app at a design and feature level:

1. **Unique visual identity**: Custom colors, typography, iconography, animations
2. **Native features**: Push notifications, widgets, Shortcuts integration, offline support
3. **Differentiated UX**: Novel navigation patterns, unique interaction models
4. **Distinct content**: Original content or unique content curation

If building a utility app in a crowded category, focus on one specific niche and execute it exceptionally:

```swift
// Instead of a generic "notes app", build something with a clear identity
// BAD: Generic note list that looks like Apple Notes
// GOOD: Specific purpose with unique features

// Example: A cooking-specific notes app with:
// - Ingredient parsing and scaling
// - Timer integration
// - Meal planning calendar
// - Grocery list generation
```

### How to Respond if You Disagree

> Our app provides a unique value proposition that differentiates it from [cited similar app]. Specifically:
> 1. [Feature unique to your app]
> 2. [Design approach that differs]
> 3. [Target audience distinction]
> 4. [Technical capability not available in the comparison app]
>
> We've attached a detailed comparison document showing the differences in functionality, design, and user experience between our app and [comparison app].

---

## 5. Guideline 4.2 — Minimum Functionality

### Guideline Text

> "We found that the usefulness of your app is limited by the minimal amount of content or features it includes."

### What Triggers It

- App is just a single screen with no meaningful interaction
- App is a WKWebView wrapper with no native features
- App replicates functionality already available in Safari or the OS
- App provides trivial functionality (e.g., a flashlight app, a single sound button)
- Marketing or brochure apps with no interactive features

### Code-Level Fix

If the app is web-heavy, add native features:

```swift
// Augment a web-based app with native capabilities

struct ContentView: View {
    @State private var showScanner = false

    var body: some View {
        NavigationStack {
            // Native feature: barcode scanner
            Button("Scan Product") { showScanner = true }

            // Native feature: favorites stored locally
            FavoritesListView()

            // Web content is supplementary, not the entire app
            WebContentView(url: contentURL)
        }
        .sheet(isPresented: $showScanner) {
            BarcodeScannerView()
        }
    }
}

// Add widgets for quick access
struct QuickAccessWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "QuickAccess",
                          provider: QuickAccessProvider()) { entry in
            QuickAccessWidgetView(entry: entry)
        }
        .configurationDisplayName("Quick Access")
        .description("Access your most-used features.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

### How to Respond if You Disagree

> Our app provides meaningful native functionality beyond what a website offers:
> 1. [Native feature 1: push notifications, offline access, etc.]
> 2. [Native feature 2: camera integration, location services, etc.]
> 3. [Native feature 3: widgets, Shortcuts, ShareExtension, etc.]
>
> The web content in our app supplements native features rather than being the sole content. We've attached a walkthrough video demonstrating the native functionality.

---

## 6. Guideline 5.1.1 — Data Collection and Storage

### Guideline Text

> "We noticed that your app collects user or device data without indicating this in the privacy manifest. Additionally, your app accesses [specific API category] without providing the required reason."

### What Triggers It

- Missing `PrivacyInfo.xcprivacy` file
- Using required-reason APIs without declaring them in the privacy manifest
- Missing `NSUsageDescription` strings for requested permissions
- Collecting data not disclosed in the App Store privacy nutrition labels
- Third-party SDKs without their own privacy manifests

### Code-Level Fix

**Create or update PrivacyInfo.xcprivacy:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <!-- Declare EVERY type of data your app collects -->
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
    <key>NSPrivacyTracking</key>
    <false/>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <!-- Declare every required-reason API you use -->
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>C617.1</string>
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
    <key>NSPrivacyTrackingDomains</key>
    <array/>
</dict>
</plist>
```

**Add missing permission strings to Info.plist:**

```xml
<!-- Only include the permissions your app actually uses -->
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan documents and take photos for your profile.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access so you can choose a profile picture.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>We use your location to show nearby results and provide directions.</string>
```

**Audit data collection against nutrition labels:**

```bash
# Find all analytics/tracking SDKs in the project
grep -rn "Analytics\|Tracking\|Crashlytics\|Sentry\|Mixpanel\|Amplitude\|Segment\|Firebase" \
    --include="*.swift" --include="Podfile" --include="Package.swift" .

# Find all permission requests
grep -rn "requestAuthorization\|requestAccess\|requestWhenInUse\|requestAlways\|requestTracking" \
    --include="*.swift" .
```

### How to Respond if You Disagree

> We have updated our privacy manifest to include [specific API category] with reason code [code]. The API is used for [legitimate purpose]. We have also verified that our App Store privacy nutrition labels accurately reflect all data collection in the app and its third-party SDKs. The updated build [version/build number] addresses this issue.

---

## 7. Guideline 5.1.2 — Data Use and Sharing (ATT)

### Guideline Text

> "Your app accesses the device's advertising identifier (IDFA) without requesting permission through the App Tracking Transparency framework."

### What Triggers It

- Accessing `ASIdentifierManager.shared().advertisingIdentifier` without calling `ATTrackingManager.requestTrackingAuthorization` first
- Third-party SDKs (Facebook SDK, AdMob, Adjust, AppsFlyer) accessing IDFA before ATT consent
- Initializing tracking SDKs on app launch before showing ATT prompt
- Missing `NSUserTrackingUsageDescription` in Info.plist

### Code-Level Fix

```swift
import AppTrackingTransparency
import AdSupport

class TrackingManager {

    /// Call this BEFORE initializing any analytics/ad SDKs that use IDFA
    func requestTrackingPermission() async -> ATTrackingManager.AuthorizationStatus {
        // Must be called when app is active (not on launch, not in background)
        let status = await ATTrackingManager.requestTrackingAuthorization()

        switch status {
        case .authorized:
            // Now safe to access IDFA and initialize tracking SDKs
            let idfa = ASIdentifierManager.shared().advertisingIdentifier
            initializeTrackingSDKs(idfa: idfa)
        case .denied, .restricted:
            // Initialize SDKs without tracking
            initializeTrackingSDKs(idfa: nil)
        case .notDetermined:
            break
        @unknown default:
            break
        }

        return status
    }

    private func initializeTrackingSDKs(idfa: UUID?) {
        // Configure your SDKs here based on tracking permission
    }
}
```

```swift
// Show ATT prompt at an appropriate time (after onboarding, not on cold launch)
struct OnboardingCompletedView: View {
    @StateObject private var tracking = TrackingManager()

    var body: some View {
        VStack {
            Text("Welcome!")
            // ... onboarding content
        }
        .onAppear {
            Task {
                // Small delay ensures the app is fully active
                try? await Task.sleep(for: .seconds(1))
                await tracking.requestTrackingPermission()
            }
        }
    }
}
```

**Info.plist addition:**

```xml
<key>NSUserTrackingUsageDescription</key>
<string>We use this to provide you with personalized content and measure the effectiveness of our advertising.</string>
```

### How to Respond if You Disagree

If your app doesn't actually track users:

> Our app does not track users as defined by Apple's App Tracking Transparency framework. We do not access the IDFA, and our analytics are first-party only (collected and used solely within our app). The SDK [name] that was flagged is configured with tracking disabled — specifically, [configuration details showing tracking is off]. We have verified that no cross-app tracking occurs.

---

## 8. Guideline 4.8 — Sign in with Apple

### Guideline Text

> "Your app uses a third-party login service but does not offer Sign in with Apple. Apps that use a third-party or social login service to set up or authenticate the user's primary account with the app must also offer Sign in with Apple as an equivalent option."

### What Triggers It

- Offering Google Sign-In, Facebook Login, Twitter/X login, or email/password registration without also offering Sign in with Apple
- Sign in with Apple present but less prominent than other options (smaller button, on a different screen)
- Sign in with Apple available but broken or not fully implemented

### Code-Level Fix

**SwiftUI implementation:**

```swift
import AuthenticationServices

struct LoginView: View {
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        VStack(spacing: 16) {
            // Sign in with Apple — same prominence as other buttons
            SignInWithAppleButton(.signIn) { request in
                request.requestedScopes = [.email, .fullName]
            } onCompletion: { result in
                switch result {
                case .success(let authorization):
                    handleAppleSignIn(authorization)
                case .failure(let error):
                    handleError(error)
                }
            }
            .signInWithAppleButtonStyle(
                colorScheme == .dark ? .white : .black
            )
            .frame(height: 50) // Same height as other buttons

            // Google Sign-In — same size
            GoogleSignInButton()
                .frame(height: 50)

            // Email login — same size
            EmailLoginButton()
                .frame(height: 50)
        }
        .padding()
    }

    private func handleAppleSignIn(_ authorization: ASAuthorization) {
        guard let credential = authorization.credential
                as? ASAuthorizationAppleIDCredential else { return }

        let userID = credential.user
        let email = credential.email           // Only on first sign-in
        let fullName = credential.fullName     // Only on first sign-in
        let identityToken = credential.identityToken

        // Send identityToken to your server for verification
        // Store userID for future credential state checks
        authenticateWithServer(
            userID: userID,
            email: email,
            fullName: fullName,
            identityToken: identityToken
        )
    }
}
```

**Credential state monitoring (handle revocation):**

```swift
// Check credential state on app launch
func checkAppleCredentialState() {
    let provider = ASAuthorizationAppleIDProvider()
    provider.getCredentialState(forUserID: savedAppleUserID) { state, error in
        switch state {
        case .authorized: break // All good
        case .revoked:
            // User revoked access — sign them out
            signOut()
        case .notFound:
            // No credential found — may need to re-authenticate
            break
        default: break
        }
    }
}
```

### How to Respond if You Disagree

If your app only uses enterprise SSO or credential-based login (not social login):

> Our app uses [enterprise SSO / credential-based authentication] for [specific business reason]. This is not a third-party social login service as described in Guideline 4.8. Users authenticate with their existing organizational credentials via [SAML/OAuth with their employer's identity provider]. Per the guideline, Sign in with Apple is required when apps "use a third-party or social login service" — our authentication is organization-managed, not social.

If the app only uses phone number or email/password without any third-party OAuth:

> Our app uses only email/password authentication — we do not integrate any third-party login services (Google, Facebook, etc.). Guideline 4.8 specifies that Sign in with Apple is required when "a third-party or social login service" is used. Email/password registration is a first-party authentication method. We'd appreciate clarification if the guideline now applies to first-party auth as well.

---

## 9. Guideline 2.5.1 — Software Requirements (Private API)

### Guideline Text

> "Your app uses or references non-public APIs: [specific API/symbol]. The use of non-public APIs is not permitted on the App Store because it can lead to a poor user experience should these APIs change."

### What Triggers It

- Calling private Apple framework methods (prefixed with `_`)
- Using `dlopen`/`dlsym` to load private frameworks or symbols
- Objective-C runtime manipulation to call private selectors
- Third-party SDKs that use private APIs (you're responsible for your dependencies)
- Deprecated UIWebView usage (now flagged as ITMS-90809 warning, will become rejection)

### Code-Level Fix

**Find and replace private API usage:**

```bash
# Search for private API patterns in your codebase
grep -rn "_UI\|_NS\|_CK\|_MK" --include="*.swift" --include="*.m" --include="*.h" .
grep -rn "dlopen\|dlsym" --include="*.swift" --include="*.m" .
grep -rn "objc_msgSend\|NSSelectorFromString\|performSelector" --include="*.swift" --include="*.m" .

# Check the built binary for private symbols
nm -u YourApp.app/YourApp | grep "_OBJC_CLASS_\$_.*_"

# Check for UIWebView (deprecated, flagged as warning)
grep -rn "UIWebView\|WKWebView" --include="*.swift" --include="*.m" --include="*.xib" --include="*.storyboard" .
```

**Common replacements:**

```swift
// BEFORE: Private API for status bar height
let height = UIApplication.shared.value(forKey: "statusBarFrame") as? CGRect

// AFTER: Public API
let height = UIApplication.shared.connectedScenes
    .compactMap { $0 as? UIWindowScene }
    .first?.statusBarManager?.statusBarFrame

// BEFORE: UIWebView (deprecated)
let webView = UIWebView(frame: .zero)

// AFTER: WKWebView
import WebKit
let webView = WKWebView(frame: .zero)

// BEFORE: Private API for device model
let model = UIDevice.current.value(forKey: "deviceName") as? String

// AFTER: Public approach
var systemInfo = utsname()
uname(&systemInfo)
let model = String(cString: &systemInfo.machine.0)
```

**Check third-party SDKs:**

```bash
# Scan all frameworks in the built app for private API usage
for framework in YourApp.app/Frameworks/*.framework; do
    echo "=== $(basename $framework) ==="
    nm -u "$framework/$(basename $framework .framework)" 2>/dev/null | grep "_OBJC_CLASS_\$__"
done
```

### How to Respond if You Disagree

If the flagged symbol is a false positive:

> The symbol [flagged symbol] is not a private Apple API. It is [defined in our codebase at path / part of the open-source library X]. The underscore prefix is part of our internal naming convention, not an Apple framework symbol. We can provide the source code for review if helpful.

If a third-party SDK is the cause:

> The private API usage was in [SDK name] version [X]. We have updated to version [Y] which removes this usage. The updated build [version/build] no longer references the flagged symbol.

---

## 10. Guideline 1.2 — User Generated Content

### Guideline Text

> "Your app enables the display of user-generated content but does not include the required moderation mechanisms. Apps with user-generated content must include: a method to filter objectionable material, a mechanism to report offensive content, the ability to block abusive users."

### What Triggers It

- Users can post text, images, or videos visible to other users
- Comment or chat functionality without reporting
- Profile pages or bios that display user-supplied content to others
- Sharing features that make user content visible publicly
- Social features (follows, likes, comments) without moderation

### Code-Level Fix

**Add report and block functionality:**

```swift
// Report action model
enum ReportReason: String, CaseIterable, Identifiable {
    case spam = "Spam"
    case harassment = "Harassment"
    case hateSpeech = "Hate Speech"
    case inappropriateContent = "Inappropriate Content"
    case misinformation = "Misinformation"
    case other = "Other"

    var id: String { rawValue }
}

struct ReportView: View {
    let contentID: String
    let contentType: String // "post", "comment", "user"
    @State private var selectedReason: ReportReason?
    @State private var additionalDetails = ""
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Why are you reporting this?") {
                    ForEach(ReportReason.allCases) { reason in
                        Button {
                            selectedReason = reason
                        } label: {
                            HStack {
                                Text(reason.rawValue)
                                Spacer()
                                if selectedReason == reason {
                                    Image(systemName: "checkmark")
                                }
                            }
                        }
                    }
                }

                Section("Additional details (optional)") {
                    TextField("Tell us more...", text: $additionalDetails, axis: .vertical)
                        .lineLimit(3...6)
                }
            }
            .navigationTitle("Report")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Submit") {
                        submitReport()
                        dismiss()
                    }
                    .disabled(selectedReason == nil)
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private func submitReport() {
        // Send report to your server
        Task {
            try await api.reportContent(
                id: contentID,
                type: contentType,
                reason: selectedReason!.rawValue,
                details: additionalDetails
            )
        }
    }
}

// Block user functionality
class BlockManager: ObservableObject {
    @Published var blockedUserIDs: Set<String> = []

    func blockUser(_ userID: String) async {
        blockedUserIDs.insert(userID)
        try? await api.blockUser(userID)
    }

    func unblockUser(_ userID: String) async {
        blockedUserIDs.remove(userID)
        try? await api.unblockUser(userID)
    }

    func isBlocked(_ userID: String) -> Bool {
        blockedUserIDs.contains(userID)
    }
}

// Add to content views via context menu
struct PostView: View {
    let post: Post
    @State private var showReport = false
    @EnvironmentObject var blockManager: BlockManager

    var body: some View {
        VStack(alignment: .leading) {
            Text(post.content)
            // ... post content
        }
        .contextMenu {
            Button(role: .destructive) {
                showReport = true
            } label: {
                Label("Report", systemImage: "flag")
            }

            Button(role: .destructive) {
                Task { await blockManager.blockUser(post.authorID) }
            } label: {
                Label("Block User", systemImage: "hand.raised")
            }
        }
        .sheet(isPresented: $showReport) {
            ReportView(contentID: post.id, contentType: "post")
        }
    }
}
```

**Content filtering (client-side minimum):**

```swift
// Basic profanity filter (supplement with server-side moderation)
import NaturalLanguage

class ContentFilter {
    func containsOffensiveContent(_ text: String) -> Bool {
        // Use Apple's built-in sentiment analysis as a first pass
        let tagger = NLTagger(tagSchemes: [.sentimentScore])
        tagger.string = text
        let sentiment = tagger.tag(at: text.startIndex, unit: .paragraph,
                                    scheme: .sentimentScore)

        // Also check against a blocklist (maintain server-side)
        return checkAgainstBlocklist(text)
    }

    private func checkAgainstBlocklist(_ text: String) -> Bool {
        // Fetch blocklist from server, check locally
        // This should be a server-side API call for production
        return false
    }
}
```

### How to Respond if You Disagree

If the "user-generated content" is actually private (not shown to other users):

> The content in our app is private to the individual user and is not displayed to or shared with other users. Specifically, [describe what the user creates and how it's stored/used]. Since no user can see another user's content, moderation mechanisms for objectionable content between users are not applicable. We'd be happy to provide a walkthrough demonstrating that all user content is private.

If moderation exists but was missed by the reviewer:

> Our app includes the required moderation mechanisms:
> 1. **Report**: Users can report content via [describe where — e.g., "the context menu on any post" or "the (...) button on any comment"]
> 2. **Block**: Users can block other users via [describe where]
> 3. **Filter**: [Describe content filtering — server-side moderation, automated flagging, etc.]
>
> These features may not have been visible during review because [they require viewing another user's content / they appear on long-press / etc.]. We've attached screenshots showing each mechanism and included navigation instructions in the review notes.
