---
name: liquid-glass
description: Implement, refactor, or review modern macOS SwiftUI UI for the new design system and Liquid Glass. Use when adopting Liquid Glass, updating NavigationSplitView, toolbars, search, sheets, and controls, removing custom backgrounds that fight system materials, or building custom glass surfaces with glassEffect, GlassEffectContainer, and glassEffectID.
---

# Liquid Glass

## Quick start

Use this skill to bring a macOS SwiftUI app into the modern design system with
the least custom chrome possible. Start with standard app structure, toolbars,
search placement, sheets, and controls, then add custom Liquid Glass only where
the app needs a distinctive surface.

Always gate the newest APIs with availability checks when the deployment target
predates them.

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
6. Verify the result on a real foreground macOS app, not a simulated mobile flow.

## Core rules

- Prefer system sidebars, toolbars, sheets, and controls before building custom glass.
- Use tint only when color carries meaning, not as decoration.
- Attach `searchable` at the correct container level for the intended search scope.
- Remove opaque custom fills before judging whether the new material looks correct.
- Use `glassEffectID` with stable identity when glass elements should morph between states.

## Guardrails

- Do not rebuild standard macOS chrome from scratch if SwiftUI already provides the right behavior.
- Do not scatter related glass elements across multiple containers.
- Do not assume iPhone tab or search behavior is the right answer on macOS.

## When to use other skills

- Use `window-management` when the problem is scene or titlebar behavior rather than materials.
- Use `appkit-interop` when the missing behavior depends on responder-chain, window, or AppKit-only control hooks.
- Use `build-run-debug` when you need to launch and inspect the app after the visual change.
