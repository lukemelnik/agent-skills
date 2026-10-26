# Constructing purposeful motion

Use for building or tuning requested web motion. Inherits the purpose/frequency
and scope gates in [the main skill](../SKILL.md); do not add decoration by default.

## Contents

- [Tool and properties](#tool-and-properties)
- [Easing](#easing)
- [Duration budgets](#duration-budgets)
- [Origin, continuity, exits](#origin-continuity-and-exits)
- [Springs and gestures](#springs-and-gestures)
- [Optional polish](#optional-polish-not-obligations)
- [Access and verification](#access-and-verification)

## Tool and properties

Use existing tools first. CSS transitions suit class/attribute state changes and
retarget naturally. `@starting-style` supports entry transitions where available;
check browser support and keep content usable without it. CSS keyframes suit
predetermined sequences, not blindly restarted rapid toggles. WAAPI offers
programmatic playback/cancellation. Existing motion libraries suit springs,
layout, exits, and gesture values; don't install one for a fade.

Prefer transform and opacity when they preserve the intended layout and appearance.
Scale also scales text/icons: it cannot replace every size change. An accordion
may genuinely need height animation. Name exact transition properties, not `all`.
`translateY(100%)` uses the element's own height; preserve this correctness for
variable-size drawers/toasts. See [performance](performance.md) before optimizing.

## Easing

| Situation | Starting point |
| --- | --- |
| Entry, exit, direct feedback | Strong ease-out |
| On-screen movement / morph | Ease-in-out |
| Hover or color | `ease` |
| Progress / constant speed | `linear` |

A slow-start ease-in often makes direct feedback feel delayed; avoid it there.
Reuse equivalent project tokens; otherwise these are opinionated starting points:

```css
:root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
}
```

For further deliberate curves consult [easing.dev](https://easing.dev/) or
[easings.co](https://easings.co/), not a collection of arbitrary near-duplicates.

## Duration budgets

| Element | Typical budget |
| --- | --- |
| Optional press feedback | 100–160ms |
| Tooltip / small popover | 125–200ms |
| Dropdown / select | 150–250ms |
| Modal / drawer | 200–500ms, with reason for the longer end |

Default to under 300ms. A large travel distance can justify a 300–500ms drawer;
a small dropdown generally cannot. Explanatory marketing motion can be longer
when requested, without delaying access to content. Never slow real completion
or falsify progress for perceived speed. Spinner cadence can affect perceived wait,
but test legibility and motion sensitivity rather than blindly speeding it up.

## Origin, continuity, and exits

- No scale-from-zero. If scale helps, start subtly (`0.95` or `0.97`) with opacity;
  pure fade is equally valid. Avoid unnecessary transform for reduced motion.
- Scaled popovers, menus, and tooltips originate at the trigger. Radix exposes
  `--radix-popover-content-transform-origin`; Base UI commonly exposes
  `--transform-origin`. Verify the actual primitive/version. Modals stay centered.
- Exit along a coherent path: a bottom toast normally leaves toward the bottom.
- For fast retriggers, retarget a transition from its current computed state.
  Keyframes/WAAPI can be coordinated too, but cancel/restart must not cause jumps.
- Deliberate hold progress can take 2s linear while cancellation returns in 200ms
  ease-out. Ordinary presses need not be slow; quick acknowledgment matters.
- Skip repeated tooltip delay and motion after the first tooltip in a toolbar,
  using the existing provider's delay/skip-delay behavior where available.

## Springs and gestures

Use springs for a drag that can reverse or settle with momentum, not for every
state change. Example Motion-style starting configurations (verify installed API):

```js
{ type: "spring", duration: 0.5, bounce: 0.2 }
{ type: "spring", mass: 1, stiffness: 100, damping: 10 }
```

These are alternatives, not equivalent settings or guaranteed wall-clock times.
Prefer little/no visible bounce in functional UI; 0.1–0.3 bounce can suit a
purposeful playful gesture. Preserve current position **and velocity** when
interrupting a spring; remounting/reinitializing can defeat continuity.
If explicitly requested, decorative pointer-following can use a spring rather
than raw position mapping; do not introduce it on reading or task surfaces.

Drag implementation requirements:
- Capture the active pointer with `setPointerCapture(event.pointerId)` once dragging
  starts; track its ID and ignore other pointers until cleanup.
- Handle `pointerup`, `pointercancel`, and lost capture; release/reset safely.
- Coordinate `touch-action` with intended scrolling; don't disable page scroll broadly.
- Apply increasing resistance beyond natural boundaries instead of a hard wall.
- Combine distance with **directional recent velocity** for dismissal. Distance /
  elapsed milliseconds yields px/ms; ~0.11 is an upstream starting example, not
  a universal threshold. Guard zero elapsed time, tune to travel/device, and avoid
  dismissing from an opposite-direction flick or average velocity over a long pause.
- Update the dragged element or motion value directly, not React state per frame.

## Optional polish, not obligations

A 30–80ms stagger may clarify an occasional group entrance; cap the total delay,
keep interaction available, and omit it for frequently seen lists. Small press
scale (0.95–0.98) can convey physicality, but native feedback or a color change may
already suffice. Neither missing stagger nor missing scale is itself a defect.

`clip-path: inset(top right bottom left)` clips inward from each edge. Useful for
hold overlays, comparisons, and coordinated tab color reveals; account for paint
cost. A small 2px blur can soften an otherwise unresolved crossfade; first fix
layering/timing. Avoid making readable content blurry; heavy blur (especially
near/above 20px) can be expensive in Safari. 3D `rotateX/Y` with
`transform-style: preserve-3d` is available for explicitly scoped depth/flip work,
not a default enhancement.

## Access and verification

Ship a static/opacity/color reduced-motion variant, with no translation, scale,
parallax, or overshoot. Check preference changes for long-lived JS animations.
Gate hover motion on fine hover-capable pointers. Preserve keyboard/focus behavior
and semantic open/closed state; do not let invisible exiting content intercept input.

Test rapid open-close-open, reversal, cancellation, variable content, reduced motion,
and touch. Slow to 2–5× duration or step frames to inspect origins/crossfades, then
judge responsiveness at normal speed. Fresh eyes can catch over-tuned motion.

Source: adapted from [Emil Kowalski's pinned animation material](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202/skills/animate)
and existing local guidance; [license](../LICENSE-emil-kowalski.txt).
