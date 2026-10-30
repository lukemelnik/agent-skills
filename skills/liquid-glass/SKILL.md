---
name: liquid-glass
description: Implement, refactor, or review Liquid Glass and the new design system in SwiftUI on iOS 26+ and macOS 26+. Use when adopting glassEffect, GlassEffectContainer, or glassEffectID, updating toolbars, search, sheets, and split views, or removing custom backgrounds that fight system materials.
---

# Liquid Glass

## Quick start

Use standard app structure, toolbars, search, sheets, and controls first; add custom glass only where the app needs a distinctive surface. Gate newest APIs with availability checks. For iOS specifics (fallbacks, containers, anti-patterns) read `references/ios.md`.

## Workflow

1. Read the relevant scene or root view and identify the structural pattern.
   - `NavigationSplitView`
   - toolbar
   - search
   - sheet
   - inspector
   - custom floating control
2. Remove custom backgrounds or scrims that fight system materials unless the product explicitly needs them.
3. Update standard SwiftUI structure and controls first.
4. Add custom `glassEffect` surfaces only for app-specific UI that standard controls do not cover.
5. Keep nearby glass surfaces inside one `GlassEffectContainer` when they should sample and morph together.
6. Verify on the real running app (macOS: foreground app, not a simulated mobile flow).

## Core rules

- Use tint only when color carries meaning.
- Attach `searchable` at the container level matching the intended search scope.
- Use `glassEffectID` with stable identity for morphing.

## Guardrails

- Do not rebuild standard macOS chrome from scratch if SwiftUI already provides the right behavior.
- Do not scatter related glass elements across multiple containers.
- Do not assume iPhone tab or search behavior is the right answer on macOS.

## When to use other skills

- Use `window-management` when the problem is scene or titlebar behavior rather than materials.
- Use the `macos` skill's AppKit bridging reference when the missing behavior depends on responder-chain, window, or AppKit-only control hooks.
- Use `build-run-debug` when you need to launch and inspect the app after the visual change.
