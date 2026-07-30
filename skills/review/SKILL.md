---
name: review
description: Review the current checked-out branch or its PR with parallel, role-specialized read-only subagents for security, correctness, robustness, wiring, repository patterns, and conditional spec compliance. Use for full branch review, PR review, focused review aspects, or the final review launched after implementation.
---

# Review

Run one parent review over the current checkout. The parent resolves scope, launches focused reviewers, aggregates findings, and checks PR-description accuracy. Specialized subagents inspect only their assigned concern.

## Input

`$ARGUMENTS` may include:

- empty — review the current branch against the default branch
- `pr 123`, `#123`, or `123` — current branch PR; reject a different PR
- `last N commits` — review only that range on the current branch
- `security | correctness | robustness | wiring | patterns | spec | full` — select roles; default `full`
- `issue 456` or `spec 456` — explicit implementation spec

If a number could be the current branch PR, treat it as the PR. Otherwise ask one focused clarification.

## 1. Resolve scope once

Use small sequential commands:

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"
DEFAULT_BRANCH="$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name' 2>/dev/null || git remote show origin | sed -n '/HEAD branch/s/.*: //p' || echo main)"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
CURRENT_PR_NUMBER="$(gh pr view --json number --jq '.number' 2>/dev/null || true)"
BASE="$(git merge-base HEAD "origin/$DEFAULT_BRANCH")"
RANGE="$BASE..HEAD"
git status --short
```

Rules:

- Review only the current checkout. Never switch branches or create a worktree.
- Reject detached HEAD and the default branch unless the user explicitly requested a working-tree review.
- If the worktree is dirty, stop before launching reviewers. Explain that committed branch review may omit or mix changes and ask whether to finish/commit, review the working tree, or continue with committed diff.
- A supplied PR must match `CURRENT_PR_NUMBER` and `CURRENT_BRANCH`.
- For `last N commits`, use `HEAD~N..HEAD`; otherwise use `RANGE`.
- If the selected range is empty, report that there is no branch diff to review.

Inspect only the scope summary before fan-out:

```bash
git diff --stat "$RANGE"
git diff --name-only "$RANGE"
```

Fetch current PR context once when available:

```bash
gh pr view "$CURRENT_PR_NUMBER" --json number,title,body,url,headRefName,baseRefName,closingIssuesReferences
```

Resolve a spec from an explicit argument first. Otherwise inspect closing issues and use one labeled `spec` when present. Do not infer a spec from an unrelated issue number.

Create one compact shared scope string containing:

- exact range and current branch/default branch
- current PR number, if any
- explicit spec issue/path only when resolved
- instruction to report only introduced issues

Do not preload changed-file lists or code into subagent prompts; each focused reviewer should inspect its own relevant paths.

## 2. Launch focused reviewers in parallel

Default `full` roles:

- `ReviewSecurity`
- `ReviewCorrectness`
- `ReviewRobustness`
- `ReviewWiring`
- `ReviewPatterns`
- `ReviewSpec` only when a concrete spec was resolved

For a role filter, launch only that role. `spec` requires a concrete spec and launches only `ReviewSpec`.

Launch all selected agents in one assistant message with separate `Agent` calls, `run_in_background: true`, `inherit_context: false`, and `isolated: true`. Each prompt should contain only the shared scope string and, for `ReviewSpec`, the exact spec reference. Do not repeat category checklists: the selected custom agent definition owns its focused prompt.

Example task prompt:

```text
Review scope: current branch feature/x against origin/main, range abc123..HEAD.
Current branch PR: #123.
Report only issues introduced in this range.
Follow your specialized agent contract and return its exact structured output.
```

While reviewers run, compare the PR title/body to the diff stat and actual feature scope. Flag stale, exaggerated, missing, or contradicted claims, especially verification claims not supported by the implementation record. Do not perform a duplicate category review.

Use each completed agent report as the handoff. Do not replay its searches. If a report is blocked, contradictory, or lacks evidence for a serious finding, spot-check only the minimum cited code needed to resolve it.

## 3. Aggregate adversarially

Combine findings from every completed role:

1. Discard pre-existing issues outside the selected range.
2. Discard findings below confidence 75, except potentially critical 50–74 findings that explicitly require human judgment.
3. Discard compiler/linter trivia without deeper impact.
4. Deduplicate findings describing the same failure path.
5. Preserve the clearest context/evidence when roles overlap.
6. Sort `critical`, `important`, then `minor`.
7. Assign stable IDs `R1`, `R2`, ... globally.

Severity:

- `critical` — auth/security breach, data loss/corruption, or broken primary flow
- `important` — likely behavioral bug, missing wiring, significant robustness gap, or explicit repository-rule violation
- `minor` — low-risk but concrete edge case or maintainability problem worth fixing

The parent owns final judgment and presentation, not fresh broad investigation. Every retained finding must explain the reachable flow, where the code sits in it, the invariant that fails, and the concrete impact.

For spec review, include the `ReviewSpec` compliance statuses without re-evaluating every criterion. Reconcile only contradictions with the actual diff or approved PR/spec deviations.

## 4. Report

Do not edit code, commit, push, or create review artifacts.

Use:

```md
Review result: <no findings | N findings>

Scope: <current branch/range and PR>

Critical
<boxed findings or None>

Important
<boxed findings or None>

Minor
<boxed findings or None>

Spec compliance
- <criterion>: MET/PARTIAL/MISSING/DEVIATED — <evidence>

PR description accuracy
- <accurate | inaccurate | not checked> — <details only when useful>

Reviewer status
- <only blocked/failed roles; omit when all completed>

Gates
- Not run — review is read-only; cite existing PR claims only
```

Finding block:

```text
╭────────────────────────────────────────────────────────────────────────────╮
│ R1 · Important · correctness · confidence 95                               │
│ Short title                                                                 │
│ apps/path/file.ts:123                                                       │
├─────────┬──────────────────────────────────────────────────────────────────┤
│ Problem │ Specific introduced failure                                      │
├─────────┼──────────────────────────────────────────────────────────────────┤
│ Context │ Reachable flow, state/invariant, and downstream dependency        │
├─────────┼──────────────────────────────────────────────────────────────────┤
│ Impact  │ Concrete user, data, security, or operational consequence         │
├─────────┼──────────────────────────────────────────────────────────────────┤
│ Fix     │ Short concrete correction                                         │
╰─────────┴──────────────────────────────────────────────────────────────────╯
```

Keep lines suitable for terminal display. Add an Evidence row only when it prevents ambiguity. If there are no findings, state that plainly and identify the reviewed scope and any blocked role.
