# Improve existing motion

Use for “improve how this feels”, “improve the animations”, or a bounded motion
audit. This is **not a search for new animation opportunities**. Follow the
[main skill](../SKILL.md): report by default; edit only when the user requests edits.
No automatic plan files, worktrees, installs, or mandatory delegation.

## 1. Bound the work

Use the named page/component/flow. If the request is app-wide, establish a practical
coverage boundary and prioritize high-traffic existing motion; clarify genuinely
ambiguous scope. Do not silently expand into every marketing page or unrelated UI.

Map framework, accessible primitives, motion library/version, tokens, animation
locations, product personality, and frequency of the selected interactions. Search
within scope for transitions, keyframes, motion props, springs, gesture handlers,
reduced-motion rules, origins, and per-frame updates. Include existing native/library
behavior: working defaults are not a blank canvas requiring replacement.

## 2. Audit the actual interactions

Use [construction](construction.md) for precise starting values,
[review](review.md) for impact/evidence standards, and [performance](performance.md)
when diagnosing stutter. Check:

1. **Purpose and repetition:** remove/reduce motion that repeatedly delays work.
   Keep frequent keyboard-driven UI immediate without declaring every keyboard-opened
   surface forbidden to animate.
2. **Easing and duration:** does direct feedback start promptly? Does the budget
   match distance and frequency? Large drawers can justify 300–500ms; a dropdown
   ordinarily belongs around 150–250ms. Respect deliberate coherent tradeoffs.
3. **Origin and continuity:** trigger-aware scaled popovers, no scale-from-zero,
   coherent exit paths, no jumps on retrigger. Pure fades are valid.
4. **Interruption and gestures:** rapid reversal, spring velocity, active-pointer
   capture/guards, cancellation, scrolling, directional flicks, and boundary resistance.
5. **Performance:** trace layout/paint/main-thread contention before promising a fix.
   Avoid per-frame React state and broad inherited variable invalidation. Inspect
   installed versions; no universal CSS or Motion acceleration claims.
6. **Accessibility:** reduced motion has no added translation/scale/parallax/overshoot;
   static or suitable opacity/color is sufficient. Hover gating and focus/semantic
   state must work during transitions and exits.
7. **Cohesion and tokens:** consolidate accidental near-duplicates using project
   conventions, not a parallel token system. Existing library motion may be best.

Do not report missing stagger, button scale, blur, or celebration as defects.
Do not require an additive suggestion quota. Immediate state changes may be correct;
only discuss a missing transition if an observed broken/jarring flow requires it,
and consider non-motion corrections first.

## 3. Vet and prioritize

Re-read each cited location, check callers and documented decisions, remove duplicates
and false positives, and separate actual evidence from hypotheses. Rank by user
impact, repetition, confidence, and effort. Accessibility/broken interaction/measured
jank are blockers; sluggish feel and wrong origin are strong craft findings with
flow context, not automatically correctness failures.

Return a short set of high-confidence findings: location, trigger, consequence,
recommended change (including delete/reduce), and verification needed. State coverage
and gaps. “The motion here is already right” is a valid result; don't pad the report.
No forced before/after tables, canned greeting, or mandatory planning artifacts.

## 4. Implement only when authorized

If the user asked only for an audit, stop at recommendations. If edits were requested,
apply bounded changes consistent with project components/tokens; do not demand a
separate execution command. Clarify selections only when materially ambiguous.

If a handoff/plan is requested, make it self-contained in the user's chosen format:
current file/symbol and relevant behavior, exact target token/value, scope/non-goals,
ordered changes, and proof. No implicit references to “the curve above”; include the
actual existing token or `cubic-bezier(0.23, 1, 0.32, 1)` where appropriate. Do not
create plan directories by default.

Verify normal-speed responsiveness, rapid retriggers, cancellation/unmount, variable
content, reduced motion, keyboard/focus, touch and real-device gestures. For measured
performance fixes compare equivalent traces. Use slow playback/frame stepping for
continuity and fresh eyes for feel; report unperformed checks honestly.

Source: adapted from [Emil Kowalski's pinned improvement material](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202/skills/improve-animations).
[License](../LICENSE-emil-kowalski.txt).
