---
name: refactoring
description: Make behavior-preserving structural changes (rename, move, extract, inline, deduplicate, replace internals). Use when the intent is restructuring without changing product behavior.
---

# Refactoring

- State the behavior and public contracts that must not change; route intentional behavior changes through the normal feature or bug-fix flow.
- Trace callers, implementations, tests, generated consumers, configuration, and external API commitments before editing.
- Pin current behavior with existing tests or focused characterization tests; load `verification` for runtime-visible behavior.
- Finish the migration: update callers and remove obsolete internal paths in the same change unless a real compatibility boundary requires staging.
- No opportunistic features or speculative abstractions.

Report the preserved behavior, structural change, and verification.
