---
name: review-spec
description: Review a spec for completeness, clarity, and format conformance
disable-model-invocation: true
---

# Review Spec

You are reviewing a spec as if you were a senior engineer ensuring it's ready for implementation. Be thorough and constructive.

**Spec:** $ARGUMENTS

This can be:
- A GitHub issue number (e.g., `42` or `#42`)
- A file path (e.g., `docs/specs/feature.md`)
- Raw spec content (passed directly)

## Step 1: Fetch the Spec

### If Input is an Issue Number
Fetch the spec from GitHub:

```bash
gh issue view <num> --json title,body
```

Parse the response to get the spec content from the `body` field.

### If Input is a File Path
Read the spec file directly.

### If Input is Raw Content
Use the content as-is.

## Step 2: Read the Spec

Read the entire spec carefully. Understand:
- The overall goal and context
- The sprint structure
- All tasks and acceptance criteria
- Any constraints or dependencies

## Step 3: Check Format Conformance

Verify the spec follows the standard structure:

### Required Sections
- [ ] **Context** with What, Why, Key Decisions, Relevant Files, Dependencies, Constraints
- [ ] **Scope** with MVP and Future Enhancements
- [ ] **Sprints** with numbered sprints and tasks

### Sprint/Task Structure
- [ ] Sprints have clear goals/themes
- [ ] Tasks are numbered within sprints (1.1, 1.2, 2.1, etc.)
- [ ] Each task has acceptance criteria with checkboxes
- [ ] Each task has validation commands

### Quality Checks
- [ ] Relevant Files include pattern hints, not just paths
- [ ] No full code blocks (just file references)
- [ ] No procedural instructions (how to commit, when to run tidy)
- [ ] Dependencies between tasks/sprints are clear
- [ ] No "Completed Work" or "Implementation Notes" sections (these go in progress files)

## Step 4: Review for Completeness

### Acceptance Criteria
For each task, check:
- Are criteria specific and measurable?
- Can you objectively verify each criterion is met?
- Are there obvious criteria missing?
- Are criteria testable?

### Edge Cases
Consider what's missing:
- Error handling scenarios
- Empty/null states
- Boundary conditions
- Permission/authorization cases
- Concurrent access issues
- Mobile/responsive considerations (if UI)

### Dependencies
- Are all prerequisites identified?
- Are there hidden dependencies between tasks?
- Is the sprint order logical?

## Step 5: Review for Clarity

### Ambiguous Requirements
Flag anything that could be interpreted multiple ways:
- Vague acceptance criteria ("should work well")
- Unclear scope ("handle errors appropriately")
- Missing specifics ("update the UI")

### Assumptions
Identify assumptions that should be explicit:
- Technology choices not stated
- Behavior in edge cases
- Integration points with existing code

## Step 6: Report Findings

Create a structured report:

### ✅ What's Good
- [List strengths of the spec]

### 🔴 Critical Issues
Issues that must be fixed before implementation:
- [Missing acceptance criteria that would block verification]
- [Ambiguous requirements that could lead to wrong implementation]
- [Missing dependencies that would cause blockers]

### 🟡 Suggestions
Improvements that would make the spec better:
- [Missing edge cases to consider]
- [Clarifications that would help]
- [Better task breakdown]

### 🟢 Minor Notes
Small improvements, optional:
- [Format tweaks]
- [Wording improvements]

## Step 7: Offer to Fix

After presenting findings, ask the user:

"Would you like me to update the spec with these improvements?"

If yes and the spec is from a GitHub issue:
1. Fix all critical issues
2. Apply suggestions the user agrees with
3. Update the issue body:
   ```bash
   gh issue edit <num> --body "$(cat <<'EOF'
   [Updated spec content]
   EOF
   )"
   ```
4. Show what changed

If yes and the spec is a file:
1. Fix all critical issues
2. Apply suggestions the user agrees with
3. Save the updated spec
4. Show what changed


Now read the spec and begin the review.
