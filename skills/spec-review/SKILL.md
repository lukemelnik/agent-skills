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

### Canonical shape and task graph

Check the draft against the canonical format and task graph rules in `../spec/SKILL.md`. Missing optional sections are acceptable only when irrelevant. Reject implementation readiness when any task lacks a required field or violates a graph rule there, and also reject:
- missing or cyclic dependencies
- unstable or implicit contracts consumed by parallel work
- missing final integration or wiring ownership

### Proof and gates

Ensure proof matches risk and tests observable behavior at the stated boundary. Require UI smoke/E2E/manual verification when appropriate, realistic backend/data proof where practical, explicit mechanical-proof exemptions, project-specific gates, and final acceptance criteria covering the user outcome.

### Scope, assumptions, and risk

Find contradictions, scope creep, unsupported assumptions, missing product decisions, ambiguous layer ownership, undeclared dependencies or architecture shifts, and weak rollout/rollback. Probe risks that apply (security, data integrity, concurrency, migration, partial failure).

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
