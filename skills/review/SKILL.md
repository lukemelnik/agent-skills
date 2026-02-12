---
name: review
description: Comprehensive code review with parallel agents, confidence scoring, and auto-fixing
disable-model-invocation: true
---

## When Called from /orchestrate

When invoked as part of the orchestrate pipeline, also check for cross-sprint integration issues:
- Do pieces from different sprints work together correctly?
- Are there inconsistencies between early and late sprint implementations?
- Did later sprints invalidate assumptions from earlier ones?

Include an ALERTS section at the end of your summary for the orchestrator to collect:
- SECURITY FINDINGS: vulnerabilities found (even if fixed)
- UNFIXED ISSUES: problems needing user judgment
- ACCEPTANCE GAPS: criteria not fully met
- PERFORMANCE CONCERNS: things that work but may not scale
- BREAKING CHANGES: API/schema changes affecting other consumers

---

Now determine the scope and begin.
