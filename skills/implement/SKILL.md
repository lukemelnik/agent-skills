---
name: implement
description: Execute tasks from a spec continuously until complete or context runs low
disable-model-invocation: true
---

# Implement Tasks

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

You are executing tasks from a spec, sprint by sprint, continuing until all sprints are complete or you are running low on context.

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

If the issue is closed, alert the user and stop.

### If Input is a File Path
Read the spec file directly. (Legacy support for existing specs.)

## Step 2: Self-Assessment - Do I Have Enough Info?

Before diving in, assess whether the issue provides enough information to implement correctly.

### Quick Research
- Locate the files that would need to change
- Understand the existing patterns in those areas
- Identify any ambiguities or missing details

### Assess Readiness

**Ready to Proceed:**
- Clear description of what to build
- Acceptance criteria are specific (or can be inferred)
- No major ambiguities about behavior
- You can identify the files and patterns to follow

**Not Ready - Missing Critical Info:**
- Ambiguous about what exactly should happen
- Multiple valid interpretations
- Missing key details (e.g., "add a button" but where? what does it do?)
- Complex feature with no breakdown

### If Not Ready

**For lightweight issues (no sprint structure):**

Present your concerns and propose assumptions:

> "Before I start, I want to confirm my understanding:
> - I'll implement [X] by doing [Y]
> - For [ambiguous thing], I'll assume [Z]
> - Edge case [A] will be handled by [B]
>
> Does this sound right, or should we flesh this out more with `/spec`?"

Wait for user confirmation before proceeding.

**For issues that look complex but lack structure:**

> "This looks like it might need more planning than the issue provides. I see [complexity/gotchas]. Would you like me to:
> 1. Proceed with these assumptions: [list assumptions]
> 2. Run `/spec` to plan this properly first"

Wait for user direction.

### If Ready
Proceed to Step 3.

## Step 3: Determine Trivial vs Non-Trivial

Analyze the spec content:

### Trivial (Skip Progress File)
- Issue body has NO "Sprint" or "Task" headings
- Just a description or bullet points
- Single commit expected

Announce: "This is a lightweight issue. I'll implement directly without a progress file."

### Non-Trivial (Create/Resume Progress File)
- Issue body has Sprint/Task structure
- Multiple commits expected

**Check for existing progress file:**
```
docs/progress/<issue-num>-*.md
```

If progress file exists: Resume from where left off.
If no progress file: Create `docs/progress/<issue-num>-<slug>.md`

The slug should be a short kebab-case version of the feature name (e.g., `42-notification-batching.md`).

**Progress file format:**
```markdown
# Progress: #<issue-num> <Feature Name>

Issue: <issue-url>
Started: <date>
Last Updated: <date>

## Status

Current Sprint: Sprint <N>
Current Task: Task <N.M>

## Completed Work

### Sprint 1: [Goal/Theme]
Completed: <date>

- Task 1.1: [Task Name] - DONE
  - [1 sentence: what was done]
  - Files: `path/to/file.ts`, `path/to/other.ts`

- Task 1.2: [Task Name] - DONE
  - [1 sentence: what was done]
  - Files: `path/to/file.ts`

## Implementation Notes

- [Critical decisions made during implementation]
- [Patterns established for future reference]

## Blockers

[None currently / Description of blocker]
```

## Step 4: Check Context Before Starting a Sprint

**Before starting each sprint**, assess your remaining context:

- Do you have enough context to complete the full sprint (all tasks, verification, tidy sub-agent)?
- If you're unsure or context feels tight, err on the side of caution

### If Context is Too Low
**STOP before starting the sprint.** Do not begin work you cannot finish.

1. **Do NOT auto-compact** - this loses important context
2. **Update the progress file** with current status
3. **Alert the user** with a clear message:
   - "⚠️ CONTEXT LOW - Stopping before starting the next sprint."
   - List what was completed this session
   - State the next sprint that needs to be done
4. The user will start a fresh agent to continue

### If Context is Sufficient
Proceed to Step 5.

## Step 5: Execute the Sprint

Work through each task in the sprint sequentially.

### For Each Task:

1. **Announce the task** before starting
2. **Execute the task** until complete
3. **Run the validation commands** specified in the spec for that task
4. **Fix any issues** until validation passes

### Stay Focused
- Only work on tasks in the current sprint
- Do not skip ahead to future sprints
- Only deviate if something is critical to completing your task
  - Example: You discover a bug that blocks your work → fix it
  - Example: A missing type that your code needs → add it
  - NOT: "I noticed this other thing could be improved"

### If You Get Blocked

Try hard to find a way forward. But if you absolutely cannot proceed:

1. **Stop immediately**
2. **Notify the user directly** with:
   - What task you were working on
   - What's blocking you
   - What you tried
   - What you think needs to happen
3. **Update the progress file** with the blocker
4. **Do not attempt other tasks** - let the user decide next steps

## Step 6: Verify Sprint Completion

**A sprint is NOT complete until all checks pass.**

After all tasks in the sprint are done:

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

## Step 7: Run Tidy Sub-Agent

After the sprint passes verification, **spawn a sub-agent to run tidy**:

```
Spawn a sub-agent with prompt:
"Run /tidy to review the code changes from this sprint. Fix any issues found.
Do not create commits yet - just fix issues."
```

Implement any fixes the tidy sub-agent identifies. Run verification again if changes were made.

## Step 8: Commit the Sprint

Once the sprint passes verification and tidy review:

1. **Create a logical commit** for the sprint
2. Write a clear commit message that explains what the sprint accomplished
3. Do NOT include co-authoring or attribution

## Step 9: Update the Issue and Progress File

### Update the GitHub Issue In-Place

After each sprint, edit the issue body directly to reflect current status. Use `gh issue edit` to:

- Mark completed tasks/sprints as done (e.g., add ✅ or "DONE" with date)
- Note any scope changes or decisions inline, right next to the relevant task
- If a task was skipped or changed, update it in-place with a brief reason

```bash
gh issue edit <num> --body "<updated issue body with tasks marked complete>"
```

The goal is that any agent fetching this issue sees the current state immediately — no comments to chase down. The spec body IS the source of truth.

### Update the Progress File

Move the completed sprint to "Completed Work" in the progress file:

```markdown
## Completed Work

### Sprint 1: [Goal/Theme]
Completed: 2024-01-15

- Task 1.1: [Task Name] - DONE
  - [1 sentence: what was done]
  - Files: `path/to/file.ts`, `path/to/other.ts`

- Task 1.2: [Task Name] - DONE
  - [1 sentence: what was done]
```

Update the "Status" section with the next sprint/task.

Add Implementation Notes only if you discovered something critical for future sprints.

## Step 10: Continue or Finish

### If More Sprints Remain
1. **Report what you just completed** (brief, 1 line)
2. **Go back to Step 4** - check context and continue to the next sprint

### If All Sprints Are Complete
Proceed to the final review.

## Step 11: Final Review (Required)

After all sprints are complete, run two final sub-agents:

### 11a. Spec-Aware Tidy
```
Spawn a sub-agent with prompt:
"Run /tidy to review the full implementation against the spec's acceptance criteria.
Check that all acceptance criteria are met. Fix any issues found."
```

Implement any fixes. Run verification again.

### 11b. Final Code Review
```
Spawn a sub-agent with prompt:
"Do a thorough code review of all changes in this branch. Check for:
- Security issues
- Performance problems
- Missed edge cases
- Inconsistencies with codebase patterns
- Any acceptance criteria from the spec that may have been missed

Report issues by priority. Fix critical and important issues."
```

Implement any fixes. Run verification again.

## Step 12: Assess Guide Need

After implementation is complete, assess whether documentation would help:
- Does this feature introduce new patterns that others need to know?
- Are there integration points or gotchas that would save future time?
- Is this complex enough to warrant a guide?

If yes, ask the user:
> "Would you like me to create a guide at `docs/guides/<name>.md`?"

Only create the guide if the user approves.

## Step 13: Complete and Close

### For GitHub Issues

1. **Mark all tasks complete in the issue body** — do a final `gh issue edit` to ensure every task/sprint is marked done with dates and any scope changes are noted inline.

2. **Create a PR that references and closes the issue:**
   ```bash
   gh pr create --title "<concise PR title>" --body "$(cat <<'EOF'
   Closes #<num>

   ## Summary
   [Brief description of the implementation]

   ## Key Changes
   - [Change 1]
   - [Change 2]

   ## Scope Changes
   - [Any deviations from the original spec, or "None"]

   ## Test Plan
   - [How this was verified]
   EOF
   )"
   ```

   The `Closes #<num>` line ensures the issue is automatically closed when the PR is merged.

3. **Delete the progress file** (if it exists) and commit the deletion

4. **Report completion** - summarize all sprints completed and share the PR URL

### For File-Based Specs (Legacy)

1. Mark the spec as complete in the file
2. **Report completion** - summarize all sprints completed

All changes are committed and ready for PR.

**STOP**


## Important Rules

1. **Self-assess before starting** - Verify you have enough info; ask questions or suggest `/spec` if unclear
2. **Check context before each sprint** - Never start a sprint you can't finish
3. **One sprint at a time** - Complete each sprint fully before moving to the next
4. **Run tidy after each sprint** - Catch issues early
5. **Validate according to the spec** - Run the validation commands specified for each task
6. **Commit after each sprint** - Atomic, logical commits
7. **Final review is required** - Spec-aware tidy + code review at the end
8. **Update the issue body in-place after each sprint** - Mark tasks done, note scope changes inline; the issue is the source of truth
9. **Never auto-compact** - Alert the user instead when context is low
10. **Never use type shortcuts** - No `any`, `as`, `@ts-ignore`, `biome-ignore`
11. **Create a PR that closes the issue** - Use `Closes #<num>` in the PR body so the issue auto-closes on merge
12. **Document scope changes inline** - Note deviations right next to the relevant task in the issue body and in the PR

Now read the spec and begin.
