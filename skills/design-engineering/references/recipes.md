# Selected web recipes

These are adaptations, not drop-in accessible components. **Every recipe inherits
[core gates](../SKILL.md) and [construction](construction.md)**: purpose/frequency,
project tokens, existing primitives, focus/dismissal, interruption, and reduced
motion. Do not layer them onto a component that already animates correctly.

## Contents

- [Reduced-motion companion](#required-companion-reduced-motion)
- [Button press](#optional-button-press)
- [Popover, tooltip, modal](#popover--tooltip--modal)
- [Drawer and toast](#drawer-and-toast)
- [Accordion](#accordion)
- [Hold and tab clipping](#hold-confirmation--clipped-tab-colors)
- [Stagger or reveal](#occasional-stagger-or-marketing-reveal)
- [Drag, crossfade, WAAPI](#drag-crossfade-and-waapi)

## Required companion: reduced motion

The snippets below opt in with `.motion-surface`. Include this companion **after**
their rules, or supply equivalent component-specific overrides that win the cascade.
The scoped `!important` declarations prevent more-specific component selectors from
reintroducing animation; do not turn this into a global `*` reset. Preserve placement
transforms and the primitive's closed-state visibility/semantics. Static visible
content must never remain at opacity zero.

```css
@media (prefers-reduced-motion: reduce) {
  .motion-surface {
    animation: none !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
  .reveal.motion-surface { clip-path: none; }
}
```

Do not reset every transform: some position the surface or hide a closed drawer.
The component-specific rules below remove entrance scale and decorative fill.
JS must also branch on `matchMedia('(prefers-reduced-motion: reduce)')` (or the
installed library's equivalent) and skip movement/spring/reveal playback. Observe
preference changes for long-lived animations. Immediate state changes are fine.
An intentional component-specific variant may retain a short opacity/color transition.

## Optional button press

Only when feedback is useful and not already supplied; no requirement for all buttons.

```css
.button.motion-surface { transition: transform 160ms var(--ease-out); }
.button.motion-surface:active { transform: scale(0.97); }
@media (prefers-reduced-motion: reduce) {
  .button.motion-surface:active { transform: none; }
}
```

Scale affects label/icons too. `:active` works on touch; hover motion separately
requires `(hover: hover) and (pointer: fine)`.

## Popover / tooltip / modal

Use the primitive's actual lifecycle attributes and origin variable, not invented
ones. Here `data-starting-style` / `data-ending-style` illustrate Base UI-style states.

```css
.panel.motion-surface {
  transform-origin: var(--transform-origin, center);
  transition: opacity 200ms var(--ease-out), transform 200ms var(--ease-out);
}
.panel[data-starting-style], .panel[data-ending-style] {
  opacity: 0;
  transform: scale(0.95);
}
.tooltip.motion-surface { transition-duration: 125ms; }
.tooltip[data-instant] { transition-duration: 0ms; }
.modal.motion-surface { transform-origin: center; transition-duration: 250ms; }
@media (prefers-reduced-motion: reduce) {
  .panel[data-starting-style], .panel[data-ending-style] { transform: none; }
}
```

Radix needs its own origin variable. Retain the provider's first-tooltip delay and
instant subsequent opening. Coordinate modal backdrop opacity with the panel.
Pure opacity is valid: delete the transform rules if spatial scaling adds nothing.

## Drawer and toast

```css
.drawer.motion-surface {
  transform: translateY(0);
  transition: transform 350ms var(--ease-drawer);
}
.drawer[data-closed] { transform: translateY(100%); }
.toast.motion-surface {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 200ms var(--ease-out), transform 200ms var(--ease-out);
  @starting-style { opacity: 0; transform: translateY(100%); }
}
@media (prefers-reduced-motion: reduce) {
  .drawer[data-closed] { transform: none; }
  @starting-style { .toast.motion-surface { opacity: 1; transform: none; } }
}
```

The drawer's 350ms budget assumes substantial travel; use shorter for small panels.
Percentages adapt to content size. The primitive must hide/inert closed content
independently of its transform. Verify entry support; unsupported `@starting-style`
should simply show the toast. Don't add mount-state machinery unless needed.
Test toast stacking: opacity and reflow timing need visual judgment, not a formula.
Existing cohesive library timing may be preferable to replacing it with this example.

## Accordion

```css
.accordion-content.motion-surface {
  overflow: hidden;
  transition: height 200ms var(--ease-out), opacity 200ms var(--ease-out);
}
```

Use measured start/end height or the primitive's supplied height variable. Do not
assume interpolation to `auto` works in target browsers. Height costs layout;
keep the surface/duration bounded and profile. Preserve semantic expansion and
focus; reduced motion should set final height immediately.

## Hold confirmation / clipped tab colors

```css
.hold-overlay.motion-surface {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 200ms var(--ease-out);
}
.hold-button:active .hold-overlay { clip-path: inset(0); transition: clip-path 2s linear; }
.tabs-active-copy.motion-surface {
  clip-path: inset(0 60% 0 20%);
  transition: clip-path 250ms var(--ease-in-out);
}
@media (prefers-reduced-motion: reduce) {
  .hold-overlay.motion-surface { display: none; }
  .tabs-active-copy.motion-surface { transition: none; }
}
```

Hold CSS is only visual progress, **not** authorization or completion logic. Keep
the fill decorative (`aria-hidden`, non-focusable); the real control owns its state.
Provide an accessible non-hold confirmation alternative and cancellation handling.
Reduced motion hides the decorative fill; provide static status/countdown in the
actual control instead. Tab clipping requires
measured active bounds; make the duplicate decorative (`aria-hidden`, non-focusable,
no duplicate IDs) while the real tablist retains semantics. No need to animate a
frequently keyboard-driven tab switch.

## Occasional stagger or marketing reveal

Only on explicit scope, never hide functional content by default. Stagger can use
30–80ms offsets with a short capped total; no interaction blocking. For a requested
one-time marketing reveal, observe entry with `IntersectionObserver`, then unobserve:

```css
.reveal.motion-surface { clip-path: inset(0); }
@media (prefers-reduced-motion: no-preference) {
  .reveal[data-ready][data-hidden] { clip-path: inset(0 0 100% 0); }
  .reveal[data-ready] { transition: clip-path 600ms var(--ease-in-out); }
}
```

Only set `data-ready` when observer setup succeeds; no-JS content remains visible.
Do not replay on every scroll-by or leave offscreen focusable content clipped.

## Drag, crossfade, and WAAPI

For drag, follow construction's pointer capture, active-pointer guard, directional
velocity, damping, cancellation, and velocity-continuous spring requirements.
A bare distance/elapsed snippet is not a complete drag implementation.

For an unresolved crossfade, try `filter: blur(2px)` during overlap with opacity,
then remove it at rest. Profile the paint cost and omit blur under reduced motion.

WAAPI can animate a requested reveal without a new dependency:

```js
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const animation = reduce ? null : element.animate(
  [{ opacity: 0 }, { opacity: 1 }],
  { duration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
);
// Retain animation for cancellation during teardown/retrigger; underlying state is visible.
```

WAAPI does not guarantee acceleration; inspect properties and actual browser path.

Source: selected/adapted [Emil Kowalski recipes, pinned](https://github.com/emilkowalski/skills/blob/2d228630ba1446365f614a108cb8252f1feda202/skills/animate/RECIPES.md).
[License](../LICENSE-emil-kowalski.txt).
