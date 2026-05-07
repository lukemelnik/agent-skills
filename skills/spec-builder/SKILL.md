---
name: spec-builder
description: Build an implementation-ready spec through an interactive live document. Use when the user wants to collaboratively plan a feature, keep an intermediate working spec with open questions, or produce a finalized spec for /implement or /implement-tdd.
---

# Spec Builder

Create a spec through a live working document, then transform that working document into a finalized implementation spec.

## Dependencies

Before starting, read:
- `../spec/SKILL.md` for the canonical final spec structure, task/proof format, and publishing rules.
- `../planterview/SKILL.md` for discovery, interview, and stress-test behavior.
- `../spec-review/SKILL.md` for independent review before publishing.

`spec-builder` owns the live working document and the cleanup/finalization process. `spec` owns the final spec format. `planterview` owns the questioning style. `spec-review` owns the independent review rubric.

## Input

`$ARGUMENTS` — brief description of what to spec out.

Right-size the process. If the requested change is truly trivial and a spec would add more friction than clarity, say so and let the user choose whether to continue. If they still want a spec, produce a compact single-sprint spec.

## Setup

1. Create a working directory: `${TMPDIR:-/tmp}/spec-builder/`.
2. Create the working doc: `${TMPDIR:-/tmp}/spec-builder/YYYY-MM-DD-<slug>.md`.
   - If the user explicitly requests a local spec from the start, use `specs/YYYY-MM-DD-<slug>.md` instead.
3. Open the working doc in a tmux split targeting the current pane:

```bash
WORKING_SPEC="${TMPDIR:-/tmp}/spec-builder/YYYY-MM-DD-slug.md"
tmux split-window -h -t "$TMUX_PANE" "nvim -c 'set autoread | autocmd FocusGained,CursorHold,CursorHoldI * checktime | set updatetime=1000' '$WORKING_SPEC'"
```

4. Tell the user: "The working spec is open in the right pane. You can annotate anytime with a `>` blockquote — save with `:w` and I'll see it. By default I'll publish the final spec as a GitHub Issue. Let's start."

## Working document

The working document is intentionally not the final spec. It contains final-spec sections plus working-only sections that are removed during finalization.

Start with the final sections from `spec`, but only fill what is known. During early discovery, it is fine for `Relevant Files`, `Tasks`, and `Verification` to be absent or placeholders; add them during execution planning.

Always include these working-only sections while planning:

```markdown
---

## Open Questions
- [ ] _Unresolved decisions needing input_

## Not Yet Discussed
- [ ] _Important areas that still need discovery_

## Review Findings
- [ ] _Issues found during stress-test/manual review, grouped by severity when useful_
```

Use checkboxes only in working sections. Permanent final sections like `Ruled Out` and `Decisions & Trade-offs` use plain bullets with rationale.

## Operating loop

Before every response during discovery:
1. Read the working doc.
2. Check for new `>` blockquote annotations.
3. Address annotations in conversation.
4. Remove handled annotations and incorporate the result into the appropriate section.

After each exchange:
1. Update the working doc with resolved decisions, new questions, and discovered risks.
2. Move answered items out of `Open Questions` / `Not Yet Discussed` into permanent sections.
3. Keep the working sections honest; add newly discovered branches instead of relying on memory.

Use targeted edits. Do not rewrite the whole working doc unless it is still tiny and no user annotations could be lost.

## Phase 1: Discovery

Use `planterview` for the interview behavior.

Before asking the first question:
- Research the codebase enough to ask informed questions.
- Draft the goal, likely non-goals, constraints, and prior art from available context.
- Pre-populate `Not Yet Discussed` with areas likely to matter.
- Answer codebase-discoverable questions yourself.

Then validate the draft with the user and walk the decision tree one consequential question at a time.

## Phase 2: Completeness check

When the user signals they are done, or when you think discovery is complete:
1. Read the full working doc.
2. Resolve or explicitly defer every unchecked item in `Open Questions`.
3. Resolve or explicitly mark not-applicable every unchecked item in `Not Yet Discussed`.
4. Confirm the permanent sections have enough substance for implementation.
5. Ask: "I think we've covered the important branches. Anything else before I stress-test this and turn it into an execution plan?"

Do not proceed to final planning while consequential working-section checkboxes remain unresolved.

## Phase 3: Stress-test

Use `planterview`'s stress-test checklist in the current conversation. This is still part of discovery: challenge assumptions, inspect code where needed, and identify risks before turning the plan into tasks.

Add stress-test concerns to `Review Findings` as unchecked items. Walk through critical and warning findings with the user, a few at a time. Update permanent sections as findings are resolved.

Do not proceed to execution planning until critical and warning findings are resolved, accepted, or explicitly deferred.

## Phase 4: Execution planning

Read `../spec/SKILL.md` again before planning.

Using the canonical format from `spec`:
- Complete `Relevant Files` with every file the implementer should read or modify.
- Add sprint-based `Tasks`.
- For each task, include risk, primary proof boundary, required proof, and done-when checkboxes.
- Add specific `Verification` acceptance criteria.
- Flag dependency additions and architectural shifts explicitly.

Walk the plan with the user and tighten ambiguous tasks or proof obligations.

## Phase 5: Independent spec review

Before finalization, use `../spec-review/SKILL.md` to review the implementation-ready working draft.

Prefer delegating exactly one subagent with the `spec-review` rubric so the review is independent. If no subagent tool is available, run the rubric yourself and say it was not independent.

Add review findings to `Review Findings`. Apply straightforward fixes directly. Discuss findings that change scope, constraints, product decisions, dependencies, or architecture before changing the spec.

Do not finalize until critical and warning review findings are resolved, accepted, or explicitly deferred.

## Phase 6: Finalization

Transform the working doc into the final spec:
1. Remove working-only sections: `Open Questions`, `Not Yet Discussed`, `Review Findings`, and the `---` divider.
2. Remove placeholder text and empty sections.
3. Ensure the final structure matches `spec`.
4. Ensure tasks are sprint-based and implementation-ready.
5. Ensure verification criteria are specific and testable.

Publish by following `spec`'s rules: GitHub Issue by default, local `specs/*.md` only when the user explicitly asked for local output.

Report the issue URL or local spec path, then tell the user they can run `/implement <issue-number-or-spec-path>` or `/implement-tdd <issue-number-or-spec-path>`.
