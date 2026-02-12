---
name: check-ci
description: Check GitHub Actions for failures, create a fix plan, and resolve after confirmation
disable-model-invocation: true
---
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
