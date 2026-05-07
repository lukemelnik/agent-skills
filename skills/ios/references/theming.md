# Design System & Theming

## Table of Contents

1. [The Pipeline](#1-the-pipeline)
2. [Raw Color Definitions](#2-raw-color-definitions)
3. [Semantic Tokens](#3-semantic-tokens)
4. [Theme Object](#4-theme-object)
5. [Environment Injection](#5-environment-injection)
6. [Typography System](#6-typography-system)
7. [Spacing and Shape](#7-spacing-and-shape)
8. [Component Styles](#8-component-styles)
9. [Dark Mode Implementation](#9-dark-mode-implementation)
10. [Accessibility](#10-accessibility)
11. [Cross-Platform (iOS + macOS)](#11-cross-platform-ios--macos)
12. [Common Mistakes](#12-common-mistakes)

---

## 1. The Pipeline

Every production SwiftUI app converges on the same four-layer pipeline for theming:

```
Raw values → Semantic tokens → Observable theme → Environment injection
```

**Why this pattern exists:**

- SwiftUI has no cascade, no global stylesheet, no selector system. There is no equivalent to CSS variables or class-based selectors — every view sets its own modifiers.
- Without a deliberate pipeline, colors and fonts scatter across view files, making updates fragile and theme changes impossible.
- The pipeline scales identically whether you have 5 tokens or 80. The architecture is the same; only the token count grows.

**Why define colors in code, not asset catalogs:**

- Full control over light/dark variants in one place.
- Themes can be swapped at runtime (user-selectable accent, multi-theme support).
- Easier to version control — diffs are readable.
- No Xcode asset catalog friction (stale caches, merge conflicts in `.xcassets` JSON).

**When asset catalogs ARE appropriate:**

- App icon, launch screen, one-off branded images.
- Marketing assets that don't participate in theming.

---

## 2. Raw Color Definitions

Define raw palette values as static constants in a namespace. These are the literal color values — hex or RGB. They are never used directly in views.

```swift
enum Palette {
    static let blue50 = Color(hex: 0x2267F5)
    static let blue60 = Color(hex: 0x0A43B9)
    static let grey10 = Color(hex: 0xF9F9FB)
    static let grey90 = Color(hex: 0x1C1B22)
    static let red50  = Color(hex: 0xE22850)
    static let green60 = Color(hex: 0x058B00)
    // Add colors when you need them, not upfront.
}
```

**Hex Color initializer:**

```swift
extension Color {
    init(hex: UInt32, opacity: Double = 1.0) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: opacity
        )
    }
}
```

Rules:
- Name by scale position (`blue50`, `grey90`), not by purpose.
- Never reference `Palette` values directly in a view. They feed into semantic tokens.

---

## 3. Semantic Tokens

Semantic tokens map raw palette values to **purpose**, not appearance. This is the core concept of the entire system.

**Name by function, not color:**
- `background`, `surfacePrimary`, `label`, `labelSecondary`, `tint`, `separator`, `destructive` — correct.
- `blue`, `darkGrey`, `lightBackground` — wrong. These break when themes change.

**Protocol-based approach:**

```swift
protocol ColorSet {
    var background: Color { get }
    var surfacePrimary: Color { get }
    var surfaceSecondary: Color { get }
    var label: Color { get }
    var labelSecondary: Color { get }
    var tint: Color { get }
    var separator: Color { get }
    var destructive: Color { get }
}
```

**Light and dark implementations are separate structs:**

```swift
struct LightColorSet: ColorSet {
    let background = Palette.grey10
    let surfacePrimary = Color.white
    let surfaceSecondary = Color(hex: 0xF0F0F4)
    let label = Palette.grey90
    let labelSecondary = Color(hex: 0x5B5B66)
    let tint = Palette.blue50
    let separator = Color(hex: 0xE0E0E6)
    let destructive = Palette.red50
}

struct DarkColorSet: ColorSet {
    let background = Palette.grey90
    let surfacePrimary = Color(hex: 0x2B2A33)
    let surfaceSecondary = Color(hex: 0x42414D)
    let label = Color(hex: 0xFBFBFE)
    let labelSecondary = Color(hex: 0xCFCFD8)
    let tint = Palette.blue50
    let separator = Color(hex: 0x52525E)
    let destructive = Palette.red50
}
```

Guidelines:
- Start with what you need. Add tokens when a new semantic purpose appears, not preemptively.
- **Rule:** if you're typing a raw color value in a View file, you're missing a token.
- If supporting multiple themes (e.g., a "midnight" theme), add another struct conforming to `ColorSet`.

---

## 4. Theme Object

A single `@Observable @MainActor` class that holds the active color set, exposes semantic colors as computed properties, and handles theme mode persistence.

```swift
enum ColorSchemeOverride: Int {
    case system = 0
    case light = 1
    case dark = 2
}

@Observable @MainActor
final class Theme {
    private static let colorSchemeKey = "selectedColorScheme"

    var colorSchemeOverride: ColorSchemeOverride {
        didSet {
            UserDefaults.standard.set(colorSchemeOverride.rawValue, forKey: Self.colorSchemeKey)
        }
    }

    /// Set by the ThemeApplier modifier when the system scheme changes.
    var systemColorScheme: ColorScheme = .light

    init() {
        let stored = UserDefaults.standard.integer(forKey: Self.colorSchemeKey)
        self.colorSchemeOverride = ColorSchemeOverride(rawValue: stored) ?? .system
    }

    // MARK: - Effective scheme

    var effectiveColorScheme: ColorScheme? {
        switch colorSchemeOverride {
        case .system: nil
        case .light: .light
        case .dark: .dark
        }
    }

    private var activeColorSet: ColorSet {
        let scheme = effectiveColorScheme ?? systemColorScheme
        switch scheme {
        case .light: return LightColorSet()
        case .dark: return DarkColorSet()
        @unknown default: return LightColorSet()
        }
    }

    // MARK: - Semantic color passthrough

    var background: Color { activeColorSet.background }
    var surfacePrimary: Color { activeColorSet.surfacePrimary }
    var surfaceSecondary: Color { activeColorSet.surfaceSecondary }
    var label: Color { activeColorSet.label }
    var labelSecondary: Color { activeColorSet.labelSecondary }
    var tint: Color { activeColorSet.tint }
    var separator: Color { activeColorSet.separator }
    var destructive: Color { activeColorSet.destructive }
}
```

Key points:
- Do NOT use `@AppStorage` inside a class — it is designed for `View` structs. Use `UserDefaults` with a `didSet` pattern instead.
- The theme object is the single source of truth for all visual tokens.
- If supporting user-selectable themes (e.g., IceCubesApp's 14 themes), the object holds which `ColorSet` is active and swaps it.

---

## 5. Environment Injection

**Inject at the app root:**

```swift
struct MyApp: App {
    @State private var theme = Theme()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(theme)
        }
    }
}
```

**Consume in any view:**

```swift
struct ProfileView: View {
    @Environment(Theme.self) private var theme

    var body: some View {
        VStack {
            Text("Username")
                .foregroundStyle(theme.label)
            Text("Bio")
                .foregroundStyle(theme.labelSecondary)
        }
        .background(theme.background)
    }
}
```

Views use `theme.label`, `theme.background`, etc. — never raw palette values.

**ThemeApplier ViewModifier:**

Apply `.preferredColorScheme` and track system changes in one place:

```swift
struct ThemeApplier: ViewModifier {
    @Environment(Theme.self) private var theme
    @Environment(\.colorScheme) private var colorScheme

    func body(content: Content) -> some View {
        content
            .preferredColorScheme(theme.effectiveColorScheme)
            .tint(theme.tint)
            .onChange(of: colorScheme) { _, newScheme in
                theme.systemColorScheme = newScheme
            }
    }
}

extension View {
    func withThemeApplier() -> some View {
        modifier(ThemeApplier())
    }
}
```

Apply once at the root: `.withThemeApplier()`.

**Preview support:**

```swift
#Preview {
    ProfileView()
        .environment(Theme())
}
```

---

## 6. Typography System

Define a type scale alongside colors — either in the theme or as a companion namespace.

**Use system semantic styles as the base:**

```swift
// Prefer system styles — they already support Dynamic Type.
Text("Title")
    .font(.headline)
Text("Body content")
    .font(.body)
Text("Fine print")
    .font(.caption)
```

**Custom fonts — register and wrap:**

1. Add font files to the target and register in `Info.plist` under `UIAppFontDescriptors` (or `Fonts provided by application`).
2. Create `Font` extensions:

```swift
extension Font {
    static func appHeadline(_ size: CGFloat) -> Font {
        .custom("MyFont-Bold", size: size, relativeTo: .headline)
    }
    static func appBody(_ size: CGFloat) -> Font {
        .custom("MyFont-Regular", size: size, relativeTo: .body)
    }
}
```

The `relativeTo:` parameter enables Dynamic Type scaling against the named text style.

**Dynamic Type rules:**
- Always use font styles (`.body`, `.headline`) or `relativeTo:` with custom fonts.
- Use `@ScaledMetric` for custom sizes that need to scale with Dynamic Type:

```swift
@ScaledMetric(relativeTo: .body) private var iconSize: CGFloat = 20
```

- Never use fixed point sizes without scaling.

**Pair weight + color for hierarchy:**

```swift
Text("Section Title")
    .font(.headline)
    .foregroundStyle(theme.label)

Text("Supporting info")
    .font(.subheadline)
    .foregroundStyle(theme.labelSecondary)
```

---

## 7. Spacing and Shape

**Define a spacing scale as static constants:**

```swift
enum Spacing {
    static let xxSmall: CGFloat = 4
    static let xSmall: CGFloat = 8
    static let small: CGFloat = 12
    static let medium: CGFloat = 16
    static let large: CGFloat = 24
    static let xLarge: CGFloat = 32
    static let xxLarge: CGFloat = 48

    static let radiusSmall: CGFloat = 8
    static let radiusMedium: CGFloat = 12
    static let radiusLarge: CGFloat = 20
}
```

**Use consistently — no magic numbers:**

```swift
// Correct
VStack(spacing: Spacing.small) {
    content
}
.padding(Spacing.medium)

// Incorrect
VStack(spacing: 11) {
    content
}
.padding(17)
```

**Corner radius:**

```swift
RoundedRectangle(cornerRadius: Spacing.radiusMedium)
    .fill(theme.surfacePrimary)
```

**Context-adaptive rounding:**

Use `ContainerRelativeShape()` in widgets and environments where the container dictates rounding — it automatically matches the enclosing shape.

---

## 8. Component Styles

Custom `ButtonStyle`, `ToggleStyle`, and `TextFieldStyle` are SwiftUI's equivalent of CSS classes. Define once, apply everywhere.

**Custom ButtonStyle:**

```swift
struct PrimaryButtonStyle: ButtonStyle {
    @Environment(Theme.self) private var theme

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(.white)
            .padding(.vertical, Spacing.small)
            .padding(.horizontal, Spacing.large)
            .background(
                RoundedRectangle(cornerRadius: Spacing.radiusMedium)
                    .fill(theme.tint)
                    .opacity(configuration.isPressed ? 0.8 : 1.0)
            )
    }
}
```

**Apply by name:**

```swift
Button("Save") { save() }
    .buttonStyle(PrimaryButtonStyle())
```

**ViewModifiers as reusable style bundles:**

```swift
struct CardStyle: ViewModifier {
    @Environment(Theme.self) private var theme

    func body(content: Content) -> some View {
        content
            .padding(Spacing.medium)
            .background(
                RoundedRectangle(cornerRadius: Spacing.radiusMedium)
                    .fill(theme.surfacePrimary)
            )
    }
}

extension View {
    func cardStyle() -> some View {
        modifier(CardStyle())
    }
}
```

This is how you approximate CSS's global selectors — define the style once, name it, apply by name.

---

## 9. Dark Mode Implementation

**Three-mode preference: system (default), force light, force dark.**

The `Theme` object stores the preference; the `ThemeApplier` modifier enforces it:

```swift
// In ThemeApplier (see section 5):
.preferredColorScheme(theme.effectiveColorScheme)
```

- `nil` means follow system. `.light` or `.dark` forces the mode.
- `.onChange(of: colorScheme)` in the ThemeApplier tracks system changes so the theme always knows the current effective scheme.

**Settings UI:**

```swift
Picker("Appearance", selection: $theme.colorSchemeOverride) {
    Text("System").tag(ColorSchemeOverride.system)
    Text("Light").tag(ColorSchemeOverride.light)
    Text("Dark").tag(ColorSchemeOverride.dark)
}
```

Requires `@Bindable var theme` or wrapping with `@Bindable`:

```swift
@Environment(Theme.self) private var theme

var body: some View {
    @Bindable var theme = theme
    Picker("Appearance", selection: $theme.colorSchemeOverride) { ... }
}
```

**Test with previews:**

```swift
#Preview("Dark Mode") {
    MyView()
        .environment(Theme())
        .preferredColorScheme(.dark)
}
```

---

## 10. Accessibility

### Auto-Contrast Detection

Calculate luminance and pick a contrasting foreground — useful for user-selected accent colors or dynamic backgrounds:

```swift
import SwiftUI

extension Color {
    func contrastingForeground() -> Color {
        let components = UIColor(self).resolvedCGColor().components ?? [0, 0, 0, 1]
        let r = components.count > 0 ? components[0] : 0
        let g = components.count > 1 ? components[1] : 0
        let b = components.count > 2 ? components[2] : 0
        let luminance = 0.299 * r + 0.587 * g + 0.114 * b
        return luminance > 0.5 ? .black : .white
    }
}
```

### High-Contrast Variants

Provide separate token values when Increase Contrast is enabled:

```swift
@Environment(\.colorSchemeContrast) private var contrast

var effectiveLabel: Color {
    contrast == .increased ? .black : theme.label
}
```

Or build contrast awareness into the `ColorSet` protocol:

```swift
protocol ColorSet {
    var label: Color { get }
    var labelHighContrast: Color { get }
    // ...
}
```

### Bold Text Detection

```swift
@Environment(\.legibilityWeight) private var legibilityWeight

var bodyFont: Font {
    legibilityWeight == .bold ? .body.bold() : .body
}
```

### General Rules

- Never rely on color alone to convey meaning — always pair with icons, labels, or shapes.
- Test with Increase Contrast and Bold Text enabled in accessibility settings.
- Use `accessibilityLabel` on any color-only indicators (status dots, badges).

---

## 11. Cross-Platform (iOS + macOS)

**Share the protocol and palette across targets:**

The `ColorSet` protocol, `Palette` enum, and `Theme` class live in a shared package/target. Both iOS and macOS import them.

**Platform-specific color sets where needed:**

```swift
#if os(macOS)
struct MacLightColorSet: ColorSet {
    let background = Color(nsColor: .windowBackgroundColor)
    let surfacePrimary = Color(nsColor: .controlBackgroundColor)
    // macOS-specific materials and system colors
}
#endif
```

**macOS-specific considerations:**
- Respect the system accent color — do not override it for standard controls (buttons, toggles, selection highlights). Use brand color for your own custom elements.
- Use macOS materials where appropriate:

```swift
#if os(macOS)
.background(.ultraThinMaterial)  // sidebar, toolbar backgrounds
#endif
```

- `ContainerRelativeShape()` adapts to platform conventions.

**Conditional defaults:**

```swift
var defaultTint: Color {
    #if os(iOS)
    return Palette.blue50
    #elseif os(macOS)
    return Color.accentColor  // Respect system accent
    #endif
}
```

---

## 12. Common Mistakes

- **Using raw hex/RGB values directly in views** — bypasses the token layer, making theme changes impossible without hunting through every file.
- **Using asset catalog colors for theming** — loses runtime swappability, harder to manage at scale, merge conflicts in `.xcassets` JSON.
- **Defining colors in each view file** — scatters definitions, guarantees inconsistency.
- **Using `.foregroundColor()` (deprecated)** — use `.foregroundStyle()` instead. `foregroundStyle` supports `ShapeStyle` (gradients, materials), not just `Color`.
- **Hardcoding dark mode colors** — provide both light and dark variants through `ColorSet` conformances. Don't check `colorScheme` in views to pick colors manually.
- **Not testing with Increase Contrast / Bold Text** — these accessibility settings affect real users. Verify your tokens are legible in all modes.
- **Creating too many tokens upfront** — add them when a new semantic purpose actually appears. Unused tokens are noise.
- **Using `@AppStorage` inside a class** — `@AppStorage` is designed for `View` structs. In `@Observable` classes, use `UserDefaults` with a `didSet` pattern.
- **Using `configureWithTransparentBackground()` for global navigation bar appearance** — this removes the automatic opaque background that iOS draws when list content scrolls behind the navigation bar, causing title text to overlap with scrolling content. Use `configureWithOpaqueBackground()` with an explicit `backgroundColor` matching your theme instead. This applies to all three appearances: `standardAppearance`, `compactAppearance`, and `scrollEdgeAppearance`.
