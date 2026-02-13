---
name: tidy
description: Review work objectively, identify issues, create commits, and run linting
disable-model-invocation: true
---

# Cleanup Review

> ⚠️ **CRITICAL PRODUCTION ENVIRONMENT**
>
> This code deploys to a production system with real users and paying customers. Your review is the last line of defense before code reaches production.
>
> - **Be ruthlessly objective**: Don't give yourself a pass—review as if someone else wrote this code
> - **Security first**: Actively look for injection vulnerabilities, auth bypasses, and data exposure
> - **No false confidence**: If you're not 100% sure something is correct, investigate further
> - **Edge cases matter**: Real users will find every edge case you missed
> - **When uncertain, ask**: Flag issues for human review rather than assuming they're fine
> - **Better to over-report than under-report**: A false positive wastes minutes; a missed bug wastes hours or worse

You are now reviewing the recent work in this session as if you were a senior engineer reviewing a co-worker's code. Be objective and critical - don't give yourself a pass just because you wrote it.

**Optional spec:** $ARGUMENTS

If a spec path is provided, also check the implementation against the spec's acceptance criteria.

## Step 1: Objective Code Review

Review all changed files with fresh eyes. Check for:

### Code Quality
- Inconsistencies with existing codebase patterns
- Unused imports, variables, or dead code
- Overly complex logic that could be simplified
- Missing error handling
- Type safety issues (especially `any` types)

### Security
- SQL injection vulnerabilities (raw queries, unparameterized inputs)
- XSS vulnerabilities (unsanitized user content rendered as HTML)
- Exposed secrets or credentials (API keys, tokens in client code)
- Unsafe user input handling (missing validation at system boundaries)
- Missing authentication/authorization checks
- IDOR (Insecure Direct Object References) — can user A access user B's data by guessing IDs?
- Mass assignment — are request bodies filtered to only allowed fields?
- CSRF concerns on state-changing endpoints
- Broken access control — are permission checks applied consistently?

### Performance
- N+1 query patterns (fetching in loops instead of batch/join)
- Unnecessary re-renders (missing memo, unstable references in deps arrays)
- Missing database indexes for new query patterns
- Large data fetched when only a subset is needed
- Expensive operations inside render paths or hot loops

### Edge Cases
- Empty/null/undefined data handling
- Concurrent access issues (race conditions, optimistic update conflicts)
- Error states — what does the user see when things fail?
- Boundary values — max lengths, zero counts, very long strings

### API Contracts
- Missing input validation at system boundaries (Zod schemas, parameter checks)
- Response shape mismatches between API and frontend expectations
- Error responses — are they structured and informative?

### Best Practices
- Proper use of the patterns defined in skills (tRPC, TanStack Form, etc.)
- Semantic colors instead of raw Tailwind colors
- Types derived from schema instead of hand-written
- Components fetching their own data vs excessive prop drilling

### Consistency
- Naming conventions match the codebase
- File organization follows domain structure
- Error messages are user-friendly

### Wiring Verification
For new features, verify the pieces are actually connected (not just existing):
- **Component → API**: Does the component actually call the endpoint? Is the response used?
- **API → Database**: Does the route query the DB and return the result (not hardcoded)?
- **Form → Handler**: Does onSubmit actually call an API/mutation (not just `() => {}`)?
- **State → Render**: Is state rendered in JSX (not hardcoded text)?
- **New files → Imports**: Are new components/hooks actually imported and used somewhere?

Flag anything that exists but isn't wired—stubs often pass type checks but do nothing.

## Step 2: Report Issues

Create a concise, prioritized list of issues found:
- 🔴 **Critical**: Security issues, data loss risks, broken functionality
- 🟡 **Important**: Bad patterns, type safety issues, inconsistencies
- 🟢 **Minor**: Style issues, small improvements

If no issues are found, state that clearly.

## Step 3: Write Tests for Critical Functions

Only write tests for functions that are truly critical:
- **Business logic** - Calculations, validations, transformations
- **Data processing** - Parsing, formatting, normalization
- **Shared utilities** - Used in multiple places
- **Security-sensitive** - Authentication, authorization, input validation

**Skip testing:**
- Simple getters/setters
- Thin wrappers around library functions
- UI components without complex logic
- Functions already well-covered by existing tests

### Before Writing Any Test

1. **Check for existing tests** - Search for existing test files that might already cover this function
2. **Check for similar functions** - Look for existing utilities that do the same thing. Reuse instead of duplicate.
3. **Check for shared usage** - If the function is used in both `apps/api` and `apps/web`, consider moving it to `packages/shared-constants/`

### Test Structure

Write focused tests covering:
- Happy path (normal inputs)
- Edge cases (empty, null, boundaries)
- Error cases (what should throw)

```typescript
describe("functionName", () => {
  describe("happy path", () => {
    it("should X when Y", () => {});
  });

  describe("edge cases", () => {
    it("should handle empty input", () => {});
  });
});
```

## Step 4: Spec-Aware Review (If Spec Provided)

If a spec path was provided, read the spec and check:

### Acceptance Criteria Verification
- Go through each task's acceptance criteria
- Verify each criterion is actually met in the implementation
- Flag any criteria marked as complete that aren't actually done
- Flag any criteria that were missed entirely

### Implementation Completeness
- Are all tasks from the spec implemented?
- Does the implementation match what the spec described?
- Any deviations from the spec that weren't documented?

### Report Spec Issues
List any spec-related issues found:
- 🔴 **Missing**: Acceptance criteria not implemented
- 🟡 **Incomplete**: Partially implemented or not working correctly
- 🟢 **Deviation**: Works but differs from spec (document why)

## Step 5: Surface Issues as Questions

**🚨 When you encounter uncertainty, ASK instead of assuming.**

Stop and ask the user when:
- A test fails and you're unsure if the test or code is wrong
- You find duplicate code and aren't sure which version to keep
- A function seems critical but you're not sure if it needs tests
- You want to refactor something but aren't sure about the impact
- Security issues need decisions about tradeoffs
- You're tempted to add special cases or workarounds
- Acceptance criteria seem ambiguous or contradictory

**Never:**
- Change a test just to make it pass
- Ignore a failing test
- Make architectural decisions silently
- Add workarounds for issues you don't understand
- Mark acceptance criteria as met when they aren't

## Step 6: Create Logical Commits

For work that passes review:
1. Group related changes into logical commits
2. Each commit should be atomic and focused
3. Write clear commit messages that explain the "why"
4. Do NOT include co-authoring or attribution

## Step 7: Run Checks

After commits are created, run:
```bash
pnpm check
```

```bash
pnpm test
```

Report any errors that need to be addressed.

## Sprint-Aware Leniency

When reviewing work that is part of a multi-sprint spec, some issues may be expected to be resolved in a later sprint. Apply this judgment:

**Fix now (even if a later sprint exists):**
- Security vulnerabilities — never leave these open
- Broken functionality — code that's merged should work
- Type safety issues — these compound and get harder to fix later
- Wiring gaps where existing code references something that doesn't work

**Note but don't block on:**
- Missing features that are explicitly scoped to a future sprint
- Incomplete UI states that a later sprint will build out (e.g., empty state placeholder when the data-fetching sprint hasn't happened yet)
- Performance optimizations that depend on infrastructure from a later sprint

When noting deferred issues, be explicit: "This will be addressed in Sprint N: [task name]" so it's clear you've verified it's covered, not just assumed.


Now begin the review by checking git status and examining the changed files. If a spec path was provided, read the spec first.
