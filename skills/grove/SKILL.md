---
name: grove
description: Manage Git worktrees with the Grove CLI instead of an agent's built-in worktree feature or raw git worktree commands. Use when asked to create, launch, provision, list, inspect, delete, or clean worktrees; when starting isolated branch work; or when working in a repository that has a .grove.yml.
---

# Grove Worktrees

Use Grove as the worktree authority. It provisions the checkout together with deterministic ports, configured environment-file links, and hooks.

## Core rules

- In a Grove-configured repository, use `grove` instead of built-in agent worktree tooling or direct `git worktree` commands.
- Run commands from the repository root unless checking the current worktree with `grove status`.
- Prefer `--json` and non-interactive commands for agent workflows.
- Always provision with `--no-open`; do not open or enter Grove workspaces.
- Let `grove create` resolve or create the branch; do not pre-create it with Git. It uses an existing local branch, tracks an existing remote branch, or creates a new branch from `origin/main` by default.
- Never pass `--from` unless the user explicitly names a different base ref.
- If `grove` is unavailable or `.grove.yml` is missing, report that instead of silently falling back to another worktree mechanism. Initialize Grove only when asked.

## Create an agent worktree

For isolated agent work, run:

```bash
grove create <branch> --no-open --json
```

Read the returned worktree path and use it as the working directory for subsequent commands. Use `--from <ref>` when the user specifies a different base branch.

For a newly created branch using the default base, verify the checkout before editing:

```bash
git log --oneline origin/main..HEAD
```

The output must be empty. If it is not, stop and report the unexpected base instead of continuing.

To rediscover an existing worktree and its assigned ports:

```bash
grove list --json
```

Do not use interactive `grove list` in an agent workflow.

## T3 Code chat handoff

For an explicit request to continue in a new T3 chat on a Grove worktree, read [references/t3-handoff.md](references/t3-handoff.md). The `/gw` Pi prompt template is the shortcut in Pi-backed T3 chats. Create with Grove, launch a T3 chat bound to the existing checkout, verify readiness, and settle the source chat only after success.

Install the bundled `assets/gw.md` prompt as `~/.pi/agent/prompts/gw.md` (prefer a symlink) to expose `/gw [task]`. A prompt added during an active session may require resource reload or a fresh session before command discovery updates.

Do not infer permission to launch a new chat or settle the source from an ordinary worktree creation request. Outside T3, keep using the normal Grove workflow; this handoff has no Codex adapter.

## Inspect the current checkout

From inside a Grove worktree, run:

```bash
grove status --json
```

This reports its branch, path, and assigned ports.

## Configure a repository

If asked to add Grove support, use `grove init` for a basic configuration and `grove schema` for the complete `.grove.yml` reference. Do not guess nested layout syntax or inspect environment-file contents. Prefer known file paths and let Grove create the configured links.

## Delete safely

Preview a single deletion first:

```bash
grove delete <branch> --dry-run --json
```

After reviewing the preview, use `grove delete <branch> --json`. Add `--keep-branch` when only the worktree should be removed.

For stale worktrees, always inspect the candidates first:

```bash
grove clean --dry-run --json
```

Run the actual clean only when the user requested cleanup and the candidates are safe. Never pass `--force`, `clean --all`, or `--discard-changes` without explicit approval; `--discard-changes` can destroy local worktree data.

## Intent mapping

- “Create/start/launch a worktree for this task” → `grove create <branch> --no-open --json`
- “Continue this task in a new T3 chat on a Grove worktree” / `/gw` invocation → read `references/t3-handoff.md`
- “Where is the worktree / which ports does it use?” → `grove list --json` or `grove status --json`
- “Remove this worktree” → preview, then `grove delete`
- “Clean merged or stale worktrees” → `grove clean --dry-run --json`, review, then clean
