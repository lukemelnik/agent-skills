# iOS Localization & Internationalization

## Table of Contents

1. [String Catalogs](#1-string-catalogs)
2. [String APIs](#2-string-apis)
3. [Layout and RTL Support](#3-layout-and-rtl-support)
4. [Per-Locale Assets and Formatting](#4-per-locale-assets-and-formatting)
5. [Testing](#5-testing)
6. [Export/Import for Translators](#6-exportimport-for-translators)
7. [Common Mistakes](#7-common-mistakes)

---

## 1. String Catalogs

### Overview (Xcode 15+)

String Catalogs (`.xcstrings`) replace `.strings` and `.stringsdict` files with a single, editor-friendly JSON file that Xcode manages automatically.

- One `.xcstrings` file per target (or per module) replaces multiple `.strings` + `.stringsdict` pairs.
- Xcode auto-extracts string keys from SwiftUI views and `String(localized:)` calls at build time.
- Pluralization, device variations, and substitution grammar are configured in the Xcode String Catalog editor — no manual `.stringsdict` XML.
- The file is source-control friendly (stable JSON, sorted keys).

### Auto-Extraction

SwiftUI views that take `LocalizedStringKey` are extracted automatically:

```swift
// Both keys are auto-extracted into the String Catalog:
Text("Welcome back")               // key: "Welcome back"
Button("Delete account") { ... }   // key: "Delete account"
```

For non-view contexts, use `String(localized:)` — these are also auto-extracted:

```swift
let title = String(localized: "notification.newFollower")
```

### Pluralization

Configure plural forms directly in the Xcode catalog UI. Supply variants for `zero`, `one`, `two`, `few`, `many`, `other` as needed per language (CLDR rules).

```swift
// In code, just pass the count — the catalog resolves the plural form:
Text("^[\(photoCount) photo](inflect: true)")
```

The `inflect: true` syntax uses Automatic Grammar Agreement (iOS 16+). The system inflects the noun based on the count and language rules.

### Device Variations

The String Catalog editor lets you supply different translations per device class (iPhone, iPad, Mac, Apple Watch, Apple TV). Use this for space-constrained strings like tab labels or button titles.

### Grammar Agreement and Inflection

Use the `^[...]` inflection syntax in localizable strings:

```swift
// Automatic pluralization + inflection:
Text("^[\(count) item](inflect: true)")
// Result: "1 item", "2 items", etc.

// Term-of-address agreement (languages with grammatical gender):
Text("^[\(person.name) added a photo to \(person.pronoun) album](inflect: true)")
```

> **macOS note:** Automatic Grammar Agreement works the same on macOS. Device variations in String Catalogs include a "Mac" category for macOS-specific wording (e.g., "Preferences" vs "Settings").

### Migrating from .strings / .stringsdict

1. In Xcode, right-click an existing `.strings` file → **Migrate to String Catalog**.
2. Xcode converts all keys, translations, and plural rules into a single `.xcstrings` file.
3. Remove the old `.strings` / `.stringsdict` files from the target.
4. Build — Xcode will warn about any keys it couldn't migrate (rare edge cases with complex `.stringsdict` nesting).

## 2. String APIs

### LocalizedStringKey

Implicit in SwiftUI views. Compile-time keys, looked up at render time.

```swift
Text("Hello")                    // LocalizedStringKey, auto-extracted
Text("Hello \(userName)")        // Interpolation is safe and extracted
Label("Settings", systemImage: "gear")  // First param is LocalizedStringKey
```

- Use for all SwiftUI view initializers that accept it.
- Do **not** use for logic, formatting, or non-UI contexts — it cannot be converted to `String` at runtime.

### String(localized:)

Replaces `NSLocalizedString`. Use in ViewModels, services, and anywhere you need a runtime `String`.

```swift
let errorTitle = String(localized: "error.networkUnavailable")
let buttonLabel = String(localized: "action.retry")

// With default value (used as the English translation):
let greeting = String(localized: "greeting.morning",
                      defaultValue: "Good morning!")

// From a specific table:
let legal = String(localized: "terms.acceptance",
                   table: "Legal")
```

### LocalizedStringResource

For passing localizable strings across module/framework boundaries without resolving them immediately. The string is resolved lazily in the consumer's locale context.

```swift
// In a shared framework:
public struct NotificationPayload {
    public let title: LocalizedStringResource
    public let body: LocalizedStringResource
}

// Creating:
let payload = NotificationPayload(
    title: LocalizedStringResource("notification.title",
                                   defaultValue: "New Message"),
    body: LocalizedStringResource("notification.body",
                                  defaultValue: "You have a new message")
)

// Consuming in a view (auto-resolves):
Text(payload.title)

// Consuming as String:
let resolved = String(localized: payload.title)
```

### AttributedString(localized:)

Supports Markdown formatting in localized strings:

```swift
// In String Catalog, value: "Tap **Continue** to accept the _terms_."
let instructions = AttributedString(localized: "onboarding.instructions")

Text(instructions)  // Bold and italic render automatically
```

### String Interpolation in Localized Strings

Safe patterns — the interpolation becomes part of the localization key:

```swift
// Good: interpolation in LocalizedStringKey
Text("Welcome, \(userName)")      // Key: "Welcome, %@"
Text("\(count) items selected")   // Key: "%lld items selected"

// Good: interpolation in String(localized:)
String(localized: "\(count) items remaining")
```

Never concatenate localized strings — word order varies by language.

### When to Use Each API

| Context | API |
|---|---|
| SwiftUI view text (labels, titles, buttons) | `LocalizedStringKey` (implicit) |
| ViewModel / service layer string | `String(localized:)` |
| Passing localizable string across modules | `LocalizedStringResource` |
| Attributed/Markdown localized text | `AttributedString(localized:)` |
| Legacy code / Objective-C interop | `NSLocalizedString` |

## 3. Layout and RTL Support

### Leading/Trailing, Not Left/Right

Always use directional layout values. These flip automatically for RTL languages (Arabic, Hebrew, Farsi, etc.).

```swift
// Correct:
.padding(.leading, 16)
.frame(alignment: .trailing)
HStack { /* content flows leading → trailing */ }

// Wrong — does not flip for RTL:
.padding(.left, 16)
.frame(alignment: .right)
```

### Testing RTL

```swift
// In previews:
MyView()
    .environment(\.layoutDirection, .rightToLeft)
    .environment(\.locale, Locale(identifier: "ar"))

// In tests or app-wide:
// Use Xcode scheme → Options → App Language → "Right-to-Left Pseudolanguage"
```

### Flipping Images

Directional images (arrows, disclosure indicators) should flip for RTL:

```swift
Image(systemName: "chevron.right")
    .flipsForRightToLeftLayoutDirection(true)

// Asset catalog images: select the asset → Attributes Inspector → Direction → "Both" or "Right to Left"
```

### Handling Varying Text Lengths

German text is ~30% longer than English; some Asian languages are shorter. Design for flexibility:

```swift
// Use flexible frames, not fixed widths:
Text(title)
    .lineLimit(2)
    .minimumScaleFactor(0.8)
    .frame(maxWidth: .infinity, alignment: .leading)

// Use Layout Priority for competing space:
HStack {
    Text(description)
        .layoutPriority(1)  // Gets remaining space
    Spacer(minLength: 8)
    actionButton
}
```

### Locale-Specific Layout Adjustments

```swift
@ViewBuilder
var body: some View {
    if locale.language.languageCode == .arabic {
        // Custom layout for Arabic if standard RTL isn't sufficient
        arabicSpecificLayout
    } else {
        standardLayout
    }
}
```

> **macOS note:** macOS respects the same `leading`/`trailing` semantics. NSView-based code should use `.leading`/`.trailing` constraints, not `.left`/`.right`.

## 4. Per-Locale Assets and Formatting

### Localized Asset Catalogs

Images and colors can vary per locale in the asset catalog:

1. Select the asset in the catalog.
2. Attributes Inspector → Localizations → add languages.
3. Provide locale-specific image variants.

Use for culturally appropriate imagery, locale-specific icons, or region-specific branding.

### Number, Date, and Currency Formatting

Always use `formatted()` — never hardcode format patterns:

```swift
// Numbers:
let price = 1299.99
Text(price.formatted(.currency(code: "EUR")))    // "1.299,99 €" in de_DE
Text(42.formatted(.percent))                       // "42%" locale-aware

// Dates:
let now = Date()
Text(now.formatted(date: .abbreviated, time: .shortened)) // Locale-aware
Text(now.formatted(.dateTime.month(.wide).day().year()))   // "March 9, 2026" in en

// SwiftUI date convenience:
Text(event.date, style: .date)      // Automatic locale formatting
Text(event.date, style: .relative)  // "2 hours ago", localized
Text(event.date, style: .timer)     // Live-updating timer

// Measurements:
let distance = Measurement(value: 5, unit: UnitLength.kilometers)
Text(distance.formatted(.measurement(width: .abbreviated)))  // "5 km" or "3.1 mi"
```

### Locale-Aware Sorting

```swift
let names = ["Ötzi", "Oscar", "Ólafur"]
let sorted = names.sorted { $0.localizedStandardCompare($1) == .orderedAscending }
// Respects locale collation rules (e.g., Ö sorts differently in German vs Swedish)
```

### Locale-Aware List Formatting

```swift
let items = ["Apple", "Banana", "Cherry"]
Text(items.formatted(.list(type: .and)))
// English: "Apple, Banana, and Cherry"
// Arabic: "Apple وBanana وCherry" (with proper conjunctions)
```

## 5. Testing

### Scheme Language/Region Overrides

In Xcode: Edit Scheme → Run → Options:
- **App Language** — select any supported language or pseudolanguage.
- **App Region** — override region for number/date/currency formatting.

### Pseudolanguages

Xcode provides built-in pseudolanguages (no translations needed):

| Pseudolanguage | Purpose |
|---|---|
| Double-Length | Simulates longer translations (German, Russian) |
| Right-to-Left | Tests RTL layout without real Arabic/Hebrew strings |
| Accented | Adds diacritics to verify encoding and font support |
| Bounded | Wraps strings in brackets to spot unlocalized text |

### Preview-Based Testing

```swift
#Preview("Arabic") {
    SettingsView()
        .environment(\.locale, Locale(identifier: "ar"))
        .environment(\.layoutDirection, .rightToLeft)
}

#Preview("German - Long strings") {
    SettingsView()
        .environment(\.locale, Locale(identifier: "de"))
}

#Preview("Japanese") {
    SettingsView()
        .environment(\.locale, Locale(identifier: "ja"))
}
```

### Testing with Specific Bundles

For unit testing localized strings from a specific module:

```swift
@Test func localizedErrorMessage() {
    let msg = String(localized: "error.networkUnavailable",
                     bundle: Bundle.module)  // SPM module bundle
    #expect(!msg.isEmpty)
    #expect(msg != "error.networkUnavailable")  // Resolved, not raw key
}
```

## 6. Export/Import for Translators

### XLIFF Export

```bash
# Export all localizable strings to XLIFF files:
xcodebuild -exportLocalizations \
    -project MyApp.xcodeproj \
    -localizationPath ./Localizations \
    -exportLanguage es -exportLanguage fr -exportLanguage de

# Output: ./Localizations/es.xcloc, fr.xcloc, de.xcloc
# .xcloc bundles contain XLIFF files + context screenshots
```

### XLIFF Import

```bash
# Import translated XLIFF back into the project:
xcodebuild -importLocalizations \
    -project MyApp.xcodeproj \
    -localizationPath ./Localizations/es.xcloc
```

### String Catalog Editor Workflow

1. Build the project — Xcode auto-discovers new keys and adds them to the catalog.
2. Open the `.xcstrings` file in Xcode → select a language → fill in translations.
3. The "State" column shows: New, Needs Review, Translated, Stale.
4. Filter by state to find untranslated strings quickly.

### Third-Party Translation Services

- Export `.xcloc` bundles and send to translators or services (Lokalise, Phrase, Crowdin, POEditor).
- Most services accept `.xcloc` or the inner XLIFF directly.
- On import, Xcode merges translations back into the String Catalog.
- For CI pipelines, use `xcodebuild -exportLocalizations` / `-importLocalizations` in scripts.

## 7. Common Mistakes

### Concatenating Localized Strings

```swift
// Wrong — word order varies by language:
let msg = String(localized: "Hello") + " " + userName + "!"

// Correct — single localized string with interpolation:
let msg = String(localized: "greeting \(userName)")
// String Catalog value: "Hello %@!" (reorderable per language)
```

### Hardcoding Date/Number Formats

```swift
// Wrong:
let dateStr = "\(month)/\(day)/\(year)"
let priceStr = "$\(amount)"

// Correct:
let dateStr = date.formatted(date: .numeric, time: .omitted)
let priceStr = amount.formatted(.currency(code: currencyCode))
```

### Using left/right Instead of leading/trailing

```swift
// Wrong — doesn't adapt for RTL:
.padding(.left, 16)
.alignment(.right)

// Correct:
.padding(.leading, 16)
.alignment(.trailing)
```

### Ignoring Plural Forms

```swift
// Wrong — breaks in languages with complex plural rules (Russian, Arabic, Polish):
Text("\(count) item\(count == 1 ? "" : "s")")

// Correct — let the String Catalog handle all plural forms:
Text("^[\(count) item](inflect: true)")
```

### Forgetting Accessibility Labels

```swift
// Localize accessibility labels too:
Image("profilePhoto")
    .accessibilityLabel(Text("profile.photo.label"))  // Extracted to catalog

Button(action: deleteAction) {
    Image(systemName: "trash")
}
.accessibilityLabel(Text("action.delete"))  // Not just the icon
```

### Not Testing with Longer Languages

German, Russian, Finnish, and Greek often produce strings 30-50% longer than English. Always test with:
- **Double-Length Pseudolanguage** during development.
- **German or Russian** locale in previews before release.
- Verify no truncation, overlapping, or broken layouts.
