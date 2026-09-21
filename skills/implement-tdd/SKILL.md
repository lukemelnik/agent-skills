---
name: implement-tdd
description: Implement a dependency-aware feature spec with strict red-green-refactor, safely parallelizing ready tasks with scoped verification, then integrate, run final gates, commit, push, and open a PR.
---

# Implement with TDD

Execute the same declarative task graph as `/implement`, but preserve real red-green-refactor for every behavior change. The parent owns product judgment, spec truthfulness, integration, commits, PRs, and final claims.

**Input:** $ARGUMENTS — a spec path or GitHub issue number.

## Initialize

Read the entire spec, Relevant Files, prior art, tests, and project instructions. Fetch issues with `gh issue view`; stop if closed. Validate stable IDs, dependencies, non-overlapping write boundaries, contracts, ownership, proof, and done conditions. Derive missing graph metadata for legacy specs, but stop on unsafe ambiguity.

Reuse or create a non-default feature branch. Respect Non-Goals, Constraints, Decisions, project dependency policy, gates, and UI verification. Ask before scope, contract, architecture, or dependency changes.

## TDD invariants

For each behavior slice:
1. **RED:** add the smallest proof at the task's stated public boundary and run the exact focused command to observe the expected failure.
2. **GREEN:** make the minimum production change and rerun that proof to green.
3. **REFACTOR:** improve structure while repeatedly preserving green.
4. Repeat for the next required-proof behavior; do not bulk-write all tests before implementation.

Prefer realistic app boundaries, mock only true external boundaries, and avoid tests coupled to private implementation. A genuinely mechanical `none` task may skip RED but still needs focused verification. Required proof is part of done.

## Dependency-ready waves

Execution follows dependencies, not textual/sprint order. Stabilize and verify shared contract barriers before consumers.

Find all incomplete tasks whose dependencies are satisfied. For two or more ready tasks with non-overlapping boundaries and stable contracts, call `implementation_wave` with each task's ID, description, goal, repository-relative write boundaries, context, exact focused proof/stop conditions, and verification mode `scoped`. Never use `deferred` for TDD behavior work: each worker must demonstrate its own red-green-refactor cycles and finish with the focused proof green.

If the tool is unavailable, launch equivalent background Code agents in the same turn. Use one bounded agent/direct implementation for a single task. Tasks sharing boundaries or unable to reach coherent proof independently form one serial lane.

Workers own only their bounded production/test work and scoped TDD proof. They do not update the spec/issue, integrate shared files outside their boundary, commit, push, or make product decisions.

## Fan in, verify, and repair

After all writers stop, the parent inspects the actual aggregate diff adversarially: test quality, demonstrated RED evidence, minimal GREEN behavior, contract compatibility, missing wiring, generated/registration ownership, error paths, and done conditions. The declared integration owner or parent performs shared wiring/generators only after writers stop.

Launch fresh Verify agents for targeted contract/wave proof; preserve required UI verification. Cluster failures by non-overlapping ownership and dispatch focused repair agents. Repairs to behavior must themselves use red-green-refactor with exact scoped proof. Rerun failed checks and affected contract proof. After two repair attempts for one symptom, require diagnosis before another retry.

Do not advance a dependent wave across an unverified contract barrier. Repeat until complete; if unfinished tasks exist but none are ready, surface the blocker.

## Gates, truth, and finish

Use targeted proof at task/contract/wave boundaries rather than blanket per-sprint full gates. Run the repository's complete required gates once after integrated work is green, preserving project policies such as `pnpm check` before commits and required UI verification.

The parent marks task/Verification checkboxes only when true and records approved material changes. Commit at meaningful integrated green boundaries, not per worker. Push only the feature branch and invoke the canonical PR skill with the spec path or issue number.

Report the PR, outcome, material spec changes, RED/GREEN proof and final gates, plus any uncompleted manual verification. Never claim a test cycle or verification that was not observed.
