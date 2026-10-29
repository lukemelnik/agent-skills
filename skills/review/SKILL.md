---
name: review
description: Review an explicitly selected GitHub PR independently of the current checkout, or review the current branch, with parallel, role-specialized read-only subagents. Use for PR review, full branch review, focused review aspects, or the final review launched after implementation.
---

# Review

Run one parent review over the requested PR or branch. The parent resolves scope, launches focused reviewers, aggregates findings, and checks PR-description accuracy. Specialized subagents inspect only their assigned concern.

## Input

`$ARGUMENTS` may include:

- empty — review the current branch against the default branch
- `pr 123`, `#123`, `123`, or a GitHub PR URL — review that PR, regardless of the current checkout
- `last N commits` — review only that range on the current branch
- `security | correctness | robustness | wiring | patterns | spec | full` — select roles; default `full`
- `issue 456` or `spec 456` — explicit implementation spec

A bare number means a PR number. `issue` and `spec` select an implementation specification; they do not select a PR. An explicit PR takes precedence over the current branch.

## 1. Resolve scope once

Choose the requested mode before applying checkout restrictions. Never switch the user's branch or alter their working files for a review.

### Explicit PR

Resolve the PR in the current repository, or use the repository identified by its URL. Fetch its context once:

```bash
gh pr view "$PR_NUMBER" --json number,title,body,url,headRefName,baseRefName,headRefOid,baseRefOid,closingIssuesReferences
```

Freeze `PR_HEAD_SHA` and `PR_BASE_SHA` from that response. Fetch those commits into the repository's object database without checking out either branch:

```bash
git fetch --no-tags origin "$PR_HEAD_SHA" "$PR_BASE_SHA"
git cat-file -e "$PR_HEAD_SHA^{commit}"
git cat-file -e "$PR_BASE_SHA^{commit}"
BASE="$(git merge-base "$PR_BASE_SHA" "$PR_HEAD_SHA")"
RANGE="$BASE..$PR_HEAD_SHA"
```

- Compare against the PR's actual target branch, which may differ from the default branch. The merge-base range represents changes introduced by the PR.
- Fetch from the PR's base repository. If its URL identifies another repository, resolve a suitable local repository or use a temporary bare repository; do not compare unrelated histories or create a working checkout.
- If fetching by SHA is unavailable, fetch the PR head and base branch into dedicated review refs, then verify they contain the frozen commits. Do not overwrite local branches. If a concurrent update prevents obtaining the snapshot, resolve fresh PR metadata and retry once; report the limitation if it persists.
- Being on `main`, detached HEAD, another branch, or a dirty worktree does not block this mode. Reviewers must use `git diff "$RANGE"` and `git show "$PR_HEAD_SHA:path"` for source, tests, and applicable repository instructions; checkout files may belong to another revision.
- Use immutable SHAs throughout the review. Do not replace the selected head with local `HEAD` or a moving remote ref. State which snapshot was reviewed.
- If the selected range is empty, report that there is no PR diff to review.

### Current branch or commit range

When no PR is explicitly supplied, use small sequential commands:

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"
DEFAULT_BRANCH="$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name' 2>/dev/null || git remote show origin | sed -n '/HEAD branch/s/.*: //p' || echo main)"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
CURRENT_PR_NUMBER="$(gh pr view --json number --jq '.number' 2>/dev/null || true)"
REVIEW_HEAD="$(git rev-parse HEAD)"
BASE="$(git merge-base "$REVIEW_HEAD" "origin/$DEFAULT_BRANCH")"
RANGE="$BASE..$REVIEW_HEAD"
git status --short
```

Rules for this mode:

- Review the current branch without switching branches or creating a worktree.
- Reject detached HEAD and the default branch unless the user explicitly requested a working-tree review.
- If the worktree is dirty, stop before launching reviewers. Explain that committed branch review may omit or mix changes and ask whether to finish/commit, review the working tree, or continue with committed diff.
- For `last N commits`, use `$REVIEW_HEAD~N..$REVIEW_HEAD`; otherwise use `RANGE`.
- If the selected range is empty, report that there is no branch diff to review.

Fetch current-branch PR context once when available. Do not require a PR for branch review:

```bash
gh pr view "$CURRENT_PR_NUMBER" --json number,title,body,url,headRefName,baseRefName,closingIssuesReferences
```

### Shared scope

Inspect only the scope summary before fan-out:

```bash
git diff --stat "$RANGE"
git diff --name-only "$RANGE"
```

Resolve a spec from an explicit argument first. Otherwise inspect closing issues and use one labeled `spec` when present. Without a PR, use the issue whose number starts the branch name (for example `456-billing-retry` → issue 456) when it exists. Do not infer a spec from an unrelated issue number.

Create one compact shared scope string containing:

- repository path, exact immutable range, and selected head/base branches
- selected PR number and URL, if any
- whether source must be read from the fetched PR snapshot rather than checkout files
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

Use the available specialized-agent API with fresh context (`fork_turns: "none"` in Codex, or `inherit_context: false` where supported). Launch selected roles concurrently up to the available agent limit, starting remaining roles as slots become free. These reviewers are read-only and can share the object database; isolation must not switch branches or create working checkouts. Each prompt should contain only the shared scope string and, for `ReviewSpec`, the exact spec reference. Do not repeat category checklists: the selected custom agent definition owns its focused prompt.

If a configured role is unavailable through the runtime, use a generic read-only subagent with that role's configured prompt as its contract. If the contract is also unavailable, report the role as blocked.

Example task prompt:

```text
Review scope: /path/to/repository, PR #123, branch feature/x against main,
range <merge-base-sha>..<head-sha>, PR URL https://github.com/owner/repo/pull/123.
Read source and applicable instructions with git show <head-sha>:<path>;
the current checkout is not the reviewed revision.
Report only issues introduced in this range.
Follow your specialized agent contract and return its exact structured output.
```

While reviewers run, compare the PR title/body to the diff stat and actual feature scope. Flag stale, exaggerated, missing, or contradicted claims, especially verification claims not supported by the implementation record. Do not perform a duplicate category review.

Use each completed agent report as the handoff. Do not replay its searches. If a report is blocked, contradictory, or lacks evidence for a serious finding, spot-check only the minimum cited code needed to resolve it.

## 3. Aggregate adversarially

Combine findings from every completed role:

1. Discard pre-existing issues outside the selected range.
2. Discard findings below confidence 75, except 50–74 findings with impact score 8+ that explicitly require human judgment.
3. Discard compiler/linter trivia without deeper impact.
4. Deduplicate findings describing the same failure path, preserving the clearest context/evidence when roles overlap.
5. Re-score adversarially. Check that each trigger is realistic and reachable, and lower likelihood or impact scores that reviewers inflated. Spot-check only the cited code needed to decide.
6. Compute `score = likelihood × impact score` and classify:
   - `fix` — score 20+, or impact score 8+ regardless of likelihood. A repository instruction may set a different score threshold.
   - `issue` — a `fix` finding that cannot reasonably be fixed on this branch: the fix exceeds the branch's scope or needs a product or design decision.
   - `dropped` — everything else. Report only the count; do not file or fix these.
7. Sort `fix` then `issue`, each by impact score then score, and assign stable IDs `R1`, `R2`, ... globally.

The parent owns final judgment and presentation, not fresh broad investigation. Every retained finding must explain the realistic trigger, the reachable flow, where the code sits in it, the invariant that fails, and the concrete impact.

For spec review, include the `ReviewSpec` compliance statuses without re-evaluating every criterion. Reconcile only contradictions with the actual diff or approved PR/spec deviations.

## 4. Report

Do not edit code, commit, push, or create review artifacts.

Choose the presentation from the session context:

- In the Codex desktop app, use concise GitHub-flavored Markdown and emit one
  `::code-comment` directive per actionable, line-specific finding. Keep the
  summary self-contained because inline comments supplement rather than replace it.
  For a fetched PR snapshot, link findings to verified lines in the PR diff rather
  than unrelated files in the current checkout.
- Otherwise, use the terminal-friendly boxed finding format below.

Use:

```md
Review result: <no findings | N findings>

Scope: <selected branch or PR, immutable range, and target branch>

Fix
<findings in the environment-appropriate format, or None>

Issue candidates
<findings in the environment-appropriate format, or None>

Dropped
- <N findings below the fix threshold>

Spec compliance
- <criterion>: MET/PARTIAL/MISSING/DEVIATED — <evidence>

PR description accuracy
- <accurate | inaccurate | not checked | no PR> — <details only when useful>

Reviewer status
- <only blocked/failed roles; omit when all completed>

Gates
- Not run — review is read-only; cite existing PR claims only
```

Codex desktop finding:

```md
### R1 · Fix · correctness · L4 × I7 = 28 · confidence 95

[`apps/path/file.ts:123`](/absolute/path/apps/path/file.ts:123)

- **Trigger:** Concrete realistic input, action, or state.
- **Problem:** Specific introduced failure.
- **Context:** Reachable flow, state/invariant, and downstream dependency.
- **Impact:** Concrete user, data, security, or operational consequence.
- **Fix:** Short concrete correction.
```

Terminal finding block:

```text
╭────────────────────────────────────────────────────────────────────────────╮
│ R1 · Fix · correctness · L4 × I7 = 28 · confidence 95                      │
│ Short title                                                                 │
│ apps/path/file.ts:123                                                       │
├─────────┬──────────────────────────────────────────────────────────────────┤
│ Trigger │ Concrete realistic input, action, or state                       │
├─────────┼──────────────────────────────────────────────────────────────────┤
│ Problem │ Specific introduced failure                                      │
├─────────┼──────────────────────────────────────────────────────────────────┤
│ Context │ Reachable flow, state/invariant, and downstream dependency        │
├─────────┼──────────────────────────────────────────────────────────────────┤
│ Impact  │ Concrete user, data, security, or operational consequence         │
├─────────┼──────────────────────────────────────────────────────────────────┤
│ Fix     │ Short concrete correction                                         │
╰─────────┴──────────────────────────────────────────────────────────────────╯
```

Keep boxed finding lines suitable for terminal display. Add an Evidence field or row only when it prevents ambiguity. If there are no findings, state that plainly and identify the reviewed scope and any blocked role.
