---
name: grove
description: Manage Git worktrees with the Grove CLI instead of an agent's built-in worktree feature or raw git worktree commands. Use when asked to create, launch, provision, open, enter, list, inspect, delete, or clean worktrees; when starting isolated branch work; or when working in a repository that has a .grove.yml.
---

# Grove Worktrees

Use Grove as the worktree authority. It provisions the checkout together with deterministic ports, configured environment-file links, hooks, and optional tmux workspace layout.

## Core rules

- In a Grove-configured repository, use `grove` instead of built-in agent worktree tooling or direct `git worktree` commands.
- Run commands from the repository root unless checking the current worktree with `grove status`.
- Prefer `--json` and non-interactive commands for agent workflows.
- Provision without changing the user's tmux focus by default. Open or enter a workspace only when explicitly requested.
- Let `grove create` resolve or create the branch; do not pre-create it with Git. It uses an existing local branch, tracks an existing remote branch, or creates a new branch from `origin/main` by default.
- If `grove` is unavailable or `.grove.yml` is missing, report that instead of silently falling back to another worktree mechanism. Initialize Grove only when asked.

## Create an agent worktree

For isolated agent work, run:

```bash
grove create <branch> --no-open --json
```

Read the returned worktree path and use it as the working directory for subsequent commands. Use `--from <ref>` when the user specifies a different base branch.

To rediscover an existing worktree and its assigned ports:

```bash
grove list --json
```

Do not use interactive `grove list` in an agent workflow.

## Open or enter a workspace

When the user asks to open the full tmux workspace:

```bash
grove open <branch>
```

Use `grove open <branch> --new-window` only when they request an additional workspace window. For a new worktree that should open immediately, `grove create <branch>` creates it and opens its configured workspace.

Use `grove enter <branch>` only when the user explicitly wants the current pane moved into that worktree. Agents should normally use the JSON path as their command working directory instead.

Optional tmux panes are skipped by default. Include all with `--all`, or named panes with `--with <name>`, only when requested.

## Inspect the current checkout

From inside a Grove worktree, run:

```bash
grove status --json
```

This reports its branch, path, and assigned ports.

## Configure a repository

If asked to add Grove support, use `grove init` for a basic configuration and `grove schema` for the complete `.grove.yml` reference. Do not guess nested tmux layout syntax or inspect environment-file contents. Prefer known file paths and let Grove create the configured links.

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
- “Open the workspace for this branch” → `grove open <branch>`
- “Where is the worktree / which ports does it use?” → `grove list --json` or `grove status --json`
- “Remove this worktree” → preview, then `grove delete`
- “Clean merged or stale worktrees” → `grove clean --dry-run --json`, review, then clean
