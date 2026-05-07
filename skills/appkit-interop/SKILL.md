---
name: appkit-interop
description: Decide when and how to bridge a macOS app from SwiftUI into AppKit. Use when implementing NSViewRepresentable or NSViewControllerRepresentable, accessing NSWindow or the responder chain, presenting panels, customizing menus, or handling desktop behaviors that SwiftUI does not model cleanly.
---

# AppKit Interop

## Quick start

Use this skill when SwiftUI is close but not quite enough for native macOS behavior.
Keep the bridge as small and explicit as possible. SwiftUI should usually remain
the source of truth while AppKit handles the imperative edge.

## Choose the smallest bridge

- Use pure SwiftUI when scenes, toolbars, commands, inspectors, or standard controls already solve the problem.
- Use `NSViewRepresentable` when you need a specific AppKit view with lightweight lifecycle needs.
- Use `NSViewControllerRepresentable` when you need controller lifecycle, delegation, or presentation coordination.
- Use a narrow `NSWindow` or responder-chain bridge when you need window mutation, panels, menu validation, or first-responder control.

## Workflow

1. Name the capability gap precisely.
   - Window behavior
   - Text system behavior
   - Menu validation
   - Drag and drop
   - File open/save panels
   - First responder control
2. Pick the smallest bridge that closes that gap.
3. Keep ownership explicit.
   - SwiftUI owns value state, selection, and observable models.
   - AppKit objects stay inside the representable, coordinator, or bridge object.
4. Expose a narrow interface back to SwiftUI.
   - Bindings for editable state
   - Small callbacks for events
   - Focused bridge services only when necessary
5. Validate lifecycle assumptions.
   - SwiftUI may recreate representables.
   - Coordinators are glue, not a second app architecture.

## Guardrails

- Do not duplicate the source of truth between SwiftUI and AppKit.
- Do not let `Coordinator` become an unstructured dumping ground.
- Do not store long-lived `NSView` or `NSWindow` instances globally without a strong ownership reason.
- Prefer a tiny tested bridge over porting a whole feature to raw AppKit.

## When to use other skills

- Use `window-management` when SwiftUI scene and window modifiers already cover the behavior.
- Use `macos` when the problem is broader than the AppKit boundary itself.
