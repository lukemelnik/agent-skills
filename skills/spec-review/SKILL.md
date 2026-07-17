---
name: spec-review
description: Critically review a dependency-aware implementation spec for graph safety, format compliance, proof quality, hidden risks, assumptions, and implementation readiness. Use before publishing or when asked to review a spec.
---

# Spec Review

Review skeptically; do not implement. Read `../spec/SKILL.md` first and treat it as canonical.

## Independent reviewer prompt

Delegate to exactly one reviewer when possible:

```text
Use the spec-review skill to review this spec; do not implement it.
Inputs: <draft/path/issue> and <brief intent/context>.
Read ../spec/SKILL.md first. Return actionable findings grouped Critical, Warning, Note, then "Ready for implementation? yes/no".
```

If delegation is unavailable, apply the same rubric and disclose that review was not independent.

## Rubric

### Canonical shape

Check applicable Goal, Non-Goals, Context, Constraints / Invariants, Decisions & Trade-offs, Ruled Out, Prior Art, Architecture, Relevant Files, Tasks, Risks & Rollback, and Verification. Missing optional sections are acceptable only when irrelevant.

### Task graph

Reject implementation readiness when any task lacks:
- stable ID and explicit `Depends on`
- repository-relative write boundary
- produced/consumed contracts or shared integration points
- ownership declaration for shared/generated/registration work
- risk, primary proof boundary, runnable required proof, and verifiable done conditions

Also reject:
- missing or cyclic dependencies
- dependency-ready tasks with overlapping write boundaries
- unstable or implicit contracts consumed by parallel work
- shared/generated/registration files without exactly one owner
- missing final integration or wiring ownership
- proof that cannot run until an undeclared successor
- tasks that cannot reach a coherent boundary independently and were not combined or declared as one serial lane

Sprints may group human milestones, but textual or sprint order must not override dependency readiness. Do not require redundant parallel-task lists.

### Proof and gates

Ensure proof matches risk and tests observable behavior at the stated boundary. Require UI smoke/E2E/manual verification when appropriate, realistic backend/data proof where practical, explicit mechanical-proof exemptions, project-specific gates, and final acceptance criteria covering the user outcome.

### Scope, assumptions, and risk

Find contradictions, scope creep, unsupported assumptions, missing product decisions, ambiguous layer ownership, undeclared dependencies or architecture shifts, and weak rollout/rollback. Probe auth, privacy, security, data integrity, transactions, idempotency, retries, concurrency, performance, migration, observability, and partial failure when relevant.

## Output

```markdown
Spec review: <N critical, M warnings, K notes>

Critical
- **[Section/task]** Problem: ...
  - Why it matters: ...
  - Suggested edit: ...

Warning
- ...

Note
- ...

Ready for implementation? <yes/no> — <reason>
```

Keep findings targeted; do not rewrite the spec unless asked.
