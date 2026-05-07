---
name: review-solo
description: Single-agent branch review for the currently checked-out branch. Use when reviewing the current branch without subagents, while still covering security, correctness, robustness, wiring, patterns, and optional spec compliance.
---

# Solo Review

Run a comprehensive code review in the current agent only. Do not spawn subagents, tmux workers, worktrees, or background review processes.

Keep this skill simple:
- current checked-out branch only
- optional `last N commits` scope on the current branch
- no branch switching
- no worktrees
- no subagents
- no tmux worker panes
- no prompt files
- review all requested categories yourself before reporting

If the current branch has a PR, treat the PR as context only for understanding intent. The reviewed code is always the currently checked-out branch. Also verify that the PR title/body accurately describes the actual diff.

## Input

`$ARGUMENTS` may be:
- empty → review the current branch
- `last N commits` on the current branch
- `last N commits on <current-branch>` when that branch is currently checked out
- an aspect filter: `security|correctness|robustness|wiring|patterns|spec|full`
- optional reference to the current branch PR: `543`, `#543`, or `pr 543`
- optional GitHub issue/spec number: `issue 560`, `#560`, or `560` when it is not being used as a PR reference
- optional flags: `--fix`, `--no-auto-fix`

Rules:
- Default aspect filter: `full`
- Default scope: current branch
- Allow PR references only when they match the PR for the current checked-out branch
- Allow `last N commits` only on the current checked-out branch
- If the request names another branch, another PR, or another commit range, stop and say this skill only reviews the current checked-out branch
- If a number could mean either a PR or issue, prefer the current branch PR when it matches; otherwise ask one clarifying question

## Step 1 — Resolve scope

Use small sequential commands. Do not run the review as one giant shell command.

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"
DEFAULT_BRANCH="$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name' 2>/dev/null || git remote show origin | sed -n '/HEAD branch/s/.*: //p' || echo main)"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
CURRENT_PR_NUMBER="$(gh pr view --json number --jq '.number' 2>/dev/null || true)"
BASE="$(git merge-base HEAD "origin/$DEFAULT_BRANCH")"
RANGE="$BASE..HEAD"
WORKTREE_STATUS="$(git status --short)"
```

Before choosing scope, check for uncommitted changes:
- if `WORKTREE_STATUS` is non-empty, stop and warn that the review may miss or mix uncommitted work
- ask whether the user wants to commit those changes first, review the working tree instead, stash/park them, or continue with committed branch diff only
- wait for the user's decision before reviewing or running any cleanup/snapshot commands

Choose scope:
- if `last N commits` is requested, review `HEAD~N..HEAD`
- otherwise if `git diff --quiet "$RANGE"` is false, review `$RANGE`
- otherwise review the working tree: staged, unstaged, and untracked changes

Inspect the scope with:

```bash
git diff --stat "$RANGE"
git diff --name-only "$RANGE"
```

For working-tree mode, use:

```bash
git status --short
git diff --stat
git diff --cached --stat
git ls-files --others --exclude-standard
```

Only report issues introduced in this scope.

## Step 2 — Gather context

Read only the relevant instructions and files needed for the review:
- root repo instructions: `AGENTS.md`, `CLAUDE.md`, or equivalent if present
- nested instruction files in directories touched by the diff
- changed files with enough surrounding context to verify findings
- the immediate producers/consumers of changed code when needed to explain the full flow, state transition, or downstream dependency
- PR title/body via `gh pr view` when the current branch has a PR, both for context and for PR-description accuracy checks
- issue/spec body via `gh issue view <num> --json title,body` only when spec compliance was requested or an issue was explicitly provided

Do not read `.env` or `.env.*` files.

## Step 3 — Review categories

For `full`, cover every category below. For a specific aspect filter, cover only that category. Still consider cross-category impact when needed to avoid missing a serious bug.

Score each finding 0-100 for confidence. Only include findings with confidence >= 50 in your working notes. In the final report, include findings with confidence >= 75, plus any potentially serious confidence 50-74 item that needs human judgment.

### Security

Check for:
- auth bypass or missing permission checks
- IDOR: user A can access or mutate user B's data by guessing IDs
- injection: SQL, shell, template, path traversal, unsafe raw queries
- XSS or unsafe rendering of user content
- CSRF or unsafe state-changing endpoints
- unsafe file, upload, storage, webhook, redirect, URL, iframe, or header handling
- exposed secrets, tokens, credentials, or sensitive data in client code/logs
- mass assignment or request bodies not constrained to allowed fields

### Correctness

Check for:
- broken behavior, inverted conditions, stale refs, off-by-one mistakes
- incomplete refactors or code paths still using old assumptions
- wrong data shape assumptions between API, database, and UI
- mutation/query mismatch or incorrect cache keys
- async ordering bugs, races, or missing awaits where result affects behavior
- regressions in existing behavior caused by the changed lines

### Robustness, edge cases, and performance

Check for:
- missing null/undefined handling
- empty result states, boundary values, long strings, invalid inputs
- missing user-visible error states or swallowed errors
- missing structured logging where failures matter
- cleanup/resource leaks
- concurrent mutation hazards
- N+1 queries, expensive hot-path work, unbounded fetching, or missing indexes for new query patterns
- validation gaps at system boundaries

### Wiring and integration

Verify changed or new pieces are connected end-to-end:
- UI component → handler/API call
- form → validation → submit mutation
- API route/procedure → service/database logic
- database schema → API response → frontend usage
- new files → imports/usages/reachability
- routes → navigation/discoverability/auth guards
- cache invalidation → affected lists/details update correctly
- background jobs/webhooks/notifications are registered and invoked

Flag stubs that type-check but do nothing.

### Patterns and repo rules

Only flag explicit repo-local rule violations. Do not invent conventions.

Common checks when repo instructions call them out:
- no broad type assertions or `any` to hide errors
- no lint ignore comments without approval
- semantic Tailwind colors and design-system components
- URL search params for modal/sheet state where required
- derived types from schemas/router outputs instead of duplicates
- tRPC `queryOptions`, `skipToken`, and correct invalidation patterns
- TanStack Form field/error/default-value patterns
- structured API logging via request/domain loggers
- `CdnImage` for CDN images where required
- no generic left-border accent pattern if forbidden

### PR description accuracy, when a current-branch PR exists

Compare the PR title/body to the actual reviewed diff:
- flag claims that are stale, exaggerated, missing, or contradicted by the code
- flag verification claims that do not appear to have been run
- treat the diff as source of truth; PR text, issues, and specs are context
- do not nitpick wording unless it could mislead reviewers or future readers

### Spec compliance, when provided

For every acceptance criterion:
- mark `MET`, `PARTIAL`, `MISSING`, or `DEVIATED`
- cite evidence from files or behavior
- distinguish implementation gaps from intentional product tradeoffs

## Step 4 — Filter and shape findings

Before reporting:
1. discard pre-existing issues not introduced by the scope
2. discard issues linters/type-checkers would trivially catch unless they indicate a deeper bug
3. discard pedantic nitpicks a senior engineer would not block on
4. de-duplicate similar findings
5. sort by severity: `critical`, `important`, `minor`
6. assign stable finding IDs in report order: `R1`, `R2`, `R3`, ...

Severity guide:
- `critical`: security vulnerability, data loss/corruption, auth bypass, broken primary flow
- `important`: likely bug, missing wiring, significant robustness gap, explicit repo rule violation
- `minor`: low-risk edge case or maintainability issue worth addressing

Each reported finding must explain why it matters in context, not just what is wrong. Keep it concise, but include enough surrounding process detail for the user to understand the failure mode without asking follow-up questions.

For each finding include:
- a stable ID (`R1`, `R2`, ...)
- severity, category, and confidence
- the exact file and line when possible
- a short title that names the failure mode
- `Problem`: the specific bug or rule violation in one sentence
- `Context`: enough flow/process detail to understand the issue without re-reading the code
- `Impact`: the concrete issue created for users, data, security, reviewers, or operations
- `Fix`: a short concrete suggestion
- `Evidence` only when it clarifies a wiring/spec/process issue or prevents ambiguity

Context requirements:
- Make `Context` more than a restatement of the location. It should usually be 2-4 short sentences.
- Name the flow or user action that reaches the code.
- Explain where this code sits in that flow: gate, state transition, persistence write, async handoff, cache update, renderer, etc.
- State the assumption/invariant this code relies on and which later step depends on it.
- For concurrency or lifecycle bugs, describe the relevant before/after state and the interleaving or trigger that exposes the bug.
- For wiring issues, trace the broken path from entry point to the missing/incorrect downstream effect.
- If you cannot explain the context clearly, gather a bit more code context before reporting.

Avoid filler context. Do not add a long explanation for obvious style or syntax issues. Add context when it changes how severe, actionable, or understandable the finding is.

## Step 5 — Optional safe auto-fixes

Only fix issues when `--fix` is enabled and `--no-auto-fix` is not set.

Auto-fix only when all are true:
- confidence >= 85
- fix is mechanical, local, and low-risk
- no product judgment is required
- no auth/permission policy, schema migration, or broad refactor is involved

Do not commit fixes unless the user explicitly asks.

After fixes, run the repo's required gates for the changed area. If the repo gives no specific gates, run the smallest relevant checks and report them.

## Step 6 — Report

Start with the direct result. Do not make the user open artifacts to understand the review.

Use this structure:

```md
Review result: <no findings | N findings | N fixed, M need attention>

Scope: <current branch vs origin/default | last N commits | working tree>

Critical
<boxed finding blocks, or "None">

Important
<boxed finding blocks, or "None">

Minor
<boxed finding blocks, or "None">

Spec compliance
- <criterion>: MET/PARTIAL/MISSING/DEVIATED — <evidence>

PR description accuracy
- <accurate | inaccurate | not checked> — <only include details when inaccurate or not checked>

Gates
- `<command>`: pass/fail/not run — <short reason>
```

Use boxed finding blocks for findings instead of markdown tables or dense paragraphs. Wrap each boxed block in a fenced `text` code block so terminal renderers preserve alignment. Keep line lengths reasonable for terminal screenshots, roughly 72-88 columns. Include horizontal separators between `Problem`, `Context`, `Impact`, and `Fix`.

Finding block template:

```text
╭────────────────────────────────────────────────────────────────────────────╮
│ R1 · Important · correctness · confidence 95                               │
│ Short title that names the failure mode                                    │
│ apps/path/file.ts:123                                                      │
├─────────┬──────────────────────────────────────────────────────────────────┤
│ Problem │ <specific bug/rule violation in one sentence>                    │
├─────────┼──────────────────────────────────────────────────────────────────┤
│ Context │ <flow/user action that reaches this code; where this code sits   │
│         │ in that flow; relevant invariant/state; downstream dependency>   │
├─────────┼──────────────────────────────────────────────────────────────────┤
│ Impact  │ <specific user/data/security/operational consequence>            │
├─────────┼──────────────────────────────────────────────────────────────────┤
│ Fix     │ <short concrete suggestion>                                      │
╰─────────┴──────────────────────────────────────────────────────────────────╯
```

If `Evidence` is needed, add another separated row after `Fix`. Do not use `<br>` inside tables. Do not rely on markdown emphasis inside the boxed block.

Number findings globally across severity sections. Do not restart numbering in each section. Use the finding IDs for any fix follow-up, e.g. "Fixed R2" or "R1 needs product judgment."

If there are no findings, say that plainly and include the scope reviewed. If a category was skipped because the user requested a narrower aspect, state that.

## Done

Do not create review artifacts unless the user asks. Do not commit review fixes unless the user explicitly asks.
