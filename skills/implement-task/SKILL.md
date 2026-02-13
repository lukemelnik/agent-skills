---
name: implement-task
description: Execute exactly one task from a spec (for automated loops)
disable-model-invocation: true
---

# Implement Single Task

> ⚠️ **CRITICAL PRODUCTION ENVIRONMENT**
>
> This code deploys to a production system with real users and paying customers. Bugs, security vulnerabilities, or regressions can have serious consequences.
>
> - **Review every line**: Read your code as if someone else wrote it and you're reviewing it
> - **Test thoroughly**: Don't assume code works—verify it
> - **No shortcuts**: Never use `any`, type casts, or ignore directives to silence errors
> - **Think about edge cases**: What happens with empty data? Null values? Concurrent access?
> - **Security is non-negotiable**: Validate inputs, escape outputs, check permissions
> - **When uncertain, investigate**: It's better to spend time understanding than to introduce bugs
> - **Double-check before marking complete**: Verify acceptance criteria are actually met, not just "probably" met

You are executing exactly ONE task from a spec, then stopping.

This command is designed for automated loops that restart Claude with fresh context for each task.

**Spec:** $ARGUMENTS

This can be:
- A GitHub issue number (e.g., `42` or `#42`)
- A file path (legacy support, e.g., `docs/specs/feature.md`)

## Step 1: Fetch the Spec

### If Input is an Issue Number
Fetch the spec from GitHub:

```bash
gh issue view <num> --json title,body,state,url
```

Parse the response to get the spec content from the `body` field.

If the issue is closed, output `[ALL_COMPLETE]` and stop.

### If Input is a File Path
Read the spec file directly. (Legacy support for existing specs.)

## Step 2: Check for Progress File

Look for an existing progress file:
```
docs/progress/<issue-num>-*.md
```

### If Progress File Exists
Read it to understand:
- What's already been completed
- Current sprint/task position
- Any implementation notes

### If No Progress File
For non-trivial specs (those with Sprint/Task structure):
- Create `docs/progress/<issue-num>-<slug>.md`
- Initialize with the starting state

For trivial specs (no Sprint structure):
- Work without a progress file
- Announce: "This is a lightweight issue. Working without a progress file."

## Step 3: Understand the Spec

Read the spec (from issue body or file). Understand:
- The overall feature/goal (Context section)
- What's already been completed (from progress file)
- What tasks remain
- Check `docs/guides/` for any relevant integration guides referenced in the spec

If there are NO remaining tasks, output `[ALL_COMPLETE]` and stop.

## Step 4: Select the Next Task

Choose the next task to work on. Use your judgment:
- Respect dependencies (don't skip ahead if something blocks it)
- Consider what unblocks the most progress
- If priorities are unclear, take the first remaining task

**Announce your selection** before starting work.

## Step 5: Execute the Task

Work on the selected task until it's DONE. Do not stop early.

### Stay Focused
- Only work on YOUR selected task
- Only deviate if something is absolutely critical to completing your task
  - Example: You discover a bug that blocks your work → fix it
  - Example: A missing type that your code needs → add it
  - NOT: "I noticed this other thing could be improved"

### If You Get Blocked

Try hard to find a way forward. But if you absolutely cannot proceed:

1. **Update the progress file** with the blocker
2. **Output exactly:** `[BLOCKED] <brief description of blocker>`
3. **Stop** - the loop will alert the user

## Step 6: Verify Your Work (REQUIRED)

**A task is NOT complete until all checks pass.** You must run:

```bash
pnpm check
```

```bash
pnpm check-types
```

If either command shows errors:
1. Fix ALL lint errors and type errors
2. Run the checks again
3. Repeat until both pass cleanly

### Type Safety Rules

**Do NOT use these shortcuts to "fix" type errors:**
- `any` type - never use it
- `as` type casting - never use it
- `@ts-ignore` or `@ts-expect-error` - never use them
- `biome-ignore` - never use it

**Instead, fix types properly:**
- Use explicit types that match the actual data
- Use inferred types from tRPC where available
- If a type is complex, define a proper interface/type
- If you're unsure what type something should be, read the surrounding code

**Do NOT proceed to Step 7 until both commands pass with zero errors AND you haven't used any of the forbidden shortcuts.**

## Step 7: Update the Progress File

If using a progress file, update it with the completed task:

```markdown
## Completed Work

### Sprint 1: [Goal/Theme]
Completed: 2024-01-15

- Task 1.1: [Task Name] - DONE
  - [1 sentence: what was done]
  - Files: `path/to/file.ts`, `path/to/other.ts`
```

Update the "Status" section with the next task.

Add Implementation Notes only if you discovered something critical for future tasks.

## Step 8: Report and Stop

1. Output a brief summary of what you completed
2. If tasks remain, output: `[TASK_COMPLETE]`
3. If this was the last task, output: `[ALL_COMPLETE]`
4. **STOP** - do not continue to the next task

**Important:** This command does NOT close the GitHub issue. The orchestrating script or `/implement` handles that.

The automated loop will start a fresh Claude session for the next task.


## Output Markers (for automation)

These exact markers allow the loop script to detect status:

- `[TASK_COMPLETE]` - Task done, more tasks remain
- `[ALL_COMPLETE]` - All tasks in the spec are done
- `[BLOCKED]` - Cannot proceed, needs human intervention

Now read the spec and begin.
