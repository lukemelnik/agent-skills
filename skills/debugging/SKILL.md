---
name: debugging
description: Root-cause and fix a reported bug, regression, crash, or hard-to-reproduce runtime failure. Use when asked to investigate or repair faulty behavior, not for routine edits.
---

# Debugging

- Respect whether the user asked for diagnosis only or a fix.
- Reproduce first on the matching runtime surface (load `verification` when setup or interaction is involved). If impractical, state the limitation and the strongest proxy.
- Confirm the mechanism, showing that the surviving cause produces the symptom, before designing the fix. Distinguish product defects from environment, fixture, dependency, and test-harness failures.
- Fix the root cause with the smallest justified change. No speculative guards, retries, or unrelated cleanup.
- Prove the fix by repeating the original reproduction on the same surface, then the narrowest regression test (failing-then-passing when cheap).
- If the mechanism stays unconfirmed, report a diagnosis or blocker, not a guess presented as a fix.

Report the symptom, confirmed cause, fix, and before/after evidence.
