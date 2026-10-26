# Motion performance: diagnose before changing

Use for jank, frame drops, acceleration decisions, or `will-change`. Inherits
[core scope and restraint](../SKILL.md). Do not replace working motion on folklore.

## Establish the actual path

Record the element, trigger, driver, animated properties, library/version, browser,
device, content size, and concurrent work (navigation, hydration, loading). Inspect
installed dependencies and documentation for that version; Motion APIs can use
different paths depending on features and values. Neither “all CSS is off-thread”
nor “all Motion shorthands are unaccelerated” is a reliable rule.

A 60Hz display offers ~16.7ms/frame; 120Hz offers ~8.3ms, shared with other work.
A fast development laptop is not proof of smoothness on a mid-range phone.

## Cost model

- Layout computes geometry; paint rasterizes; composite assembles layers.
- Transform/opacity are strong defaults, often compositor-eligible, not guarantees.
- Width/height/padding/margin/top/left generally require layout; shadows, border
  radius, and color may paint. Filter/clip-path/background acceleration varies with
  browser, shape, effect, and layer conditions. Test instead of asserting GPU-only.
- Scale is not interchangeable with size: it distorts text/children and does not
  move neighboring flow. Translation does not replace a layout change that users need.
- Opacity does not replace `display`, `hidden`, `inert`, or semantic visibility.
- `drop-shadow()` may outperform box-shadow in a particular trace but is not a
  universal faster equivalent; shapes/appearance differ. Compare on target devices.

## Diagnostic sequence

1. Reproduce the user flow, including busy-page conditions and rapid interactions.
2. Capture a DevTools Performance trace: locate missed frames, long tasks, style
   recalculation, layout, paint, and compositing. Use paint flashing/layer inspection
   where available. Name the dominant cause before choosing a fix.
3. If layout dominates, bound the affected subtree or use transform/opacity only
   where visually and behaviorally equivalent. A brief accordion height transition
   may be justified; don't label every layout animation broken without evidence.
4. If main-thread contention dominates, determine whether the current driver is a
   JS/rAF loop or a compositor-capable CSS/WAAPI path. CSS transitions/keyframes and
   WAAPI **can** hand eligible animations off; an rAF callback itself needs the main
   thread. JS libraries may delegate to WAAPI. Compare an eligible path under load.
5. Look for React state updates in rAF, pointermove, scroll, or drag handlers. Use
   refs/direct element style updates or library motion values for per-frame values;
   commit semantic state at meaningful boundaries rather than rendering every frame.
6. If cost grows with descendants, inspect inherited CSS custom properties updated
   per frame. Broad inherited updates can cause extensive style recalculation.
   Prefer an element-local transform/motion value; scoped non-inheriting registered
   properties may help where supported, but verify the actual trace.
7. Check many concurrent elements, large layers, animated blur and filters. Small
   2–5px blur can still cost; near/above 20px is especially suspect in Safari. Reduce
   area/effect before assuming layer promotion fixes it.
8. Only then test targeted `will-change` for measured promotion/startup artifacts
   or jank. It is a hint, not a repair for layout or long tasks. Avoid `*`, huge
   containers, and permanent promotion of every item; layers consume memory.

## Syntax and correctness traps

```js
// Broad per-frame inherited update can invalidate descendant styles:
container.style.setProperty('--swipe-amount', `${distance}px`);
// A local update is often cheaper (preserve any existing transform composition):
dragged.style.transform = `translateY(${distance}px)`;
```

Do not overwrite unrelated transforms. Inspect Motion's installed version and
profile its `x`/`y`/`scale` path before replacing it with a full transform string.
A string may unlock acceleration for some paths but change composition, gesture,
layout, or interruption behavior. Measure the replacement, not just the old code.

Preserve percentage transforms for variable-size content: `translateY(100%)`
means the element's height, not its parent's. Historical acceleration limitations
are not a reason to hard-code stale pixels. Correctness beats speculative promotion.
Use explicit transition properties instead of `all` to prevent future accidental work.

## Verify and report

Compare the same flow/content/load before and after, with the same browser/device.
Remote-profile a representative phone when possible. Desktop CPU throttling does
not model a weak GPU or tight memory budget. The Animations panel/slow playback
helps timing inspection, not proof of frame-budget success at normal speed.

Report location, trigger, observed symptom, trace-supported cause, proposed or
requested fix, and evidence. Distinguish measured jank from code-level risk and
unverified hypotheses. If device access is unavailable, state the verification gap.
Check reduced motion, interaction correctness, and interruption after optimization.
Apply changes only within the user's requested scope; otherwise report recommendations.

Source: adapted and qualified from [Emil Kowalski's pinned performance skill](https://github.com/emilkowalski/skills/blob/2d228630ba1446365f614a108cb8252f1feda202/skills/animation-performance/SKILL.md).
[License](../LICENSE-emil-kowalski.txt).
