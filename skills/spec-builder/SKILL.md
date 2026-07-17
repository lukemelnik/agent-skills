---
name: spec-builder
description: Build an implementation-ready dependency-aware spec through an interactive live document. Use for collaborative feature planning with open questions before /implement or /implement-tdd.
---

# Spec Builder

Build a live working document, then transform it into the canonical final spec.

## Dependencies

Read:
- `../spec/SKILL.md` for final structure, task graph, proof, and publishing rules.
- `../planterview/SKILL.md` for discovery and stress-testing.
- `../spec-review/SKILL.md` before publishing.

Read `../prototype/SKILL.md` only for a user-approved uncertainty spike. Do not duplicate those skills' mechanics here.

## Setup

Create `${TMPDIR:-/tmp}/spec-builder/YYYY-MM-DD-<slug>.md`, unless the user explicitly requests `specs/YYYY-MM-DD-<slug>.md`. Open it in a tmux split when available and invite `>` blockquote annotations.

Use the canonical sections from `spec` plus these working-only sections:

```markdown
---
## Open Questions
- [ ] ...
## Not Yet Discussed
- [ ] ...
## Review Findings
- [ ] ...
```

## Operating loop

Before each response, read the document, process new annotations, remove handled annotations, and incorporate decisions. After each exchange, update resolved decisions, open questions, and risks with targeted edits. Answer codebase-discoverable questions yourself and ask one consequential product question at a time.

## Phases

1. **Discovery:** Research first; draft goal, non-goals, constraints, prior art, likely contracts, and integration points. Use `planterview` to explore consequential branches.
2. **Optional prototype:** If discussion cannot resolve a material uncertainty, state the exact question and artifact, get approval, then follow `../prototype/SKILL.md`.
3. **Completeness:** Resolve or explicitly defer every working checkbox. Confirm permanent sections are substantive.
4. **Stress-test:** Challenge assumptions and record findings. Resolve, accept, or explicitly defer critical/warning findings.
5. **Execution planning:** Re-read `../spec/SKILL.md`. Create stable task IDs and a declarative dependency graph. For every task specify `Depends on`, repository-relative write boundary, produced/consumed contracts or integration points, shared/generated ownership, risk, proof boundary, runnable required proof, and done conditions.
6. **Graph validation:** Ensure dependency-ready tasks have non-overlapping write boundaries; shared/generated/registration files have one owner; contracts are stable before consumers; integration ownership is explicit; and no task needs an undeclared successor to become coherent or prove itself. Combine inseparable work or make it one serial lane. Keep sprints only as useful human milestones.
7. **Independent review:** Follow `../spec-review/SKILL.md`; discuss findings that change product intent, scope, constraints, dependencies, or architecture.
8. **Finalization:** Remove working-only sections, placeholders, and empty sections. Ensure the final document matches `spec`, then follow its publishing rules.

Preserve project-specific gates and UI verification in final `Verification`; do not encode agent orchestration in the spec.
