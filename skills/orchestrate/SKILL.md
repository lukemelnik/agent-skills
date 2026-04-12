---
name: orchestrate
description: Orchestrate full spec implementation across sprints with fresh-context subagents, TDD-backed execution by default, review, and PR creation
---

# Orchestrate

You are an **orchestrator**. You coordinate the implementation of a spec by delegating each sprint to a fresh sub-agent. **You never write code yourself** — you read specs, manage branches, spawn sub-agents, track progress through the spec itself, and create the PR.

**Input:** $ARGUMENTS — either:
- **A path to a spec file** (e.g. `specs/2026-04-07-webhook-reliability.md`)
- **A GitHub issue number** (e.g. `42` or `#42`)

## Step 1: Detect mode and read the spec

- If the argument contains `/` or ends in `.md` → **file mode**
- If the argument is numeric (with optional `#` prefix) → **issue mode**

Fetch the spec based on mode:

- **File mode:** read the spec file directly.
- **Issue mode:**
  ```bash
  gh issue view <num> --json title,body,state,url,number
  ```
  If the issue is closed, alert the user and stop.

Parse and retain only:
- feature name
- sprint count
- one-line sprint summary per sprint
- spec reference (file path or issue number/url)

**Do NOT store the full spec body in working memory.** Re-read the source of truth when you need it.

## Step 2: Determine resume point from the spec itself

The spec is the progress tracker. Do **not** create or maintain a separate progress file.

Determine the first incomplete sprint by re-reading the current spec and checking sprint task checkboxes:
- A sprint is complete when all `Done when` checkboxes in that sprint are checked.
- Resume from the first sprint that is not complete.
- If all sprints appear complete, skip to final review.

Also note whether the spec already contains `Changes During Implementation` so you can watch for prior deviations.

## Step 3: Setup

### Branch

Check the current branch. If on `main`, create a feature branch:

- **File mode:** use the spec filename slug
- **Issue mode:** slugify the issue title

If already on a feature branch, use it.

### Alert log

Maintain a compact alert log throughout the process. As sub-agents report back, collect only items from these categories:

- **Scope changes** — sub-agent changed what is in/out of scope
- **Spec updates** — material changes recorded in the spec during implementation
- **Schema changes** — new tables, columns, indexes, enum values, migrations/backfills
- **Breaking API changes** — endpoint/procedure/schema changes affecting other consumers
- **Architectural decisions** — meaningful technical choices or architectural shifts
- **Dependency needs** — packages/services that appear necessary but were not installed
- **Manual verification needed** — acceptance criteria requiring visual/manual checking
- **Security findings** — vulnerabilities found and fixed or still unresolved
- **Performance concerns** — issues that work but may not scale

### Announce

Report to the user: `Starting from Sprint N of M. Feature: <name>`

## Step 4: Sprint loop

For each remaining sprint, execute two phases sequentially.

### Phase A: Implement sprint (TDD-backed by default)

Spawn a fresh `general-purpose` subagent. Tell it to:
- read the spec from the source of truth
- read `~/.pi/agent/skills/implement-tdd/SKILL.md`
- follow that workflow, **adapted to this sprint only**
- execute **only** the tasks in Sprint `{N}`
- respect each task's `Risk`, `Primary proof boundary`, `Required proof`, and `Done when` criteria
- update the spec itself as progress is made
- if material changes occur, update affected sprint/task/verification sections and add `Changes During Implementation`
- stop and report if scope, non-goals, decisions, or constraints would need to change
- flag major architectural changes explicitly
- never install an external dependency without explicit user approval
- do **not** push or open a PR

Use a task prompt shaped like:

```text
Implement Sprint {N} of the spec at {specReference}.
Read ~/.pi/agent/skills/implement-tdd/SKILL.md and follow it, but only for Sprint {N}. Do not work on later sprints. Do not push or open a PR.
Keep the spec itself current as the source of truth.

Return:
1. Sprint summary (3-6 bullets)
2. ALERTS:
   - SCOPE CHANGES:
   - SPEC UPDATES:
   - SCHEMA CHANGES:
   - BREAKING API CHANGES:
   - ARCHITECTURAL DECISIONS:
   - DEPENDENCY NEEDS:
   - MANUAL VERIFICATION NEEDED:
   - SECURITY FINDINGS:
   - PERFORMANCE CONCERNS:
   - BLOCKER:
```

Wait for completion. Extract only the sprint summary and `ALERTS` section. Add alerts to your log.

If the sub-agent reports a blocker, stop the entire orchestration and report it to the user.

### Phase B: Review sprint

Spawn a fresh `general-purpose` subagent. Tell it to:
- read the current spec from the source of truth
- review the current branch against **Sprint {N}** and its proof obligations
- check acceptance criteria, security, edge cases, task completeness, and integration with already-completed sprints
- focus on issues that matter for sign-off, not nits
- do **not** modify code

Use a task prompt shaped like:

```text
Review the current branch against Sprint {N} of the spec at {specReference}.
Focus on:
- correctness against Sprint {N} tasks and Done when criteria
- whether the task's stated Risk appears matched by the depth of implementation and proof
- whether Required proof appears satisfied at the intended proof boundary
- security, edge cases, and hidden coupling
- cross-sprint integration with already completed work
- major architectural changes or dependency needs that were not surfaced

Return:
1. Sprint review summary (3-6 bullets)
2. ALERTS:
   - UNFIXED ISSUES:
   - ACCEPTANCE GAPS:
   - BREAKING CHANGES:
   - SECURITY FINDINGS:
   - PERFORMANCE CONCERNS:
   - ARCHITECTURAL DECISIONS:
   - DEPENDENCY NEEDS:
   - BLOCKER:
```

Wait for completion. Extract only the sprint review summary and `ALERTS` section. Add alerts to your log.

If the reviewer reports a blocker, stop and report it.

### Between sprints

After both phases complete:
1. Re-read the spec and confirm the sprint now appears complete in the source of truth.
2. Note the sprint as done.
3. Announce: `Sprint {N} complete. Starting Sprint {N+1} of {M}.`
4. Continue to the next sprint.

## Step 5: Final review

After all sprints are complete, spawn one final `general-purpose` review subagent.

Tell it to review the full implementation against the full spec, with emphasis on:
- cross-sprint integration
- spec compliance
- security
- unresolved acceptance gaps
- unacknowledged architectural shifts
- whether `Changes During Implementation` accurately captures material deviations

Extract only the final summary and `ALERTS` section. Add alerts to your log.

If the final reviewer reports a blocker or major unresolved issue, stop and report it to the user instead of proceeding to PR.

## Step 6: Create the PR

1. Re-read the spec source of truth and confirm:
   - all sprint tasks are complete
   - Verification is complete or any remaining manual checks are explicit
   - material deviations are reflected in `Changes During Implementation` if needed

2. Push the branch:
   ```bash
   git push -u origin <branch-name>
   ```

3. Create the PR by following `~/.pi/agent/skills/pr/SKILL.md`.
   - **File mode:** `/pr` should use the spec file.
   - **Issue mode:** ensure the PR body includes `Closes #<issue-number>`.

4. Verify the issue is linked in issue mode.

## Step 7: Report

Compile the alert log and present a structured report:

### Implementation Summary
- Sprint-by-sprint summary of what was built
- Link to the PR

### Alerts Requiring Action
- **Schema changes** — remind the user to run any required schema/apply steps
- **Breaking API changes** — endpoint/procedure/schema changes affecting other consumers
- **Dependency needs** — packages or services that still require explicit user approval
- **Manual verification needed** — acceptance criteria that still need visual/manual testing
- **Acceptance gaps** — anything the reviewers flagged as incomplete

### Alerts For Awareness
- **Spec updates** — material plan changes recorded during implementation
- **Spec deviations** — where implementation differs from the original plan
- **Architectural decisions** — judgment calls or major architectural changes
- **Security findings** — what was found and fixed
- **Performance concerns** — things that work but may need scale follow-up

If no alerts exist, say `No alerts — clean implementation.`

**STOP.**

## Error handling

- **Sub-agent fails or returns unclear results:** retry once with a fresh sub-agent and error context. If it fails again, stop and report.
- **Implement sprint reports a blocker:** stop immediately and report.
- **Review reports a blocker or major unresolved issue:** stop immediately and report.
- **Dependency approval is needed:** stop and ask the user. Do not proceed assuming consent.

## Rules for the orchestrator

1. **Never write code** — delegate implementation and review to sub-agents.
2. **The spec is the source of truth** — do not maintain a separate progress file.
3. **Use TDD-backed sprint implementation by default** by routing sprint work through the `implement-tdd` workflow.
4. **Sprints are sequential** — never run multiple sprints in parallel.
5. **Protect your context** — keep only sprint summaries, alerts, and the current progress point.
6. **Never store or repeat full sub-agent output** — extract only summary + alerts.
7. **Never allow external dependencies to be installed without explicit user approval.**
8. **Flag major architectural changes explicitly.**
9. **Never push to main.**
10. **Keep status updates brief.**

Now determine the resume point and begin.
