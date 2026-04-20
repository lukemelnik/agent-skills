# Liquid Glass

Use this guide when adopting iOS 26+ Liquid Glass APIs in SwiftUI.

## First pass

1. Identify which surfaces should feel glass-like: chips, buttons, cards, floating controls.
2. Prefer native Liquid Glass APIs over custom blur stacks.
3. Group related glass elements inside `GlassEffectContainer`.
4. Gate everything with `if #available(iOS 26, *)` and provide a non-glass fallback.

## Core rules

- Use `.glassEffect(...)` after layout and appearance modifiers.
- Use `.interactive()` only on controls that actually respond to touch or pointer input.
- Keep shapes and prominence consistent across related glass elements.
- Use glass button styles for actions before composing custom treatments.
- Add morphing only when the hierarchy genuinely changes and the transition earns its complexity.

## Implementation pattern

```swift
if #available(iOS 26, *) {
    GlassEffectContainer(spacing: 20) {
        VStack(spacing: 16) {
            Text("Now Playing")
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .glassEffect(.regular, in: .capsule)

            Button("Play") {
                play()
            }
            .buttonStyle(.glassProminent)
        }
    }
} else {
    VStack(spacing: 16) {
        Text("Now Playing")
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(.ultraThinMaterial, in: Capsule())

        Button("Play") {
            play()
        }
        .buttonStyle(.borderedProminent)
    }
}
```

## Review checklist

- Availability gating is present and the fallback is usable.
- Multiple glass views are grouped in `GlassEffectContainer`.
- `glassEffect` is applied after sizing, padding, and base styling.
- Interactive glass is only used for controls.
- Shapes, spacing, and tinting are consistent across the feature.

## Anti-patterns

- Building fake glass with stacked blurs when the native APIs are available.
- Applying glass to every surface until hierarchy and contrast degrade.
- Omitting a fallback for pre-iOS 26 targets.
- Mixing unrelated shapes and prominence levels in the same control cluster.
