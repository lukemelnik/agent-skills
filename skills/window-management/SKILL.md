---
name: window-management
description: Customize macOS 15+ SwiftUI window and scene behavior with Window, WindowGroup, and window modifiers. Use for toolbar/title styling, WindowDragGesture drag regions, window materials, restoration and minimize behavior, default/ideal placement, and borderless windows.
---

# Window Management

## Quick start

Identify which scene owns the window, then customize toolbar/title, material, restoration, and placement. These APIs are modern macOS window and scene customizations. Use availability
guards or a narrow AppKit bridge when the deployment target predates them.

## Core rules

- Prefer scene and window modifiers over ad hoc `NSWindow` mutation when SwiftUI already provides the behavior directly.
- Keep hidden titles logically meaningful for accessibility and menus.
- Use materials rather than hardcoded translucent colors for stylized utility windows.
- Treat default placement and ideal placement as separate policies.

## Guardrails

- Do not hide toolbar chrome without replacing the lost drag affordance.
- Do not disable restoration on the main navigation or document window unless the product explicitly wants a fresh start every launch.
- Do not hardcode one monitor size or assume a single-display setup.

## When to use other skills

- Use `macos` (`references/appkit-bridge.md`) when SwiftUI scene and window modifiers are not enough.
- Use `liquid-glass` when the problem is mostly about material treatment and modern visual styling.
