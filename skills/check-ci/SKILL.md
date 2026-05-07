---
name: check-ci
description: Check GitHub Actions for failures, create a fix plan, and resolve after confirmation
---

# Check CI

Investigate GitHub Actions failures, create a plan to fix them, and execute after user confirmation.

## Step 1: Get CI Status

Check recent workflow runs:
```bash
gh run list --limit 10
```

Find the failing run:
```bash
gh run list --status failure --limit 5
```

## Step 2: Get Failure Details

View the failed run logs:
```bash
gh run view <run-id> --log-failed
```

Or for more detail:
```bash
gh run view <run-id> --log
```

## Step 3: Analyze Failures

Identify the type of failure:

### Common CI Failures

**Type Errors**
- TypeScript compilation failures
- Missing type definitions

**Lint Errors**
- ESLint/Biome violations
- Formatting issues

**Test Failures**
- Unit test assertions failing
- Integration test timeouts

**Build Failures**
- Missing dependencies
- Import errors
- Bundle size issues

**Environment Issues**
- Missing env variables
- Database connection failures
- Service unavailable

## Step 4: Create Fix Plan

**⚠️ STOP HERE - Do not proceed without user confirmation**

Present a clear plan:

```
## CI Failure Analysis

**Failed Job:** [job name]
**Error Type:** [type/lint/test/build/env]

### Root Cause
[Explain what's causing the failure]

### Proposed Fix
1. [First step]
2. [Second step]
3. [Third step]

### Files to Modify
- `path/to/file.ts` - [what change]
- `path/to/other.ts` - [what change]

### Risk Assessment
- [Low/Medium/High] - [why]

### Verification
After fix, will run:
- `pnpm check`
- `pnpm test` (if test failure)
- Push and verify CI passes

**Proceed with this fix plan?**
```

## Step 5: Execute Fix (After Confirmation)

Only after user confirms:

1. Make the planned changes
2. Run local verification:
   ```bash
   pnpm check
   pnpm test  # if applicable
   ```
3. Commit with clear message referencing CI fix
4. Push changes
5. Monitor CI:
   ```bash
   gh run watch
   ```

## Step 6: Report Results

After CI completes:
- ✅ If passing: Report success
- ❌ If still failing: Analyze new errors, create new plan, confirm again

## Important Rules

1. **Always create a plan first** - Never jump straight to fixing
2. **Wait for confirmation** - User must approve before changes
3. **Don't hide problems** - If the fix seems wrong, say so
4. **One issue at a time** - Fix the first failure, then reassess
5. **Document what you learn** - Note any patterns for future reference
