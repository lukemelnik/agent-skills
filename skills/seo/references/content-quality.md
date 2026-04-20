# Content Quality Reference

Word counts, uniqueness thresholds, content depth requirements, and AI writing detection patterns. Use this when auditing content or creating new pages.

## Word count minimums by page type

These are MINIMUMS, not targets. Hitting the minimum doesn't guarantee quality, but missing it usually means thin content.

| Page type | Min words | Unique content % | Notes |
|---|---|---|---|
| Homepage | 500 | 100% | Must clearly communicate value proposition |
| Service / feature page | 800 | 100% | Detailed explanation of offering |
| Location (primary) | 600 | 60%+ | City HQ or main service area |
| Location (secondary) | 500 | 40%+ | Satellite locations |
| Blog post | 1,500 | 100% | In-depth, valuable content |
| Product page | 400 | 80%+ | Unique descriptions, specs |
| Category page | 400 | 100% | Unique intro, not just product listings |
| About page | 400 | 100% | Company story, team, values |
| Landing page | 600 | 100% | Focused conversion content |
| FAQ page | 800 | 100% | Comprehensive Q&A |

**These minimums are for substantive content,** not navigation, footer, or boilerplate.

## Quality > word count

Hitting word count minimums doesn't guarantee ranking. A 2000-word generic article will lose to a 800-word original article with unique insights.

The bar is **"better than what currently ranks for the target query."** That's the only useful benchmark.

For any new page targeting a query:
1. Search the query yourself
2. Open the top 5 results
3. Identify what they cover, what they miss, what's outdated
4. Write something more comprehensive, more current, or with original data they lack

## Thin content detection

Google penalizes thin content via algorithmic devaluation (not always a manual action).

### Signs of thin content
- Less than 300 words of substantive content (excluding nav/footer)
- Generic copy that could apply to any company in your space
- Auto-generated content with no curation
- Duplicate content across multiple pages
- Pages with only a few sentences and a CTA
- Tag/category pages with 1-2 results
- "Coming soon" pages that don't get updated
- Empty product listings with no description

### Pages most at risk
- Tag pages with 1 post
- Category pages with no intro text
- Location pages where only the city name changes
- Programmatic SEO pages with template-only content
- Translation pages with poor translation
- Auto-generated comparison pages without real differences

### How to fix thin content
1. **Consolidate** — merge thin pages into comprehensive pillar pages
2. **Expand** — add unique value, examples, data, original analysis
3. **Noindex** — if a page can't be expanded, noindex it
4. **Redirect** — 301 to a more substantive related page

## E-E-A-T overview

Per the September 2025 Google Quality Rater Guidelines and the December 2025 core update, E-E-A-T now applies to ALL competitive queries (not just YMYL).

Full details in `eeat-framework.md`. Quick version:

- **Experience (20%)** — first-hand knowledge demonstrated
- **Expertise (25%)** — formal credentials, demonstrated knowledge
- **Authoritativeness (25%)** — recognition by others
- **Trustworthiness (30%)** — most important, transparency, accuracy

After Dec 2025, generic content doesn't rank — even for non-YMYL queries.

## AI writing detection

Google has gotten good at detecting low-quality AI-generated content. The Sept 2025 QRG explicitly addresses this.

**AI content is acceptable** if it demonstrates genuine E-E-A-T. **Low-quality AI content is penalized.**

What matters: does the content provide unique value regardless of how it was created?

### Markers of low-quality AI writing

These patterns are flags for both algorithmic detection and human reviewers:

#### Em dash overuse
AI models (especially GPT-4 and Claude) overuse em dashes. Real human writing uses them sparingly. If a page has multiple em dashes per paragraph, it reads as AI.

```
Bad (AI signature): "The product is fast — really fast — and reliable — extremely reliable — making it the best choice — by far — for your needs."

Good: "The product is fast and reliable. It's the best choice for most users."
```

#### Generic transition phrases
AI models lean on filler transitions:
- "It's important to note that..."
- "It's worth mentioning..."
- "In today's fast-paced world..."
- "When it comes to..."
- "At the end of the day..."
- "In conclusion..."
- "Let's dive in..."
- "Without further ado..."
- "In a world where..."

Strip these. They add words without value.

#### Hedge phrases
AI models hedge constantly:
- "While X may have its merits..."
- "Some would argue..."
- "It could be said that..."
- "Many believe..."
- "Various factors..."

Real expertise asserts facts. Hedge phrases signal "I don't actually know."

#### Overused adjectives
- "Powerful" (especially for software)
- "Robust"
- "Cutting-edge"
- "Innovative"
- "Game-changing"
- "Seamless"
- "Comprehensive"
- "Holistic"
- "Synergistic"
- "Dynamic"
- "Solution"
- "Stakeholders"
- "Leverage" (as a verb)

Replace with specifics.

#### Repetitive structure across pages
Multiple pages on the same site that follow the exact same template, with only the topic changed, signal scaled AI content abuse.

#### Lack of specifics
AI content tends toward generic claims:
- "Many users report improvements" → bad
- "73% of users (n=1,247) saw at least 20% improvement in [specific metric]" → good
- "Industry leaders trust us" → bad
- "Used by Stripe, Notion, and Linear" → good

#### No first-hand experience signals
AI cannot fabricate genuine experience. Look for:
- "I tested this..." vs "Users have tested this..."
- "When I built X, I encountered Y..." vs "When building X, one might encounter Y..."
- Original screenshots vs stock-looking images
- Specific dates and contexts vs vague timelines
- "We measured 47ms latency" vs "Latency is impressively low"

## How to make AI-assisted content rank

If you use AI to help write content (legitimate use), make it indistinguishable from human-written by:

1. **Add real first-hand experience** — your testing, your data, your screenshots
2. **Strip generic phrases** (the list above)
3. **Add specific numbers** — measured, dated, sourced
4. **Add named examples** — real companies, real people, real outcomes
5. **Vary structure** — don't follow a rigid template across all pages
6. **Add author bio with credentials** — visible byline
7. **Show your work** — methodology, sources, dates
8. **Update with new info** over time (not just regenerate)

## Freshness signals

Required on any content page:

- **Publication date** visible on the page (not just in metadata)
- **Last updated date** visible (separate from publication if updated)
- A clear "Last reviewed: [date]" or "Updated [date]" line near the top
- Schema markup with `datePublished` and `dateModified`

### Update cadence by content type

| Content type | Refresh frequency |
|---|---|
| News / current events | Within hours/days |
| Year-in-review / "best of [year]" | At least annually |
| Tool comparisons | Quarterly (pricing changes, feature updates) |
| Tutorials | Annually + when interfaces change |
| Statistics-heavy posts | Quarterly |
| Reference / glossary | Annually |
| Legal / privacy | When changes occur |

### Genuine vs fake updates

Google detects fake updates:
- ❌ Just bumping the `dateModified` without changing content
- ❌ Adding a single sentence with the new year
- ❌ "Updated: [today]" with zero content changes
- ✅ Replacing outdated stats with current ones
- ✅ Adding a new section reflecting recent developments
- ✅ Updating screenshots to current product UI
- ✅ Removing obsolete information

## Internal linking from new pages

Every new page should:
- [ ] Be linked from at least one existing page (no orphans)
- [ ] Link to 3-5 related existing pages internally
- [ ] Have descriptive anchor text on those links
- [ ] Be added to the sitemap
- [ ] Be added to relevant category/hub pages

See `internal-linking.md` for full guidance.

## Output for content audits

When reviewing existing content, group findings:

### Critical
- Pages under 300 words on indexed URLs
- Duplicate content across multiple URLs
- Pages last updated 2+ years ago that target competitive queries

### High
- Pages 300-600 words that should be 1000+
- Pages with no author or date
- Pages with em dash overuse / AI writing signatures
- Pages without clear primary keyword target

### Medium
- Pages with weak E-E-A-T signals (no credentials, no first-hand experience)
- Pages without internal links from related content
- Pages without freshness signals

### Low
- Pages that could be improved but currently perform fine
- Optional schema additions
- Minor formatting issues
