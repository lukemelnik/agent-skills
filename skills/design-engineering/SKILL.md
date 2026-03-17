---
name: design-engineering
description: UI animation, interaction polish, and component design patterns for web interfaces. Use when building or reviewing CSS/JS animations, transitions, hover/press states, popovers, toasts, drawers, drag interactions, or any UI element that needs motion and polish. Covers easing, duration, springs, clip-path, gesture handling, and performance.
---

# Design Engineering

Inspired by [Emil Kowalski's](https://emilkowal.ski/) design engineering philosophy and writings.

Unseen details compound. When every interaction feels exactly as expected, users love the interface without knowing why. Prioritize invisible correctness over flashy effects.

## Animation Decision Framework

Answer in order before writing any animation code.

### 1. Should this animate?

| Frequency | Decision |
| --- | --- |
| 100+/day (keyboard shortcuts, command palette) | No animation. Ever. |
| Tens/day (hover effects, list nav) | Remove or drastically reduce |
| Occasional (modals, drawers, toasts) | Standard animation |
| Rare/first-time (onboarding, celebrations) | Can add delight |

**Never animate keyboard-initiated actions.** They repeat too often; animation makes them feel slow.

### 2. What easing?

| Context | Easing |
| --- | --- |
| Element entering or exiting | ease-out |
| Moving/morphing on screen | ease-in-out |
| Hover/color change | ease |
| Constant motion (marquee, progress) | linear |
| Default | ease-out |

**Never use ease-in for UI animations.** It delays initial movement — the exact moment the user watches most closely.

Use custom curves. Built-in CSS easings are too weak:

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

Resources: [easing.dev](https://easing.dev/), [easings.co](https://easings.co/)

### 3. How fast?

| Element | Duration |
| --- | --- |
| Button press feedback | 100-160ms |
| Tooltips, small popovers | 125-200ms |
| Dropdowns, selects | 150-250ms |
| Modals, drawers | 200-500ms |

**UI animations should stay under 300ms.** Faster-spinning spinners make apps feel like they load faster even at identical load times.

## Component Patterns

### Buttons: must feel responsive

```css
.button {
  transition: transform 160ms ease-out;
}
.button:active {
  transform: scale(0.97);
}
```

Applies to any pressable element. Scale range: 0.95-0.98.

### Never animate from scale(0)

Nothing in the real world appears from nothing. Start from `scale(0.95)` or higher with opacity:

```css
/* Bad */
.entering { transform: scale(0); }

/* Good */
.entering { transform: scale(0.95); opacity: 0; }
```

### Popovers: origin-aware

Scale from trigger, not center. **Exception: modals stay centered.**

```css
/* Radix UI */
.popover { transform-origin: var(--radix-popover-content-transform-origin); }
/* Base UI */
.popover { transform-origin: var(--transform-origin); }
```

### Tooltips: skip delay on subsequent hovers

First tooltip delays before appearing. Once one is open, adjacent tooltips open instantly with no animation:

```css
.tooltip {
  transition: transform 125ms ease-out, opacity 125ms ease-out;
  transform-origin: var(--transform-origin);
}
.tooltip[data-starting-style],
.tooltip[data-ending-style] {
  opacity: 0;
  transform: scale(0.97);
}
.tooltip[data-instant] {
  transition-duration: 0ms;
}
```

### Stagger animations

When multiple elements enter together, stagger with 30-80ms delays between items. Keep delays short — long delays feel slow. Never block interaction while stagger plays.

```css
.item {
  opacity: 0;
  transform: translateY(8px);
  animation: fadeIn 300ms ease-out forwards;
}
.item:nth-child(1) { animation-delay: 0ms; }
.item:nth-child(2) { animation-delay: 50ms; }
.item:nth-child(3) { animation-delay: 100ms; }
```

### Asymmetric enter/exit timing

Deliberate actions (hold-to-delete) should be slow. System responses (release, dismiss) should be snappy:

```css
.overlay { transition: clip-path 200ms ease-out; }
.button:active .overlay { transition: clip-path 2s linear; }
```

### Use blur to mask imperfect crossfades

When a crossfade looks off, add `filter: blur(2px)` during the transition. Blur blends two overlapping states into a perceived single transformation. Keep under 20px (expensive in Safari).

### Animate entry with @starting-style

Modern CSS entry animation without JS:

```css
.toast {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 400ms ease, transform 400ms ease;
  @starting-style {
    opacity: 0;
    transform: translateY(100%);
  }
}
```

## clip-path for Animation

`clip-path: inset(top right bottom left)` defines a rectangular clip. Each value eats into the element from that side.

```css
.hidden { clip-path: inset(0 100% 0 0); }
.visible { clip-path: inset(0 0 0 0); }
```

Use cases: hold-to-delete overlays, tab color transitions (duplicate + clip active tab), image reveals on scroll, comparison sliders.

## Spring Animations

Springs feel more natural than duration-based animations — they simulate physics and have no fixed duration.

**When to use:** drag interactions with momentum, elements that feel "alive," gestures that can be interrupted, decorative mouse-tracking.

```jsx
// Without spring: feels artificial
const rotation = mouseX * 0.1;

// With spring: feels natural, has momentum
const springRotation = useSpring(mouseX * 0.1, {
  stiffness: 100, damping: 10,
});
```

**Configuration (Apple-style, easier to reason about):**
```js
{ type: "spring", duration: 0.5, bounce: 0.2 }
```

Keep bounce subtle (0.1-0.3). Springs maintain velocity when interrupted — CSS animations restart from zero.

## Gesture and Drag Interactions

- **Momentum dismissal:** Calculate velocity (`distance / elapsed_time`). If velocity > ~0.11, dismiss regardless of distance. Quick flicks should work.
- **Damping at boundaries:** When dragging past natural limits, apply increasing friction. Never hard-stop.
- **Pointer capture:** Once dragging starts, capture all pointer events on the element so drag continues outside bounds.
- **Multi-touch protection:** Ignore additional touch points after initial drag begins to prevent position jumps.

## Performance Rules

### Only animate transform and opacity
These skip layout and paint, running on GPU. Animating `padding`, `margin`, `height`, or `width` triggers full re-render.

### Avoid CSS variables for per-frame updates
Changing a CSS variable on a parent recalculates styles for all children. Update `transform` directly:

```js
// Bad: triggers recalc on all children
element.style.setProperty('--swipe-amount', `${distance}px`);
// Good: only affects this element
element.style.transform = `translateY(${distance}px)`;
```

### CSS transitions > keyframes for dynamic UI
Transitions can be interrupted and retargeted mid-animation. Keyframes restart from zero. Use transitions for anything triggered rapidly (toasts, toggles).

### CSS animations > JS under load
CSS animations run off main thread. Framer Motion uses `requestAnimationFrame` and drops frames when the browser is busy. Use CSS for predetermined animations, JS for dynamic/interruptible ones.

### Framer Motion hardware acceleration
Shorthand props (`x`, `y`, `scale`) are NOT hardware-accelerated. Use full transform strings:

```jsx
// Not hardware accelerated
<motion.div animate={{ x: 100 }} />
// Hardware accelerated
<motion.div animate={{ transform: "translateX(100px)" }} />
```

### WAAPI for programmatic CSS-speed animations
Web Animations API gives JS control with CSS performance:

```js
element.animate(
  [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }],
  { duration: 1000, fill: 'forwards', easing: 'cubic-bezier(0.77, 0, 0.175, 1)' }
);
```

## Accessibility

### prefers-reduced-motion
Reduced motion means fewer and gentler animations, not zero. Keep opacity/color transitions. Remove movement and position animations.

```css
@media (prefers-reduced-motion: reduce) {
  .element { animation: fade 0.2s ease; }
}
```

### Touch device hover states
Gate hover animations behind this query to avoid false positives on tap:

```css
@media (hover: hover) and (pointer: fine) {
  .element:hover { transform: scale(1.05); }
}
```

## Review Checklist

When reviewing UI code, use a Before/After/Why table:

| Before | After | Why |
| --- | --- | --- |
| `transition: all` | `transition: transform 200ms ease-out` | Specify exact properties |
| `scale(0)` entry | `scale(0.95); opacity: 0` | Nothing appears from nothing |
| `ease-in` on UI element | `ease-out` or custom curve | ease-in feels sluggish |
| `transform-origin: center` on popover | Trigger-anchored origin (modals exempt) | Popovers scale from trigger |
| Animation on keyboard action | Remove animation | Too frequent |
| Duration > 300ms on UI | 150-250ms | Feels unresponsive |
| Hover without media query | `@media (hover: hover) and (pointer: fine)` | Prevents tap false positives |
| Keyframes on rapid triggers | CSS transitions | Interruptibility |
| Framer Motion `x`/`y` under load | `transform: "translateX()"` | Hardware acceleration |
| Same enter/exit speed | Exit faster than enter | System responds fast |
| All elements appear at once | Stagger 30-80ms | More natural cascade |
