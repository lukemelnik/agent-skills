---
name: ios
description: Build native iOS apps with SwiftUI. Covers architecture (project structure, state management, concurrency, DI, testing), Human Interface Guidelines (layout, navigation, typography, color, accessibility, gestures, components, privacy), SwiftUI component patterns, and localization/internationalization. Use when building, reviewing, or refactoring iOS/iPhone SwiftUI apps.
---

# iOS Development

## Core Principles

- Keep views declarative and lightweight; business logic in view models/services.
- Use semantic system styles or app design tokens (fonts, colors, materials) — avoid ad hoc hardcoded visual values.
- Make loading, empty, error, and success states explicit.
- Every interactive element: 44pt minimum, accessible, keyboard-navigable.

### Deployment Target

- **Default: iOS 17+** — recommended for `@Observable`, `#Preview`, `sensoryFeedback`, `contentMargins`, modern SwiftUI APIs.
- Use `if #available(iOS 18, *)` or `@available(iOS 18, *)` for iOS 18+ APIs: new `Tab` syntax, zoom transitions, mesh gradients, custom containers.
- iOS 16 support only when business requirements demand it — comes with significant SwiftUI limitations (no `@Observable`, limited navigation).

## References

Read the relevant reference based on the task:

### `references/architecture.md`

Read when scaffolding features, refactoring structure, setting up DI, managing state, writing tests, or reviewing PR quality.

Covers: project structure, @Observable architecture, dependency injection, structured concurrency, state management, navigation, error handling, performance, testing.

### `references/hig.md`

Read when designing UI, reviewing HIG compliance, implementing navigation patterns, handling accessibility, or auditing an app before release.

Covers: layout rules (safe areas, touch targets, thumb zone), navigation (tab bar, NavigationStack), typography, color/dark mode, accessibility (VoiceOver, Dynamic Type, Reduce Motion), gestures, components, privacy/permissions, system integration, anti-patterns, evaluation checklist.

### `references/theming.md`

Read when setting up a design system, defining color tokens, building a theme object, implementing dark mode, creating reusable component styles, or adding multi-theme support.

Covers: theming pipeline (raw values → semantic tokens → observable theme → environment injection), hex Color extension, ColorSet protocol, @Observable Theme class with persistence, ThemeApplier modifier, typography system (custom fonts, Dynamic Type, @ScaledMetric), spacing/shape constants, custom ButtonStyle/ViewModifier patterns, three-mode dark mode, accessibility (contrast detection, high-contrast variants, Bold Text), cross-platform (iOS + macOS), common mistakes.

### `references/networking.md`

Read when building API clients, defining endpoints, handling auth, uploading media, implementing pagination, or managing thread-safe network state.

Covers: Endpoint protocol pattern, generic request methods (get/post/put/delete), URLSession async/await, OAuth flow, ServerError mapping, cursor-based pagination with Link headers, multipart upload with progress, WebSocket streaming, OSAllocatedUnfairLock thread safety.

### `references/capabilities.md`

Read when implementing push notifications, background tasks, deep linking, widgets, App Groups, or in-app purchases.

Covers: UNUserNotificationCenter setup, APNs registration, Notification Service Extension, BGAppRefreshTask/BGProcessingTask, background URLSession, universal links, onOpenURL deep link routing, WidgetKit (TimelineProvider, families, intent configuration), App Groups (shared UserDefaults, file container, keychain), StoreKit 2 (products, transactions, subscriptions, restore, testing).

### `references/app-intents.md`

Read when implementing App Intents, Siri integration, Shortcuts support, interactive widgets, Spotlight indexing of app content, Focus Filters, or Action Button actions.

Covers: AppIntent protocol (perform, return types, openAppWhenRun), @Parameter (types, requestValue, requestDisambiguation, requestConfirmation), AppEntity (EntityQuery, EntityStringQuery, displayRepresentation), AppShortcutsProvider (phrases, ShortcutsLink, SiriTipView), IndexedEntity for Spotlight, interactive widget buttons/toggles (iOS 17+), SetFocusFilterIntent, Action Button registration, Siri dialog patterns, testing intents, common patterns (favorites, open item, create, widget refresh).

### `references/persistence.md`

Read when implementing data storage, choosing a persistence strategy, setting up SwiftData or Core Data, storing credentials, or caching data to disk.

Covers: SwiftData (@Model, @Query, ModelContainer, relationships, predicates, CRUD), schema migration (VersionedSchema, SchemaMigrationPlan, lightweight vs custom), Core Data (NSPersistentContainer, NSFetchRequest, migration), @AppStorage (UserDefaults, custom RawRepresentable types, @Observable bridge), Keychain (Security framework, protocol-based access, Codable storage), Codable-to-file (JSON settings, actor-based caches), decision guide.

### `references/cloudkit.md`

Read when implementing iCloud sync, CloudKit integration, cross-device data sharing, or choosing between sync strategies.

Covers: SwiftData + CloudKit (ModelConfiguration, schema restrictions, debugging sync), NSUbiquitousKeyValueStore (key-value sync, limits, change observation), direct CloudKit API (CKRecord CRUD, CKQuery, CKAsset, batch operations), subscriptions and push (CKDatabaseSubscription, CKQuerySubscription, silent push), sharing (CKShare, participant roles, accepting shares), conflict resolution (field-level merge, server change tokens, differential sync), error handling (CKError codes, retry logic), testing (CloudKit Dashboard, mock protocol layer), decision guide.

### `references/testing.md`

Read when writing unit tests, UI tests, setting up mocks, testing async code, adding snapshot tests, or reviewing test coverage.

Covers: Swift Testing framework (@Test, #expect, @Suite, traits, parameterized tests), XCTest essentials (XCTestCase, assertions, expectations), testing @Observable ViewModels, async test patterns (ActorIsolated, withMainSerialExecutor, polling waits), protocol-based mocking (actor mocks, multi-protocol mocks, tracking mocks, closure-based DI), snapshot testing (swift-snapshot-testing with device configs), UI testing with XCUIApplication (launch config, accessibility queries, wait helpers, screenshots), preview-based testing.

### `references/uikit-bridge.md`

Read when bridging UIKit views or view controllers into SwiftUI, embedding SwiftUI inside UIKit, or troubleshooting interop issues.

Covers: UIViewRepresentable (makeUIView, updateUIView, dismantleUIView, sizeThatFits, Coordinator pattern), UIViewControllerRepresentable (camera, mail, document picker, Safari), common bridges (UITextView rich text, MKMapView, WKWebView, PKCanvasView, camera preview), state bridging (@Binding two-way flow, preventing update loops), UIHostingController (embedding SwiftUI in UIKit, sizing, table/collection cells), layout/sizing, Swift 6 concurrency (@MainActor coordinators, Sendable, nonisolated), common mistakes.

### `references/charts.md`

Read when building data visualizations, charts, graphs, sparklines, or dashboards with Swift Charts.

Covers: Chart container, mark types (BarMark, LineMark, PointMark, AreaMark, RuleMark, RectangleMark, SectorMark), combining marks, Plottable protocol, ForEach in Chart, date-based data, foregroundStyle/symbol/position styling, custom color scales, axis customization (AxisMarks, labels, formatting, hidden axes), scales (fixed domain, log), interaction (chartXSelection, chartOverlay, scrollable charts), annotations, accessibility (audio graphs, chart descriptors), common patterns (sparkline card, threshold bar chart, multi-series line chart, donut chart, real-time chart).

### `references/code-review.md`

Read when reviewing PRs, auditing existing code, or writing new SwiftUI code. Covers deprecated API replacements (with before/after examples), modern Swift idioms to enforce, and view organization rules.

### `references/performance.md`

Read when diagnosing slow rendering, janky scrolling, high CPU/memory usage, excessive view updates, or layout thrash in SwiftUI apps.

Covers: audit workflow (code-first review, Instruments profiling, SwiftUI timeline lanes), common code smells with before/after fixes (formatters in body, unstable identity, conditional view swapping, broad observable dependencies, image decoding), hang diagnosis, remediation patterns.

### `references/components.md`

Read when implementing specific SwiftUI views — navigation stacks, lists, forms, sheets, search, loading states, animations, gestures.

Covers: NavigationStack/SplitView patterns, programmatic navigation, sheet customization, adaptive layouts, async content loading, skeleton views, haptic feedback, animations, gestures.

### `references/localization.md`

Read when localizing strings, supporting multiple languages, handling RTL layouts, formatting dates/numbers/currency for locales, setting up String Catalogs, or exporting translations.

Covers: String Catalogs (.xcstrings, auto-extraction, pluralization, device variations, grammar agreement, migration), string APIs (LocalizedStringKey, String(localized:), LocalizedStringResource, AttributedString(localized:), decision guide), RTL layout (leading/trailing, image flipping, flexible layouts), per-locale assets and formatting (formatted() API, locale-aware sorting), testing (scheme overrides, pseudolanguages, preview-based), XLIFF export/import, common mistakes.
