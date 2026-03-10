# iOS Human Interface Guidelines

## Table of Contents

1. [Layout & Safe Areas](#1-layout--safe-areas) — CRITICAL
2. [Navigation](#2-navigation) — CRITICAL
3. [Typography & Dynamic Type](#3-typography--dynamic-type) — HIGH
4. [Color & Dark Mode](#4-color--dark-mode) — HIGH
5. [Accessibility](#5-accessibility) — CRITICAL
6. [Gestures & Input](#6-gestures--input) — HIGH
7. [Components](#7-components) — HIGH
8. [Patterns](#8-patterns) — MEDIUM
9. [Privacy & Permissions](#9-privacy--permissions) — HIGH
10. [System Integration](#10-system-integration) — MEDIUM
11. [Quick Reference](#quick-reference)
12. [Anti-Patterns](#anti-patterns)
13. [Evaluation Checklist](#evaluation-checklist)

---

## 1. Layout & Safe Areas
**CRITICAL**

### 1.1 — Minimum 44pt Touch Targets

All interactive elements must have a minimum tap target of 44x44pt.

```swift
// Correct
Button("Save") { save() }
    .frame(minWidth: 44, minHeight: 44)

// Incorrect — icon with no padding, too small to tap reliably
Button(action: save) {
    Image(systemName: "checkmark")
        .font(.system(size: 20))
}
```

### 1.2 — Respect Safe Areas

Never place interactive or essential content under the status bar, Dynamic Island, or home indicator. Use `.ignoresSafeArea()` only for background fills, images, or decorative elements — never for text or interactive controls.

```swift
// Incorrect
VStack {
    Text("Content")
}
.ignoresSafeArea() // Content clipped under notch/Dynamic Island
```

### 1.3 — Primary Actions in the Thumb Zone

Place primary actions at the bottom of the screen where the user's thumb naturally rests. Secondary actions and navigation belong at the top.

```swift
// Correct
VStack {
    ScrollView { /* content */ }
    Button("Continue") { next() }
        .buttonStyle(.borderedProminent)
        .padding()
}
```

### 1.4 — Support All iPhone Screen Sizes

Design for iPhone SE (375pt wide) through iPhone Pro Max (430pt wide). Use flexible layouts, avoid hardcoded widths.

```swift
// Correct — adapts to screen width
HStack(spacing: 12) {
    ForEach(items) { item in
        CardView(item: item)
            .frame(maxWidth: .infinity)
    }
}

// Incorrect — breaks on SE, wastes space on Pro Max
CardView(item: item)
    .frame(width: 180)
```

### 1.5 — 8pt Grid Alignment

Align spacing, padding, and element sizes to multiples of 8pt (8, 16, 24, 32, 40, 48). Use 4pt for fine adjustments.

### 1.6 — Landscape Support

Support landscape unless the app is task-specific (e.g., camera). Use `ViewThatFits` or `GeometryReader` for adaptive layouts.

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

## 3. Typography & Dynamic Type
**HIGH**

### 3.1 — Use Built-in Text Styles

Always use semantic text styles. These scale automatically with Dynamic Type.

```swift
// Correct
Text("Title").font(.headline)
Text("Body").font(.body)
Text("Updated 2h ago").font(.caption).foregroundStyle(.secondary)

// Incorrect — won't scale with Dynamic Type
Text("Title").font(.system(size: 17, weight: .semibold))
```

### 3.2 — Support Accessibility Sizes

Dynamic Type scales up to ~200% at largest accessibility sizes. Layouts must reflow — never truncate essential text.

```swift
@Environment(\.dynamicTypeSize) var dynamicTypeSize

var body: some View {
    if dynamicTypeSize.isAccessibilitySize {
        VStack(alignment: .leading) { content }
    } else {
        HStack { content }
    }
}
```

### 3.3 — Custom Fonts Must Scale

Scale custom fonts with `relativeTo:` so they respond to Dynamic Type.

```swift
Text("Hello")
    .font(.custom("CustomFont-Regular", size: 17, relativeTo: .body))
```

### 3.4 — Treat 11pt as a Practical Floor for Readable UI Copy

For standard UI text, avoid going smaller than `caption2` (11pt). Go smaller only for decorative, zoomable, or clearly nonessential content.

### 3.5 — Hierarchy Through Weight and Size

Establish visual hierarchy through font weight and size, not solely color.

---

## 4. Color & Dark Mode
**HIGH**

### 4.1 — Use Semantic System Colors

```swift
// Correct — adapts to light/dark
Text("Primary").foregroundStyle(.primary)
Text("Secondary").foregroundStyle(.secondary)
VStack { }.background(Color(.systemBackground))

// Incorrect — invisible on dark backgrounds
Text("Primary").foregroundColor(.black)
VStack { }.background(.white)
```

### 4.2 — Light and Dark Variants for Custom Colors

Define custom colors in the asset catalog with Both Appearances variants.

```swift
// In Assets.xcassets: "BrandBlue"
// Any Appearance: #0066CC, Dark Appearance: #4DA3FF
Text("Brand").foregroundStyle(Color("BrandBlue"))
```

### 4.3 — Never Rely on Color Alone

Pair color with text, icons, or shapes. ~8% of men have color vision deficiency.

```swift
// Correct
HStack {
    Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.red)
    Text("Error: Invalid email").foregroundStyle(.red)
}

// Incorrect — only color indicates error
TextField("Email", text: $email)
    .border(isValid ? .green : .red)
```

### 4.4 — 4.5:1 Contrast Ratio Minimum

All text must meet WCAG AA: 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt+ bold).

### 4.5 — Background Hierarchy

Use the three-level system for depth:
- `systemBackground` — primary surface
- `secondarySystemBackground` — grouped content, cards
- `tertiarySystemBackground` — elements within grouped content

### 4.6 — One Accent Color

Single tint/accent for all interactive elements (buttons, links, toggles).

```swift
ContentView()
    .tint(.indigo) // All interactive elements use indigo
```

---

## 5. Accessibility
**CRITICAL**

### 5.1 — VoiceOver Labels on All Interactive Elements

```swift
// Correct
Button(action: addToCart) {
    Image(systemName: "cart.badge.plus")
}
.accessibilityLabel("Add to cart")

// Incorrect — VoiceOver reads "cart.badge.plus"
```

### 5.2 — Logical VoiceOver Order

Use `.accessibilitySortPriority()` when visual layout doesn't match reading order.

### 5.3 — Support Bold Text

SwiftUI text styles handle this automatically. For custom text, use the SwiftUI environment value:

```swift
@Environment(\.legibilityWeight) var legibilityWeight
// legibilityWeight == .bold when Bold Text is enabled
```

### 5.4 — Support Reduce Motion

```swift
@Environment(\.accessibilityReduceMotion) var reduceMotion

CardView()
    .animation(reduceMotion ? nil : .spring(), value: isExpanded)
```

### 5.5 — Support Increase Contrast

Use `@Environment(\.colorSchemeContrast)` to detect. Provide higher-contrast variants for custom colors.

### 5.6 — Alternative Interactions for All Gestures

Every custom gesture must have an equivalent tap-based or menu-based alternative.

### 5.7 — Support Switch Control and Full Keyboard Access

Test navigation order and focus behavior with external switches and Bluetooth keyboards.

---

## 6. Gestures & Input
**HIGH**

### 6.1 — Standard Gesture Vocabulary

| Gesture | Standard Use |
|---------|-------------|
| Tap | Primary action, selection |
| Long press | Context menu, preview |
| Swipe horizontal | Delete, archive, navigate back |
| Swipe vertical | Scroll, dismiss sheet |
| Pinch | Zoom in/out |
| Two-finger rotate | Rotate content |

### 6.2 — Reserved System Gestures

Never intercept:
- Swipe from left edge (back navigation)
- Swipe down from top-left (Notification Center)
- Swipe down from top-right (Control Center)
- Swipe up from bottom (home / app switcher)

### 6.3 — Custom Gestures Must Be Discoverable

Provide visual hints (grabber handles) and ensure the action is also available through a visible button or menu.

---

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

## Quick Reference

| Need | Component | Notes |
|------|-----------|-------|
| Top-level sections (3–5) | `TabView` | Bottom tab bar, SF Symbols |
| Hierarchical drill-down | `NavigationStack` | Large title root, inline children |
| Self-contained task | `.sheet` | Swipe to dismiss, cancel/done |
| Critical decision | `.alert` | 2 buttons preferred, max 3 |
| Secondary actions | `.contextMenu` | Long press; also accessible elsewhere |
| Scrolling content | `List` `.insetGrouped` | 44pt min row, swipe actions |
| Selection (few) | `Picker` | Segmented for 2–5 |
| Selection (on/off) | `Toggle` | Right-aligned in list row |
| Search | `.searchable` | Suggestions, recent searches |
| Known progress | `ProgressView(value:)` | Show percentage |
| Unknown progress | `ProgressView()` | Inline, never full-screen |
| One-time location | `LocationButton` | No persistent permission |
| Sharing | `ShareLink` | System share sheet |
| Haptic feedback | `.sensoryFeedback()` | `.impact`, `.success`, `.selection` |
| Destructive action | `Button(role: .destructive)` | Red tint, confirm via alert |

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

## Evaluation Checklist

### Layout & Safe Areas
- [ ] All touch targets ≥ 44x44pt
- [ ] No content clipped under status bar, Dynamic Island, or home indicator
- [ ] Primary actions in thumb zone (bottom half)
- [ ] Layout adapts from SE to Pro Max
- [ ] Spacing on 8pt grid

### Navigation
- [ ] Tab bar for 3–5 top-level sections
- [ ] No hamburger/drawer menus
- [ ] Primary views use large titles
- [ ] Back swipe works throughout
- [ ] State preserved when switching tabs

### Typography
- [ ] All text uses semantic styles or scaled custom fonts
- [ ] Dynamic Type supported including accessibility sizes
- [ ] Layouts reflow at large sizes (no truncation)
- [ ] Minimum 11pt text

### Color & Dark Mode
- [ ] Semantic system colors or light/dark asset variants
- [ ] Dark Mode looks intentional
- [ ] No info conveyed by color alone
- [ ] Text contrast ≥ 4.5:1 (normal) or 3:1 (large)
- [ ] Single accent color for interactive elements

### Accessibility
- [ ] VoiceOver reads all screens with meaningful labels
- [ ] Bold Text respected
- [ ] Reduce Motion disables decorative animations
- [ ] Increase Contrast variant for custom colors
- [ ] All gestures have alternative access

### Components
- [ ] Alerts only for critical decisions
- [ ] Sheets have dismiss path (button and/or swipe)
- [ ] List rows ≥ 44pt
- [ ] Tab bar never hidden during navigation
- [ ] Destructive buttons use `.destructive` role

### Privacy
- [ ] Permissions requested in context, not at launch
- [ ] Custom explanation before system permission dialog
- [ ] Sign in with Apple offered alongside other providers
- [ ] App usable without account for basic features

### System Integration
- [ ] Widgets show glanceable, up-to-date info
- [ ] Content indexed for Spotlight
- [ ] Share Sheet available for shareable content
- [ ] Interruptions handled gracefully (calls, background, Siri)
