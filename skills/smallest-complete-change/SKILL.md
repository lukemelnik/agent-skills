---
name: smallest-complete-change
description: Find the smallest complete solution without sacrificing correctness, safety, architecture, or proof. Use when asked to simplify an implementation, reduce code or diff size, avoid over-engineering or YAGNI violations, remove speculative abstractions, or choose between existing code, platform features, dependencies, and custom code.
---

# Smallest Complete Change

Optimize for the least maintenance surface that fully satisfies the request. Do not optimize for line count alone.

## Workflow

1. **Define completeness.** Identify the requested observable behavior, explicit non-goals, affected callers, tests, fixtures, configuration, exports, and user or data risks.
2. **Choose the first complete option.** Prefer, in order:
   - removing or avoiding behavior the request does not need
   - reusing an existing project helper, component, service, or established pattern
   - using a platform, native, or standard-library capability
   - using an already-installed dependency
   - writing the smallest direct implementation that remains clear
3. **Reject speculative complexity.** Do not add unrequested abstractions, wrappers, interfaces, conversions, options, configuration, compatibility paths, or “for later” code. Preserve layers and contracts the project intentionally requires.
4. **Protect the hard boundaries.** Never reduce requested behavior, trust-boundary validation, security or privacy, accessibility, data integrity, error handling that prevents loss, concurrency correctness, or required migration safety.
5. **Finish the reach.** Update every affected caller, fixture, export, schema, generated consumer, and integration point. A short local diff is not complete when wiring is broken elsewhere.
6. **Prove the behavior.** Add or run the narrowest meaningful proof for the regression risk. Load `verification` when runtime-visible behavior needs real-surface evidence.
7. **Trim once more.** Remove code that adds no behavior, safety, readability, or required project structure. Prefer readable direct code over compressed one-liners.

Do not narrate this ladder unless the choice or trade-off matters. Report what was reused, the proof completed, and any meaningful omission or remaining risk.
