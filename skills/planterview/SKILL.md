---
name: planterview
description: Interview the user relentlessly about a plan, design, product idea, or implementation approach until there is shared understanding. Use when the user wants to be questioned, stress-test a plan, clarify a design, resolve tradeoffs, or says "planterview".
---

# Planterview

Interview the user about a plan or design until the important branches of the decision tree are understood and resolved.

## Core rules

- Ask one consequential question at a time.
- Provide your recommended answer with each consequential question.
- Resolve dependencies between decisions before opening unrelated branches.
- If codebase exploration can answer a question, inspect the codebase instead of asking.
- Use the user for intent, priorities, judgment, and tradeoffs — not facts available in the repo.
- Challenge assumptions, especially when the requested mechanism may not match the desired outcome.
- Keep pressing until the shared understanding is specific enough to act on.

## Workflow

### 1. Orient

Restate the plan in 1-3 sentences. If the plan touches a codebase, scan relevant files, docs, schemas, services, tests, and prior patterns before asking questions.

When useful, draft your current understanding first so the user can correct it instead of starting from a blank page.

### 2. Walk the decision tree

For each branch:
1. Explain why this branch matters.
2. Ask one question.
3. Give your recommended answer and rationale.
4. Wait for the user.
5. Interpret the answer into a resolved decision, open question, deferred/non-goal, or new branch.
6. Decide the next question based on the remaining decision tree.

Do not batch several consequential questions together. Batch only trivial clarifications.

When another workflow is maintaining a document, provide a compact state update after each answer: resolved decision, section it belongs in, any new open question, and the next question to ask.

### 3. Probe the plan

Actively check:
- Goal: what outcome is actually desired?
- Non-goals: what might someone assume is included but is not?
- Constraints: performance, compatibility, safety, legal, data, or deployment boundaries.
- Users and permissions: who can do this, and who must not be able to?
- Failure modes: what happens when calls fail, data is missing, work is interrupted, or retries occur?
- Data integrity: transactions, idempotency, race conditions, partial writes, cleanup.
- Architecture: existing patterns to reuse, hidden coupling, new dependencies, migration path.
- Rollout: observability, safe deploy, rollback, support impact.

### 4. Drill significant features

For non-trivial features, do not accept a one-sentence description. Map the full surface area:
- UI states, data flows, API changes, persistence, background work, and permissions.
- Empty, loading, error, disabled, and edge states.
- Navigation, notifications, logging, analytics, and documentation if relevant.
- Existing features affected by the change.
- Adjacent features the user may be implicitly imagining.

Ask why this should exist as proposed rather than as a simpler change to an existing flow. If the answer is vague, keep drilling.

### 5. Stress-test

Before concluding, examine:
- Edge cases and boundary values.
- Error scenarios and recovery.
- Auth and authorization gaps.
- Performance at realistic scale.
- Security and privacy surface.
- Existing data and migration needs.
- Dependency additions or architectural shifts.

Surface real concerns with a recommendation. Do not invent theoretical risks just to sound thorough.

### 6. Conclude

End with a concise summary:
- Resolved decisions.
- Remaining open questions, if any.
- Risks or tradeoffs the user accepted.
- Recommended next step.
