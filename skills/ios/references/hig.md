# iOS Human Interface Guidelines

iOS-specific rules agents commonly get wrong. Generic layout, typography, and color guidance is omitted.

---

## 2. Navigation
**CRITICAL**

### 2.1 — Tab Bar for Top-Level Sections

Use a tab bar for 3–5 top-level sections. Each tab is a distinct category of content.

```swift
TabView {
    HomeView()
        .tabItem { Label("Home", systemImage: "house") }
    SearchView()
        .tabItem { Label("Search", systemImage: "magnifyingglass") }
    ProfileView()
        .tabItem { Label("Profile", systemImage: "person") }
}
```

### 2.1b — iOS 18+ Tab Syntax

On iOS 18+, use the `Tab`-based `TabView` for type-safe, customizable tabs:

```swift
@available(iOS 18, *)
TabView {
    Tab("Home", systemImage: "house") {
        HomeView()
    }
    Tab("Search", systemImage: "magnifyingglass") {
        SearchView()
    }
    Tab("Profile", systemImage: "person") {
        ProfileView()
    }
    // Sidebar automatically generated on iPad
    // Tabs support .badge() and .customizationID()
}
.tabViewStyle(.sidebarAdaptable) // iPad: sidebar, iPhone: tab bar
```

For iOS 17 compatibility, keep the existing `tabItem` API and use `if #available` or target checks.

### 2.2 — Avoid Hamburger Menus for Primary Navigation

On iPhone, hidden global navigation reduces discoverability. Prefer a tab bar or another always-visible navigation surface. Reserve a menu button for secondary actions or compact utilities.

### 2.3 — Large Titles on Primary Views

Use `.navigationBarTitleDisplayMode(.large)` for top-level views. Titles transition to inline on scroll.

### 2.4 — Never Override Back Swipe

The swipe-from-left-edge gesture for back navigation is a system expectation. Never attach custom gesture recognizers that interfere with it.

### 2.5 — Use NavigationStack

Use `NavigationStack` (not deprecated `NavigationView`) with `NavigationPath` for programmatic navigation.

```swift
NavigationStack(path: $path) {
    List(items) { item in
        NavigationLink(value: item) {
            ItemRow(item: item)
        }
    }
    .navigationDestination(for: Item.self) { item in
        ItemDetail(item: item)
    }
}
```

### 2.5b — Use NavigationSplitView for iPad Sidebar Navigation

On iPad, use `NavigationSplitView` for two- or three-column layouts with a sidebar. It collapses automatically to a single column on iPhone.

```swift
NavigationSplitView {
    List(categories, selection: $selectedCategory) { category in
        Label(category.name, systemImage: category.icon)
    }
    .navigationTitle("Categories")
} detail: {
    if let category = selectedCategory {
        CategoryDetailView(category: category)
    } else {
        ContentUnavailableView("Select a Category", systemImage: "sidebar.left")
    }
}
```

### 2.6 — Preserve State Across Navigation

Restore scroll position and input state when navigating back or switching tabs. Use `@SceneStorage` or `@State`.

---

## Accessibility (iOS-specific rules)

- Icon-only buttons and menus need text labels (`Label`, `.accessibilityLabel`); prefer `Label` over `HStack` for icon + text.
- Mark decorative images hidden from VoiceOver; provide alternatives for every custom gesture.
- Honor Reduce Motion, Increase Contrast, Bold Text, and never rely on color alone.
- Support Dynamic Type including accessibility sizes; custom fonts must scale (`relativeTo:`, `@ScaledMetric`).
- Touch targets 44pt minimum; never place controls under the Dynamic Island or home indicator (`ignoresSafeArea()` only for backgrounds).

## 7. Components
**HIGH**

### 7.1 — Button Styles and Roles

**Styles** (`.buttonStyle()`):
- `.borderedProminent` — primary CTA
- `.bordered` — secondary
- `.borderless` — tertiary/inline

**Roles** (`Button(role:)`):
- `.destructive` — red tint for delete/remove actions
- `.cancel` — dismiss or cancel actions

### 7.2 — Alerts for Critical Decisions Only

2 buttons preferred, max 3. Use `.destructive` role. Never for tips or non-critical info.

```swift
.alert("Delete Photo?", isPresented: $showAlert) {
    Button("Delete", role: .destructive) { deletePhoto() }
    Button("Cancel", role: .cancel) { }
} message: {
    Text("This photo will be permanently removed.")
}
```

### 7.3 — Sheets for Scoped Tasks

Always provide dismiss (button and/or swipe). Use `.presentationDetents()` for half-height.

```swift
.sheet(isPresented: $showCompose) {
    NavigationStack {
        ComposeView()
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showCompose = false }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Send") { send() }
                }
            }
    }
    .presentationDetents([.medium, .large])
}
```

### 7.4 — Lists: Inset Grouped Default

`.insetGrouped` list style. Swipe actions for common operations. Minimum 44pt row height.

```swift
List {
    Section("Recent") {
        ForEach(recentItems) { item in
            ItemRow(item: item)
                .swipeActions(edge: .trailing) {
                    Button(role: .destructive) { delete(item) } label: {
                        Label("Delete", systemImage: "trash")
                    }
                }
        }
    }
}
.listStyle(.insetGrouped)
```

### 7.5 — Tab Bar Behavior

- SF Symbols: filled for selected, outline for unselected
- Never hide the tab bar when navigating deeper within a tab
- Badge counts with `.badge()`

### 7.6 — Search

Use `.searchable()` with suggestions and recent searches.

### 7.7 — Context Menus

Long press for secondary actions. Never the only way to access an action.

### 7.8 — Progress Indicators

- Determinate (`ProgressView(value:total:)`) for known duration
- Indeterminate (`ProgressView()`) for unknown
- Never block the entire screen with a spinner

---

## 8. Patterns
**MEDIUM**

### 8.1 — Onboarding: Max 3 Pages, Skippable

Defer sign-in until the user needs authenticated features.

### 8.2 — Loading: Skeleton Views, Not Blocking Spinners

```swift
// Correct — placeholder matching final layout
if isLoading {
    ForEach(0..<5) { _ in
        SkeletonRow()
            .redacted(reason: .placeholder)
    }
}

// Incorrect — blocks the entire view
if isLoading {
    ProgressView("Loading...")
}
```

### 8.3 — Launch Screen Must Match First Screen

No splash logos or branding screens. Match the initial screen for perceived instant launch.

### 8.4 — Modality: Use Sparingly

Modal only when the user must complete or abandon a focused task. Clear dismiss action. Never stack modals on modals.

### 8.5 — Feedback: Visual + Haptic

Immediate feedback for every action: visual state change + haptic for significant actions.

```swift
Button("Complete") { completeTask() }
    .sensoryFeedback(.success, trigger: isComplete)
```

---

## 9. Privacy & Permissions
**HIGH**

### 9.1 — Request Permissions in Context

Request at the moment the user takes an action that needs it — never at launch.

```swift
// Correct — request when user taps
Button("Take Photo") {
    AVCaptureDevice.requestAccess(for: .video) { granted in
        if granted { showCamera = true }
    }
}

// Incorrect — all at launch, no context
func application(_ app: UIApplication, didFinishLaunchingWithOptions ...) {
    AVCaptureDevice.requestAccess(for: .video) { _ in }
    CLLocationManager().requestWhenInUseAuthorization()
}
```

### 9.2 — Explain When the Value Isn't Obvious

A lightweight explainer can improve opt-in for sensitive permissions, especially when the benefit is not immediately obvious. Keep it brief and never mimic the system alert.

```swift
struct LocationExplanation: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "location.fill").font(.largeTitle)
            Text("Find Nearby Stores").font(.headline)
            Text("We use your location to show stores within walking distance. Your location is never shared.")
                .multilineTextAlignment(.center)
            Button("Enable Location") {
                locationManager.requestWhenInUseAuthorization()
            }
            .buttonStyle(.borderedProminent)
            Button("Not Now") { dismiss() }
                .foregroundStyle(.secondary)
        }
        .padding()
    }
}
```

### 9.3 — Sign in with Apple

If the app offers third-party sign-in (Google, Facebook, etc.), it must also offer Sign in with Apple as an equivalent option. Present it prominently alongside other providers.

### 9.4 — Don't Require Accounts Unless Necessary

Let users explore before requiring sign-in. Gate only features that genuinely need authentication.

### 9.5 — Location Button for One-Time Access

```swift
LocationButton(.currentLocation) {
    fetchNearbyStores()
}
```

---

## 10. System Integration
**MEDIUM**

### 10.1 — Widgets

Provide WidgetKit widgets for frequently checked information.

### 10.2 — App Shortcuts

```swift
struct MyAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: StartWorkoutIntent(),
            phrases: ["Start a workout in \(.applicationName)"],
            shortTitle: "Start Workout",
            systemImageName: "figure.run"
        )
    }
}
```

### 10.3 — Spotlight Indexing

Index content with `CSSearchableItem`.

### 10.4 — Share Sheet

```swift
ShareLink(item: article.url) {
    Label("Share", systemImage: "square.and.arrow.up")
}
```

### 10.5 — Live Activities

Use Live Activities and Dynamic Island for real-time, time-bound events.

### 10.6 — Handle Interruptions Gracefully

Save state on calls, Siri, notifications, app switcher.

```swift
@Environment(\.scenePhase) var scenePhase

.onChange(of: scenePhase) { _, newPhase in
    switch newPhase {
    case .active: resumeActivity()
    case .inactive: pauseActivity()
    case .background: saveState()
    @unknown default: break
    }
}
```

---

## Anti-Patterns

1. **Hamburger menus** — Use a tab bar. Hamburger menus reduce discoverability.
2. **Breaking back swipe** — Never attach custom gestures to the left edge.
3. **Full-screen spinners** — Use skeleton views or inline progress.
4. **Splash screens with logos** — Launch screen must mirror the first screen.
5. **Permissions at launch** — Ask in context or users will deny everything.
6. **Hardcoded font sizes** — Use text styles for Dynamic Type support.
7. **Color-only state indicators** — Pair with icons or text for colorblind users.
8. **Alerts for non-critical info** — Use banners or inline messages.
9. **Hiding the tab bar on push** — Tab bar stays visible within a tab.
10. **Ignoring safe areas** — `.ignoresSafeArea()` on content clips under notch/Dynamic Island.
11. **Non-dismissable modals** — Every modal needs a clear exit path.
12. **Custom gestures without alternatives** — Always provide a visible button/menu.
13. **Tiny touch targets** — 44pt minimum, no exceptions.
14. **Stacked modals** — Use navigation within a single modal.
15. **Dark Mode as afterthought** — Use semantic colors from the start.

---

