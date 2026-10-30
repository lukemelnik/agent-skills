# Liquid Glass on iOS 26+

- Gate with `if #available(iOS 26, *)` and always provide a non-glass fallback (`.ultraThinMaterial`, `.borderedProminent`).
- Apply `.glassEffect(...)` after layout and appearance modifiers (sizing, padding, base styling).
- Group related glass elements in one `GlassEffectContainer`.
- `.interactive()` only on controls that respond to touch.
- Prefer glass button styles (`.glass`, `.glassProminent`) before custom treatments.
- Add morphing (`glassEffectID`) only when hierarchy genuinely changes.

```swift
if #available(iOS 26, *) {
    GlassEffectContainer(spacing: 20) {
        Text("Now Playing").padding(.horizontal, 14).padding(.vertical, 10)
            .glassEffect(.regular, in: .capsule)
        Button("Play") { play() }.buttonStyle(.glassProminent)
    }
} else {
    // .background(.ultraThinMaterial, in: Capsule()) + .borderedProminent
}
```

## Anti-patterns

- Fake glass via stacked blurs when native APIs exist.
- Glass on every surface (hierarchy and contrast degrade).
- Mixed shapes/prominence within one control cluster.
