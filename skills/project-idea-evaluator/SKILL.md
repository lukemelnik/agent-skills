---
name: project-idea-evaluator
description: "Run a structured multi-phase project idea assessment from optimistic exploration to hard-nosed business evaluation. Use when discussing startup/product/project ideas, deciding whether to build or park an idea, stress-testing distribution and monetization early, assessing founder-dependence vs sellability, and producing a project-ideas/*.md record with viability rating and pursue/pilot/park decision gate."
---

# Project Idea Evaluator

Run a phase-gated process that separates creative exploration from critical business realism.

Default behavior: start in conversation, then write a final record in `project-ideas/` when the user approves.

## Process Rules

- Keep **Phase 1 optimistic**. Do not score or reject in that phase.
- Add **realist pressure early** in Phase 1B and beyond.
- Treat every phase as a gate. At the end of each phase, ask:
  - `Ready to move to Phase <N>? (yes / revise / stop)`
- Distinguish clearly between:
  - **Evidence** (source-backed facts or observed data)
  - **Assumptions** (untested beliefs)
- Ask for concrete numbers/ranges whenever possible (price, conversion, audience size, effort).
- If key answers stay vague, mark as a **critical unknown** and lower confidence.
- If a phase is skipped, reduce confidence in the final assessment.
- Do not present a final viability rating before Phase 4.

## Phase 0 — Kickoff Context + Business Intent

Collect baseline context:

1. Working title
2. Problem being solved
3. Target user(s)
4. Why this idea matters to the founder
5. Founder constraints (time, budget, skill, risk tolerance)
6. 90-day success target

Collect mandatory business-intent context:

1. Venture type: `Standalone business` | `Personal-brand product` | `Hybrid`
2. Goal: `Cashflow lifestyle` | `Scale + team` | `Build to sell` | `Unsure`
3. Founder Dependency Index (FDI, 0–5)
   - 0 = independent of founder identity/audience
   - 5 = fully dependent on founder identity/audience
4. Sellability importance: high / medium / low
5. Monetization thesis (required):
   - who pays
   - what they pay for
   - when they pay
   - why they do not just use free substitutes

Output:

- short idea brief
- explicit assumptions list
- explicit unknowns list

Then ask to continue.

## Phase 1 — Optimistic Exploration

Expand the idea without judgment.

Cover:

- Core user experience
- Feature possibilities
- Delight factors / differentiation opportunities
- Delivery formats (product + content + services, if relevant)
- Best-case outcome narrative

Output: concise “Vision Draft” containing:

- One-sentence concept
- Who it is for
- Why it could be exciting
- Candidate MVP slice

Then ask to continue.

## Phase 1B — Reality Gate (Red-Team)

Challenge the idea early. Require concrete justification.

Required prompts:

1. First paying customer profile (specific)
2. First paid offer and initial price point
3. Why now (timing trigger)
4. Why this wins vs incumbent + free alternatives
5. How first 10 paying customers arrive (channel + conversion assumptions)
6. **30-day kill criteria (what result makes us pause/pivot)**
7. **Primary acquisition channel + fallback channel (with trigger)**

Rules:

- If answers are vague, flag `critical unknown`.
- If monetization path or acquisition path is unclear after this phase, cap decision at `Pilot first`.

Then ask to continue.

## Phase 2 — Market Reality Scan

Ground the idea in market reality.

Use web research when available. If browsing/search is unavailable, state limitations and continue with clearly labeled assumptions.

Build a practical market map:

- Direct competitors (minimum 3 when available)
- Adjacent substitutes (minimum 3 when available)
- Pricing, positioning, strengths, weaknesses
- Signs of demand (reviews, communities, search intent, user complaints)
- Willingness-to-pay signals (if available)

Output:

- competitor/substitute table
- “already solved?” summary
- whitespace opportunities
- likely distribution constraints

Then ask to continue.

## Phase 3 — Wedge Test (Better / Cheaper / Different)

Define a credible strategic wedge.

Require one primary wedge:

- Better: stronger outcomes/quality
- Cheaper: lower cost/time-to-value
- Different: sharper niche, distribution model, or community advantage

Output:

- wedge statement in one sentence
- why this wedge can win for a specific segment
- what incumbents/free options still do better
- risks that could invalidate the wedge

If no credible wedge is found, flag weak differentiation.

Then ask to continue.

## Phase 4 — Viability Scorecard

Read `references/scorecard.md` and apply it.

For each dimension:

- assign a 1–5 score
- cite evidence
- calculate weighted contribution

Output:

- weighted viability score (0–100)
- confidence level (low/medium/high)
- top unknowns that most affect score
- red flags / hard blockers
- hard-gate pass/fail summary

Then ask to continue.

## Phase 5 — Validation Plan

Turn uncertainty into tests.

Create 2–4 low-cost experiments.

Requirements:

- include at least one **monetization** test
- include at least one **acquisition/distribution** test
- include pass/fail criteria and follow-up decision

Each experiment must include:

- assumption being tested
- test method
- time and cost
- pass/fail criteria
- what decision changes based on the result

Output: ranked experiment plan by learning value per unit effort.

Then ask to continue.

## Phase 6 — Decision Gate + Record

Read `references/project-idea-template.md` and produce the final document.

Decision options:

- `Pursue now`
- `Pilot first`
- `Park`

Always include:

- viability rating at top
- confidence level
- business archetype + goal + sellability intent
- founder dependency index + sellability implications
- key risks and unknowns
- time breakdown across:
  - build
  - content
  - distribution/promotion
  - ongoing support/operations
- explicit next actions (7-day and 30-day)

Write to:

- `project-ideas/<slug>.md`

If the file already exists, update it in place and add a new “Last Updated” date.

## Output Style

- Be concise and direct.
- Use tables for scorecards, market maps, and experiment plans.
- Push for realism: challenge vague claims and ask for justification.
- Prefer disconfirming evidence over optimistic assumptions.
- Avoid fake precision. If data quality is weak, lower confidence.
- Call out hard blockers explicitly (no acquisition path, no willingness to pay, legal/licensing blockers, unsustainable founder dependence).
