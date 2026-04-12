---
name: implement-tdd
description: Implement a feature spec with red-green-refactor — work through sprints and tasks, satisfy proof obligations one behavior at a time, keep the spec current, run gates, commit, push, and open a PR. Use when given a path to a spec file in specs/ or a GitHub issue number and the user wants a strict TDD workflow.
---

# Implement with TDD

Execute a feature spec from start to PR using strict test-driven development. This skill uses the same spec contract as `/implement`, but the execution method is different: one proof item at a time, red → green → refactor.

> **Production environment.** This deploys to real users. Be defensive. When uncertain, ask.

**Input:** $ARGUMENTS — either:
- **A path to a spec file** (e.g., `specs/2026-04-07-webhook-reliability.md`) — from `/living-spec`
- **A GitHub issue number** (e.g., `42` or `#42`) — from `/spec`

## Core principles

- **The spec defines the work; this skill defines the method.**
- **One behavior at a time.** Do not write all tests first, then all implementation.
- **Prefer public boundaries.** Tests should prove behavior through the task's `Primary proof boundary`, not internal implementation details.
- **Integration-first when the spec says integration.** For API work, prefer real app-boundary tests with realistic data setup over mocks of internal collaborators.
- **Mock only true external boundaries** (third-party APIs, time, randomness, sometimes filesystem/network). Do not mock your own modules just to make tests easier.
- **Simple tasks can still use TDD.** The difference is that the loop may only need one small tracer-bullet cycle.

## Detecting input mode

- If the argument contains `/` or ends in `.md` → **file mode**
- If the argument is numeric (with optional `#` prefix) → **issue mode**

Throughout this skill, "the spec" refers to the content regardless of source.

## Step 1: Read the spec end to end

Fetch the spec content based on the input mode:

- **File mode:** read the spec file directly with the `read` tool.
- **Issue mode:**
  ```bash
  gh issue view <num> --json title,body,url,state --jq '.title, .body, .url, .state'
  ```
  If the issue is closed, alert the user and stop.

Read the entire spec before doing anything. Pay close attention to:

- Goal / Non-Goals
- Constraints / Invariants
- Decisions & Trade-offs
- Ruled Out
- Prior Art / Blessed Patterns
- Relevant Files
- Tasks, especially each task's:
  - `Risk`
  - `Primary proof boundary`
  - `Required proof`
  - `Done when`
- Verification
- Changes During Implementation (if present)

Some older specs may not include the newer task metadata (`Risk`, `Primary proof boundary`, `Required proof`). If a task is missing one of these, infer the lightest sensible default and continue. Do not rewrite the spec just to backfill metadata unless the user asks.

## Step 2: Load context from Relevant Files

Read each file in the Relevant Files section before starting implementation. Also read named tests, factories, helper modules, and similar prior-art examples that matter for the proof boundary.

## Step 3: Set up the branch

Check the current branch:

```bash
git branch --show-current
```

If already on a feature branch, use it. If on `main`, create a new feature branch using the same slugging rules as `/implement`.

> **NEVER push directly to main. NEVER.**

## Step 4: Execute the sprints with TDD

Work sprint by sprint, task by task, in order.

For each sprint:
1. Re-read the current spec.
2. Re-read the current sprint and task metadata.
3. Implement each task via red-green-refactor.
4. Keep the spec current as work progresses.
5. After the sprint is complete, run the repo's normal gates.
6. Commit at a meaningful sprint or task boundary.

## Step 5: Run the TDD loop for each task

For each task in the current sprint:

1. **Understand the target behavior.**
   - Respect Constraints / Invariants.
   - Reuse Prior Art / Blessed Patterns.
   - Let `Primary proof boundary` determine where the proof should live.
   - Let `Required proof` determine which behaviors need explicit cycles.

2. **Choose the next proof slice.**
   - If `Required proof` is present, pick the next unmet behavior bullet.
   - If the task is behavior-changing but has no explicit proof bullets, create one small tracer-bullet behavior yourself.
   - If `Primary proof boundary` is `none` and the task is truly mechanical/non-behavioral, skip strict red-green and complete it directly, then verify via appropriate gates.

3. **RED: write the smallest failing proof for that slice.**
   - **Unit:** test through the relevant public interface, not private helpers.
   - **Integration:** test at the real app boundary where practical (e.g. real router/procedure/app path, realistic DB-backed setup, factories/scenario helpers).
   - **E2E:** use a focused end-to-end proof only when that boundary is genuinely required.
   - Do not bulk-write the whole task's test matrix before implementation.

4. **GREEN: write the minimum code to make that proof pass.**
   - Do not anticipate later proof slices.
   - Do not add speculative abstractions.
   - If the test setup is awkward, improve the helper/factory/scenario layer only as much as needed.

5. **REFACTOR: clean up while staying green.**
   - Remove duplication.
   - Deepen modules where the new code reveals a better boundary.
   - Keep tests on public behavior, not implementation details.

6. **Repeat until the task's required proof is satisfied.**
   - For low-risk tasks, this may be one or two cycles.
   - For higher-risk tasks, work branch by branch.

7. **Finish the non-test checklist for the task.**
   - Satisfy the task's `Done when` criteria.
   - If the task needed new helpers, fixtures, or scenario builders to make proof maintainable, include them as part of the task.

8. **Run targeted verification for the finished task.**
   - Re-run the narrowest relevant test selection first.
   - If you encounter failing proof after 2-3 thoughtful attempts, stop and surface the blocker.

## Step 6: Guidance by proof boundary

### `none`
- Use when the task is truly mechanical or non-behavioral.
- Do not invent fake TDD loops when nothing observable changes.
- Still verify via the narrowest meaningful command and project gates.

### `unit`
- Prefer pure public interfaces.
- Avoid mocking your own collaborators.
- Keep tests resilient to refactors.

### `integration`
- Prefer realistic app-boundary tests.
- For DB-backed work, favor minimal per-test factories/scenario builders over giant shared seed worlds when possible.
- If an endpoint touches multiple tables, add small helpers to create the required graph rather than bloating a shared global seed.
- Add or improve test helpers when the setup burden is obscuring the behavior.

### `e2e`
- Use for wiring, cross-system flows, and critical user journeys.
- Keep them focused. Do not use E2E to replace the entire API behavior matrix.

## Step 7: Keep the spec truthful

As you work:

- Mark `Done when` checkboxes as they become true.
- **File mode:** update the spec file with targeted edits.
- **Issue mode:** fetch the current issue body, update it, and write it back.
- If implementation materially changes the plan:
  - update affected sprint/task/verification sections
  - add `## Changes During Implementation` if needed
  - add a concise bullet describing what changed and why
- **If scope, Non-Goals, Decisions & Trade-offs, or Constraints / Invariants need to change, stop and ask the user first.**
- **Flag major architectural changes explicitly.**
- **Never install a new external dependency without explicit user consent.** If TDD exposes a missing library/helper you think you need, ask first.

## Step 8: Run gates at sprint boundaries

After each sprint is fully complete:

1. Run the repo's standard gates for the completed work.
2. Fix underlying failures before moving on.
3. If repeated attempts still fail, stop and surface the blocker.
4. Commit the sprint as a coherent unit when appropriate.

If the spec is tiny and one task effectively is the sprint, this means gates run after that task.

## Step 9: Handle blockers and ambiguity

If you hit a blocker or genuine ambiguity:

- **Stop. Do not guess.**
- **Ask the user** with specific options and your recommendation.
- **If a new dependency seems necessary, do not install it. Ask first.**
- **If the implementation implies a major architectural change, surface it explicitly.**
- **If you must deviate materially from the spec, get approval and then update the spec so it stays accurate.**

## Step 10: Final verification

After all sprints and tasks are complete:

1. Run the full gate suite.
2. Walk through the Verification section and confirm each criterion is met.
3. Mark Verification checkboxes as you confirm them.
4. Ensure the spec is current, including `Changes During Implementation` if needed.
5. Commit any final updates.

## Step 11: Push and create the PR

1. **Push the branch:**
   ```bash
   git push -u origin "feat/$SLUG"
   ```

2. **Create the PR by invoking the `/pr` skill.**
   - File mode: `/pr` can infer the spec from the branch.
   - Issue mode: ensure the PR body includes `Closes #N`.

3. **Report back to the user** with:
   - PR URL
   - brief summary of what was built
   - material spec changes made during implementation
   - any manual verification still needed
   - any dependency requests or architectural decisions that still need follow-up

## Rules

1. **Read the spec end to end first.**
2. **Work sprint by sprint, task by task.**
3. **Use red-green-refactor for behavior-changing tasks.**
4. **Let `Primary proof boundary` decide where the proof lives.**
5. **Treat `Required proof` as the queue of behaviors to drive.**
6. **Do not horizontal-slice all tests first.**
7. **Keep tests on public behavior, not implementation details.**
8. **Keep the spec current when material changes happen.**
9. **Flag major architectural changes explicitly.**
10. **Never install external dependencies without explicit user consent.**
11. **Never push to main.**
12. **Always create a PR at the end.**

## Output Format

End with a structured report:

```markdown
## Summary
[1-2 paragraphs of what was built]

## PR
[URL]

## Spec Updates During Implementation
[Any material spec changes and why. "None" if none.]

## Manual Verification Needed
[Acceptance criteria that still need visual or manual testing]

## Notes
[Any dependency requests, architectural decisions, performance observations, or follow-up items]
```
