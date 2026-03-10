# Viability Scorecard

Use this rubric in Phase 4.

## Weights

Total possible points: 100.

| Dimension | Weight | What to evaluate |
|---|---:|---|
| Problem pain & urgency | 10 | Is this a meaningful, urgent problem for a specific user? |
| Audience clarity & reachability | 10 | Is the target audience clear, and can you realistically reach them? |
| Differentiation / wedge strength | 8 | Is there a credible better/cheaper/different wedge? |
| Distribution feasibility | 20 | Is there a plausible, repeatable path to acquire users? |
| Monetization clarity | 20 | Is willingness to pay credible with a clear offer/price model? |
| Build feasibility | 8 | Can MVP be built within realistic time/skill constraints? |
| Content + operations burden | 8 | Is recurring content/support workload sustainable? |
| Legal / licensing / platform risk | 4 | Are there blocking compliance, IP, or platform risks? |
| Founder fit & sustained energy | 4 | Is this aligned with founder strengths and long-term motivation? |
| Business independence & transferability | 8 | Can value survive beyond founder identity and be sold/transferred later? |

## Scoring Scale (1–5)

- **1** = very weak / major concern
- **2** = weak / significant risk
- **3** = mixed / uncertain
- **4** = strong / manageable risk
- **5** = very strong / clear advantage

For each dimension:

1. Assign `score` (1–5)
2. Compute `weighted_points = weight * (score / 5)`
3. Add all weighted points and round to nearest integer for total viability score (0–100)

## Confidence Rating

- **High**: most dimensions supported by concrete evidence (market data, pricing, user signals), few critical unknowns
- **Medium**: mix of evidence and assumptions, at least one critical unknown remains
- **Low**: mostly assumptions, limited market evidence, or multiple unresolved unknowns

If confidence is low, do not upgrade decision quality based on score alone.

## Hard Gates (Required for `Pursue now`)

A score alone is not enough. To qualify for `Pursue now`, all of these must pass:

1. Total score >= 75
2. Confidence is medium or high
3. Distribution feasibility score >= 4
4. Monetization clarity score >= 4
5. No hard blocker present
6. If sellability importance is high: Business independence & transferability score >= 3

If any hard gate fails, decision cannot be `Pursue now`.

## Decision Thresholds

- **Pursue now**: pass all hard gates
- **Pilot first**: score 55–74, or score >= 75 with any hard-gate failure that is testable/fixable
- **Park**: score < 55, or clear hard blocker regardless of score

## Red Flags / Hard Blockers

Any of these should force `Pilot first` or `Park`:

- No realistic distribution channel
- No credible willingness to pay
- Legal/licensing constraints likely to block launch
- Founder time demand exceeds realistic availability
- Core assumption cannot be tested cheaply or quickly

## Business Independence & Transferability Guidance

Use founder dependence and sellability goals to score this dimension:

- **1**: Fully founder-dependent; cannot transfer without founder presence
- **2**: Mostly founder-dependent; transfer would lose most value
- **3**: Mixed; some transferable systems/assets exist
- **4**: Largely transferable; founder adds value but is not core dependency
- **5**: Highly transferable; value mostly independent of founder identity

## Time Burden Breakdown (Required in Final Output)

Estimate effort in four buckets:

1. Build MVP (initial)
2. Content production (initial + ongoing)
3. Distribution/promotion (weekly recurring)
4. Support/operations (weekly recurring)

Include rough cash costs when possible.
