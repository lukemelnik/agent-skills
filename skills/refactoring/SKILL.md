---
name: refactoring
description: Perform behavior-preserving structural changes safely. Use when renaming, moving, extracting, inlining, deduplicating, simplifying, reorganizing, or replacing internals without intentionally changing product behavior.
---

# Refactoring

Preserve observable behavior while improving structure. Route intentional behavior changes through the normal feature or bug-fix workflow instead.

## Workflow

1. **State the invariant.** Name the behavior and public contracts that must remain unchanged, plus explicit non-goals.
2. **Trace the blast radius.** Find callers, implementations, tests, generated consumers, configuration, and external API commitments before editing.
3. **Pin current behavior.** Use existing tests or add focused characterization coverage where a meaningful behavior lacks proof. Load `verification` for runtime-visible behavior.
4. **Choose the target shape.** Prefer deletion, directness, and existing project patterns over new layers. Identify migration order before changing shared contracts.
5. **Work in verifiable units.** Keep each step coherent and run focused proof before advancing. Preserve unrelated changes.
6. **Finish the migration.** Update callers and remove obsolete internal paths in the same change unless a real compatibility boundary requires staging.
7. **Prove equivalence.** Run characterization coverage, affected tests, project gates, and matching runtime verification when behavior is user-visible.

Do not mix opportunistic features or speculative abstractions into the refactor. Report the preserved behavior, structural change, blast radius, and verification.
