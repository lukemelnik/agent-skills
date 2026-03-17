---
name: review-spec
description: Review a spec for clarity, completeness, and hidden risks
disable-model-invocation: true
---

# Review Spec

Review a spec as a senior engineer would — focus on substance over format.

**Spec:** $ARGUMENTS

This can be a GitHub issue number (e.g., `42`), a file path, or raw content.

## Step 1: Fetch and Read the Spec

- Issue number: `gh issue view <num> --json title,body`
- File path: read the file
- Raw content: use as-is

Read the entire spec. Understand the goal, the approach, and the tasks.

## Step 2: Stress-Test the Design

This is the core of the review. Don't check formatting — check thinking.

**For every spec:**
- Are there edge cases not covered? (empty states, nulls, boundaries, concurrent access)
- What error scenarios are missing? (network failures, invalid input, partial failures)
- Are auth/permission implications addressed?
- Are acceptance criteria objectively verifiable, not vague?

**For substantial specs:**
- **Architecture:** Why this approach? What alternatives were considered? Where could this design become a problem later?
- **Hidden coupling:** Does this affect other features? Break existing behavior? Depend on implicit contracts?
- **Data integrity:** Race conditions, consistency, crash recovery, idempotency needs?
- **Performance:** Will this scale? N+1 queries, unbounded lists, missing indexes?
- **Security:** New attack surface? Privilege escalation? Data exposure?
- **Migration:** Existing data impact? Downtime risk? Backwards compatibility during rollout?

## Step 3: Report Findings

Structure by severity, not by checklist:

**Must fix** — Issues that will cause bugs, block implementation, or lead to the wrong thing being built.

**Worth discussing** — Tradeoffs, risks, or ambiguities where the spec author should make a deliberate choice.

**Minor** — Small improvements, only if worth mentioning.

For each finding, explain *why* it matters and suggest a fix or a question to resolve it.

## Step 4: Offer to Update

Ask if the user wants you to apply fixes. If yes, update the issue (`gh issue edit <num> --body "..."`) or file and show what changed.
