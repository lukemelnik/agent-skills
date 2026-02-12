---
name: spec
description: Create a structured spec for agent-driven implementation
disable-model-invocation: true
---

## Scope

### MVP (This Implementation)
- [Core functionality that must be included]
- [Essential behavior]

### Future Enhancements (Out of Scope)
- [Nice-to-have features for later]
- [Extensions that aren't essential now]

---

## Sprints

Group tasks into sprints. Each sprint should result in demoable, working software that builds on previous sprints.

### Sprint 1: [Goal/Theme]
[Brief description of what this sprint accomplishes]

#### Task 1.1: [Task Name]
[Brief description of what needs to be done]

**Acceptance criteria:**
- [ ] [Specific measurable outcome]
- [ ] [Specific measurable outcome]

**Validation:**
- `[command to verify this task, e.g., pnpm check-types]`
- `[additional validation if needed]`

#### Task 1.2: [Task Name]
[Brief description]

**Acceptance criteria:**
- [ ] [Specific measurable outcome]

**Validation:**
- `[validation command]`

---

### Sprint 2: [Goal/Theme]
[Brief description of what this sprint accomplishes]

#### Task 2.1: [Task Name]
...

[Continue for all sprints and tasks...]
```

**Note:** Do NOT include "Completed Work" or "Implementation Notes" sections. The GitHub Issue is the immutable source of truth for WHAT to build. Progress is tracked locally in progress files.

## Step 4: Present the Draft

Present the spec to the user in conversation and explain what you've planned.

## Step 5: Assess Complexity and Interview (If Needed)

### For Simple/Straightforward Work
If this is a quick fix, minor change, or the scope is very clear and limited:
- Ask the user if the spec looks good or if they have any changes
- If approved, you're done with drafting
- If they have feedback, make the changes and confirm

### For Complex Features
If this is a substantial feature with multiple tasks or architectural decisions, conduct a comprehensive interview.

**Ask all your questions at once (max 10-15 questions).** Cover these areas in a single batch:

1. **Potential Pitfalls / Foot Guns**
   - What could go wrong with this approach?
   - Are there edge cases that might cause issues?
   - Security considerations?
   - Performance implications?

2. **Enhancement Opportunities**
   - Are there practical features that would make this significantly better?
   - Patterns from the codebase that could be leveraged?
   - UX improvements worth considering?

3. **Clarify Intent**
   - Ask about specific behaviors that aren't clear
   - Confirm assumptions you made in the design
   - Understand the user's priorities

4. **MVP vs Future**
   - Which parts are essential for the first version?
   - What can be deferred to future iterations?

**Present your thoughts as questions/suggestions, not demands.** The user decides what's in scope.

If the user responds that they've captured enough or want to move on, skip further iteration and finalize the spec.

## Step 6: Iterate Until Approved

Based on user feedback:

1. **Update the spec draft** with any changes:
   - Adjust scope (MVP vs Future)
   - Add/remove/modify tasks
   - Update context with new decisions
   - Add constraints or considerations surfaced in discussion

2. **Present the updated version** and ask if there's anything else to address

3. **Repeat** until the user confirms the spec is complete

## Step 7: Self-Review

Once the user approves the content, perform a self-review:

### Check Format Conformance
- [ ] Context section with What, Why, Key Decisions, Relevant Files, Dependencies, Constraints
- [ ] Scope section with MVP and Future Enhancements
- [ ] Sprints with numbered sprints and tasks
- [ ] Each task has acceptance criteria with checkboxes
- [ ] Each task has validation commands

### Quality Checks
- [ ] Relevant Files include pattern hints, not just paths
- [ ] No full code blocks (just file references)
- [ ] No procedural instructions
- [ ] Dependencies between tasks/sprints are clear
- [ ] Acceptance criteria are specific and measurable

If issues are found, fix them and confirm with the user.

## Step 8: Create GitHub Issue

Once the spec is approved and reviewed, create a GitHub Issue:

```bash
gh issue create --title "[Feature Name]" --body "[Spec body]" --label "spec"
```

**Important:**
- The `spec` label distinguishes full specs from lightweight issues
- If the "spec" label doesn't exist, create it: `gh label create spec --description "Structured implementation spec" --color "0052CC"`
- Use a HEREDOC to pass the body to ensure correct formatting

Example:
```bash
gh issue create --title "Notification Batching" --body "$(cat <<'EOF'
# Notification Batching

## Context
...
EOF
)"  --label "spec"
```

## Step 9: Finalize

After creating the issue:
1. Report the issue URL and number to the user
2. Remind the user they can run `/implement <issue-number>` to begin execution

---

## Guidelines for Good Specs

### Context Section
- Be specific, not vague
- Include actual file paths the agent will need
- Note patterns to follow (reference existing similar code): "follow the pattern in `contacts-router.ts`"
- State constraints upfront so agent doesn't waste time on invalid approaches
- Reference relevant guides from `docs/guides/` when applicable
- Give breadcrumbs, not full code blocks (code becomes stale)

### Scope Section
- MVP should be the smallest useful version
- Be explicit about what's NOT included to prevent scope creep
- Future enhancements capture good ideas without committing to them now

### Sprints
- Each sprint should result in demoable, working software
- Group related tasks that together form a coherent milestone
- Earlier sprints should unblock later sprints
- A sprint is typically 2-5 tasks (enough to be meaningful, small enough to complete)

### Tasks
- Order by dependency within each sprint
- Each task should be completable in one focused session
- Make acceptance criteria concrete and verifiable
- Don't make tasks too granular (agent can figure out sub-steps)
- Don't make tasks too broad (should be completable without interruption)

### Validation Commands
- Specify how to verify each task is complete
- Common validations: `pnpm check-types`, `pnpm check`, `pnpm test [path]`
- Can also be manual verification: "Verify the button appears on the settings page"
- Validation is task-specific - not every task needs the same checks

### What NOT to Include
- Implementation details the agent can figure out
- Obvious things ("write clean code")
- Tasks that are really just sub-steps of other tasks
- Full code blocks (provide file paths and pattern hints instead)
- Procedural instructions (how to commit, when to run tidy - that's the implement command's job)
- **Time estimates** - No "1-2 weeks", "quick fix", "should take a few hours", etc. Focus on what, not how long.
- **Completed Work / Implementation Notes sections** - These are tracked in local progress files, not in the issue

### Interview Tips
- Ask a comprehensive set of questions all at once (max 10-15 questions)
- Cover all your considerations in one batch rather than iterating one question at a time
- Frame suggestions as options, not requirements - let the user decide what's in scope
- If the user says they've captured enough, move on and finalize
