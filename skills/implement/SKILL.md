---
name: implement
description: Implement a dependency-aware feature spec end to end using adversarial implementation waves, verification fan-out, repair, final gates, review with a bounded fix loop, rebase, and push or PR merge. Use with a specs/ path or GitHub issue number, optionally `auto`.
---

# Implement

Execute a spec from plan to shipped code. The parent owns product judgment, spec truthfulness, integration, commits, PRs, and final claims.

> Production work: respect Non-Goals, Constraints, Decisions, Ruled Out approaches, project instructions, and dependency policy. Ask rather than guess.

**Input:** $ARGUMENTS — a spec path or GitHub issue number, optionally followed by `auto`. Without `auto`, stop for approval before shipping. With `auto`, ship without stopping unless a risk trigger fires (see Finish).

## Initialize

1. Read the entire file, or fetch an open issue with `gh issue view`. Read every Relevant File and named prior-art/test helper.
2. Validate the task graph: stable IDs, dependencies, write boundaries, contracts, proof, ownership, and done conditions. For legacy specs, derive this graph explicitly before dispatch; stop on unsafe ambiguity.
3. Check project instructions and required gates/UI verification.
4. If the spec depends on another spec, confirm that spec is merged into the default branch and rebase onto it before starting; otherwise stop and report the blocker.
5. Reuse the current feature branch or create one when on the default branch. For an issue, name it `<issue-number>-<short-slug>` so review can find the spec. Push the default branch only in the direct-to-main ship step below. Never force-push the default branch.
6. Determine the ship mode from repository instructions: **direct-to-main** when they say to work on and push to the default branch without pull requests; otherwise **PR**.
7. Never install dependencies, alter scope/constraints/decisions, or make a major architecture change without user approval.

## Dependency-wave loop

Execution follows dependencies, not sprint or textual order. Sprints remain human milestones.

### 1. Establish barriers and readiness

Stabilize shared contracts before consumers. Identify every incomplete task whose dependencies are satisfied. A set is wave-safe only when its write boundaries do not overlap and shared/generated/registration/integration files have one declared owner.

Do not stack a new dependency wave on an unverified contract barrier. Tasks that cannot independently reach a coherent boundary belong in one serial lane.

### 2. Dispatch implementation

For two or more safe ready tasks, call `implementation_wave` once with the already dependency-ready wave. For each task provide its ID, description, goal, repository-relative write boundaries, context, proof/stop conditions when useful, and verification mode `deferred`.

For user-facing UI tasks, render the spec's prototype to an image first and give each worker the image path, the project design contract (for example `DESIGN.md`), and the layout rules in words; point workers at the prototype, not at another platform's implementation, as the visual source.

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

Run targeted contract/wave proof, preserving all project-specific UI verification. For UI changes, compare final screenshots side by side with the rendered prototype; layout drift fails verification even when behavior passes. Launch fresh Verify agents after implementation fan-in; they must inspect/run the relevant focused proof without trusting writer reports.

Cluster failures by non-overlapping ownership. Dispatch focused repair agents with the symptom, evidence, boundary, and expected proof, then rerun only failed checks plus affected contract proof. After two repair attempts for the same symptom, stop blind retries and require root-cause diagnosis before more edits.

Advance dependents only after their contract barrier is verified. Repeat until no incomplete task is ready or work is complete. If incomplete tasks remain with none ready, report the dependency/blocker rather than improvising.

## Gates and commits

- Replace blanket per-sprint full gates with targeted task, contract, and wave proof.
- Run the repository's complete required gates once after all waves and integration are green. Preserve project-specific requirements, including `pnpm check` before commits and required web/iOS UI verification.
- Commit only at meaningful integrated green boundaries, never per worker. Workers never stage files; the parent stages explicit paths for each commit and checks `git diff --cached --stat` before committing. Follow the repository commit skill/policy.
- After each commit, back up the feature branch with a normal `git push -u origin <branch>`. Do not rebase until Finish, so backup pushes never need force.
- If final gates fail, use the same fresh verification, ownership clustering, repair, and diagnosis rules; rerun failed checks before the final suite as needed.

## Finish

### 1. Spec walk

Walk every Verification criterion, mark only confirmed checkboxes, and ensure material changes are recorded in the spec or issue.

### 2. Review and fix loop

Run the canonical `review` skill once on the branch with the spec. Then:

1. Fix every `fix` finding (directly or with bounded Code agents) and commit the fixes.
2. Re-check only the fix commits: launch one fresh `ReviewCorrectness` over the fix-commit range with the list of findings they address. It answers only whether each fix resolves its finding and whether the fix introduces a regression; it does not hunt the rest of the branch.
3. A fix that fails the re-check gets one more attempt and re-check. After that, report it as unresolved.

Never run a second full review. Discard `dropped` findings and anything new the re-check raises outside the fix commits.

For each `issue` finding, search existing issues first (`gh issue list --search`) and comment on a duplicate rather than opening another. Without `auto`, list proposed issues at the check-in for approval; with `auto`, create them.

### 3. Prepare to ship

- **Direct-to-main:** `git fetch`, rebase onto `origin/<default>`, then rerun the complete required gates. If a conflict requires choosing between behaviors, stop and report it. Give any conflict resolution you make the same narrow re-check as a fix.
- **PR:** push the branch normally and invoke the canonical PR skill, passing the spec path or issue number (`Closes #N` for issues). Do not rebase locally.

### 4. Check-in

Without `auto`, stop here. Report the outcome, review results, gates, proposed issues, and what shipping will do, then wait for approval.

With `auto`, stop the same way only when a risk trigger fires:
- the diff changes payment, billing, authentication, or permission behavior (moving a check without changing who can do what, with tests proving the same outcomes, is not a change), or touches database migrations or data deletion, secrets or environment configuration, or deploy/infrastructure files
- the diff touches paths that repository instructions mark as requiring sign-off
- a `fix` finding with impact score 8+ remains unresolved

### 5. Ship

- **Direct-to-main:** from the feature branch, `git push origin HEAD:<default>`. If it is rejected because the default branch moved, fetch, rebase, rerun the gates, and retry, up to 3 attempts in total before stopping. Then delete the remote feature branch with `git push origin --delete <branch>`.
- **PR:** `gh pr merge --rebase --auto --delete-branch`. If the branch must be brought up to date, use `gh pr update-branch --rebase`. Only for real conflicts, rebase locally, resolve, rerun gates, and `git push --force-with-lease` the feature branch; this is expected on your own feature branch.
- Never force-push the default branch.

### 6. Report

Report the shipped commit or PR URL, implemented outcome, material spec changes, review and fix-loop results, created issues, verification/gates, and any honest manual verification or blockers. Never claim verification that did not run. For UI changes, include final screenshots of every changed screen (web and/or iOS) in the report.

Before finishing, stop dev servers and shut down simulators this task started unless the user is still using them.
