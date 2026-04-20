---
name: ios
description: Build native iOS apps with SwiftUI. Covers architecture (project structure, state ownership, concurrency, DI, testing), SwiftUI UI patterns and refactors, App Intents and system surfaces, performance audits, Human Interface Guidelines, theming, UIKit bridging, and localization/internationalization. Use when building, reviewing, refactoring, or diagnosing iOS/iPhone SwiftUI apps.
---

# iOS Development

## Quick start

Choose the narrowest path that matches the request:

- **New screen or feature**: start with `references/architecture.md`, then `references/components.md`.
- **Refactor a large SwiftUI view**: start with `references/architecture.md`, then `references/code-review.md` and `references/components.md`.
- **Performance issue or janky scrolling**: start with `references/performance.md`.
- **App Intents, Siri, Spotlight, widgets, or Action Button**: start with `references/app-intents.md`.
- **Design system or visual polish**: start with `references/theming.md` and `references/hig.md`.
- **iOS 26+ Liquid Glass UI**: start with `references/liquid-glass.md`.
- **UIKit bridge or representables**: start with `references/uikit-bridge.md`.

Prefer SwiftUI-native state first. Introduce a view model only when the feature needs a reference type for async orchestration, cross-section feature state, or a clearer testing seam.

Use adjacent skills when the task is narrower than this general iOS skill:

- `ios-debugger` for simulator build/run/UI inspection with XcodeBuildMCP.
- `swift-concurrency` for actor isolation, Sendable, or Swift 6.2 compiler diagnostics.
- `apple-release` for signing, archiving, notarization, TestFlight, or App Store submission.
- `app-review` for pre-submission rejection audits.

## Core Principles

- Keep views declarative and lightweight; put durable business logic in services, models, or a view model only when one materially improves the design.
- Use semantic system styles or app design tokens (fonts, colors, materials) — avoid ad hoc hardcoded visual values.
- Make loading, empty, error, and success states explicit.
- Every interactive element: 44pt minimum, accessible, keyboard-navigable.

### Deployment Target

- **Default: iOS 17+** — recommended for `@Observable`, `#Preview`, `sensoryFeedback`, `contentMargins`, modern SwiftUI APIs.
- Use `if #available(iOS 18, *)` or `@available(iOS 18, *)` for iOS 18+ APIs: new `Tab` syntax, zoom transitions, mesh gradients, custom containers.
- Use `if #available(iOS 26, *)` for Liquid Glass APIs (`glassEffect`, `GlassEffectContainer`, glass button styles) and always provide a non-glass fallback.
- iOS 16 support only when business requirements demand it — comes with significant SwiftUI limitations (no `@Observable`, limited navigation).

## References

Read the relevant reference based on the task:

### `references/project-setup.md`

Read when creating a new iOS project, setting up XcodeGen, configuring build settings, setting up linting/formatting, or troubleshooting build/display issues (letterboxing, missing Info.plist, asset catalog errors).

Covers: directory layout, XcodeGen `project.yml` template, full Makefile (build, run, test, lint, format, setup, release, version bumping), `.gitignore`, `.swiftlint.yml` with custom architecture/theming/HIG rules, `.swiftformat` config, `ExportOptions.plist`, `CLAUDE.md` template, pre-commit hook setup, asset catalog setup, common gotchas (app not filling screen, background not extending behind safe areas, code signing errors, SwiftFormat/SwiftLint conflicts).

### `references/architecture.md`

Read when scaffolding features, refactoring structure, setting up DI, managing state, writing tests, or reviewing PR quality.

Covers: project structure, @Observable architecture, dependency injection, structured concurrency, state management, navigation, logging (category-based os.Logger, privacy annotations), error handling, pure decision engines (extracting complex branching into testable structs), performance, testing.

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

### `references/liquid-glass.md`

Read when adopting iOS 26+ Liquid Glass surfaces, reviewing native glass usage, or adding glass treatments with availability fallbacks.

Covers: `glassEffect`, `GlassEffectContainer`, interactive glass, glass button styles, modifier ordering, morphing transitions, fallback materials, and review/implementation checklists.

### `references/persistence.md`

Read when implementing data storage, choosing a persistence strategy, setting up SwiftData or Core Data, storing credentials, or caching data to disk.

Covers: SwiftData (@Model, @Query, ModelContainer, relationships, predicates, CRUD), schema migration (VersionedSchema, SchemaMigrationPlan, lightweight vs custom), Core Data (NSPersistentContainer, NSFetchRequest, migration), @AppStorage (UserDefaults, custom RawRepresentable types, @Observable bridge), Keychain (Security framework, protocol-based access, Codable storage), Codable-to-file (JSON settings, actor-based caches), decision guide.

### `references/cloudkit.md`

Read when implementing iCloud sync, CloudKit integration, cross-device data sharing, or choosing between sync strategies.

Covers: SwiftData + CloudKit (ModelConfiguration, schema restrictions, debugging sync), NSUbiquitousKeyValueStore (key-value sync, limits, change observation), direct CloudKit API (CKRecord CRUD, CKQuery, CKAsset, batch operations), subscriptions and push (CKDatabaseSubscription, CKQuerySubscription, silent push), sharing (CKShare, participant roles, accepting shares), conflict resolution (field-level merge, server change tokens, differential sync), error handling (CKError codes, retry logic), testing (CloudKit Dashboard, mock protocol layer), decision guide.

### `references/testing.md`

Read when writing unit tests, UI tests, setting up mocks, testing async code, adding snapshot tests, or reviewing test coverage.

Covers: Swift Testing framework (@Test, #expect, @Suite, traits, parameterized tests), XCTest essentials (XCTestCase, assertions, expectations), testing @Observable models, stores, and view models, async test patterns (ActorIsolated, withMainSerialExecutor, polling waits), protocol-based mocking (actor mocks, multi-protocol mocks, tracking mocks, closure-based DI), snapshot testing (swift-snapshot-testing with device configs), UI testing with XCUIApplication (launch config, accessibility queries, wait helpers, screenshots), preview-based testing, scenario-based state machine testing (declarative time-stamped steps, dependency-injected time control).

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
