---
name: implement-task
description: Execute exactly one task from a spec (for automated loops)
disable-model-invocation: true
---

## Output Markers (for automation)

These exact markers allow the loop script to detect status:

- `[TASK_COMPLETE]` - Task done, more tasks remain
- `[ALL_COMPLETE]` - All tasks in the spec are done
- `[BLOCKED]` - Cannot proceed, needs human intervention

Now read the spec and begin.
