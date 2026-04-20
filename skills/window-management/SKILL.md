---
name: window-management
description: Customize macOS 15+ SwiftUI windows and scene behavior using Window, WindowGroup, and macOS window modifiers. Use when styling or hiding window toolbars and titles, extending drag regions with WindowDragGesture, replacing window backgrounds with materials, disabling minimize or restoration for utility windows, setting default or ideal window placement from content and display size, creating borderless windows, or tuning default launch behavior.
---

# Window Management

## Quick start

Use this skill to tailor each SwiftUI window to its job. Start by identifying
which scene owns the window, then customize the toolbar and title area,
background material, resize and restoration behavior, and initial or zoomed
placement.

These APIs are modern macOS window and scene customizations. Use availability
guards or a narrow AppKit bridge when the deployment target predates them.

## Workflow

1. Inspect the scene declaration and classify the window role.
   - main navigation
   - utility or inspector
   - About or support
   - media playback
   - welcome window
   - borderless custom surface
2. Adjust toolbar and title presentation to match the content.
3. If the toolbar background or toolbar is hidden, make sure the window still has a usable drag region.
4. Refine minimize, restoration, resize, and launch behavior for that role.
5. Set default placement for newly opened windows and ideal placement for zoom behavior when content size matters.
6. Build and launch the app to verify the result in a real foreground macOS app.

## Core rules

- Prefer scene and window modifiers over ad hoc `NSWindow` mutation when SwiftUI already provides the behavior directly.
- Keep hidden titles logically meaningful for accessibility and menus.
- Use materials rather than hardcoded translucent colors for stylized utility windows.
- Treat default placement and ideal placement as separate policies.
- Consider external displays and narrow screens when sizing media or document windows.

## Guardrails

- Do not hide toolbar chrome without replacing the lost drag affordance.
- Do not disable restoration on the main navigation or document window unless the product explicitly wants a fresh start every launch.
- Do not hardcode one monitor size or assume a single-display setup.
- Do not reach for AppKit before checking whether SwiftUI window modifiers already solve the problem.

## When to use other skills

- Use `appkit-interop` when SwiftUI scene and window modifiers are not enough.
- Use `liquid-glass` when the problem is mostly about material treatment and modern visual styling.
