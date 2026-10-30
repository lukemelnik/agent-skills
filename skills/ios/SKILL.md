---
name: ios
description: Build, review, and refactor native iOS SwiftUI apps: architecture, UI patterns, App Intents, performance, HIG, theming, UIKit bridging, and localization. Use for iPhone SwiftUI work.
---

# iOS Development

## Quick start

Choose the narrowest path that matches the request:

- **New screen or feature**: start with `references/architecture.md`, then `references/components.md`.
- **Refactor a large SwiftUI view**: start with `references/architecture.md`, then `references/code-review.md` and `references/components.md`.
- **Code review or quality audit**: start with `references/code-review.md`, then load only the relevant topical references.
- **Protocol customization or object-lifetime bug**: start with `references/architecture.md` for dispatch through abstractions and ownership in optimized builds.
- **Performance issue or janky scrolling**: start with `references/performance.md`.
- **Instruments `.trace` file analysis**: start with `references/performance.md`, then use `ios-debugger` if simulator/device reproduction is needed.
- **App Intents, Siri, Spotlight, widgets, or Action Button**: start with `references/app-intents.md`.
- **Design system or visual polish**: start with `references/theming.md` and `references/hig.md`.
- **iOS 26+ Liquid Glass UI**: use the `liquid-glass` skill.
- **UIKit bridge or representables**: start with `references/uikit-bridge.md`.

Prefer SwiftUI-native state first. Introduce a view model only when the feature needs a reference type for async orchestration, cross-section feature state, or a clearer testing seam.

When reviewing code, run a fast modern-API/deprecation pass first using `references/code-review.md`, then dive into architecture/performance/accessibility specifics.

Use adjacent skills when the task is narrower than this general iOS skill:

- `ios-debugger` for simulator build/run/UI inspection with XcodeBuildMCP.
- `liquid-glass` for Liquid Glass adoption on iOS 26+.
- `swift-concurrency` for actor isolation, Sendable, or Swift 6.2 compiler diagnostics.
- `apple-release` for signing, archiving, notarization, TestFlight, or App Store submission.
- `app-review` for pre-submission rejection audits.

## Core Principles

- Keep views declarative and lightweight; put durable business logic in services, models, or a view model only when one materially improves the design.
- Report only genuine, user-impacting issues during review; avoid speculative nitpicks.
- Prefer native SwiftUI APIs over UIKit bridging unless bridging is required by a concrete capability gap.
- Do not add third-party frameworks unless the user explicitly requests or approves them.
- Use semantic system styles or app design tokens (fonts, colors, materials) — avoid ad hoc hardcoded visual values.
- Make loading, empty, error, and success states explicit.
- Every interactive element: 44pt minimum, accessible, keyboard-navigable, and clearly labeled for assistive tech.
- Treat the accessibility tree as part of the app contract: add stable accessibility identifiers for controls that tests or automation need to target, especially repeated, icon-only, or ambiguous controls.

### Deployment Target

- **Default: iOS 17+** — recommended for `@Observable`, `#Preview`, `sensoryFeedback`, `contentMargins`, modern SwiftUI APIs.
- Use `if #available(iOS 18, *)` or `@available(iOS 18, *)` for iOS 18+ APIs: new `Tab` syntax, zoom transitions, mesh gradients, custom containers.
- Use `if #available(iOS 26, *)` for Liquid Glass APIs (`glassEffect`, `GlassEffectContainer`, glass button styles) and always provide a non-glass fallback.

## References

Read the relevant reference based on the task:

### `references/project-setup.md`

Read when creating a new iOS project, setting up XcodeGen, configuring build settings, setting up linting/formatting, or troubleshooting build/display issues (letterboxing, missing Info.plist, asset catalog errors).

Covers: directory layout, XcodeGen `project.yml`, Makefile, `.gitignore`, SwiftLint/SwiftFormat config, `ExportOptions.plist`, `AGENTS.md` template, pre-commit hook, asset catalog, common gotchas.

### `references/architecture.md`

Read when scaffolding features, refactoring structure, setting up DI, managing state, writing tests, or reviewing PR quality.

Covers: project structure, @Observable architecture, DI, protocol dispatch, object lifetimes, state, navigation, logging convention, error handling, decision engines.

### `references/hig.md`

Read when designing UI, reviewing HIG compliance, implementing navigation patterns, handling accessibility, or auditing an app before release.

Covers: iOS-specific navigation, accessibility, components, patterns, privacy/permissions, system integration, anti-patterns.

### `references/theming.md`

Read when setting up a design system, defining color tokens, building a theme object, implementing dark mode, creating reusable component styles, or adding multi-theme support.

Covers: theming pipeline (raw values → semantic tokens → observable theme → environment injection), hex Color extension, ColorSet protocol, @Observable Theme class with persistence, ThemeApplier modifier, typography system (custom fonts, Dynamic Type, @ScaledMetric), spacing/shape constants, custom ButtonStyle/ViewModifier patterns, three-mode dark mode, accessibility (contrast detection, high-contrast variants, Bold Text), cross-platform (iOS + macOS).

### `references/capabilities.md`

Read when implementing push notifications, background tasks, deep linking, widgets, App Groups, or in-app purchases.

Covers: UNUserNotificationCenter setup, APNs registration, Notification Service Extension, BGAppRefreshTask/BGProcessingTask, background URLSession, universal links, onOpenURL deep link routing, WidgetKit (AppIntentTimelineProvider, families, intent configuration), App Groups (shared UserDefaults, file container, keychain), StoreKit 2 (products, transactions, subscriptions, restore, testing).

### `references/app-intents.md`

Read when implementing App Intents, Siri integration, Shortcuts support, interactive widgets, Spotlight indexing of app content, Focus Filters, or Action Button actions.

Covers: AppIntent protocol (perform, return types, openAppWhenRun), @Parameter (types, requestValue, requestDisambiguation, requestConfirmation), AppEntity (EntityQuery, EntityStringQuery, displayRepresentation), AppShortcutsProvider (phrases, ShortcutsLink, SiriTipView), IndexedEntity for Spotlight, interactive widget buttons/toggles (iOS 17+), SetFocusFilterIntent, Action Button registration, Siri dialog patterns, testing intents, common patterns (favorites, open item, create, widget refresh).

### `references/persistence.md`

Read when implementing data storage, choosing a persistence strategy, SwiftData, or storing credentials.

Covers: SwiftData gotchas, predicate pitfalls, migration, Keychain, decision guide.

### `references/cloudkit.md`

Read when implementing iCloud sync, CloudKit integration, cross-device data sharing, or choosing between sync strategies.

Covers: SwiftData+CloudKit schema restrictions and CKError gotchas.

### `references/testing.md`

Read when writing unit tests, UI tests, setting up mocks, testing async code, adding snapshot tests, or reviewing test coverage.

Covers: Swift Testing rules and gotchas, async/mocking/snapshot conventions, UI testing, scenario-based state machine testing.

### `references/uikit-bridge.md`

Read when bridging UIKit views or view controllers into SwiftUI, embedding SwiftUI inside UIKit, or troubleshooting interop issues.

Covers: UIViewRepresentable (makeUIView, updateUIView, dismantleUIView, sizeThatFits, Coordinator pattern), UIViewControllerRepresentable (camera, mail, document picker, Safari), common bridges (UITextView rich text, MKMapView, WKWebView, PKCanvasView, camera preview), state bridging (@Binding two-way flow, preventing update loops), UIHostingController (embedding SwiftUI in UIKit, sizing, table/collection cells), layout/sizing, Swift 6 concurrency (@MainActor coordinators, Sendable, nonisolated), common mistakes.

### `references/code-review.md`

Read when reviewing PRs, auditing existing code, or writing new SwiftUI code. Covers deprecated API replacements (with before/after examples), modern Swift idioms to enforce, and view organization rules.

### `references/performance.md`

Read when diagnosing slow rendering, janky scrolling, high CPU/memory usage, excessive view updates, or layout thrash in SwiftUI apps.

Covers: audit workflow (code-first review, Instruments profiling, SwiftUI timeline lanes), analyzing shared `.trace` bundles, Swift algorithmic complexity and allocation/copy/runtime-frame clues, common code smells with before/after fixes (formatters in body, unstable identity, conditional view swapping, broad observable dependencies, image decoding), hang diagnosis, remediation patterns.

### `references/components.md`

Read when implementing specific SwiftUI views — navigation, forms, sheets, search, loading states.

Covers: navigation, pagination, ScrollView APIs, forms, sheets, search, loading, error/empty states.

### `references/localization.md`

Read when localizing strings, supporting multiple languages, handling RTL layouts, formatting dates/numbers/currency for locales, setting up String Catalogs, or exporting translations.

Covers: String Catalogs (.xcstrings, auto-extraction, pluralization, device variations, grammar agreement, migration), string APIs (LocalizedStringKey, String(localized:), LocalizedStringResource, AttributedString(localized:), decision guide), RTL layout (leading/trailing, image flipping, flexible layouts), per-locale assets and formatting (formatted() API, locale-aware sorting), testing (scheme overrides, pseudolanguages, preview-based), XLIFF export/import.
