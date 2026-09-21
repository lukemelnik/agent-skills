---
name: debugging
description: Diagnose and fix bugs, regressions, crashes, incorrect behavior, and difficult runtime failures using evidence-first debugging. Use when asked to investigate, reproduce, root-cause, or repair faulty behavior.
---

# Debugging

Separate observation, hypothesis, confirmed mechanism, and fix.

## Workflow

1. **Set scope.** Respect whether the user requested diagnosis only or a complete fix.
2. **Reproduce first.** Use the matching runtime surface and load the `verification` skill when environment setup or user interaction is involved. If reproduction is impractical, state the concrete limitation and strongest available proxy.
3. **Collect evidence.** Record the exact trigger, expected and actual behavior, relevant state, logs, errors, and timing. Add focused instrumentation when state is unclear.
4. **Isolate the cause.** Form competing hypotheses and eliminate them with high-information checks. Distinguish product defects from environment, fixture, dependency, and test-harness failures.
5. **Confirm the mechanism.** Show that the surviving cause produces the symptom before designing the fix.
6. **Fix the root cause.** Make the smallest change justified by the evidence. Do not ship speculative guards, retries, or unrelated cleanup.
7. **Prove the fix.** Repeat the original reproduction on the same surface, then run the narrowest regression tests. Add a failing-then-passing test first when the path is cheap and meaningful.

Report the symptom, confirmed cause, fix, and before/after evidence. If the mechanism remains unconfirmed, report a diagnosis or blocker rather than presenting a guess as a fix.
