---
name: dev-server-logs
description: Find and inspect an already-running dev server in tmux for the current repo. Use when the user asks to check dev server logs, inspect an existing local dev process, find which tmux pane is running the app, or debug a runtime error without starting the server yourself.
---

# Dev Server Logs

Use this skill when the user already has a dev server running in tmux and wants its logs inspected without launching a new process.

## Goal

Locate the tmux pane most likely running the current repo's dev server, capture recent logs, and report the likely error and pane id.

## Workflow

### 1. List tmux panes

Run:

```bash
tmux list-panes -a -F '#{pane_id}\t#{session_name}:#{window_index}.#{pane_index}\t#{pane_current_command}\t#{pane_title}\t#{pane_current_path}'
```

Prefer panes whose `pane_current_path` matches the current repo or a parent/child path of it.

### 2. Narrow candidates

Prioritize panes whose current command or output suggests a dev server, especially:

- `node`
- `pnpm`
- `vite`
- `tsx`
- `next`
- `bun`

If multiple panes match the repo, keep all likely candidates.

### 3. Capture recent output

For each candidate pane, run:

```bash
tmux capture-pane -p -S -150 -t <pane_id>
```

If needed, increase history depth to `-300`.

### 4. Identify the best pane

Look for output such as:

- local dev server startup lines
- localhost/port messages
- Vite/TanStack/Next dev output
- stack traces
- runtime errors
- HMR/build messages

Pick the pane with the most relevant active app output.

### 5. Report succinctly

Return:

- tmux pane id
- session/window/pane label
- why it looks like the dev server
- top current error or recent relevant log lines

## Notes

- Do not start or restart the dev server unless the user asks.
- If no tmux pane clearly matches, say that explicitly and list the closest candidates.
- If a runtime error is obvious, quote the exact error and file path.
- If the user wants ongoing monitoring, capture the pane again rather than guessing from stale output.
