---
name: spec
description: Create a structured spec for agent-driven implementation
disable-model-invocation: true
---

# Create Spec

> This work deploys to a production system with real users and paying customers. Think defensively. When uncertain, ask.

Create a spec optimized for the `/implement` command to execute. The spec will be stored as a GitHub Issue.

> Do not write specs to files on disk. Draft in conversation, then publish as a GitHub Issue with `gh issue create`.

**Input:** $ARGUMENTS

## Step 1: Research

Before writing anything, gather context:
- Find relevant existing code patterns and files that will be touched
- Look for similar features to reference
- Check `docs/guides/` for relevant integration guides
- For non-trivial work: check git history for related bugs/fixes, consider what commonly goes wrong with this kind of feature

## Step 2: Draft the Spec

Draft in conversation using this structure:

```markdown
# [Feature Name]

## Context

**What:** [1-2 sentences]

**Why:** [1-2 sentences]

**Key Decisions:**
- [Decision and rationale]

**Relevant Files:**
- `path/to/file.ts` - [why it's relevant, what pattern to follow]

**Constraints:**
- [Technical, business, or dependency constraints — only if they exist]

## Scope

**In:** [Core functionality for this implementation]

**Out:** [Explicitly excluded — things that might seem in scope but aren't]

## Tasks

Ordered by dependency. Group into sprints only if there are natural demoable milestones (don't force sprint structure on small work).

### [Sprint 1: Theme] (only if multiple sprints warranted)

#### Task 1: [Name]
[What needs to happen and why, not how to do it]

**Done when:**
- [ ] [Specific, verifiable outcome]
- [ ] [Specific, verifiable outcome]

#### Task 2: [Name]
...
```

### Spec principles

- **Breadcrumbs, not blueprints.** Reference files and patterns ("follow the pattern in `contacts-router.ts`"), never include code blocks. Code becomes stale; pointers don't.
- **Say what, not how.** Describe the desired outcome and constraints. The implementing agent can figure out the steps.
- **Right-size the structure.** A 2-task fix doesn't need sprints. A 15-task feature does. Match the format to the work.
- **Acceptance criteria must be objectively verifiable.** "Works correctly" is not a criterion. "Returns 403 for unauthenticated requests" is.

## Step 3: Stress-Test the Design

After drafting, critically examine the spec before presenting it. The depth of this examination should match the complexity of the work — don't interrogate a button color change the same way you'd interrogate a new payment flow.

**Always consider, regardless of size:**
- Edge cases: empty states, null values, boundary conditions, concurrent access
- Error scenarios: what happens when things fail? Network errors, invalid input, partial failures
- Auth/permissions: who can do this? What happens if someone who shouldn't tries?

**For substantial features, also dig into:**

- **Architecture tradeoffs:** Why this approach over alternatives? What are we trading off? Where could this design paint us into a corner?
- **Hidden coupling:** Does this change affect other features in non-obvious ways? Will it break existing behavior? Are there implicit contracts with other parts of the system?
- **Data integrity:** Race conditions, consistency issues, what happens if the process crashes mid-operation? Do we need transactions, idempotency, or cleanup?
- **Performance at scale:** Does this work fine with 10 records but fall over at 10,000? N+1 queries, unbounded lists, missing indexes?
- **Security surface:** New inputs that could be exploited? Privilege escalation paths? Data exposure?
- **Migration path:** Is there existing data that needs to change? Can we deploy this without downtime? Do we need backwards compatibility during rollout?

Incorporate anything you discover into the spec's Constraints or acceptance criteria. If something surfaces a genuine design question you can't resolve, note it for the user.

## Step 4: Present and Discuss

Present the draft. If you identified design questions, tradeoffs, or risks during the stress test, raise them alongside the draft — not as a formulaic questionnaire, but as genuine concerns:

- Lead with what you think the answer should be and why
- Flag risks you're uncertain about and explain the tradeoff
- Ask about specific behaviors where the right choice isn't obvious from context

Frame concerns proportionally. A small feature might warrant "one thing to flag..." while a complex feature might need a real discussion about architecture.

If the user wants to move on, finalize without further iteration.

## Step 5: Iterate and Publish

Update based on feedback, then create the GitHub Issue:

```bash
gh issue create --title "[Feature Name]" --body "$(cat <<'EOF'
[spec content]
EOF
)" --label "spec"
```

If the "spec" label doesn't exist, create it first: `gh label create spec --description "Structured implementation spec" --color "0052CC"`

Report the issue URL and remind the user they can run `/implement <issue-number>` to begin.
