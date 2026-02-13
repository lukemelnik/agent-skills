---
name: task
description: Quick task capture with smart assessment
disable-model-invocation: true
---

# Quick Task

Capture a task quickly, but smartly. Assess whether it's truly simple or deceptively complex before creating the issue.

**Input:** $ARGUMENTS

This should describe what the task is (e.g., "add logout button to nav dropdown").

## Step 1: Understand the Task

Parse the input to understand:
- What needs to be done
- Where in the codebase this likely lives
- Initial sense of scope

## Step 2: Research and Assess

Before creating the issue, investigate:

### Find Relevant Code
- Locate the files that would need to change
- Understand the existing patterns in those areas
- Note any related functionality

### Check for Hidden Complexity
Look for things that could trip up implementation:

- **Dependencies**: Does this touch shared code? State management? API contracts?
- **Edge cases**: Empty states, error handling, permissions, mobile/responsive
- **Gotchas**: Race conditions, caching issues, auth edge cases
- **Integration points**: Does this need to coordinate with other features?
- **Data implications**: Schema changes? Migrations? Existing data?

### Assess Complexity

**Truly Simple:**
- Single file or 2-3 closely related files
- Clear pattern to follow
- No ambiguous decisions
- No hidden dependencies
- Experienced dev could implement without questions

**Deceptively Complex:**
- Touches multiple systems
- Has non-obvious edge cases
- Requires decisions about behavior
- Could be interpreted multiple ways
- Has dependencies that aren't obvious from the request

## Step 3: Branch Based on Assessment

### If Truly Simple → Create Issue Directly

Create a GitHub issue with implementation context:

```bash
gh issue create --title "[Task title]" --body "$(cat <<'EOF'
## Task
[1-2 sentence description]

## Implementation Hints
- File: `path/to/file.ts` - [what to do here]
- Pattern: Follow [existing pattern reference]
- [Any other helpful context]

## Acceptance Criteria
- [ ] [Specific outcome]
- [ ] [Specific outcome]
EOF
)"
```

Skip to Step 5.

### If Deceptively Complex → Quick Interview

Tell the user what you found:

> "This looks more involved than it might seem. I found [complexity/gotcha]. A few quick questions:"

Ask **3-5 focused questions** covering:
- Ambiguous behaviors you discovered
- Edge cases that need decisions
- Scope clarification (what's in vs out)

Keep it brief - this isn't a full spec interview.

## Step 4: Create Issue with Context (After Interview)

Based on the interview, create an issue with the additional context:

```bash
gh issue create --title "[Task title]" --body "$(cat <<'EOF'
## Task
[1-2 sentence description]

## Context from Discussion
- [Key decision 1]
- [Key decision 2]
- [Edge case handling]

## Implementation Hints
- File: `path/to/file.ts` - [what to do here]
- Pattern: Follow [existing pattern reference]

## Gotchas
- [Thing to watch out for]
- [Non-obvious consideration]

## Acceptance Criteria
- [ ] [Specific outcome]
- [ ] [Specific outcome]
- [ ] [Edge case handled]
EOF
)"
```

**Note:** If during the interview you discover this actually needs a full spec with sprints, tell the user:
> "This is bigger than a quick task. I'd recommend running `/spec [task]` to plan it properly."

Then stop - don't create a half-baked issue.

## Step 5: Report

Tell the user:
- Issue URL and number
- Brief summary of what was captured
- Remind them: `/implement <number>` to execute


## Guidelines

### Keep It Light
- This is NOT `/spec` - no sprint structure, no 10-question interviews
- Goal: capture enough context for implementation, not plan everything

### Trust Your Assessment
- If something smells complex, it probably is
- Better to ask 3 quick questions than create a confusing issue

### Implementation Hints Should Be Actionable
- Specific file paths, not vague areas
- Reference existing patterns by name
- Note anything non-obvious

### Don't Over-Engineer the Issue
- Simple tasks get simple issues
- Only add complexity discovered during assessment
- If you're writing sprints, use `/spec` instead
