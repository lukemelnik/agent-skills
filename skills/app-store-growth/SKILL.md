---
name: app-store-growth
description: Organic-first post-launch App Store growth and monetization workflow for iOS/macOS apps. Use when asked to analyze App Store Connect analytics, increase downloads, improve purchases, improve ASO, diagnose funnel metrics, plan Product Page Optimization/A/B tests, update screenshots/metadata, improve ratings/reviews, pricing/paywalls, Custom Product Pages, featuring nominations, or create a data-driven growth experiment plan. Paid ads and Apple Search Ads are last-resort, approval-gated, and must never be created, configured, launched, or drafted without explicit user approval.
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

Minimum metrics to collect when available:

- Impressions by source: Search, Browse, App Referrer, Web Referrer, App Clip, campaigns/custom pages.
- Product Page Views.
- First-Time Downloads / App Units.
- Product page conversion rate: downloads or app units divided by product page views, unless ASC provides the exact rate.
- Purchases, proceeds, paying users, conversion to purchase, revenue per download.
- Refunds/cancellations if applicable.
- Retention: day 1, day 7, day 30, sessions, active devices.
- Ratings: average rating, review count, recent review themes.
- Quality: crashes, hangs, launch time, critical support issues.

If ASC data is not available, perform a qualitative assessment from the app, metadata, screenshots, pricing, and known sales/downloads, and state that the assessment is hypothesis-only.

### 3. Diagnose the primary bottleneck

Use this decision map:

| Symptom | Likely bottleneck | Organic-first levers |
| --- | --- | --- |
| Low impressions | Not enough discoverability or external demand | ASO keyword audit, subtitle/name clarity, category fit, localization, launch/update story, featuring nomination, owned-channel outreach |
| Impressions but weak page views | Search result is not compelling | Icon, name, subtitle, first screenshots, ratings/review count |
| Page views but weak downloads | Product page does not convert | Benefit-first screenshots, preview video, description, social proof, price clarity, credibility, clearer audience targeting |
| Downloads but weak purchase conversion | Value is not proven before monetization | Onboarding, first-value moment, paywall copy/timing, pricing, IAP naming, free vs paid feature boundary |
| Purchases but refunds/cancellations/low retention | Expectation mismatch or weak durable value | Metadata accuracy, onboarding promises, product quality, recurring-value loop, post-purchase experience |
| Good conversion but low volume | Distribution problem | Release cadence, content/SEO site, community outreach, partnerships, featuring nomination, only then approval-gated ads |

Prioritize the bottleneck with the largest plausible impact, not the easiest metric to move.

### 4. Choose one primary experiment

Default to one major variable at a time so results are interpretable. Exceptions:

- Fix outright broken, misleading, noncompliant, or stale assets immediately instead of treating them as experiments.
- Bundle tightly coupled changes as one experiment, e.g. a screenshot set plus matching promotional text.
- For very low traffic, treat results as directional and combine quantitative data with qualitative review.

Rank candidate experiments by impact, confidence, effort, reversibility, and whether they preserve user trust. Prefer App Store-side experiments before building in-app A/B infrastructure unless the app has enough traffic to justify in-app testing.

Good organic experiment types:

- Product Page Optimization: screenshots, icon, app preview variants.
- Screenshot refresh: outcome-first panels using `aso-screenshots`.
- Metadata test: name/subtitle/keywords/description/promotional text, using `asc` where possible.
- Custom Product Page: audience-specific page for a non-paid campaign, creator link, website CTA, newsletter, or launch post.
- Review prompt timing: ask after a successful user outcome, not on launch.
- Pricing/IAP copy: one-time unlock price, localized pricing, IAP display name/description, paywall copy.
- Onboarding/first-value improvement: reduce time to first successful outcome.
- Featuring nomination: only for meaningful launch/update stories.

### 5. Write the experiment brief before executing

Use this format:

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

### 6. Output a growth assessment

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
