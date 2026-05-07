---
name: spec
description: Create a structured GitHub Issue spec for agent-driven implementation. Use when planning implementation work before /implement or /implement-tdd.
---

# Create Spec

Create a spec optimized for `/implement` and `/implement-tdd` to execute. This skill owns the canonical final spec structure, task/proof format, and publishing rules. Default to publishing the final spec as a GitHub Issue. Only write a local `specs/*.md` file when the user explicitly asks for a local spec.

> This work may deploy to real users. Think defensively. When uncertain, ask.

**Input:** $ARGUMENTS

## Step 1: Research

Before writing, gather enough context to make the spec actionable:
- Find relevant existing code patterns and files that will be touched.
- Look for similar features to reference.
- Check project docs/guides when relevant.
- For non-trivial work, check git history for related bugs/fixes and common failure modes.
- Answer codebase-discoverable questions yourself; use the user for product intent and tradeoffs.

## Step 2: Draft the spec

Draft in conversation using this canonical implementation-ready structure:

```markdown
# [Feature Name]

## Goal
[1-2 sentences. What outcome are we producing?]

## Non-Goals
- [Explicitly out of scope]

## Context
**What:** [1-2 sentences]
**Why:** [1-2 sentences]

## Constraints / Invariants
- [Non-negotiable technical, product, safety, compatibility, or dependency boundaries]

## Decisions & Trade-offs
- [Decision] — [rationale, especially when alternatives were considered]

## Ruled Out
- [Rejected approach] — [why rejected]

## Prior Art / Blessed Patterns
- `path/to/file.ts` — [what pattern to follow or reuse]

## Architecture
[Solution shape, data flow, schemas, key patterns]

## Relevant Files
- `path/to/file.ts` — [why relevant: what to read, what to modify]

## Tasks

### Sprint 1: [Theme]

#### Task 1: [Name]
[What needs to happen and why, not step-by-step how]

**Risk:** [low | medium | high]
**Primary proof boundary:** [none | unit | integration | e2e]

**Required proof:**
- [Behavior that must be demonstrated, or "Mechanical change; no behavior proof required"]

**Done when:**
- [ ] [Specific, verifiable outcome]

#### Task 2: [Name]
...

## Risks & Rollback
- **Risk:** [what could go wrong]
- **Rollout:** [how to deploy safely]
- **Rollback:** [how to undo]

## Verification
- [ ] [Specific, testable acceptance criterion]
```

### Spec principles

- **Breadcrumbs, not blueprints.** Reference files and patterns, never include code blocks for implementation.
- **Say what, not how.** Describe outcomes, constraints, and proof obligations.
- **Always use sprints.** Small work can live entirely inside `Sprint 1`.
- **Preserve the why.** Decisions & Trade-offs and Ruled Out prevent re-litigation later.
- **Prefer one canonical proof boundary per behavior.** Duplicate deep coverage only when transport-specific behavior matters.
- **Acceptance criteria must be objectively verifiable.** "Works correctly" is not a criterion.
- **Flag dependency additions explicitly.** Treat new external dependencies as requiring user approval.

## Step 3: Stress-test the design

After drafting, critically examine the spec before presenting it. Match depth to risk.

Always consider:
- Edge cases: empty states, null values, boundary conditions, concurrent access.
- Error scenarios: network errors, invalid input, partial failures.
- Auth/permissions: who can do this and what happens if someone who should not tries.

For substantial work, also examine:
- Architecture tradeoffs and hidden coupling.
- Data integrity, transactions, idempotency, crash recovery, and cleanup.
- Performance at scale: N+1 queries, unbounded lists, missing indexes.
- Security surface: new inputs, privilege escalation paths, data exposure.
- Migration path: existing data, downtime, backwards compatibility.
- Dependency surface: whether existing code/libraries are enough.

Incorporate resolved risks into Constraints, Tasks, Risks & Rollback, or Verification. If a genuine design question remains, raise it with a recommendation.

## Step 4: Present and discuss

Present the draft and any real design concerns. Be proportional: a small fix may need one note; a payment or auth flow may need a real tradeoff discussion.

If the user wants to move on, finalize without unnecessary iteration.

## Step 5: Independent spec review

Before publishing, use `../spec-review/SKILL.md` to review the draft.

Prefer delegating exactly one subagent with the `spec-review` rubric so the review is independent. If no subagent tool is available, run the rubric yourself and say it was not independent.

Apply straightforward fixes directly. Discuss findings that change scope, constraints, product decisions, dependencies, or architecture before changing the spec.

## Step 6: Publish

Update based on feedback and review findings, then publish as a GitHub Issue by default:

```bash
gh label create spec --description "Structured implementation spec" --color "0052CC" 2>/dev/null || true
gh issue create --title "[Feature Name]" --body-file /tmp/spec-body.md --label "spec"
```

Use a temp file for the body instead of shell-quoting large markdown.

If the user explicitly asked for a local spec, write `specs/YYYY-MM-DD-<slug>.md` instead and do not create a GitHub Issue.

Report the issue URL or local spec path, then tell the user they can run `/implement <issue-number>` or `/implement-tdd <issue-number>` to begin.
