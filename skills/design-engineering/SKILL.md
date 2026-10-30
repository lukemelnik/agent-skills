---
name: design-engineering
description: Build, review, improve, and diagnose web UI motion and interaction polish. Use for “animate this”, “review animations”, “improve how this feels”, CSS/JS transitions, gestures, drawers, popovers, or animation jank. Purpose-first motion craft with restrained defaults, accessibility, and measured performance.
---

# Design Engineering

Unseen details compound. Prioritize invisible correctness over flashy effects.
The default is **no new decorative motion**. Preserve native and existing library
behavior rather than overriding it merely to demonstrate craft.

An explicit motion request authorizes thoughtful implementation, not indiscriminate
animation. Emil's craft is the taste reference; purpose and frequency still gate
individual choices. Removing or reducing motion is a successful outcome.

## Load only what the task needs

References are optional; do not read the whole bundle for a small task.

| Request / trigger | Load |
| --- | --- |
| “animate this”, build a transition, tune timing, springs, origins, or gestures | [Construction](references/construction.md) |
| Implement a popover, tooltip, drawer, toast, accordion, hold, reveal, or crossfade | [Recipes](references/recipes.md), alongside construction constraints |
| Jank, stutter, frame drops, CSS vs JS, acceleration, or `will-change` | [Performance](references/performance.md) |
| “review animations”, motion PR/diff critique | [Review](references/review.md); read-only |
| “improve how this feels”, audit existing motion across a bounded surface | [Improve](references/improve.md); report first, edit only when requested |

Review and improve can load construction for precise values and performance for
causal diagnostics. Do not expand a diff review into a whole-app audit.

## Decide before coding

1. **Scope:** identify the requested component or flow, current tokens, primitives,
   motion driver, and relevant browser/library versions.
2. **Purpose:** name feedback, spatial continuity, state indication, explanation,
   or prevention of a jarring change. Rare delight requires explicit scope.
3. **Frequency:** consider actual repetition, not just the input device.
4. **Cost:** choose the smallest motion and cheapest suitable existing tool.
5. **Behavior:** account for reversal, rapid retriggers, exit, focus, and cancellation.
6. **Access:** ship reduced-motion and pointer behavior with the implementation.
7. **Proof:** test normal speed, interruption, reduced motion, and real gestures.

| Frequency / context | Posture |
| --- | --- |
| Hundreds/day, keyboard-driven command UI | Keep immediate; remove added latency |
| Tens/day, navigation or repeated hover | Nothing or near-imperceptible feedback |
| Occasional modal, drawer, toast | Brief functional motion can clarify state |
| Rare onboarding or celebration | More expressive only when requested and useful |

Keyboard input is not a universal ban: an occasional dialog may retain a useful
transition. Never require animation for every keyboard action or every button.
Do not move data the user is trying to read or act on for decoration.

## Core craft

- Reuse project tokens and accessible components; do not fork a motion system or
  replace focus management, dismissal, semantics, or native behavior.
- Favor responsive ease-out entrances/exits; avoid slow-start `ease-in` when it
  makes feedback lag. Strong custom curves and duration budgets live in construction.
- Under 300ms is the UI default, not a law. Large drawers can justify 300–500ms.
- No `scale(0)` entrances. Small scale plus opacity is available, not mandatory:
  **pure fades and immediate changes are valid**, especially for reduced motion.
- Anchor scaled popovers to their trigger; viewport modals can remain centered.
- Dynamic motion must retarget from its current value. Gesture springs should
  preserve velocity; test rather than assuming an API guarantees continuity.
- Deliberate holds may be slow; cancellation and system response should be snappy.
  Equal enter/exit durations are not inherently wrong.
- Stagger and press scaling are optional tools, never universal requirements.
- Prefer `transform`/`opacity`, explicit transition properties, and small surfaces.
  Acceleration depends on property, browser, library, version, and execution path.
- Do not replace correct percentages or library syntax on an unmeasured GPU claim.

## Accessibility is behavior

Honor `prefers-reduced-motion`: avoid added translation, scale, parallax, and
overshoot. Use static state, opacity, or color only where appropriate; **zero added
animation is allowed**. JS animations must observe the same preference.
Gate hover motion with `(hover: hover) and (pointer: fine)`.
Keep focus visible, content operable, and semantic state timely during transitions.
Opacity alone does not hide a control from focus or assistive technology.

## Deliver only useful evidence

For implementation, give the change, brief purpose/timing rationale, and checks.
For reviews/audits, cite locations and the affected user flow. Separate accessibility,
broken behavior, and measured jank blockers from strong craft findings and hypotheses.
Do not manufacture issues, impose additive suggestion quotas, or require a table.
When feel is uncertain, say so: slow playback helps inspect continuity, but final
judgment needs normal-speed use; gestures need a real device.

## Sources

Adapted from Emil Kowalski's animation craft and the pinned
[upstream skills](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202).
See [LICENSE-emil-kowalski.txt](LICENSE-emil-kowalski.txt) for upstream licensing.
Local guidance intentionally favors restraint and evidence over blanket rules.
Removal guidance adapted from Emil Kowalski's
[remove-animations](https://github.com/emilkowalski/skills/blob/a81dbca07f2217b7103e510c0f13f8d5b017afc9/skills/remove-animations/SKILL.md).
