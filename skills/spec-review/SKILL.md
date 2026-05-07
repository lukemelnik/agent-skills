---
name: spec-review
description: Critically review an implementation spec for format compliance, missing requirements, weak proof obligations, unclear tasks, hidden risks, bad assumptions, and implementation readiness. Use before publishing a spec or when asked to review a spec.
---

# Spec Review

Review a spec as a skeptical implementation-readiness reviewer. Do not implement the spec.

## Dependencies

Before reviewing, read `../spec/SKILL.md`. Treat it as the canonical standard for final spec structure, task/proof format, and publishing expectations.

## Use as a subagent rubric

When another skill delegates to a review agent, send exactly one reviewer this task:

```text
Use the spec-review skill to critically review this implementation spec. Do not implement it.

Inputs:
- Spec draft/path/issue: <provide the draft text, file path, or GitHub issue number>
- Relevant context: <briefly summarize user intent, constraints, and any known code paths>

Before reviewing, read ../spec/SKILL.md and treat it as the canonical standard.

Review for format compliance, implementation readiness, hidden risks, bad assumptions, unresolved questions, contradictions, weak proof obligations, missing gates, and scope creep.

Return findings only. Group by Critical, Warning, and Note. For each finding include:
- Section/task
- Problem
- Why it matters
- Suggested edit

End with: Ready for implementation? yes/no, with a one-sentence reason.
```

If no subagent tool is available, perform the same review yourself and explicitly say it was not independent.

## Review rubric

### Format and completeness

Check that the spec has the canonical shape from `spec` where applicable:
- Goal
- Non-Goals
- Context
- Constraints / Invariants
- Decisions & Trade-offs
- Ruled Out
- Prior Art / Blessed Patterns
- Architecture
- Relevant Files
- Tasks
- Risks & Rollback
- Verification

Missing optional sections are acceptable only when they are genuinely irrelevant. Missing Goal, Constraints for risky work, Tasks, or Verification should usually be a finding.

### Task quality

Every task must be implementation-ready:
- organized under a sprint heading
- outcome-oriented, not vague area ownership
- includes `Risk: low | medium | high`
- includes `Primary proof boundary: none | unit | integration | e2e`
- includes concrete `Required proof`
- includes `Done when` checkboxes with verifiable completion indicators
- has dependencies ordered sensibly

Flag tasks that are too broad, too small to be meaningful, missing proof, or unclear about completion.

### Proof and gates

Check that proof obligations match risk:
- Critical behavior has a credible proof boundary.
- UI behavior includes appropriate smoke/E2E/manual verification expectations when needed.
- Backend/data behavior has unit or integration proof where practical.
- Mechanical tasks explicitly say no behavior proof is required.
- Overall `Verification` covers the actual user outcome, not just internal implementation details.
- Repo gates or final validation expectations are explicit enough for an implementing agent.

### Scope and assumptions

Look for:
- scope creep beyond Non-Goals
- decisions that conflict with tasks or verification
- assumptions not backed by codebase evidence
- missing product decisions
- ambiguous ownership between platforms or layers
- unclear rollout or rollback story
- new dependencies or architecture shifts that are not called out

### Risk review

Probe for missing or weak treatment of:
- auth and authorization
- data integrity, transactions, idempotency, retries, partial failures
- concurrency and ordering issues
- performance at realistic scale
- migration and existing data concerns
- privacy, security, logging, secrets, and user data exposure
- observability, support, and operational rollback

## Output format

Use this format:

```markdown
Spec review: <N critical, M warnings, K notes>

Critical
- **[Section/task]** Problem: ...
  - Why it matters: ...
  - Suggested edit: ...

Warning
- **[Section/task]** Problem: ...
  - Why it matters: ...
  - Suggested edit: ...

Note
- **[Section/task]** Problem: ...
  - Why it matters: ...
  - Suggested edit: ...

Ready for implementation? <yes/no> — <one-sentence reason>
```

Keep findings actionable. Do not rewrite the whole spec unless asked; suggest targeted edits.
