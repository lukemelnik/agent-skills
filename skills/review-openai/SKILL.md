---
name: review-openai
description: OpenAI-based branch review for the currently checked-out branch using ordinary tmux panes and inline prompts. Use when reviewing the current branch, optionally the last N commits on the current branch, before or while iterating on that branch's PR.
---

# OpenAI Review

Run one orchestrator plus one or more OpenAI review workers in normal tmux panes.

Keep this skill simple:
- current branch only
- optional `last N commits` scope on the current branch
- no branch switching
- no worktrees
- no prompt markdown files
- no separate worker log files
- normal interactive tmux panes
- inline prompts only

If the current branch has a PR, treat the PR as context only for understanding intent. The reviewed code is always the currently checked-out branch. Also verify that the PR title/body accurately describes the actual diff.

## Input

`$ARGUMENTS` may be:
- empty → review the current branch
- `last N commits` on the current branch
- `last N commits on <current-branch>` when that branch is currently checked out
- an aspect filter: `security|correctness|robustness|wiring|patterns|full`
- optional reference to the current branch PR: `543`, `#543`, or `pr 543`
- optional flags: `--fix`, `--no-auto-fix`, `--timeout 1800`

Rules:
- Default aspect filter: `full`
- Default scope: current branch
- Allow PR references only when they match the PR for the current checked-out branch
- Allow `last N commits` only on the current checked-out branch
- If the request names another branch, another PR, an issue number, or another commit range, stop and say this skill only reviews the current branch

Execution discipline:
- Parse quickly, compute scope in a few short commands, and launch workers immediately
- Do not do a large orchestrator-side investigation before launching workers
- Do not run the whole workflow as one giant shell command
- Use small sequential tool calls
- Use bash only for small git/tmux/status commands
- Never create a git worktree
- Never switch branches
- Never use shell-side polling loops like `while`, `until`, or `watch` to wait for workers
- If you need to check progress, run another short tmux/status command from the orchestrator

## Step 1 — Create the run directory

```bash
RUN_ID="${RUN_ID:-review-$(date -u +%Y%m%dT%H%M%SZ)-$(uuidgen | tr '[:upper:]' '[:lower:]' | cut -c1-8)}"
REVIEW_ROOT="${TMPDIR:-/tmp}/review-openai/${RUN_ID}"
mkdir -p "$REVIEW_ROOT/results"
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"
```

Artifacts stay under:
- `$REVIEW_ROOT/results/*.md`
- `$REVIEW_ROOT/summary.md`

## Step 2 — Resolve current-branch context

Resolve these values:

```bash
ASPECT_FILTER="full"
AUTO_FIX=0
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-1800}"
REQUESTED_PR_NUMBER=""
CURRENT_PR_NUMBER=""
REQUESTED_COMMIT_COUNT=""
DEFAULT_BRANCH="$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name' 2>/dev/null || git remote show origin | sed -n '/HEAD branch/s/.*: //p' || echo main)"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
CURRENT_PR_NUMBER="$(gh pr view --json number --jq '.number' 2>/dev/null || true)"
BASE="$(git merge-base HEAD "origin/$DEFAULT_BRANCH")"
RANGE="$BASE..HEAD"
MODE="current-branch"
```

Interpret PR mentions like this:
- `543`, `#543`, or `pr 543` means `REQUESTED_PR_NUMBER=543`
- if `REQUESTED_PR_NUMBER` is set and `CURRENT_PR_NUMBER` is empty, stop and say the current branch does not have that PR
- if both are set and differ, stop and say this skill only reviews the current branch and its own PR
- if they match, continue normally

Interpret recent-commit requests like this:
- `last 5 commits` means `REQUESTED_COMMIT_COUNT=5` on the current branch
- `last 5 commits on <branch>` is allowed only when `<branch>` is the current checked-out branch
- if the named branch is not the current branch, stop and say this skill only reviews the current checked-out branch

Choose scope like this:
- if `REQUESTED_COMMIT_COUNT` is set, review `HEAD~N..HEAD`
- otherwise if `git diff --quiet "$RANGE"` is false, review `RANGE`
- otherwise fall back to `working-tree` mode and review staged + unstaged + untracked changes in the current checkout

Keep one short scope string for worker prompts, for example:
- `Review the last 5 commits on the current branch; only report issues introduced in those commits.`
- `Review the current branch feature/foo against origin/$DEFAULT_BRANCH; only report issues introduced by this branch.`
- `Review the current working tree on the current branch; only report issues introduced by the current uncommitted changes.`

If `CURRENT_PR_NUMBER` exists, fetch the PR title/body once for orchestrator-side accuracy review, then keep one short PR context string for workers, for example:
- `Current branch PR: #123. Use gh pr view 123 only if extra PR context is needed.`

Compare the PR title/body against the actual reviewed diff. Flag stale, exaggerated, missing, or contradicted claims, especially verification claims that do not appear to have been run. Treat the diff as source of truth; PR text, issues, and specs are context.

## Step 3 — Choose worker roles

Use these roles for `full` review:
- `security`
- `correctness`
- `robustness`
- `wiring`
- `patterns`

Use this logic:

```bash
case "$ASPECT_FILTER" in
  security|correctness|robustness|wiring|patterns)
    REVIEW_ROLES=("$ASPECT_FILTER")
    ;;
  full)
    REVIEW_ROLES=(security correctness robustness wiring patterns)
    ;;
  *)
    echo "Unknown aspect filter: $ASPECT_FILTER" >&2
    exit 1
    ;;
esac
```

Model settings are fixed:
- `security` → `openai-codex` + `gpt-5.4` + `xhigh`
- all others → `openai-codex` + `gpt-5.4` + `high`

## Step 4 — Create a normal tmux window

Window name format: `<run-id>-review`.

Create ordinary tmux panes with the user's default shell by omitting any command.

```bash
if [ -n "$TMUX" ] && [ -n "$TMUX_PANE" ]; then
  SESSION="$(tmux display-message -p '#{session_name}')"
else
  echo "No tmux session detected; create or attach to a tmux session before launching review workers." >&2
  exit 1
fi

FIRST_PANE="$(tmux new-window -t "$SESSION:" -n "${RUN_ID}-review" -P -F '#{pane_id}' -c "$REPO_ROOT")"
WINDOW_ID="$(tmux display-message -p -t "$FIRST_PANE" '#{window_id}')"
tmux set-option -t "$WINDOW_ID" remain-on-exit on >/dev/null
tmux set-window-option -t "$WINDOW_ID" allow-set-title off >/dev/null
tmux set-option -t "$WINDOW_ID" pane-border-status top >/dev/null
tmux set-option -t "$WINDOW_ID" pane-border-format '#{pane_index}: #{pane_title}' >/dev/null

DECLARED_PANES=("$FIRST_PANE")
for idx in $(seq 1 $((${#REVIEW_ROLES[@]} - 1))); do
  DECLARED_PANES[$idx]="$(tmux split-window -t "$FIRST_PANE" -h -P -F '#{pane_id}' -c "$REPO_ROOT")"
done

for idx in "${!REVIEW_ROLES[@]}"; do
  tmux select-pane -t "${DECLARED_PANES[$idx]}" -T "${REVIEW_ROLES[$idx]}"
done

tmux select-layout -t "$WINDOW_ID" tiled
```

Wait until each pane shell is ready before sending commands:

```bash
wait_for_shell() {
  local pane="$1"
  local tries="${2:-50}"
  local current
  for _ in $(seq 1 "$tries"); do
    current="$(tmux display-message -p -t "$pane" '#{pane_current_command}')"
    case "$current" in
      bash|zsh|fish|sh|nu)
        return 0
        ;;
    esac
    sleep 0.1
  done
  echo "Pane $pane did not become ready for input." >&2
  return 1
}

for pane in "${DECLARED_PANES[@]}"; do
  wait_for_shell "$pane"
done
```

## Step 5 — Launch workers with inline prompts in interactive mode

Do not use `-p` / `--print`.

Workers should run in interactive mode so the pane shows live tool use and live output while the review is happening.
Their final result should also be printed in the pane after being written to disk.

Launch quickly: once scope and roles are resolved, immediately launch workers.
Do not create prompt files. Build one plain-text inline prompt per role and pass it directly as the initial user message to `pi`.

Use this command shape:

```bash
pi --no-session --provider openai-codex --no-extensions --model gpt-5.4 --thinking high "<inline prompt>"
```

Role-specific thinking:
- `security` uses `xhigh`
- all others use `high`

Each worker should write its structured result to:
- `$REVIEW_ROOT/results/<role>.md`

Use this result schema:

```md
# Review Worker Result
run_id: <run-id>
role: <security|correctness|robustness|wiring|patterns>
status: done
started_at: 2026-..-..T..
finished_at: 2026-..-..T..

## findings
| severity | file | line | confidence | category | auto-fix | finding | evidence | fix suggestion |
|---|---|---|---:|---|---|---|---|---|

## notes
- assumptions or caveats
```

Use `auto-fix` values only from:
- `safe-auto`
- `needs-approval`
- `manual`

Recommended prompt pattern:

```text
You are the <role> review worker.

<one-line scope string>
<optional one-line PR context string>

Focus: <role-specific checklist in 1 short paragraph>.
Use git, gh, and repo instructions as needed.
Only report issues introduced in this scope.
Only include findings with confidence >= 50.
If there are no findings, write an empty findings table and a short note.
Write the final markdown result to <results/role.md> via a temp file <results/role.md.tmp> and then rename it into place.
After writing the file, print the same final markdown to stdout, then print one final line: Result file: <results/role.md>
```

Role checklists:
- `security`: auth bypass, permissions, injection, XSS, CSRF, trust boundaries, unsafe file/storage/webhook handling
- `correctness`: logic errors, broken behavior, stale refs, wrong assumptions, incomplete refactors
- `robustness`: edge cases, error handling, validation gaps, null handling, cleanup, obvious performance risks
- `wiring`: end-to-end connection, route/component/API/db wiring, cache invalidation, discoverability, auth checks on reachable paths
- `patterns`: only explicit repo-local rule violations, not invented conventions

## Step 6 — Check completion from tmux panes

Do not keep a bash command open just to wait.
Do not use shell-side polling loops.
If you need to check progress, run another short status command.

Treat tmux pane state as the source of truth:
- `done` if the pane output contains `Result file: <path>` and that result file exists
- `failed` if the pane has returned to a shell and the result file does not exist
- `running` otherwise

This handles the common cases cleanly:
- successful worker prints `Result file:` at the end
- crashed worker drops back to the shell without a result file
- still-running worker has not yet printed the final line

Use short checks like:

```bash
tmux list-panes -t "$WINDOW_ID" -F '#{pane_id} #{pane_title} #{pane_current_command}'
tmux capture-pane -p -t "$PANE_ID" | tail -n 40
```

Keep checking with separate short orchestrator commands until every pane is terminal (`done` or `failed`), then aggregate immediately.
Do not wait for result files alone.
Do not assume `pane_current_command=node` means the worker is still unfinished; inspect the pane output for the final `Result file:` line.

## Step 7 — Aggregate and shape final findings

When all panes are terminal:
1. collect findings from all worker markdown tables
2. add any orchestrator-side PR description accuracy finding, if the current branch has a PR
3. filter to confidence `>= 75`
4. de-duplicate on `file + line + category + finding`
5. sort by severity: `critical`, `important`, `minor`
6. assign stable finding IDs in final report order: `R1`, `R2`, `R3`, ...

Worker notes may stay compact and table-oriented. The orchestrator owns the final presentation. Do not paste raw worker rows as the final review.

For each retained finding, verify enough surrounding code and repo context to explain why it matters. If worker output lacks context, read the relevant file or diff before reporting.

Each final finding must include:
- a stable ID (`R1`, `R2`, ...)
- the exact file and line when possible
- the problem in one sentence
- `Context`: the flow/process this code participates in, where this code sits in that flow, and what downstream step relies on it
- `Impact`: the concrete issue created for users, data, security, reviewers, or operations
- `Fix`: a short concrete suggestion
- `Evidence` only when it clarifies a wiring/spec/process issue or prevents ambiguity

Avoid filler context. Do not add a long explanation for obvious style or syntax issues. Add context when it changes how severe, actionable, or understandable the finding is.

If a worker failed or never wrote its result file, include that explicitly in the final report.

## Step 8 — Optional safe auto-fixes

Workers never edit code. The orchestrator is the only agent that may fix anything.

Auto-fix only when all are true:
- `--fix` is enabled and `--no-auto-fix` is not set
- worker confidence is `>= 85`
- `auto-fix` is `safe-auto`
- the orchestrator independently agrees the fix is mechanical, local, and low-risk

Never auto-fix:
- auth/permission changes
- schema changes
- big refactors
- uncertain user-visible behavior

## Step 9 — Report

Write `$REVIEW_ROOT/summary.md`, but treat that file as a secondary artifact, not the primary user experience.

In the chat response, use this structure:

```md
Review result: <no findings | N findings | N fixed, M need attention>

Scope: <current branch vs origin/default | last N commits | working tree>

Critical
R1. `file:line` — <problem> (confidence: N, category: security|correctness|robustness|wiring|patterns)
Context: <flow/process, where this code sits in it, and what depends on it>
Impact: <specific issue it creates>
Fix: <short concrete suggestion>
Evidence: <optional; include only when useful>

Important
R2. ...

Minor
R3. ...

PR description accuracy
- <accurate | inaccurate | not checked> — <only include details when inaccurate or not checked>

Worker status
- <only include failed/incomplete workers, or omit when all completed>

Artifacts
- `<review-root-path>`
```

Number findings globally across severity sections. Do not restart numbering in each section. Use the finding IDs for any fix follow-up, e.g. "Fixed R2" or "R1 needs product judgment."

If there are no findings, say that plainly and include the scope reviewed. If a category was skipped because the user requested a narrower aspect, state that.

Mention PR description inaccuracies clearly if any. Mention worker failures clearly if any. Mention the review root path last, briefly.

Do not make the user open temp files to understand the review.
Do not lead with the artifact path when there are substantive findings to report.

## Done

When finished:
- leave review artifacts only under `/tmp/review-openai/<run-id>`
- do not commit artifacts
- do not commit review fixes unless the user explicitly asks
