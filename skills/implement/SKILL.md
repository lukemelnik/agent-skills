---
name: implement
description: Implement a feature spec end to end — work through sprints and tasks, satisfy proof obligations, keep the spec current, run gates, commit, push, and open a PR. Use when given a path to a spec file in specs/ or a GitHub issue number.
---

# Implement

Execute a feature spec from start to PR. This skill is the bridge between planning (`/spec-builder` or `/spec`) and finalization (`/pr`).

> **Production environment.** This deploys to real users. Be defensive. When uncertain, ask.

**Input:** $ARGUMENTS — either:
- **A path to a spec file** (e.g., `specs/2026-04-07-webhook-reliability.md`) — from `/spec-builder`
- **A GitHub issue number** (e.g., `42` or `#42`) — from `/spec`

## Detecting input mode

- If the argument contains `/` or ends in `.md` → **file mode**: read the spec from the file system
- If the argument is numeric (with optional `#` prefix) → **issue mode**: fetch the spec body from GitHub via `gh issue view`

Throughout this skill, "the spec" refers to the content regardless of source. Steps that differ between modes call out the difference explicitly.

## Step 1: Read the spec end to end

Fetch the spec content based on the input mode:

- **File mode:** read the spec file directly with the `read` tool.
- **Issue mode:**
  ```bash
  gh issue view <num> --json title,body,url,state --jq '.title, .body, .url, .state'
  ```
  If the issue is closed, alert the user and stop.

Read the entire spec before doing anything. Pay close attention to:

- **Goal and Non-Goals** — these define what's in and out of scope. Non-Goals are the "helpful creativity kill-switch" — do not expand scope with "helpful" additions.
- **Constraints / Invariants** — these are non-negotiable. Treat them as hard boundaries.
- **Decisions & Trade-offs** — these explain *why* choices were made. **Do not second-guess them.**
- **Ruled Out** — approaches already considered and rejected. Don't re-suggest them.
- **Prior Art / Blessed Patterns** — existing code to reuse. Do not reinvent abstractions that already exist.
- **Relevant Files** — pre-discovered code you'll need to read or modify.
- **Tasks** — your execution plan, organized into sprints.
- **Risks & Rollback** — what to watch for.
- **Verification** — the overall acceptance criteria.
- **Changes During Implementation** — if present, treat it as the latest truth about prior deviations or discoveries.

Some older specs may not include the newer task metadata (`Risk`, `Primary proof boundary`, `Required proof`). If a task is missing one of these, infer the lightest sensible default and continue. Do not rewrite the spec just to backfill metadata unless the user asks.

## Step 2: Load context from Relevant Files

Read each file in the Relevant Files section before starting implementation. The spec was written assuming you'd do this — it gives you the existing patterns, conventions, and code shape you'll need to follow. Skipping this leads to reinventing things and missing project conventions.

If the spec names tests, factories, helpers, or reference implementations, read those too.

## Step 3: Set up the branch

Check the current branch and default branch:

```bash
CURRENT_BRANCH=$(git branch --show-current)
DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name' 2>/dev/null || git remote show origin | sed -n '/HEAD branch/s/.*: //p' || echo main)
```

If already on a feature branch, use it. If on `main`, `master`, or the repo default branch, create a new feature branch. The slug source depends on input mode:

- **File mode:** extract the slug from the spec filename (the part after the date prefix).
  ```bash
  # specs/2026-04-07-webhook-reliability.md → feat/webhook-reliability
  SLUG=$(basename "$SPEC_FILE" .md | sed 's/^[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}-//')
  git checkout -b "feat/$SLUG"
  ```

- **Issue mode:** slugify the issue title.
  ```bash
  TITLE=$(gh issue view <num> --json title --jq .title)
  SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//; s/-$//')
  git checkout -b "feat/$SLUG"
  ```

> **NEVER push directly to `main`, `master`, or the repo default branch. NEVER.** This is non-negotiable.

## Step 4: Execute the sprints

Work sprint by sprint, task by task, in order. Do not skip ahead unless the spec explicitly allows parallelization.

For each sprint:
1. Re-read the current spec before starting the sprint.
2. Read each task carefully:
   - task description
   - `Risk`
   - `Primary proof boundary`
   - `Required proof`
   - `Done when`
3. Implement the sprint task by task.
4. Keep the spec current as work progresses.
5. After the sprint is complete, run the repo's normal gates for the completed work.
6. Commit at a meaningful sprint or task boundary.

## Step 5: Execute each task

For each task in the current sprint:

1. **Understand the task before changing code.**
   - Respect Constraints / Invariants strictly.
   - Reuse Prior Art / Blessed Patterns.
   - Follow the patterns from Relevant Files.
   - Use the task's `Risk`, `Primary proof boundary`, and `Required proof` to decide how much verification this task needs.

2. **Implement the task directly.**
   - This skill is the default implementation workflow, not strict TDD.
   - It is fine to code first, then verify.
   - But do not treat tests as an afterthought — the task's proof obligations are part of the definition of done.

3. **Satisfy the task's proof obligations.**
   - **If `Primary proof boundary` is `none`:** no new task-specific test is required unless one is needed to safely prove behavior.
   - **If `unit`:** add or update narrowly scoped tests around the relevant public interface.
   - **If `integration`:** add or update integration tests at the real app boundary where practical.
   - **If `e2e`:** add or update a focused end-to-end proof for the behavior, or stop and ask if the environment is not realistically available.
   - Prefer one canonical proof boundary per behavior. Do not duplicate deep coverage across multiple transports unless transport-specific behavior itself matters.
   - If a task needs new factories, scenario builders, or test helpers to make the proof maintainable, add them as part of the task.

4. **Mark task progress in the spec.**
   - Mark the task's `Done when` checkboxes as you satisfy them.
   - **File mode:** use targeted edits on the spec file.
   - **Issue mode:** fetch the current issue body, update it, and write it back:
     ```bash
     gh issue view <num> --json body --jq .body > /tmp/issue-body.md
     # ... edit /tmp/issue-body.md ...
     gh issue edit <num> --body-file /tmp/issue-body.md
     ```

5. **Keep the spec truthful if the plan changes.**
   - For **minor implementation details**, no spec change is needed.
   - For **material changes**, update the spec itself so it remains the source of truth:
     - update affected sprint/task/verification sections
     - add `## Changes During Implementation` if it does not exist yet
     - add a concise bullet describing what changed and why
   - **If scope, Non-Goals, Decisions & Trade-offs, or Constraints / Invariants need to change, stop and ask the user first.**
   - **Flag major architectural changes explicitly.** Do not bury them in task notes.
   - **Never install a new external dependency without explicit user consent.** If one appears necessary, stop and ask.

6. **Run targeted verification for the task.**
   - Run the narrowest useful commands to prove the task's required behavior first.
   - Fix failures by understanding root cause before changing code again.
   - If you make 2-3 thoughtful attempts and the task proof is still failing, stop and surface it as a blocker.

## Step 6: Run gates at sprint boundaries

After each sprint is fully complete:

1. Run the repo's standard gates for completed work. Check `AGENTS.md` / `CLAUDE.md` for the exact commands.
2. If a gate fails, fix the underlying issue before moving on.
3. If repeated attempts fail, stop and surface the blocker.
4. Commit the sprint as a coherent unit when appropriate.

If the spec is small enough that one task effectively *is* the sprint, this means gates run after that task.

## Step 7: Handle blockers and ambiguity

If you hit a blocker or genuine ambiguity:

- **Stop. Do not guess.**
- **Ask the user** with specific options and your recommendation.
- **If implementation uncovers a likely new dependency, do not install it. Ask first.**
- **If implementation implies a major architectural change, surface it explicitly.**
- **If you must deviate materially from the spec, update the spec after approval so it stays accurate.**

## Step 8: Final verification

After all sprints and tasks are complete:

1. **Run the full gate suite one more time** (lint, formatting, types, tests, and any other required project gates).
2. **Walk through the Verification section** of the spec and confirm each criterion is met.
3. **Mark the Verification checkboxes** as you confirm them.
4. **Ensure the spec is current.** If any material implementation changes occurred, verify the relevant sprint/task sections and `Changes During Implementation` accurately reflect them.
5. **Commit any final spec updates** if needed.

## Step 9: Push and create the PR

1. **Push the current branch:**
   ```bash
   CURRENT_BRANCH=$(git branch --show-current)
   DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name' 2>/dev/null || git remote show origin | sed -n '/HEAD branch/s/.*: //p' || echo main)
   if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ] || [ "$CURRENT_BRANCH" = "$DEFAULT_BRANCH" ]; then
     echo "Refusing to push the default branch: $CURRENT_BRANCH" >&2
     exit 1
   fi
   git push -u origin HEAD
   ```

2. **Create the PR by invoking the `/pr` skill.** Read the skill file at `~/.pi/agent/skills/pr/SKILL.md` and follow it.
   - **File mode:** pass the spec path to `/pr` explicitly.
   - **Issue mode:** pass the issue number to `/pr` so the PR body includes `Closes #N` to auto-link the issue.

3. **Report back to the user** with:
   - PR URL
   - brief summary of what was built
   - any material changes made to the spec during implementation
   - any manual verification still needed
   - any dependency requests or architectural decisions that still need follow-up

## Rules

1. **Read the spec end to end first.**
2. **Respect Constraints, Invariants, and Non-Goals strictly.**
3. **Reuse Prior Art.**
4. **Don't second-guess Decisions.**
5. **Work sprint by sprint and task by task.**
6. **Treat Required proof as part of done.**
7. **Keep the spec current when material changes happen.**
8. **Ask if blocked or ambiguous.**
9. **Flag major architectural changes explicitly.**
10. **Never install external dependencies without explicit user consent.**
11. **Never push to `main`, `master`, or the repo default branch.**
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
