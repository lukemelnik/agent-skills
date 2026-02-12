---
name: orchestrate
description: Orchestrate full spec implementation with fresh-context sprints, tidy, and review
disable-model-invocation: true
---

## Step 1: Read and Parse the Spec

```bash
gh issue view <num> --json title,body,state,url,number
```

If the issue is closed, alert the user and stop.

Parse the spec body to identify:
- Feature name
- All sprints and their tasks
- Total number of sprints

Store the full spec body — you'll pass it to sub-agents.

## Step 2: Setup

### Branch

Check the current branch. If on `main`, create a feature branch:
```bash
git checkout -b feat/<short-slug>
```

If already on a feature branch, use it.

### Progress File

Check for an existing progress file:
```
docs/progress/<issue-num>-*.md
```

- If one exists, read it to determine which sprint to resume from.
- If none exists, the first sprint sub-agent will create it.

### Alert Log

Maintain an internal alert log throughout the process. As sub-agents report back, extract and collect any items from these categories:

- **Scope changes** — sub-agent deviated from the spec, skipped something, or implemented differently than specified
- **Schema changes** — new tables, columns, indexes, or enum values that need `db push` or migration on existing data
- **Breaking API changes** — endpoint signatures, response shapes, or Zod schemas changed in ways that affect the iOS app or other consumers
- **Architectural decisions** — places where the sub-agent made a judgment call between valid approaches
- **Manual verification needed** — acceptance criteria that require visual/manual testing (can't be checked by gates alone)
- **Security findings** — vulnerabilities found and fixed (user should know what was there, even if resolved)
- **Dependency needs** — packages or tools the implementation needs but couldn't install (per CLAUDE.md rules)

You'll present these in the final report.

### Announce

Report to the user: "Starting from Sprint N of M. Feature: <name>"

## Step 3: Sprint Loop

For each remaining sprint, execute two phases sequentially:

### Phase A: Implement Sprint

Spawn a **Task sub-agent** (`general-purpose`) with this prompt:

```
> CRITICAL PRODUCTION ENVIRONMENT — This deploys to production with real users and paying customers.
> Review every line. Test thoroughly. No shortcuts. Think about edge cases. Security is non-negotiable.

You are implementing Sprint {N} of GitHub issue #{number}: {title}.

<spec>
{paste the full spec body here}
</spec>

YOUR JOB: Implement ONLY Sprint {N}. Complete every task in this sprint.

PROCESS:
1. Read the progress file at docs/progress/{progress-file}.md if it exists
2. For each task in Sprint {N}:
   - Read the acceptance criteria carefully
   - Implement the changes
   - Run the validation commands specified in the spec for that task
   - Fix any issues until validation passes
3. After all tasks in the sprint, run gates:
   pnpm check
   pnpm check-types
   pnpm test
   Fix ALL failures. Do not proceed until gates pass.
4. Update the progress file:
   - Create it at docs/progress/{issue-num}-{slug}.md if it doesn't exist
   - Move completed sprint to "Completed Work" section
   - List files changed per task
   - Add implementation notes for anything the next sprint needs to know
5. Update the GitHub issue body — mark Sprint {N} tasks as complete with today's date using gh issue edit
6. Commit: git add <specific-files> && git commit -m "feat(scope): sprint {N} — description"

RULES:
- Follow all conventions in CLAUDE.md
- Never use any, as, @ts-ignore, @ts-expect-error, or biome-ignore
- No comments in code
- Use static imports in the API
- Use structured logging (never console.log in API)
- Stay focused on Sprint {N} only
- If blocked, update the progress file with the blocker and state clearly: BLOCKED: <reason>

AT THE END OF YOUR SUMMARY, include an ALERTS section listing any of the following that apply (skip categories with nothing to report):
- SPEC DEVIATIONS: anything you implemented differently from what the spec described, even if your approach is better. Include WHAT the spec said, WHAT you did instead, and WHY. This is critical — the user must know when the plan was changed, even for good reasons.
- SCHEMA CHANGES: new tables, columns, indexes, enum values added
- BREAKING API CHANGES: endpoint or Zod schema changes affecting other consumers (iOS, etc.)
- ARCHITECTURAL DECISIONS: judgment calls where you chose between valid approaches, or took liberties the spec didn't specify. Explain the tradeoff and why you went this direction.
- MANUAL VERIFICATION: acceptance criteria that need visual/manual testing
- DEPENDENCIES NEEDED: packages or tools the implementation requires but weren't installed
```

Wait for the sub-agent to complete. Read its summary.

**If the sub-agent reports a blocker:** Stop the entire orchestration and report to the user. Do not proceed.

### Phase B: Tidy Sprint

Spawn a **Task sub-agent** (`general-purpose`) with this prompt:

```
> You are reviewing code as a senior engineer. Be objective — review as if someone else wrote this.

Review and tidy the most recent sprint commit(s) for Sprint {N} of issue #{number}.

PROCESS:
1. Run git log --oneline -5 to identify the sprint commits
2. Run git diff against the state before the sprint to see all changes
3. Review for:
   - Code quality issues or anti-patterns
   - Type safety (no any, no as, no unsafe casts)
   - Unused imports, variables, dead code
   - Pattern violations per CLAUDE.md (semantic colors, derived types, no comments, icon sizing, etc.)
   - Wiring: are new components actually imported and used? Do forms call APIs? Is state rendered?
   - Missing validation at system boundaries
   - Security issues (injection, XSS, auth bypass)
4. Run gates:
   pnpm check
   pnpm check-types
   pnpm test
5. Fix any issues found
6. If you made changes, commit: git add <files> && git commit -m "tidy: clean up sprint {N}"
7. If no issues, confirm the code is clean

AT THE END OF YOUR SUMMARY, include an ALERTS section listing any of the following found during review (skip categories with nothing to report):
- SECURITY FINDINGS: vulnerabilities found and fixed (describe what was there and how it was fixed)
- SCOPE CONCERNS: implementation doesn't match spec intent
- PATTERN VIOLATIONS: significant deviations from codebase conventions that were fixed
```

Wait for the sub-agent to complete. Read its summary.

### Between Sprints

After both phases complete:
1. Note the sprint as done
2. Announce: "Sprint {N} complete. Starting Sprint {N+1} of {M}."
3. Continue to the next sprint

## Step 4: Final Review

After ALL sprints are complete, spawn a **Task sub-agent** (`general-purpose`) for a comprehensive review:

```
Run /review #{number}

This launches parallel review agents with confidence scoring to catch bugs, security issues,
pattern violations, wiring gaps, and spec compliance. It will auto-fix high-confidence issues
and report everything else.

This is being called from /orchestrate — include the ALERTS section for cross-sprint issues.
```

Wait for the sub-agent to complete. Read its summary and extract alerts into your alert log.

## Step 5: Create PR

1. Push the branch:
   ```bash
   git push -u origin <branch-name>
   ```

2. Final update of the GitHub issue body — ensure all tasks are marked complete

3. Create the PR:
   ```bash
   gh pr create --title "<concise title>" --body "$(cat <<'EOF'
   Closes #<num>

   ## Summary
   <1-3 sentences describing the feature>

   ## Key Changes
   - <Sprint 1 summary>
   - <Sprint 2 summary>
   - ...

   ## Scope Changes
   - <Any deviations from spec, or "None">

   ## Test Plan
   - <How this was verified>
   EOF
   )"
   ```

4. Delete the progress file and push:
   ```bash
   git rm docs/progress/<file>.md && git commit -m "chore: remove progress file" && git push
   ```

## Step 6: Report

Compile the alert log from all sub-agent summaries and present a structured report:

### Implementation Summary
- Sprint-by-sprint summary of what was built
- Link to the PR

### Alerts Requiring Action
Consolidate all alerts collected from sub-agents throughout the process. Group by category:

- **Schema changes** — list all DB changes; remind user to run `db push` or check if existing data needs migration
- **Breaking API changes** — endpoint or schema changes that may affect the iOS app or other consumers
- **Dependencies needed** — packages that need to be installed before this will work
- **Manual verification needed** — acceptance criteria that passed gates but need visual/manual testing

### Alerts For Awareness
These were handled but the user should know about them:

- **Spec deviations** — where implementation differs from the spec: what the spec said, what was done instead, and why. Even if the change was an improvement, flag it.
- **Architectural decisions** — judgment calls or liberties taken that the spec didn't specify
- **Security findings** — what was found and fixed during tidy/review
- **Performance concerns** — things that work but may need attention at scale

If no alerts in a category, omit that category entirely. If no alerts at all, just say "No alerts — clean implementation."

**STOP.**

---

## Error Handling

- **Sub-agent fails or returns unclear results:** Retry ONCE with a fresh sub-agent, including the error context in the prompt. If it fails again, stop and report.
- **Gates fail after retry:** Stop and report the specific failures to the user.
- **Blocker reported:** Stop immediately and report. Do not attempt the next sprint.

## Rules for the Orchestrator

1. **Never write code** — delegate everything to sub-agents
2. **Stay lean** — don't read implementation files yourself, only summaries and the progress file
3. **Sprints are sequential** — never run sprints in parallel (they build on each other)
4. **One retry max** — if a sub-agent fails twice, stop and report
5. **Don't push to main** — always work on a feature branch
6. **Brief status updates** — announce progress between sprints so the user can follow along

Now fetch the spec and begin.
