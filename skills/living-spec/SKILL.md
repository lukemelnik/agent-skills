---
name: living-spec
description: Interactive spec creation with a live document in a tmux pane. Iteratively interviews the user, fills in decisions/trade-offs/questions in real time, and produces a final implementation spec.
---

# Living Spec

Create specs through conversation, not monologue. A shared markdown document updates in real time as you and the user work through the problem together.

**Input:** $ARGUMENTS — brief description of what to spec out.

Right-size the process. If the requested change is truly trivial and a spec would add more friction than clarity, say so and let the user choose whether to skip `/living-spec`. If they still want one, produce a single-sprint spec.

## Setup

1. Create `specs/` directory if it doesn't exist.
2. Create the working doc: `specs/YYYY-MM-DD-<slug>.md` using the template below.
3. Open a tmux pane with nvim for the user, targeting the current pane so the split happens in the agent's window:

```bash
tmux split-window -h -t $TMUX_PANE "nvim -c 'set autoread | autocmd FocusGained,CursorHold,CursorHoldI * checktime | set updatetime=1000' specs/YYYY-MM-DD-slug.md"
```

4. Tell the user: "The spec is open in the right pane. You can annotate anytime with a `>` blockquote — save with `:w` and I'll see it. Let's start."

## Working Doc Template

The working template includes permanent sections (survive finalization) and working sections (stripped during cleanup). Finalization should still be a light pass — the structure stays mostly the same, implementation-planning sections (`Relevant Files`, `Tasks`, `Verification`) are added after discovery. `Changes During Implementation` is optional and only appears later if the plan materially changes.

```markdown
# [Feature Name]

## Goal
_1-2 sentences. What outcome are we producing? (Not the mechanism.)_

## Non-Goals
_Explicitly out of scope. The "helpful creativity kill-switch." Prevents the implementing agent from expanding scope with "helpful" additions._

## Context
_Problem background and why now._

## Constraints / Invariants
_Laws of physics for this change: performance budgets, safety properties, compatibility requirements, forbidden actions. These are non-negotiable — the implementing agent must treat them as hard boundaries._

## Decisions & Trade-offs
_Confirmed choices. Include rationale where the "why" matters — especially when alternatives were seriously considered. This prevents implementing agents from second-guessing choices during review, and gives future readers the reasoning without archaeology._

## Ruled Out
_Rejected approaches and why. Keeps reviewers and implementing agents from re-suggesting dead ends._

## Prior Art / Blessed Patterns
_Existing code to reuse. Patterns to follow. Things NOT to reinvent. "Cite the prior art you're copying. Do not add new abstractions unless you justify them."_

## Architecture
_Emerging shape of the solution._

## Risks & Rollback
_How could this fail in prod? What do we watch? How do we deploy safely? How do we undo it?_

---

## Open Questions
- [ ] _Unresolved items needing input_

## Not Yet Discussed
- [ ] _Known areas we haven't touched_
```

## Phase 1: Discovery

**Goal:** Understand what the user actually needs, not just what they asked for.

Interview the user. Challenge assumptions. Watch for XY problems. Be thorough but not tedious — match depth to complexity. Resolve one consequential branch at a time.

### Pre-research and draft (before asking anything)

**The agent proposes, the user disposes.** Before the first question, do thorough independent research and draft as many sections as you can. The user should be reacting to proposals, not answering from scratch.

1. **Scan the codebase.** Read schemas, services, config, related code, existing patterns, guides in `docs/guides/`, and any other relevant context. Front-load this investigation so your questions are informed and specific, not exploratory.
2. **Draft the Goal** from what the user asked for. Your best interpretation of the outcome they want.
3. **Draft Non-Goals** by inferring reasonable scope boundaries from context.
4. **Draft Constraints / Invariants** from what you find in the codebase (existing patterns, performance characteristics, compatibility requirements).
5. **Populate Prior Art / Blessed Patterns** with existing solutions, helpers, and patterns that should be reused. Search for similar features already implemented. The goal is "curated collision points" with existing code, not dumping the whole repo.
6. **Pre-populate Not Yet Discussed** with areas you think are relevant. This gives the user a sense of scope and ensures nothing obvious is missed early.
7. **Answer codebase-discoverable questions yourself first.** If the codebase can answer a question, research it instead of asking the user.

Present your draft to the user with something like: "I've done an initial scan and drafted what I could. Here's where I landed — correct anything that's off, then we'll dig into the open questions."

When you find codebase answers to your own questions, still surface them — e.g. "Q: What email provider are we using? From the codebase: MailerLite, already integrated in `email.service.ts`." This shows your understanding and lets the user correct you if wrong.

### How to interview

After presenting the draft, the interview is about validating, correcting, and filling gaps — not cold-starting from "what's the problem."

- **Validate the draft first.** "Does this Goal capture what you want? Anything in Non-Goals that should be in scope, or vice versa?"
- **Ask one consequential question at a time.** Resolve that branch before opening another. Batch only trivial clarifications.
- **Provide a recommended answer with each consequential question.** Tell the user what you think the default should be and why.
- **If the codebase can answer it, research instead of asking.** Use the user for intent, priorities, and judgment — not for facts already in the repo.
- **Probe for hidden requirements:** "Who uses this? What happens when X fails? How does this interact with Y?"
- **Challenge when appropriate:** "You mentioned X, but have you considered Y? It might solve the underlying problem better."
- **Watch for XY problems.** If the user is asking for a mechanism, ask about the outcome they want. The mechanism might not be the right solution.

### What to probe during discovery

Beyond the core feature questions, actively probe for:

- **Constraints / invariants:** "Are there performance budgets? Compatibility requirements? Things we absolutely cannot break?" Populate the Constraints section — don't let these live as tribal knowledge.
- **Failure modes and risks:** "How could this fail in prod? What happens if the process crashes mid-operation? Do we need idempotency, transactions, cleanup?" Populate Risks & Rollback.
- **Scope boundaries:** Push for explicit non-goals early. "What are we deliberately *not* doing? What might someone assume is in scope but isn't?"
- **Architecture / dependency surface:** Is this extending an existing pattern or introducing a meaningful architectural shift? Does it imply a new external dependency or service? Flag both early instead of hiding them in implementation details.

### Probe deeply on significant features

**When a feature surfaces during discovery that is non-trivial (new pages, new API endpoints, new user-facing flows), do not accept it at face value.** Treat it as a mini-discovery session within the larger spec. Before marking it as decided:

1. **Map the full surface area.** What does this feature actually consist of? What UI elements, data flows, API changes, state management? List every component, not just the headline.
2. **Challenge the scope.** "You said add search — but what does the full page look like? What data is on it? How does it differ from what already exists? What can you do here that you can't do elsewhere?"
3. **Probe for hidden consequences.** New pages create navigation questions, gating questions, data volume questions, mobile vs. desktop questions. Surface all of these before agreeing to build.
4. **Ask about adjacent features.** "If we're building an All Activity page, should it also show top-performing content? Trends? What about export?" The user may have a larger vision they haven't articulated. Draw it out.
5. **Grill on the "why".** Why does this feature exist as a separate page vs. enhancing what's already there? What user problem does it solve that the existing UI doesn't? If the answer is vague, push harder.
6. **Check for ripple effects.** Does this new feature change how existing features work? Does the dashboard widget need to link differently? Does the navigation structure change? Does this affect both platforms?
7. **Name architectural shifts explicitly.** If the proposal implies a major architectural change, call that out as a first-class decision rather than letting it slip into implementation.

**The goal is to leave no room for "oh, we also need X" later.** A feature that gets one sentence in conversation should get a full section in the spec with every detail resolved before implementation begins. Never rush to check off a big item — the cost of under-specifying a major feature far exceeds the cost of spending extra time in discovery.

### Updating the doc during discovery

After each exchange, update the spec file with what you learned:
- Move answered items from Open Questions / Not Yet Discussed into the appropriate permanent section (Decisions & Trade-offs, Ruled Out, Constraints, etc.)
- **When recording a decision, capture the rationale inline if alternatives were considered.** Format: `- [Decision] — [why this over the alternative]`. This is the moment to preserve the "why" — if you don't capture it now, it's gone.
- Add new Open Questions as they surface
- Keep the Not Yet Discussed list honest — add things you realize are missing

Use `edit` for targeted updates. Never rewrite the whole file.

**Working sections (Open Questions, Not Yet Discussed) use checkboxes `- [ ]` / `- [x]`.** Ruled Out uses plain list items with rationale (items there are final by nature). When an item is resolved, check it off and note the outcome inline (e.g. `- [x] Unsubscribe flow → moved to Decisions`). Do not use strikethrough for resolved items.

### Annotations

The user may add `>` blockquote annotations anywhere in the spec file. **Read the spec file before every response** during discovery — both to refresh your understanding and to check for new annotations. When you see an annotation:
1. Address it in conversation
2. Remove the annotation and incorporate the result into the appropriate section

## Phase 2: Completeness Check

When the user signals they're done, or all checkboxes are checked and you have no more questions:

1. Read the full spec file
2. Scan Not Yet Discussed — ask about anything that matters
3. Scan for unchecked Open Questions — resolve or explicitly defer
4. Check that Goal, Non-Goals, and Constraints are filled in — these are easy to skip during discovery but critical for implementation
5. Ask: "I think we've covered everything. Anything else before I stress-test and plan the execution?"

## Phase 3: Stress Test

**Self-examine the spec before the review pass.** The depth should match complexity — don't interrogate a button color change the same way you'd interrogate a new payment flow.

**Always consider, regardless of size:**
- Edge cases: empty states, null values, boundary conditions, concurrent access
- Error scenarios: what happens when things fail? Network errors, invalid input, partial failures
- Auth/permissions: who can do this? What happens if someone who shouldn't tries?

**For substantial features, also examine:**
- **Architecture tradeoffs:** Why this approach over alternatives? What are we trading off? Where could this design paint us into a corner?
- **Hidden coupling:** Does this change affect other features in non-obvious ways? Will it break existing behavior? Are there implicit contracts with other parts of the system?
- **Data integrity:** Race conditions, consistency issues, what happens if the process crashes mid-operation? Do we need transactions, idempotency, or cleanup?
- **Performance at scale:** Does this work fine with 10 records but fall over at 10,000? N+1 queries, unbounded lists, missing indexes?
- **Security surface:** New inputs that could be exploited? Privilege escalation paths? Data exposure?
- **Migration path:** Is there existing data that needs to change? Can we deploy this without downtime? Do we need backwards compatibility during rollout?
- **Dependency surface:** Can this be done with existing code and libraries? If a new external dependency seems required, flag it explicitly and treat user approval as unresolved — never assume installation.

If you discover issues, raise them with the user and update the spec (Decisions, Constraints, Risks, etc.) before proceeding.

## Phase 4: Execution Planning

**Goal:** Turn the discovered design into an implementation-ready plan.

The spec should define the work and what must be proven, not the execution style. TDD, code-first implementation, and orchestration belong to the implementation skill, not this spec.

1. **Complete Relevant Files.** Add every file the implementer is likely to read or modify, including test helpers, factories, and reference implementations when they matter.
2. **Create Tasks organized into sprints.** Always include sprint headings. Even the smallest spec gets `Sprint 1`.
3. **Break the work into dependency-ordered tasks.** Each task should produce a meaningful outcome, not just a vague area of effort.
4. **For each task, include:**
   - A short outcome-oriented description
   - `**Risk:** low | medium | high`
   - `**Primary proof boundary:** none | unit | integration | e2e`
   - `**Required proof:**` bullets describing what behavior must be demonstrated. If the task is purely mechanical, say so explicitly.
   - `**Done when:**` checkboxes with specific, verifiable outcomes
5. **Prefer one canonical proof boundary per behavior.** Do not duplicate deep proof requirements across multiple transports unless transport-specific behavior itself matters.
6. **Flag major architectural changes explicitly.** If the plan implies a meaningful architectural shift, capture it in Decisions & Trade-offs and Risks before finalizing.
7. **Flag dependency additions explicitly.** If the plan appears to require a new external dependency, call it out and treat explicit user approval as required.
8. **Add Verification.** Capture the overall acceptance criteria for the feature, separate from per-task proof.
9. **Walk the plan with the user.** Tighten any ambiguous tasks, proof obligations, or sprint boundaries before review.

## Phase 5: Manual Review

**Gate:** Do not run this phase if any unchecked `- [ ]` items remain in Open Questions or Not Yet Discussed. Resolve all items first.

Review the spec yourself in the current conversation. **Do not use a subagent for this phase unless the user explicitly asks for one.** The point is to do a direct completeness/risk pass as part of `/living-spec`, not to silently turn it into `/review`.

Run a structured pass over the spec and referenced code, looking for:
1. **Security concerns** — auth gaps, input validation, data exposure
2. **Edge cases** — race conditions, empty states, error handling, partial failures
3. **Architectural foot guns** — hidden coupling, painful-to-change decisions, accidental one-offs
4. **Task-plan gaps** — missing tasks, unclear dependencies, insufficient proof obligations, weak acceptance criteria
5. **Contradictions** — decisions that conflict with each other
6. **Major architecture / dependency implications** — hidden architectural shifts or new external dependencies the spec implies but does not acknowledge

When you find issues:
1. Add a `## Review Findings` section to the working doc with findings as unchecked items, grouped by severity (critical first, then warning, then note)
2. Walk through them with the user **a few at a time**, just like discovery — don't dump the full list in conversation
3. As each finding is addressed, check it off in the doc and update the relevant section (Decisions, Architecture, Tasks, etc.)
4. Do not proceed to finalization until all critical and warning items are checked off. Notes can be deferred.

If the user asks for a lighter pass, summarize only the highest-value findings instead of exhaustively enumerating everything.

## Phase 6: Finalization

Clean up the working doc in place — it becomes the final spec. No second file. Git history preserves the working version.

### Consolidation process

The structure mostly stays the same. Finalization is a light pass, not a rewrite:

1. **Strip working sections.** Remove: Open Questions, Not Yet Discussed, Review Findings, and the `---` divider. Their value has been absorbed into the permanent sections above.
2. **Clean up permanent sections.** Remove any remaining placeholder text (e.g. `_Laws of physics..._`). Drop any permanent section that's genuinely empty — not every spec needs Risks & Rollback or Ruled Out.
3. **Ensure Relevant Files is complete.** Breadcrumbs pointing to existing code the implementer should reference. List **every file** discovered during research that the implementer will need to read or modify. Group by area (API, iOS, web, shared). This saves the implementing agent significant search time.
4. **Ensure Tasks are sprint-based and implementation-ready.** Every task should live under a sprint heading and include risk, primary proof boundary, required proof, and done-when criteria.
5. **Ensure Verification is specific.** Add specific, testable acceptance criteria for the overall feature.
6. **Do not add empty maintenance sections.** `Changes During Implementation` should only appear later if implementation materially changes the plan.

### Final doc structure

```markdown
# [Feature Name]

## Goal
_1-2 sentences._

## Non-Goals
- _What we're explicitly not doing_

## Context
**What:** [1-2 sentences]
**Why:** [1-2 sentences]

## Constraints / Invariants
- _Non-negotiable boundaries_

## Decisions & Trade-offs
- [Decision] — [rationale where the "why" matters]

## Ruled Out
- [Approach] — [why rejected]

## Prior Art / Blessed Patterns
- `path/to/file.ts` — [what pattern to follow, what to reuse]

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
- [Behavior that must be demonstrated]
- [Behavior that must be demonstrated]

**Done when:**
- [ ] [Specific, verifiable outcome]
- [ ] [Specific, verifiable outcome]

#### Task 2: [Name]
...

### Sprint 2: [Theme] (add only if needed)
...

## Risks & Rollback
- **Risk:** [what could go wrong]
- **Rollout:** [how to deploy safely]
- **Rollback:** [how to undo]

## Verification
- [ ] [Specific, testable acceptance criterion]
- [ ] [Specific, testable acceptance criterion]

## Changes During Implementation
_Optional. Add only if implementation materially changes the plan._
- [Change] — [what changed and why]
```

### Final spec principles
- **Breadcrumbs, not blueprints.** Reference files and patterns, not code blocks. Code becomes stale; pointers don't.
- **Define the work, not the execution style.** The spec should state outcomes, constraints, and proof obligations. TDD, code-first execution, and orchestration belong to implementation skills.
- **Always use sprints.** Small work can live entirely inside `Sprint 1`.
- **Prefer a canonical proof boundary per behavior.** Duplicate deep coverage across multiple transports only when transport behavior itself matters.
- **Preserve the "why".** Decisions & Trade-offs and Ruled Out stay in the final doc. They prevent implementing agents from second-guessing choices and give future readers the reasoning without archaeology.
- **Verifiable acceptance criteria.** "Works correctly" is not a criterion. "Returns 403 for unauthenticated requests" is.

### Maintaining the spec during implementation

The final spec is still a living document. If implementation materially changes the plan:

1. **Update the affected sprint/task/verification sections** so the main body reflects current truth.
2. **Add `Changes During Implementation`** with a concise bullet explaining what changed and why.
3. **If scope, non-goals, decisions, or constraints change, confirm with the user first.**
4. **Flag major architectural changes explicitly.** Do not bury them in a task note.
5. **Never install a new external dependency without explicit user consent.** If implementation uncovers that need, surface it as a blocker or approval request.

## Phase 7: Handoff

Offer the user three options:
1. **Launch an implementing agent** — split a pane below the spec and start a new agent session with the implementation skill the user wants. If they don't specify one, default to `/implement`. Example:
   ```bash
   # Find the nvim pane showing the spec (it's in our window)
   SPEC_PANE=$(tmux list-panes -t $(tmux display-message -p '#{window_id}') -F '#{pane_id} #{pane_current_command}' | grep nvim | head -1 | awk '{print $1}')
   tmux split-window -v -t $SPEC_PANE "pi \"/implement specs/YYYY-MM-DD-slug.md\""
   ```
   Replace `specs/YYYY-MM-DD-slug.md` with the actual spec path. This puts the implementing agent directly below the spec for easy reference.
2. **Close the spec pane** — kill the nvim pane.
3. **Leave it open** — keep the spec visible for manual reference.
