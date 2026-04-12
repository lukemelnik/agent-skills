---
name: living-spec
description: Interactive spec creation with a live document in a tmux pane. Iteratively interviews the user, fills in decisions/trade-offs/questions in real time, and produces a final implementation spec.
---

# Living Spec

Create specs through conversation, not monologue. A shared markdown document updates in real time as you and the user work through the problem together.

**Input:** $ARGUMENTS — brief description of what to spec out.

## Setup

1. Create `specs/` directory if it doesn't exist.
2. Create the working doc: `specs/YYYY-MM-DD-<slug>.md` using the template below.
3. Open a tmux pane with nvim for the user, targeting the current pane so the split happens in the agent's window:

```bash
tmux split-window -h -t $TMUX_PANE "nvim -c 'set autoread | autocmd FocusGained,CursorHold,CursorHoldI * checktime | set updatetime=1000' specs/YYYY-MM-DD-slug.md"
```

4. Tell the user: "The spec is open in the right pane. You can annotate anytime with a `>` blockquote — save with `:w` and I'll see it. Let's start."

## Working Doc Template

The working template includes permanent sections (survive finalization) and working sections (stripped during cleanup). This means finalization is a light pass — the structure stays the same, implementation sections get added, working sections get removed.

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
- _Known areas we haven't touched_
```

## Phase 1: Discovery

**Goal:** Understand what the user actually needs, not just what they asked for.

Interview the user. Challenge assumptions. Watch for XY problems. Be thorough but not tedious — match depth to complexity.

### Pre-research and draft (before asking anything)

**The agent proposes, the user disposes.** Before the first question, do thorough independent research and draft as many sections as you can. The user should be reacting to proposals, not answering from scratch.

1. **Scan the codebase.** Read schemas, services, config, related code, existing patterns, guides in `docs/guides/`, and any other relevant context. Front-load this investigation so your questions are informed and specific, not exploratory.
2. **Draft the Goal** from what the user asked for. Your best interpretation of the outcome they want.
3. **Draft Non-Goals** by inferring reasonable scope boundaries from context.
4. **Draft Constraints / Invariants** from what you find in the codebase (existing patterns, performance characteristics, compatibility requirements).
5. **Populate Prior Art / Blessed Patterns** with existing solutions, helpers, and patterns that should be reused. Search for similar features already implemented. The goal is "curated collision points" with existing code, not dumping the whole repo.
6. **Pre-populate Not Yet Discussed** with areas you think are relevant. This gives the user a sense of scope and ensures nothing obvious is missed early.

Present your draft to the user with something like: "I've done an initial scan and drafted what I could. Here's where I landed — correct anything that's off, then we'll dig into the open questions."

When you find codebase answers to your own questions, still surface them — e.g. "Q: What email provider are we using? From the codebase: MailerLite, already integrated in `email.service.ts`." This shows your understanding and lets the user correct you if wrong.

### How to interview

After presenting the draft, the interview is about validating, correcting, and filling gaps — not cold-starting from "what's the problem."

- **Validate the draft first.** "Does this Goal capture what you want? Anything in Non-Goals that should be in scope, or vice versa?"
- **Probe for hidden requirements:** "Who uses this? What happens when X fails? How does this interact with Y?"
- **Challenge when appropriate:** "You mentioned X, but have you considered Y? It might solve the underlying problem better."
- **Batch related questions** — 2-3 per exchange is a good pace. Don't overwhelm.
- **Watch for XY problems.** If the user is asking for a mechanism, ask about the outcome they want. The mechanism might not be the right solution.

### What to probe during discovery

Beyond the core feature questions, actively probe for:

- **Constraints / invariants:** "Are there performance budgets? Compatibility requirements? Things we absolutely cannot break?" Populate the Constraints section — don't let these live as tribal knowledge.
- **Failure modes and risks:** "How could this fail in prod? What happens if the process crashes mid-operation? Do we need idempotency, transactions, cleanup?" Populate Risks & Rollback.
- **Scope boundaries:** Push for explicit non-goals early. "What are we deliberately *not* doing? What might someone assume is in scope but isn't?"

### Probe deeply on significant features

**When a feature surfaces during discovery that is non-trivial (new pages, new API endpoints, new user-facing flows), do not accept it at face value.** Treat it as a mini-discovery session within the larger spec. Before marking it as decided:

1. **Map the full surface area.** What does this feature actually consist of? What UI elements, data flows, API changes, state management? List every component, not just the headline.
2. **Challenge the scope.** "You said add search — but what does the full page look like? What data is on it? How does it differ from what already exists? What can you do here that you can't do elsewhere?"
3. **Probe for hidden consequences.** New pages create navigation questions, gating questions, data volume questions, mobile vs. desktop questions. Surface all of these before agreeing to build.
4. **Ask about adjacent features.** "If we're building an All Activity page, should it also show top-performing content? Trends? What about export?" The user may have a larger vision they haven't articulated. Draw it out.
5. **Grill on the "why".** Why does this feature exist as a separate page vs. enhancing what's already there? What user problem does it solve that the existing UI doesn't? If the answer is vague, push harder.
6. **Check for ripple effects.** Does this new feature change how existing features work? Does the dashboard widget need to link differently? Does the navigation structure change? Does this affect both platforms?

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
5. Ask: "I think we've covered everything. Anything else before I stress-test and review?"

## Phase 3: Stress Test

**Self-examine the spec before delegating to the subagent.** The depth should match complexity — don't interrogate a button color change the same way you'd interrogate a new payment flow.

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

If you discover issues, raise them with the user and update the spec (Decisions, Constraints, Risks, etc.) before proceeding.

## Phase 4: Subagent Review

**Gate:** Do not run this phase if any unchecked `- [ ]` items remain in Open Questions or Not Yet Discussed. Resolve all items first.

Delegate a review to a subagent with clean context. This catches blind spots, security issues, and foot guns.

```
subagent({
  agent: "general-purpose",  // or check available agents with subagent
  task: `You are reviewing a feature spec for completeness and risks. Read the spec file at ${specFilePath} and the relevant codebase files it references.

Analyze for:
1. **Security concerns** — auth gaps, input validation, data exposure, webhook verification
2. **Edge cases** — race conditions, empty states, error handling, partial failures
3. **Architectural foot guns** — things that will be painful to change later, hidden coupling
4. **Missing pieces** — anything the spec assumes exists but doesn't, or steps that are underspecified
5. **Contradictions** — decisions that conflict with each other

Return a structured list of findings with severity (critical/warning/note) and specific recommendations. Be concise.`
})
```

When the subagent returns:
1. Add a `## Review Findings` section to the working doc with all findings as unchecked items, grouped by severity (critical first, then warning, then note)
2. Walk through them with the user **a few at a time**, just like discovery — don't dump the full list in conversation
3. As each finding is addressed, check it off in the doc and update the relevant section (Decisions, Architecture, etc.)
4. Do not proceed to finalization until all critical and warning items are checked off. Notes can be deferred.

## Phase 5: Finalization

Clean up the working doc in place — it becomes the final spec. No second file. Git history preserves the working version.

### Consolidation process

The structure mostly stays the same. Finalization is a light pass, not a rewrite:

1. **Strip working sections.** Remove: Open Questions, Not Yet Discussed, Review Findings, and the `---` divider. Their value has been absorbed into the permanent sections above.
2. **Clean up permanent sections.** Remove any remaining placeholder text (e.g. `_Laws of physics..._`). Drop any permanent section that's genuinely empty — not every spec needs Risks & Rollback or Ruled Out.
3. **Add Relevant Files.** Breadcrumbs pointing to existing code the implementer should reference. List **every file** discovered during research that the implementer will need to read or modify. Group by area (API, iOS, web, shared). This saves the implementing agent significant search time.
4. **Add Tasks.** Structured implementation steps with acceptance criteria, ordered by dependency. Group into sprints only if there are natural milestones (don't force sprint structure on small work).
5. **Add Verification.** Specific, testable acceptance criteria for the overall feature.

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

### [Sprint 1: Theme] (only if multiple sprints warranted)

#### Task 1: [Name]
[What needs to happen and why, not step-by-step how]

**Done when:**
- [ ] [Specific, verifiable outcome]
- [ ] [Specific, verifiable outcome]

#### Task 2: [Name]
...

## Risks & Rollback
- **Risk:** [what could go wrong]
- **Rollout:** [how to deploy safely]
- **Rollback:** [how to undo]

## Verification
- [ ] [Specific, testable acceptance criterion]
- [ ] [Specific, testable acceptance criterion]
```

### Final spec principles
- **Breadcrumbs, not blueprints.** Reference files and patterns, not code blocks. Code becomes stale; pointers don't.
- **Say what, not how.** Describe outcomes and constraints. The implementing agent figures out the steps.
- **Right-size.** Match detail to complexity. A 2-task fix doesn't need sprints.
- **Preserve the "why".** Decisions & Trade-offs and Ruled Out stay in the final doc. They prevent implementing agents from second-guessing choices and give future readers the reasoning without archaeology.
- **Verifiable acceptance criteria.** "Works correctly" is not a criterion. "Returns 403 for unauthenticated requests" is.

## Phase 6: Handoff

Offer the user three options:
1. **Launch an implementing agent** — split a pane below the spec and start a new agent session running the `/implement` skill, which carries the full workflow (tasks, gates, commits, push, PR creation):
   ```bash
   # Find the nvim pane showing the spec (it's in our window)
   SPEC_PANE=$(tmux list-panes -t $(tmux display-message -p '#{window_id}') -F '#{pane_id} #{pane_current_command}' | grep nvim | head -1 | awk '{print $1}')
   tmux split-window -v -t $SPEC_PANE "pi \"/implement specs/YYYY-MM-DD-slug.md\""
   ```
   Replace `specs/YYYY-MM-DD-slug.md` with the actual spec path. This puts the implementing agent directly below the spec for easy reference.
2. **Close the spec pane** — kill the nvim pane.
3. **Leave it open** — keep the spec visible for manual reference.
