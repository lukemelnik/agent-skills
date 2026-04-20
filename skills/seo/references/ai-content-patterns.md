# AI Content Patterns

Specific writing patterns that AI search engines (Google AI Overviews, ChatGPT, Perplexity) extract and cite. Use these for any page you want cited.

## Core principle

AI systems extract **passages**, not pages. A 2000-word article that gets cited is cited because of one specific 150-word block, not the whole thing. Write so individual sections work as standalone answers.

## Optimal passage length

**134-167 words per self-contained answer block.**

This is the sweet spot for AI extraction:
- Long enough to fully answer most questions
- Short enough that AI systems will extract it whole
- Matches typical featured snippet length

If you need more depth, write multiple 134-167 word blocks instead of one long passage.

## Block patterns

### 1. Definition block

For "What is X?" queries.

**Template:**
```
[Term] is [one-sentence definition that answers the question completely].

[2-3 sentences elaborating on what it does, why it matters, who uses it.]

[Optional: 1-2 sentences with a specific example or use case.]
```

**Example:**
```
Programmatic SEO is the practice of generating large numbers of web pages
from templates and structured data, designed to rank for long-tail keyword
patterns at scale.

It works by combining a repeatable page template with a database of
variables (locations, products, comparisons, etc.) to produce hundreds or
thousands of unique landing pages, each targeting a specific search query.
Companies like Zapier, Tripadvisor, and G2 use programmatic SEO to capture
search demand that would be impossible to address with manually written
content.

For example, Zapier creates a unique page for every "Connect [App A] to
[App B]" combination across their ~5,000 supported apps, generating
millions of indexable pages from a single template.
```

Word count: ~120 words. Stands alone. Answers the question. Includes a specific example.

### 2. Step-by-step block

For "How to X" queries.

**Template:**
```
To [accomplish goal], follow these steps:

1. **[Action verb]:** [Specific instruction with concrete detail]
2. **[Action verb]:** [Next step]
3. **[Action verb]:** [Next step]
...

[Optional: 1-2 sentences about expected outcome or common gotchas.]
```

**Example:**
```
To add JSON-LD schema to a React page, follow these steps:

1. **Build the schema object:** Create a JavaScript object matching the
   schema.org type you need (e.g., Article, Product, Organization).
2. **Inject into the document head:** Use your framework's head injection
   API (Next.js `metadata` export, TanStack Start `head` function, Remix
   `meta` export, etc.).
3. **Render as a script tag:** Wrap the JSON in a `<script type="application/ld+json">`
   tag, using `dangerouslySetInnerHTML` with `JSON.stringify()` to avoid
   React's default content escaping.
4. **Validate:** Test with Google's Rich Results Test (which renders JS)
   before deploying.

The schema must be in the initial server-rendered HTML for time-sensitive
data like prices, availability, and publication dates.
```

### 3. Comparison table

For "X vs Y" queries.

Always use real tables, not prose. AI systems extract structured data more reliably from tables than from "Whereas X has..., Y has..." sentences.

**Template:**
```markdown
| Feature | Option A | Option B |
|---------|----------|----------|
| Pricing | $X/mo | $Y/mo |
| Best for | [Use case] | [Use case] |
| Strengths | [Specific] | [Specific] |
| Weaknesses | [Honest] | [Honest] |
```

Follow the table with a TL;DR sentence: "Choose A if [condition]. Choose B if [different condition]."

### 4. Pros/cons block

For evaluation queries ("Is X worth it?", "Should I use X?").

**Template:**
```markdown
**[Product/Approach Name]**

Pros:
- [Specific benefit]
- [Specific benefit]
- [Specific benefit]

Cons:
- [Honest limitation]
- [Honest limitation]
- [Honest limitation]

Best for: [Specific use case].
Not ideal for: [Specific case where it doesn't fit].
```

The "best for / not ideal for" framing builds trust because it's honest about limitations.

### 5. FAQ block

For pages where users have common questions. Even though FAQPage schema is restricted on commercial sites for Google rich results, AI systems still extract Q&A patterns from FAQ-formatted content.

**Template:**
```markdown
## Frequently asked questions

### [Question phrased exactly as users would ask it]
[Direct answer in 2-4 sentences. Self-contained.]

### [Next question]
[Direct answer]
```

**Rules:**
- Questions should be natural language, matching how people search
- Answers should be self-contained (work without context)
- Lead with the answer, then optionally add detail
- 3-7 questions per FAQ section (more is overwhelming)

### 6. Statistic block

For data-driven content. Princeton GEO: statistics give a +37% citation lift.

**Template:**
```
[Specific number] of [population] [action/outcome], according to [source with date].

[1-2 sentences explaining what the number means or implications.]
```

**Example:**
```
49.7% of mobile websites passed all three Core Web Vitals as of October
2025, up from 39.4% in 2023, according to Google's HTTPArchive Web Almanac.

This means more than half of mobile sites still fail at least one CWV
threshold — making CWV optimization a meaningful competitive advantage
even though it's a "tiebreaker" ranking signal rather than a primary one.
```

**Rules:**
- Always cite the source
- Always include a date for the statistic
- Original data > aggregated data > general claims
- Round numbers feel made up (4,732 is more credible than 5,000)

## Lead-with-answer rule

Bury the lead and AI won't cite you. Every major section should follow this pattern:

```
## [Question or topic in heading]

[Direct answer in first sentence — the TL;DR.]

[Optional: 2-3 sentences of context or elaboration.]

[Optional: more detail, examples, edge cases.]
```

**Bad (lead buried):**
```
## How to optimize Core Web Vitals

Core Web Vitals were introduced by Google in 2020 as part of the Page
Experience update. They include several metrics that measure different
aspects of user experience. Originally, the metrics were FID (First
Input Delay), LCP, and CLS, but in March 2024, FID was replaced by INP...

[Eventually] To optimize LCP, compress images and use modern formats.
```

**Good (lead first):**
```
## How to optimize Core Web Vitals

To improve Core Web Vitals, focus on three optimizations: compress and
preload your largest hero image (LCP), break up long JavaScript tasks
(INP), and set explicit width/height on all images and embeds (CLS).

These three changes typically move a site from "Needs Improvement" to
"Good" on most pages. The Core Web Vitals are measured at the 75th
percentile of real user data, so optimizing the worst-performing pages
yields the biggest aggregate improvement.
```

## Heading patterns that match queries

Write H2/H3 headings that mirror how people phrase searches.

**Bad:**
- `Our Approach`
- `Solutions`
- `Methodology`
- `Section 3`

**Good:**
- `What is programmatic SEO?` (matches "what is" queries)
- `How to add schema markup to a Next.js site` (matches "how to" queries)
- `Yoast vs Rank Math: which is better?` (matches "vs" queries)
- `Best schema types for SaaS websites` (matches "best for" queries)

Question-format headings:
1. Match how people search
2. Naturally lead with the answer in the section body
3. Get extracted by AI systems looking for Q&A patterns

## Tables beat prose

For any comparison, ranking, or feature list — use a table.

**Bad (prose):**
```
Yoast SEO has a free tier and a premium tier at $99/year. It's the most
popular WordPress SEO plugin with over 13 million active installs. Rank
Math also offers a free tier, plus a Pro tier at $59/year. Rank Math
has more features in the free tier than Yoast, including support for
multiple keywords per post.
```

**Good (table):**
```markdown
| Feature | Yoast SEO | Rank Math |
|---------|-----------|-----------|
| Active installs | 13M+ | 3M+ |
| Free tier | Yes | Yes (more features) |
| Paid tier | $99/year (Premium) | $59/year (Pro) |
| Multiple keywords (free) | No | Yes |
| Schema types | Limited | Comprehensive |
```

The same information, but the table is extractable. AI systems pull tables wholesale into citations.

## Lists beat paragraphs (for sequential or multi-item content)

**Bad (prose):**
```
First, install the plugin. Then activate it from the WordPress admin.
Next, go to the settings page. From there, you can configure your XML
sitemap. Finally, submit the sitemap to Google Search Console.
```

**Good (numbered list):**
```
1. **Install the plugin** from the WordPress plugin directory
2. **Activate** it from the WordPress admin
3. **Configure your XML sitemap** from the plugin settings page
4. **Submit the sitemap** to Google Search Console
```

The numbered list:
1. Maps to step-by-step intent
2. Is easier to extract for AI citation
3. Renders better in featured snippets
4. Makes scanning faster for humans too

## Specific over generic

AI systems prefer specific, verifiable claims over generic statements.

| Generic (low citation value) | Specific (high citation value) |
|---|---|
| "Our customers love us" | "94% of customers renew after the first year (n=1,247, 2025)" |
| "Lots of features" | "47 features across 6 categories: ..." |
| "Fast performance" | "p95 response time of 120ms across 50,000 daily requests" |
| "Trusted by leading companies" | "Used by Stripe, Notion, Vercel, and Linear" |

Specific claims are citable. Generic claims are filtered out.

## Freshness signals

Every page that wants AI citations should have:
- **Publication date** visible (not just in metadata)
- **Last updated date** visible (separate from publication date)
- A "Recently updated" or "Last reviewed" line near the top
- Schema markup with `datePublished` and `dateModified`

AI systems weight recency heavily. Undated content competes against dated content and loses.

## Content updates

Refresh competitive content quarterly minimum:
- Update statistics with the latest numbers
- Update product/tool names if anything changed
- Update screenshots if interfaces changed
- Bump the `dateModified` (genuinely — Google detects fake updates)

## What to avoid

- **Walls of text** — break into 134-167 word blocks
- **Buried answers** — lead with the answer in every section
- **Generic phrasing** — use specific numbers, names, examples
- **Keyword stuffing** — Princeton GEO research: -10% visibility
- **No author** — anonymous content gets less citation
- **No dates** — undated content gets less citation
- **PDF-only content** — harder to parse than HTML
- **JS-only rendering** — AI crawlers don't execute JS, ensure SSR
- **Gated content** — if AI can't read it, it can't cite it
