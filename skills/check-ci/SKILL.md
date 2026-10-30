---
name: check-ci
description: Check GitHub Actions for failures, create a fix plan, and resolve after confirmation
---

# Check CI

Investigate failing GitHub Actions runs (`gh run list --status failure`, `gh run view <id> --log-failed`), present a fix plan, and execute only after user confirmation.

## Plan (stop here for confirmation)

Do not change anything before the user approves:

```
## CI Failure Analysis
**Failed Job:** [job name]
### Root Cause
[what is causing the failure]
### Proposed Fix
1. [step]
### Files to Modify
- `path` - [change]
### Risk
- [Low/Medium/High] - [why]
### Verification
- [the repository's required local gates, plus targeted tests]
- Push and verify CI passes

**Proceed with this fix plan?**
```

## Execute (after confirmation)

1. Make the planned changes and run the local verification from the plan, using the repository's package manager and gates.
2. Commit with a message referencing the CI fix, push, and monitor with `gh run watch`.
3. If CI still fails, analyze the new errors, present a new plan, and confirm again.

Fix one failure at a time, then reassess. If a proposed fix seems wrong or only masks the problem, say so.
