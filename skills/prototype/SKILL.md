---
name: prototype
description: Build a throwaway prototype to answer an uncertain product, state, data-model, logic, or UI question before committing to a design. Use when the user asks to prototype, sanity-check a model, try UI variants, test a state machine, or when a spec/planning decision is too uncertain to resolve by discussion alone.
---

# Prototype

A prototype is throwaway code that answers one explicit question. The question determines the shape.

Do not prototype by default. Propose a prototype only when discussion would otherwise produce guesses, and ask the user before creating one.

## Pick the branch

Choose the smallest branch that answers the uncertainty:

- **State/logic:** Use an interactive in-memory driver for workflows, state machines, reducers, algorithms, or business rules.
- **Data model:** Use in-memory records, sample operations, and example queries to test whether entities and relationships represent the domain cleanly.
- **UI:** Use several radically different variants in real app context, switchable by URL state or an equivalent project-native mechanism.

If the branch is ambiguous, ask. If the user is unavailable, state the assumption and pick the branch closest to the touched code: backend/domain module → state or data model; page/component → UI.

## Rules

- **Ask first.** Before writing prototype code, state the question, proposed branch, artifact location, and run command; get confirmation.
- **Throwaway from day one.** Name files/routes with `prototype` and keep them easy to delete.
- **One command to run.** Use the existing project runtime/task runner. If adding a script would pollute the repo, document a direct command in `NOTES.md` instead.
- **No new dependencies without approval.** Use existing tools unless the user explicitly approves an install.
- **No production data.** Use in-memory data, fixtures, stubs, local scratch files, or a clearly disposable scratch DB.
- **No persistence by default.** Persist only when persistence is the question being tested.
- **Skip production polish.** No tests, abstractions, or comprehensive error handling unless needed to answer the question.
- **Surface the state.** Print or render the relevant state after every action or variant switch.
- **Capture the answer.** Keep only the conclusion: decision, rationale, and cleanup/fold-in plan.

## State/logic prototype

Use when the question is about transitions, actions, rules, algorithms, or API/domain behavior.

Shape:
1. Write the question at the top of the prototype or in `NOTES.md`.
2. Isolate the real logic in a small portable module: reducer, state machine, pure functions, or a tiny stateful class.
3. Build the thinnest possible interactive shell around it.
4. After each action, render current state, allowed next actions, invalid actions if useful, and event history.
5. Let the user drive edge cases and add actions as the question evolves.

The interactive shell is disposable. The pure logic may be lifted into production only after being rewritten/reviewed under normal standards.

## Data-model prototype

Use when the question is whether records, relationships, snapshots, ownership, history, or query paths can represent the domain.

Shape:
1. Write the modeling question explicitly.
2. Define in-memory "tables" or records using plain objects/structs.
3. Seed realistic examples, including edge cases.
4. Add operations that mimic real flows: create, link, merge, transfer, revoke, snapshot, query, or delete.
5. Print records before/after each operation and include the queries the real app would need.

Good outputs are decisions like: "this needs a separate identity table", "status should be derived", or "snapshot belongs on the event, not the current entity".

## UI prototype

Use when the question is what a screen, flow, component, or information hierarchy should look or feel like.

Shape:
1. Prefer mounting variants inside the existing route/page so real navigation, chrome, density, auth, and data context remain visible.
2. Create 3 radically different variants by default; cap at 5.
3. Switch variants with URL state (`?variant=`) or the closest project-native equivalent.
4. Add a clearly non-production switcher for cycling variants.
5. Keep variants structurally different: layout, hierarchy, affordances, and flow — not just color/copy tweaks.
6. Gate or name prototype UI so it cannot be mistaken for production.

When a direction wins, delete losing variants and fold the chosen direction into real code under normal standards.

## During spec-builder

If a planning decision is too uncertain, `spec-builder` may propose a prototype spike. The user must confirm before code is written.

When the prototype answers the question, update the working spec:
- Move the resolved answer into `Decisions & Trade-offs`, `Architecture`, `Risks & Rollback`, or `Prior Art / Blessed Patterns`.
- Remove or check off the related `Open Questions` / `Not Yet Discussed` item.
- If prototype cleanup or fold-in is part of implementation, add a task or done-when item.
- Record the prototype as prior art only if the implementer should inspect it; otherwise capture only the decision.

## Finish

Before stopping, report:
- Question answered.
- What the prototype showed.
- Decision or remaining uncertainty.
- Files/routes created.
- How to run it.
- Cleanup/fold-in recommendation.
