# iOS Platform Capabilities

## Table of Contents

1. [Push Notifications](#1-push-notifications)
2. [Background Modes](#2-background-modes)
3. [Universal Links and Deep Links](#3-universal-links-and-deep-links)
4. [WidgetKit](#4-widgetkit)
5. [App Groups](#5-app-groups)
6. [StoreKit 2](#6-storekit-2)
7. [Live Activities](#7-live-activities)

---

## 1. Push Notifications

### Permission Request

```swift
import UserNotifications

func requestPushPermission() async throws -> Bool {
    try await UNUserNotificationCenter.current()
        .requestAuthorization(options: [.alert, .sound, .badge])
}
```

After authorization, register for remote notifications on the main thread:

```swift
await MainActor.run {
    UIApplication.shared.registerForRemoteNotifications()
}
```

### APNs Token Registration

Handle the token in your `AppDelegate` or via `UIApplicationDelegateAdaptor`:

```swift
class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        // Send token to your server
    }

    func application(_ application: UIApplication,
                     didFailToRegisterForRemoteNotificationsWithError error: Error) {
        // Handle failure — simulator, missing entitlement, etc.
    }
}
```

### Notification Service Extension (Rich Notifications)

Add a **Notification Service Extension** target to modify notification content before display (images, decryption, badges):

```swift
class NotificationService: UNNotificationServiceExtension {
    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        guard let content = request.content.mutableCopy() as? UNMutableNotificationContent else {
            contentHandler(request.content)
            return
        }

        // didReceive is NOT async — wrap async work in a Task
        Task {
            if let imageURLString = content.userInfo["image_url"] as? String,
               let imageURL = URL(string: imageURLString) {
                if let (data, _) = try? await URLSession.shared.data(from: imageURL) {
                    let fileURL = FileManager.default.temporaryDirectory.appendingPathComponent("notif.png")
                    try? data.write(to: fileURL)
                    if let attachment = try? UNNotificationAttachment(identifier: "image", url: fileURL) {
                        content.attachments = [attachment]
                    }
                }
            }
            contentHandler(content)
        }
    }
}
```

- The extension has ~30 seconds to call `contentHandler`.
- Share data with the main app via **App Groups** or **Keychain Access Groups**.
- Use `INSendMessageIntent` for communication-style notifications with avatars.

### Handling Notification Responses

Set your delegate and implement response handling:

```swift
@MainActor
class NotificationHandler: NSObject, UNUserNotificationCenterDelegate {
    func setup() {
        UNUserNotificationCenter.current().delegate = self
    }

    // Tapped notification
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let userInfo = response.notification.request.content.userInfo
        // Route to the appropriate screen based on payload
    }

    // Foreground notification — decide presentation
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .sound, .badge]
    }
}
```

### Checklist

- Request permission at a contextually appropriate moment, not at launch.
- Always handle `didFailToRegisterForRemoteNotificationsWithError`.
- Use `provisional` authorization for trial notifications without prompting.
- Add `aps-environment` entitlement (`development` / `production`).

---

## 2. Background Modes

Enable in Xcode: target > Signing & Capabilities > Background Modes.

### BGAppRefreshTask

Periodic background refresh (system-managed cadence, typically 15+ minutes):

```swift
import BackgroundTasks

// Register early — in App.init() or application(_:didFinishLaunchingWithOptions:)
// IMPORTANT: BGTaskScheduler.register must be called before the app finishes launching.
// Registering too late silently fails — no error is thrown or logged.
BGTaskScheduler.shared.register(
    forTaskWithIdentifier: "com.example.app.refresh",
    using: nil
) { task in
    guard let task = task as? BGAppRefreshTask else { return }
    task.expirationHandler = { task.setTaskCompleted(success: false) }
    Task {
        await performRefresh()
        task.setTaskCompleted(success: true)
    }
}

// Schedule
func scheduleRefresh() {
    let request = BGAppRefreshTaskRequest(identifier: "com.example.app.refresh")
    request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60)
    try? BGTaskScheduler.shared.submit(request)
}
```

### BGProcessingTask

Long-running background work (database maintenance, ML model updates):

```swift
BGTaskScheduler.shared.register(
    forTaskWithIdentifier: "com.example.app.dbcleanup",
    using: nil
) { task in
    guard let task = task as? BGProcessingTask else { return }
    let operation = Task {
        await cleanupDatabase()
        task.setTaskCompleted(success: true)
    }
    task.expirationHandler = {
        operation.cancel()
        task.setTaskCompleted(success: false)
    }
}

func scheduleProcessing() {
    let request = BGProcessingTaskRequest(identifier: "com.example.app.dbcleanup")
    request.requiresNetworkConnectivity = true
    request.requiresExternalPower = false
    try? BGTaskScheduler.shared.submit(request)
}
```

### Background URLSession

Downloads/uploads that continue when the app is suspended:

```swift
let config = URLSessionConfiguration.background(withIdentifier: "com.example.app.download")
config.sessionSendsLaunchEvents = true
config.isDiscretionary = false  // true for non-urgent transfers

let session = URLSession(configuration: config, delegate: self, delegateQueue: nil)
let task = session.downloadTask(with: url)
task.resume()
```

Handle completion in `AppDelegate`:

```swift
func application(_ application: UIApplication,
                 handleEventsForBackgroundURLSession identifier: String,
                 completionHandler: @escaping () -> Void) {
    // Store completionHandler — call it after URLSession delegate finishes
    backgroundCompletionHandler = completionHandler
}
```

### Info.plist Registration

All background task identifiers must be declared:

```xml
<key>BGTaskSchedulerPermittedIdentifiers</key>
<array>
    <string>com.example.app.refresh</string>
    <string>com.example.app.dbcleanup</string>
</array>
```

### Debugging

Test background tasks in the debugger:

```
e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"com.example.app.refresh"]
```

---

## 3. Universal Links and Deep Links

### Associated Domains (Universal Links)

1. Add the Associated Domains capability: `applinks:example.com`.
2. Host an `apple-app-site-association` file at `https://example.com/.well-known/apple-app-site-association`:

**Legacy format** (using `"paths"`):

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.example.app",
        "paths": ["/posts/*", "/users/*"]
      }
    ]
  }
}
```

**Modern format** (iOS 14+, using `"components"` — preferred):

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["TEAMID.com.example.app"],
        "components": [
          { "/": "/posts/*" },
          { "/": "/users/*" },
          { "/": "/tags/*", "?": { "ref": "?*" } }
        ]
      }
    ]
  }
}
```

> **Note:** The `"paths"` key is legacy. Prefer `"components"` for new projects -- it supports matching query parameters, fragments, and exclusion patterns.

- Served with `Content-Type: application/json`, no redirects.
- Apple CDN caches this — changes can take 24-48 hours to propagate.

### onOpenURL (SwiftUI Deep Link Handler)

```swift
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onOpenURL { url in
                    // Handles both universal links and custom URL schemes
                    router.handleDeepLink(url: url)
                }
        }
    }
}
```

### Custom URL Scheme

Register in Info.plist under `CFBundleURLTypes`:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>myapp</string>
        </array>
    </dict>
</array>
```

Then `myapp://posts/123` arrives via `onOpenURL`.

### Deep Link Routing Pattern

Centralize route parsing so multiple entry points (universal links, URL scheme, notifications) share the same logic:

```swift
enum DeepLink {
    case post(id: String)
    case profile(id: String)
    case tag(name: String)

    init?(url: URL) {
        let components = url.pathComponents
        if components.count >= 3, components[1] == "posts" {
            self = .post(id: components[2])
        } else if components.count >= 3, components[1] == "users" {
            self = .profile(id: components[2])
        } else if components.count >= 3, components[1] == "tags" {
            self = .tag(name: components[2])
        } else {
            return nil
        }
    }
}

// In RouterPath or equivalent:
func handleDeepLink(url: URL) {
    // Convert custom scheme to https for uniform parsing
    let normalized = url.absoluteString
        .replacingOccurrences(of: "myapp://", with: "https://example.com/")
    guard let normalized = URL(string: normalized),
          let link = DeepLink(url: normalized) else { return }

    switch link {
    case .post(let id):    navigate(to: .statusDetail(id: id))
    case .profile(let id): navigate(to: .accountDetail(id: id))
    case .tag(let name):   navigate(to: .hashTag(tag: name, account: nil))
    }
}
```

- Keep route enum and `NavigationStack` destinations aligned.
- Handle scheme-to-https normalization in one place.

---

## 4. WidgetKit

### Core Protocols

Every widget needs three things:

```swift
import WidgetKit
import SwiftUI

// 1. Entry — a snapshot of data at a point in time
struct MyEntry: TimelineEntry {
    let date: Date
    let title: String
    let value: Int
}

// 2. Provider — supplies timeline entries
struct MyProvider: TimelineProvider {
    func placeholder(in context: Context) -> MyEntry {
        MyEntry(date: .now, title: "Placeholder", value: 0)
    }

    func getSnapshot(in context: Context, completion: @escaping (MyEntry) -> Void) {
        completion(MyEntry(date: .now, title: "Snapshot", value: 42))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<MyEntry>) -> Void) {
        // Fetch data, build entries
        let entry = MyEntry(date: .now, title: "Live", value: 99)
        let timeline = Timeline(entries: [entry], policy: .atEnd)
        completion(timeline)
    }
}

// 3. Widget — glues it together
struct MyWidget: Widget {
    let kind = "MyWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MyProvider()) { entry in
            MyWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("My Widget")
        .description("Shows a value")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

### Intent-Based Configuration (User-Configurable Widgets)

Use `AppIntentTimelineProvider` with `AppIntentConfiguration` for widgets the user can configure:

```swift
import AppIntents

struct MyWidgetConfig: WidgetConfigurationIntent {
    static let title: LocalizedStringResource = "Widget Settings"
    static let description = IntentDescription("Configure your widget")

    @Parameter(title: "Account")
    var account: AccountEntity?
}

struct MyIntentProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> MyEntry { ... }
    func snapshot(for configuration: MyWidgetConfig, in context: Context) async -> MyEntry { ... }
    func timeline(for configuration: MyWidgetConfig, in context: Context) async -> Timeline<MyEntry> { ... }
}
```

### Widget Families

| Family | Size | Use Case |
|--------|------|----------|
| `systemSmall` | 2x2 grid cell | Single glanceable value |
| `systemMedium` | 4x2 | Short list, key metrics |
| `systemLarge` | 4x4 | Detailed list, chart |
| `systemExtraLarge` | 8x4 (iPad) | Dashboard layout |
| `accessoryCircular` | Lock Screen circle | Single icon/gauge |
| `accessoryRectangular` | Lock Screen rectangle | 2-3 line summary |
| `accessoryInline` | Lock Screen inline text | Single text line |

### Data Sharing via App Groups

Widgets run in a separate process. Share data through App Groups (see [section 5](#5-app-groups)):

```swift
// Main app — write
let defaults = UserDefaults(suiteName: "group.com.example.app")
defaults?.set(count, forKey: "unreadCount")
WidgetCenter.shared.reloadAllTimelines()

// Widget — read
let defaults = UserDefaults(suiteName: "group.com.example.app")
let count = defaults?.integer(forKey: "unreadCount") ?? 0
```

### Key Points

- Widgets are primarily glanceable. On iOS 17+ / macOS 14+, simple `Button` and `Toggle` controls can run App Intents without opening the app; on earlier OS versions use `Link` or `widgetURL`.
- Use `containerBackground(_:for:)` for iOS 17+ widget backgrounds.
- Call `WidgetCenter.shared.reloadTimelines(ofKind:)` when app data changes.
- Use `#Preview(as:)` macro for widget previews.

---

## 5. App Groups

Enable in Xcode: target > Signing & Capabilities > App Groups. Add the **same group identifier** to each target (app, widget extension, notification extension).

### Shared UserDefaults

```swift
let sharedDefaults = UserDefaults(suiteName: "group.com.example.app")

// Write (main app)
sharedDefaults?.set(authToken, forKey: "currentToken")

// Read (extension)
let token = sharedDefaults?.string(forKey: "currentToken")
```

### Shared File Container

```swift
let containerURL = FileManager.default.containerURL(
    forSecurityApplicationGroupIdentifier: "group.com.example.app"
)!

// Write a file
let fileURL = containerURL.appendingPathComponent("cache.json")
try data.write(to: fileURL)

// Read from extension
let data = try Data(contentsOf: fileURL)
```

### Keychain Sharing

Use Keychain Access Groups for shared secrets (tokens, keys):

```swift
let keychain = KeychainSwift()
keychain.accessGroup = "TEAMID.com.example.shared"
keychain.set(token, forKey: "oauthToken", withAccess: .accessibleAfterFirstUnlock)
```

### Communication Between App and Extensions

| Mechanism | Direction | Use Case |
|-----------|-----------|----------|
| Shared UserDefaults | Both | Small values, settings, counts |
| Shared file container | Both | Larger data, caches, databases |
| Keychain Access Groups | Both | Secrets, tokens |
| `WidgetCenter.reloadTimelines` | App to widget | Trigger widget refresh |
| `NSUserActivity` / deep links | Widget to app | Launch app from widget tap |
| Darwin notifications | Both | Real-time cross-process signals |

---

## 6. StoreKit 2

### Loading Products

```swift
import StoreKit

let productIDs = ["com.example.app.pro", "com.example.app.yearly"]
let products = try await Product.products(for: productIDs)

for product in products {
    // product.displayName, product.displayPrice, product.type
}
```

### Purchasing

```swift
func purchase(_ product: Product) async throws -> Bool {
    let result = try await product.purchase()

    switch result {
    case .success(let verification):
        let transaction = try checkVerified(verification)
        await transaction.finish()
        return true
    case .userCancelled:
        return false
    case .pending:
        // Waiting for approval (Ask to Buy, SCA)
        return false
    @unknown default:
        return false
    }
}

func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
    switch result {
    case .unverified(_, let error):
        throw error
    case .verified(let safe):
        return safe
    }
}
```

### Listening for Transactions

Start at app launch to handle transactions completed outside the app (renewals, Ask to Buy approvals, refunds):

```swift
func listenForTransactions() -> Task<Void, Error> {
    Task.detached {
        for await result in Transaction.updates {
            guard let transaction = try? self.checkVerified(result) else { continue }
            await self.updateEntitlements(for: transaction)
            await transaction.finish()
        }
    }
}
```

### Subscription Status

```swift
func checkSubscriptionStatus() async throws -> Bool {
    guard let statuses = try await Product.SubscriptionInfo
        .status(for: "com.example.app.subscriptionGroup") as? [Product.SubscriptionInfo.Status] else {
        return false
    }

    for status in statuses {
        guard let transaction = try? checkVerified(status.transaction) else { continue }
        if status.state == .subscribed || status.state == .inGracePeriod {
            return true
        }
    }
    return false
}
```

### Renewal Info

```swift
if let status = statuses.first,
   let renewalInfo = try? checkVerified(status.renewalInfo) {
    renewalInfo.willAutoRenew       // Will renew?
    renewalInfo.expirationReason    // Why it expired
    renewalInfo.gracePeriodExpirationDate
}
```

### Restoring Purchases

StoreKit 2 syncs automatically. For an explicit restore button:

```swift
try await AppStore.sync()
```

Then re-check `Transaction.currentEntitlements`:

```swift
func refreshEntitlements() async {
    var activeProductIDs: Set<String> = []
    for await result in Transaction.currentEntitlements {
        if let transaction = try? checkVerified(result) {
            activeProductIDs.insert(transaction.productID)
        }
    }
    // Update app state with activeProductIDs
}
```

### Testing

- **Xcode StoreKit Testing**: Add a StoreKit Configuration file, enable it in scheme settings. Supports purchase flows, subscription renewal, refunds.
- **Sandbox**: Use sandbox Apple ID for end-to-end APNs + server verification testing. Subscriptions renew at accelerated intervals (monthly = 5 min).
- **Transaction Manager**: Xcode > Debug > StoreKit > Manage Transactions — simulate refunds, revocations, offer code redemption.

### Checklist

- Always call `transaction.finish()` after granting entitlements.
- Listen for `Transaction.updates` from app launch.
- Verify transactions with `VerificationResult` before granting access.
- Handle `.pending` state for Ask to Buy and Strong Customer Authentication.
- Use `Product.SubscriptionInfo.status` rather than storing expiry dates locally.
- Show a restore button (App Store requirement).

---

## 7. Live Activities

iOS 16.1+ via ActivityKit. Display real-time, glanceable information on the Lock Screen and Dynamic Island.

### Key Types

- `ActivityAttributes` — defines the static and dynamic data for a Live Activity.
- `ActivityConfiguration` — provides the SwiftUI views for Lock Screen and Dynamic Island presentations.
- `Activity.request(attributes:content:)` — starts a new Live Activity.
- `Activity.update(ActivityContent)` — pushes new dynamic state.
- `Activity.end(_:dismissalPolicy:)` — ends the activity.

### Minimal Example

```swift
import ActivityKit

struct DeliveryAttributes: ActivityAttributes {
    // Fixed data for the lifetime of the activity
    let orderNumber: String

    // Dynamic data that changes over time
    struct ContentState: Codable, Hashable {
        let status: String
        let estimatedArrival: Date
    }
}

// Start
let attributes = DeliveryAttributes(orderNumber: "12345")
let initialState = DeliveryAttributes.ContentState(status: "Preparing", estimatedArrival: .now.addingTimeInterval(1800))
let activity = try Activity.request(attributes: attributes, content: .init(state: initialState, staleDate: nil))

// Update
let updatedState = DeliveryAttributes.ContentState(status: "On the way", estimatedArrival: .now.addingTimeInterval(600))
await activity.update(.init(state: updatedState, staleDate: nil))

// End
await activity.end(.init(state: updatedState, staleDate: nil), dismissalPolicy: .default)
```

Live Activities can also be updated via push notifications (ActivityKit push tokens).
