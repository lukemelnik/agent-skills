---
name: implement
description: Implement a dependency-aware feature spec end to end using adversarial implementation waves, verification fan-out, repair, final gates, commits, push, and PR. Use with a specs/ path or GitHub issue number.
---

# Implement

Execute a spec from plan to PR. The parent owns product judgment, spec truthfulness, integration, commits, PRs, and final claims.

> Production work: respect Non-Goals, Constraints, Decisions, Ruled Out approaches, project instructions, and dependency policy. Ask rather than guess.

**Input:** $ARGUMENTS — a spec path or GitHub issue number.

## Initialize

1. Read the entire file, or fetch an open issue with `gh issue view`. Read every Relevant File and named prior-art/test helper.
2. Validate the task graph: stable IDs, dependencies, write boundaries, contracts, proof, ownership, and done conditions. For legacy specs, derive this graph explicitly before dispatch; stop on unsafe ambiguity.
3. Check project instructions and required gates/UI verification.
4. Reuse the current feature branch or create one when on the default branch. Never push the default branch.
5. Never install dependencies, alter scope/constraints/decisions, or make a major architecture change without user approval.

## Dependency-wave loop

Execution follows dependencies, not sprint or textual order. Sprints remain human milestones.

### 1. Establish barriers and readiness

Stabilize shared contracts before consumers. Identify every incomplete task whose dependencies are satisfied. A set is wave-safe only when its write boundaries do not overlap and shared/generated/registration/integration files have one declared owner.

Do not stack a new dependency wave on an unverified contract barrier. Tasks that cannot independently reach a coherent boundary belong in one serial lane.

### 2. Dispatch implementation

For two or more safe ready tasks, call `implementation_wave` once with the already dependency-ready wave. For each task provide its ID, description, goal, repository-relative write boundaries, context, proof/stop conditions when useful, and verification mode `deferred`.

If the tool is unavailable, launch equivalent background Code agents in the same turn. For one task, use one bounded Code agent or implement directly.

Workers own production code and tests only. With deferred verification they do not run gates. They do not update the spec/issue, shared contracts outside their boundary, commits, PRs, or product decisions. Do not duplicate extension mechanics in prompts.

### 3. Fan in and inspect adversarially

Wait for every writer in the wave to stop. Then the parent:
- inspect actual aggregate status and diff, not worker summaries
- verify boundaries, contracts, tests, wiring assumptions, error paths, and done conditions
- look for cross-task contradictions, missing registration, generated drift, unsafe assertions, and hidden scope changes
- have the declared integration owner—or parent—perform shared wiring and generators after writers stop

Update task/issue checkboxes only when the aggregate diff makes them true. Record material approved changes; keep product and scope decisions with the parent/user.

### 4. Verify with fresh eyes

Run targeted contract/wave proof, preserving all project-specific UI verification. Launch fresh Verify agents after implementation fan-in; they must inspect/run the relevant focused proof without trusting writer reports.

Cluster failures by non-overlapping ownership. Dispatch focused repair agents with the symptom, evidence, boundary, and expected proof, then rerun only failed checks plus affected contract proof. After two repair attempts for the same symptom, stop blind retries and require root-cause diagnosis before more edits.

Advance dependents only after their contract barrier is verified. Repeat until no incomplete task is ready or work is complete. If incomplete tasks remain with none ready, report the dependency/blocker rather than improvising.

## Gates and commits

- Replace blanket per-sprint full gates with targeted task, contract, and wave proof.
- Run the repository's complete required gates once after all waves and integration are green. Preserve project-specific requirements, including `pnpm check` before commits and required web/iOS UI verification.
- Commit only at meaningful integrated green boundaries, never per worker. Follow the repository commit skill/policy.
- If final gates fail, use the same fresh verification, ownership clustering, repair, and diagnosis rules; rerun failed checks before the final suite as needed.

## Finish

Walk every Verification criterion, mark only confirmed checkboxes, and ensure material changes are recorded. Push the non-default branch and invoke the canonical PR skill, passing the spec path or issue number (`Closes #N` for issues).

Report the PR URL, implemented outcome, material spec changes, verification/gates, and any honest manual verification or blockers. Never claim verification that did not run.
