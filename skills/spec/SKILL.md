---
name: spec
description: Create a structured GitHub Issue spec for dependency-aware agent implementation. Use when planning implementation work before /implement or /implement-tdd.
---

# Create Spec

Create a declarative, implementation-ready spec. This skill owns the canonical final structure and publishing rules. Publish as a GitHub Issue by default; write `specs/*.md` only when explicitly requested.

> This work may deploy to real users. Think defensively. Ask about genuine product decisions; answer codebase questions yourself.

**Input:** $ARGUMENTS

## Research

Inspect relevant code, tests, project guidance, similar features, and—when useful—history. Identify contracts, generated/registration files, integration points, failure modes, and project-specific gates before drafting.

## Canonical format

```markdown
# [Feature Name]

## Goal
[Outcome]

## Non-Goals
- [Explicit exclusion]

## Context
**What:** ...
**Why:** ...

## Constraints / Invariants
- [Non-negotiable boundary]

## Decisions & Trade-offs
- [Decision] — [rationale]

## Ruled Out
- [Rejected approach] — [reason]

## Prior Art / Blessed Patterns
- `path` — [pattern to reuse]

## Architecture
[Solution shape, data flow, stable contracts, shared integration points]

## Relevant Files
- `path` — [why relevant]

## Tasks

### Sprint 1: [Human milestone]

#### Task TASK-ID: [Name]
[Outcome and why]

**Depends on:** [TASK-ID, ... | none]
**Write boundary:** [`repo/relative/path/**`, ...]
**Produces:** [contract or integration point | none]
**Consumes:** [contract or integration point | none]
**Shared/generated ownership:** [owned files/integration step | none]
**Risk:** [low | medium | high]
**Primary proof boundary:** [none | unit | integration | e2e]

**Required proof:**
- [Runnable behavior proof, or "Mechanical change; no behavior proof required"]

**Done when:**
- [ ] [Specific verifiable outcome]

## Risks & Rollback
- **Risk:** ...
- **Rollout:** ...
- **Rollback:** ...

## Verification
- [ ] [User outcome or repository acceptance criterion]
```

## Task graph rules

- Give every task a stable ID and explicit `Depends on`, including `none`.
- Dependency readiness—not textual or sprint order—controls execution. Sprints are optional human milestones, not orchestration barriers.
- Choose repository-relative write boundaries narrow enough to reveal safe concurrency. Dependency-ready tasks must not overlap boundaries.
- Declare produced/consumed contracts and shared integration points. Stabilize shared contracts before dependent work.
- Assign exactly one owner for every shared, generated, registration, and final integration file. Other tasks consume that owner's result rather than editing the same surface.
- Combine tasks that cannot independently reach a coherent, provable boundary, or model them as one explicit serial dependency lane.
- Ensure each task's primary proof can run when the task becomes ready. If proof requires a successor, combine the work or declare that successor dependency and integration ownership.
- Do not add redundant `Can run in parallel with` lists; readiness follows from dependencies, contracts, and boundaries.

## Quality rules

- Write breadcrumbs, not implementation code; say what and why, not step-by-step how.
- Keep acceptance criteria objective and one canonical proof boundary per behavior.
- Preserve project-specific gates and required UI verification in `Verification`.
- Flag dependencies, migrations, architecture shifts, rollout, permissions, data integrity, concurrency, and failure handling when relevant.
- Require user approval for new external dependencies.

Stress-test the draft, incorporate resolved risks, then use `../spec-review/SKILL.md` for independent review. Apply mechanical fixes; discuss scope, product, dependency, constraint, or architecture changes.

## Publish

Create the `spec` label if needed and publish with `gh issue create --body-file`; avoid shell-quoting large Markdown. For explicitly requested local output, write `specs/YYYY-MM-DD-<slug>.md` instead.

Report the URL/path and suggest `/implement <issue-or-path>` or `/implement-tdd <issue-or-path>`.
