# T3 Code Grove handoff

Use this workflow only for an explicit request to continue work in a new T3 chat bound to a Grove worktree. Invoking the `/gw` prompt authorizes that handoff, including settling the source chat after success. A generic request to create a worktree does not authorize a new chat or settling.

## Preflight

- Require a T3-owned source thread and the T3 thread launch, read, workspace status, and organize tools. Discover them from the live tool catalog; use the supported T3 ACP transport only when supplied by the runtime. Stop if unavailable; do not substitute Codex tools, shell `cd`, or provider session-file edits.
- Retain the source thread ID from runtime context or `orchestrator_capabilities`. Read its metadata and call `t3_worktree_status` to identify the project and main workspace root. Run Grove from that root, even when the source chat is already in another worktree.
- Take the task from the invocation, or from an unambiguous task already agreed in this conversation. If absent or ambiguous, ask one focused question before creating anything.
- Load `grove` and applicable project instructions. Require Grove and `.grove.yml`; do not initialize or replace them automatically. Never access `.env` or `.env.*` files.
- Choose a short task-derived branch name, unless the user supplies one. For a new worktree, avoid existing branch/worktree names rather than silently reusing unrelated work. Reuse only when explicitly requested. Honor an explicitly named base; otherwise retain Grove's default. Quote all shell arguments.
- Preserve the source checkout. Uncommitted changes, ignored files, and running processes do not migrate. If the task needs uncommitted work, explain that and resolve how to carry it before proceeding; do not stash, copy, commit, or reset it automatically.

## Create and launch

1. Run `grove create <branch> --no-open --json` from the main workspace root. Add `--from <ref>` only for a user-specified base. Do not open a Grove workspace, start dev servers, or use native T3 worktree creation.
2. Retain the successful JSON result's absolute path and branch. For a newly created default-base branch, run `git log --oneline origin/main..HEAD` in the worktree and require empty output. Stop on provisioning errors or an unexpected base; keep the source chat active and leave any partial worktree intact.
3. Prepare a self-contained handoff message containing:
   - The user's task, acceptance criteria, agreed decisions, constraints, and unresolved questions.
   - Relevant file paths, discoveries, completed work, and verification evidence or remaining checks.
   - The Grove branch, absolute path, base choice, and assigned ports when returned.
   - Instructions to work only in this bound checkout, read its applicable skills/instructions, avoid recreating the worktree or recursively invoking `/gw`, and preserve unrelated changes.
   Do not copy secrets or imply that the new chat receives the whole conversation automatically. Preserve the task's actual scope; do not invent permission to commit, push, or open a PR.
4. Call `t3_thread_launch` once with the task in `message` and an explicit existing-worktree strategy:

   ```json
   {
     "title": "Short task title",
     "workspaceStrategy": {
       "type": "existing_worktree",
       "worktreePath": "/absolute/path/from/grove",
       "branch": "branch-from-grove"
     },
     "message": "Self-contained task and handoff context"
   }
   ```

   Omit project, model, and mode overrides to inherit the source settings. This is an ordinary top-level chat, not a delegated subagent. Do not use `create_threads`, which shares the caller's checkout, or `t3_worktree_handoff`, which creates a separate native worktree.
5. Retain the returned `threadId` and `runId` immediately. Launch `status: "preparing"` is acceptance, not readiness. Read the destination with `t3_thread_read` using `view: "activity"` and verify its worktree path and branch match the Grove result. Check preparation activity (`input: "Preparing workspace"`); a running preparation item or `failure.code: "workspace_preparation_failed"` is not success. Stop on any preparation or provider-launch error, even if a start timestamp was recorded. Require the destination's initial agent run to have actually started, or explicit successful preparation evidence from the available live response. A populated binding or merely leaving the preparing state is insufficient. Use bounded follow-up reads if still pending; do not use `t3_thread_wait` as a preparation gate, since it waits for implementation to finish.
6. If launch errors or its response is lost, inspect `t3_thread_list` before any retry: launch has no idempotency key. Do not duplicate an active chat. If binding or readiness cannot be confirmed, report the known chat/worktree state and leave the source active. Do not delete the worktree or cancel the destination automatically.

## Finish the handoff

- After successful readback, link the destination as `[Task title](t3-thread://v1/<threadId>)` using its exact returned ID. Include the branch only if useful; do not claim implementation is complete.
- Call `t3_thread_organize` with the retained **source** thread ID and `action: "settle"` as the final lifecycle action. Settling applies when the current turn finishes; interruptions, failures, or queued user messages can keep the source active. Do not settle the destination.
- Default to settle, not archive. Archive the source only if the user explicitly requests it. If the organize call fails, provide the destination link and report that the source remains active.
- End the source turn with the destination link and a brief handoff confirmation. Do not continue implementing in the source chat or promise that the app automatically navigated to the destination.
