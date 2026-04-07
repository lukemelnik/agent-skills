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

```markdown
# [Feature Name]

## Context
_What problem are we solving and why?_

## Decisions
_Confirmed choices._

## Open Questions
- [ ] _Unresolved items needing input_

## Trade-offs
- [ ] _Identified tensions — check off once weighed_

## Ruled Out
_Rejected approaches and why._

## Not Yet Discussed
- _Known areas we haven't touched_

## Architecture
_Emerging shape of the solution._
```

## Phase 1: Discovery

**Goal:** Understand what the user actually needs, not just what they asked for.

Interview the user. Challenge assumptions. Watch for XY problems. Be thorough but not tedious — match depth to complexity.

### Initial scan

Before asking the first question, do a quick codebase scan relevant to the topic. Pre-populate the Not Yet Discussed section with areas you think are relevant. This gives the user a sense of scope and ensures nothing obvious is missed early.

### Research and self-answer

Formulate your questions first, then search the codebase (schema, services, config, related code) for answers. When you find an answer, still surface the question along with your finding — e.g. "Q: What email provider are we using? From the codebase: MailerLite, already integrated in `email.service.ts`." This shows your understanding and lets the user correct you if your interpretation is wrong. Only leave questions unanswered when the codebase genuinely can't answer them.

**Do thorough independent research before asking the user anything.** Read subscription models, plan structures, feature flags, existing gating patterns, API schemas, and related code *before* formulating questions. The user should never have to correct you on facts that are discoverable in the codebase. Front-load your investigation so your questions are informed and specific, not exploratory.

### How to interview

- Start broad: "What's the core problem? What does success look like?"
- Probe for hidden requirements: "Who uses this? What happens when X fails? How does this interact with Y?"
- Challenge when appropriate: "You mentioned X, but have you considered Y? It might solve the underlying problem better."
- Batch related questions — 2-3 per exchange is a good pace. Don't overwhelm.
- Identify the objective early: is this a marketing goal, a technical fix, a UX improvement? The objective shapes every subsequent decision.

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
- Move answered items from Open Questions / Not Yet Discussed → Decisions (or Ruled Out)
- Check off resolved Trade-offs
- Add new Open Questions or Trade-offs as they surface
- Keep the Not Yet Discussed list honest — add things you realize are missing

Use `edit` for targeted updates. Never rewrite the whole file.

**All sections use checkboxes `- [ ]` / `- [x]` consistently**, except Ruled Out (items there are final by nature — use plain list items with rationale). When an item is resolved, check it off and note the outcome inline (e.g. `- [x] Unsubscribe flow → moved to Decisions`). Do not use strikethrough for resolved items.

### Annotations

The user may add `>` blockquote annotations anywhere in the spec file. **Read the spec file before every response** during discovery — both to refresh your understanding and to check for new annotations. When you see an annotation:
1. Address it in conversation
2. Remove the annotation and incorporate the result into the appropriate section

## Phase 2: Completeness Check

When the user signals they're done, or all checkboxes are checked and you have no more questions:

1. Read the full spec file
2. Scan Not Yet Discussed — ask about anything that matters
3. Scan for unchecked Trade-offs — resolve or explicitly defer
4. Ask: "I think we've covered everything. Anything else before I finalize?"

## Phase 3: Subagent Review

**Gate:** Do not run this phase if any unchecked `- [ ]` items remain in Open Questions, Trade-offs, or Not Yet Discussed. Resolve all items first.

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

## Phase 4: Finalization

Clean up the working doc in place — it becomes the final spec. No second file. Git history preserves the working version.

### Consolidation process

1. **Fold essential context into Decisions.** Any trade-off or open question whose resolution adds important rationale should be merged into the Decisions section as "Decision — reason why." Not every resolved item needs rationale — only where the *why* matters for implementation or future understanding.
2. **Strip working sections.** Remove: Open Questions, Trade-offs, Ruled Out, Not Yet Discussed, Review Findings. Their value has been absorbed into Decisions and Architecture.
3. **Add implementation steps.** Concrete checklist for the implementing agent. Ordered by dependency.
4. **Add relevant files.** Breadcrumbs pointing to existing code the implementer should reference.
5. **Add verification.** How to confirm it works — specific, testable criteria.

### Final doc structure

```markdown
# [Feature Name]

## Context
**What:** [1-2 sentences]
**Why:** [1-2 sentences]

## Decisions
- [Decision] — [rationale where it adds value]

## Architecture
[Solution shape, data flow, schemas, key patterns]

## Relevant Files
- `path/to/file.ts` — [why relevant: what to read, what to modify, what pattern to follow]

_List **every file** discovered during research that the implementer will need to read or modify. Group by area (API, iOS, web, shared). This saves the implementing agent significant search time — all the file discovery happened during spec creation, so encode that knowledge here._

## Implementation Steps
- [ ] Step 1
- [ ] Step 2

## Quality Checks
- [ ] Linting passes with no new warnings/errors
- [ ] Formatting passes
- [ ] Type checking passes (if applicable)
- [ ] Tests pass (existing + new)
- [ ] New functionality has test coverage for critical paths
- [ ] Migrations generate cleanly (if schema changes)

## Verification
- [ ] [Specific, testable acceptance criterion]
```

### Final spec principles
- **Breadcrumbs, not blueprints.** Reference files and patterns, not code blocks.
- **Say what, not how.** Describe outcomes and constraints. The implementing agent figures out steps.
- **Right-size.** Match detail to complexity.
- **Verifiable acceptance criteria.** "Works correctly" is not a criterion. "Returns 403 for unauthenticated requests" is.

## Phase 5: Handoff

Offer the user three options:
1. **Launch an implementing agent** — split a pane below the spec and start a new agent session to implement it. Use:
   ```bash
   # Find the nvim pane showing the spec (it's in our window)
   SPEC_PANE=$(tmux list-panes -t $(tmux display-message -p '#{window_id}') -F '#{pane_id} #{pane_current_command}' | grep nvim | head -1 | awk '{print $1}')
   tmux split-window -v -t $SPEC_PANE "pi \"implement the spec at specs/YYYY-MM-DD-slug.md\""
   ```
   This puts the implementing agent directly below the spec for easy reference.
2. **Close the spec pane** — kill the nvim pane.
3. **Leave it open** — keep the spec visible for manual reference.
