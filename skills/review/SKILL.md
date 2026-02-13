---
name: review
description: Comprehensive code review with parallel agents, confidence scoring, and auto-fixing
disable-model-invocation: true
---

# Code Review

> ⚠️ **CRITICAL PRODUCTION ENVIRONMENT**
>
> This code deploys to a production system with real users and paying customers.
> Be ruthlessly objective. Better to over-report than under-report. A false positive wastes minutes; a missed bug wastes hours or worse.

You are running a comprehensive code review using multiple parallel agents. Each agent independently reviews the changes from a different perspective. Findings are confidence-scored to filter false positives.

**Arguments:** $ARGUMENTS

This can be:
- Empty — review all changes on this branch vs main
- A GitHub issue number — also checks acceptance criteria against the spec
- Specific aspects: `security`, `errors`, `wiring`, `patterns` (default: all)

## Step 1: Determine Scope

```bash
git diff main...HEAD --stat
git diff --stat
```

If an issue number is provided, fetch the spec:
```bash
gh issue view <num> --json title,body
```

If there are no changes vs main (e.g., on main branch), fall back to reviewing uncommitted + staged changes.

## Step 2: Gather Context

Spawn a **Task sub-agent** (`haiku`) to:
- Read the root CLAUDE.md
- Identify CLAUDE.md files in directories with changes
- Summarize the overall change in 2-3 sentences
- Return the CLAUDE.md content and summary

## Step 3: Launch Review Agents

Launch these **in parallel** as Task sub-agents (`general-purpose`). Each agent must:
- Score every finding 0-100 for confidence
- Only report findings with confidence ≥ 50
- Only flag issues IN the changes, not pre-existing issues
- Return structured output: `file | line range | description | category | confidence`

### Agent 1: Convention & Pattern Compliance

```
Review the git diff (run: git diff main...HEAD) against CLAUDE.md conventions.

<conventions>
{CLAUDE.md content from Step 2}
</conventions>

Check every change for violations:
- Forbidden: any types, as casts, @ts-ignore, biome-ignore, console.log in API
- Required: semantic colors (not raw Tailwind), derived types (not hand-written), static imports in API
- Required: structured logging (ctx.log or domain loggers), size-* for icons, CdnImage for CDN images
- Required: modal/sheet state via URL search params (not useState), skipToken for conditional queries
- Required: no comments in code, no left border accents, no useEffect for form defaults
- Pattern compliance: tRPC queryOptions, TanStack Form with Field component, form.useStore() for reactive state

For each finding, verify the CLAUDE.md ACTUALLY calls it out. Score 0-100.
Ignore: pre-existing violations, issues linters will catch, pedantic nitpicks.
```

### Agent 2: Bug & Security Scanner

```
Scan the git diff for bugs and security vulnerabilities.

Run git diff main...HEAD, then read full files for context where needed.
Run git blame on modified sections for historical context.

SECURITY:
- SQL injection (raw queries, unparameterized inputs)
- XSS (unsanitized user content rendered as HTML)
- IDOR (can user A access user B's data by guessing IDs?)
- Auth bypass (missing permission checks on endpoints)
- Mass assignment (request bodies not filtered to allowed fields)
- Exposed secrets (API keys, tokens in client code)
- CSRF on state-changing endpoints

BUGS:
- Logic errors (wrong conditions, off-by-one, inverted checks)
- Race conditions (concurrent access without locks/transactions)
- Null/undefined access without guards
- Resource leaks (unclosed connections, missing cleanup)
- Incorrect error handling (swallowed errors, wrong error types)
- Data corruption risks

Score each finding 0-100. Ignore pre-existing issues not introduced in this diff.
```

### Agent 3: Error Handling, Edge Cases & Performance

```
Review the git diff for error handling gaps, missed edge cases, and performance issues.

Run git diff main...HEAD, then read full files for context.

ERROR HANDLING:
- Silent failures (empty catch blocks, catch-and-continue without logging)
- Missing error handling on API calls, DB queries, file operations
- Missing error states in UI (what does the user see when it fails?)
- Errors not logged with structured logging

EDGE CASES:
- Empty arrays/objects — does the UI handle zero results?
- Null/undefined — are optional fields handled?
- Very long strings — overflow or truncation?
- Concurrent mutations — two users editing the same thing?
- Boundary values — max/min, zero, negative

PERFORMANCE:
- N+1 query patterns (fetching in loops instead of batch/join)
- Unnecessary re-renders (missing memo, unstable deps)
- Missing database indexes for new query patterns
- Expensive operations in render paths or hot loops
- Large data fetched when subset would suffice

VALIDATION:
- Missing input validation at system boundaries
- Response shape assumptions without checks

Score each finding 0-100. Only flag issues in the changes.
```

### Agent 4: Wiring & Integration

```
Verify the changes are properly wired end-to-end.

Run git diff main...HEAD.

For every new or modified piece, verify:
- Component → API: Does it call the endpoint? Is the response used in JSX?
- API → Database: Does the route query the DB (not return hardcoded data)?
- Form → Handler: Does onSubmit call a mutation/API (not empty () => {})?
- State → Render: Is state actually rendered (not just stored)?
- New files → Imports: Are new components/hooks imported and used somewhere?
- Routes → Navigation: Are new routes reachable from the UI?
- Schema → Types: Do new DB columns flow through to the API response and frontend types?

Flag anything that exists but isn't wired — stubs pass type checks but do nothing.

Score each finding 0-100.
```

### Agent 5: Spec Compliance (only if spec provided)

```
Verify the implementation against the spec's acceptance criteria.

<spec>
{spec body}
</spec>

Run git diff main...HEAD.

For EVERY acceptance criterion in the spec:
1. Find the code that implements it
2. Verify it actually works (not just exists)
3. Check if the implementation matches the spec's intent

Report each criterion as:
- ✅ MET: Fully implemented with evidence
- ⚠️ PARTIAL: Partially done or uncertain
- ❌ MISSING: Not implemented
- 🔄 DEVIATED: Implemented differently — describe what changed and why it may or may not be fine
```

## Step 4: Aggregate and Filter

After all agents return:

1. **Collect** all findings
2. **Filter** to confidence ≥ 75 (discard noise)
3. **De-duplicate** — if multiple agents found the same issue, keep the highest-confidence version
4. **Sort** by: Critical (security, data loss, broken functionality) → Important (bad patterns, type safety) → Suggestions (minor improvements)

### Discard these false positives:
- Pre-existing issues not introduced in the diff
- Things linters/type-checkers catch (gates handle this)
- Pedantic nitpicks a senior engineer wouldn't flag
- Issues on lines not modified in the diff
- Code with lint-ignore comments (intentionally suppressed)

## Step 5: Fix and Report

### Auto-fix high-confidence issues (≥ 85):
For clearly fixable findings:
1. Fix the issue
2. Run gates: `pnpm check && pnpm check-types && pnpm test`
3. Commit: `git add <files> && git commit -m "review: fix <description>"`

### Report all findings:

```
## Review Results

### 🔴 Critical (must fix)
- [Agent]: Description — file:line (confidence: N) [FIXED/NEEDS ATTENTION]

### 🟡 Important (should fix)
- [Agent]: Description — file:line (confidence: N) [FIXED/NEEDS ATTENTION]

### 🟢 Suggestions
- [Agent]: Description — file:line (confidence: N)

### ✅ Spec Compliance (if spec provided)
- [Criterion]: ✅/⚠️/❌/🔄 — evidence

### 📊 Summary
- Issues found: N (after filtering)
- Auto-fixed: N
- Need user attention: N
- Spec criteria: N/M met
```

### Items needing user input:
Clearly list any findings that:
- Require architectural decisions
- Have tradeoffs needing human judgment
- Are uncertain (confidence 50-74) but potentially important
- Represent spec deviations the user should approve


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


Now determine the scope and begin.
