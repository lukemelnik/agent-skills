---
description: Hand a task off to a new T3 chat on a Grove worktree
argument-hint: "[task]"
---
Load the `grove` skill and follow its T3 Code chat-handoff workflow in `references/t3-handoff.md`, resolved relative to that skill's directory.

This `/gw` invocation explicitly requests Grove provisioning, a new top-level T3 chat bound to the resulting existing worktree, and settling this source chat only after the destination is verified ready. This workflow is T3-specific; stop if the required T3 tools are unavailable. Do not implement the task in this source chat or substitute a shell directory change for chat binding.

Task: $ARGUMENTS

If no task was supplied, use an unambiguous task already agreed in this conversation; otherwise ask one focused question before creating anything.
