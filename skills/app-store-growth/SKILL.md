---
name: app-store-growth
description: Organic-first post-launch growth strategy and analytics for iOS/macOS apps: read App Store Connect data, diagnose the funnel, and plan one experiment at a time. Paid ads and Apple Search Ads are last-resort, approval-gated, and must never be created, configured, launched, or drafted without explicit user approval.
---

# App Store Growth

Use this skill to turn App Store data into one focused organic growth experiment at a time. Treat featuring as upside, not the growth strategy.

## Hard Guardrails

- Prefer organic and owned-channel improvements: product-page conversion, screenshots, metadata, reviews, onboarding, pricing, retention, release stories, featuring nominations.
- Paid acquisition is last resort. Never create, configure, launch, draft, bid, budget, or optimize Apple Search Ads or other ads unless the user explicitly asks for ads.
- Do not optimize for downloads alone. Track downstream activation, purchases, proceeds, refunds/cancellations, retention, ratings, and crashes.
- Do not buy, fake, gate, or manipulate reviews. Ask for reviews only after successful user outcomes.
- Do not promise featuring. Use nominations only for meaningful launches, major updates, timely content, or strong editorial stories.
- If data is incomplete, say so and label assumptions. Do not invent metrics.

## Workflow

### 1. Establish the current business context

Identify:

- App, platform, category, core audience, key promise.
- Monetization model: paid upfront, one-time IAP, subscription, consumable, ads, or mixed.
- Current App Store assets: name, subtitle, keywords, screenshots, preview, description, rating/review count, price/IAP price.
- Current acquisition efforts: organic only, launch posts, website, social, newsletter, influencer outreach, featuring nominations, custom product pages, ads only if user explicitly brings them up.

Route to existing skills when needed:

- Use `asc` for metadata, screenshots, pricing, IAP, release notes, and CLI workflows.
- Use `aso-screenshots` for screenshot benefit discovery and production.
- Use `app-review` before submission or major metadata/product changes.
- Use `ios` / `ios-onboarding` for in-app onboarding, paywall, or review-prompt implementation.

### 2. Baseline the funnel

Use App Store Connect App Analytics, Sales and Trends, exported CSVs, screenshots, or user-provided values. Prefer a recent stable window such as 7, 14, or 30 days, plus prior-period comparison when available.

Collect when available: impressions by source, product page views, downloads, product page conversion (downloads / page views unless ASC gives the rate), purchases/proceeds/refunds, retention, ratings and review themes, crashes.

If ASC data is not available, perform a qualitative assessment from the app, metadata, screenshots, pricing, and known sales/downloads, and state that the assessment is hypothesis-only.

### 3. Diagnose and choose one experiment

Prioritize the funnel stage with the largest plausible impact, not the easiest metric to move. Default to one major variable at a time; fix broken, misleading, or noncompliant assets immediately, and bundle tightly coupled changes (e.g. screenshots plus matching promotional text). For very low traffic, treat results as directional. Prefer App Store-side experiments (Product Page Optimization, Custom Product Pages, metadata, screenshots via `aso-screenshots`) over in-app A/B infrastructure. Review prompts go after a successful user outcome, not on launch. Featuring nominations only for meaningful launches or updates.

### 4. Write the experiment brief before executing

Format:

```text
Hypothesis: If we [change], then [metric] will improve because [reason].
Audience/source: [all users / Search / Browse / specific custom page / owned channel]
Change: [one primary variable or one bundled creative package]
Primary metric: [e.g. product page conversion rate]
Guardrails: [purchase rate, revenue/download, ratings, crashes, refunds, retention]
Baseline window: [dates and values]
Measurement window: [dates or minimum data rule]
Decision rule: Keep if [threshold]; revert if [threshold]; iterate if [mixed result]
Execution path: [ASC/PPO/screenshots/metadata/app change]
Approval needed: [anything requiring user approval]
```

Never include ad creation or ad setup in `Execution path` unless the user explicitly requested ads.

### 5. Output a growth assessment

For assessments, produce:

```text
Current read: [short diagnosis]
Data quality: [strong / partial / weak, with missing data]
Primary bottleneck: [one bottleneck]
Top opportunities:
1. [opportunity]
2. [opportunity]
3. [opportunity]
Recommended next experiment: [one experiment]
Experiment brief: [filled template]
Backlog: [later experiments, explicitly not simultaneous]
Do not do yet: [premature optimizations, including ads unless approved]
```

Keep the plan practical. If there is no meaningful data yet, recommend the smallest measurable improvement and the next data to collect.
