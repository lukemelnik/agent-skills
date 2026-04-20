# AI Search Overview (GEO / AEO)

How AI search engines select and cite sources, and what to optimize. Also called GEO (Generative Engine Optimization), AEO (Answer Engine Optimization), or LLMO (LLM Optimization).

## Why this matters now

| Stat | Value | Source |
|---|---|---|
| Google searches with AI Overviews | ~50% (rising) | Industry data 2025 |
| AI Overviews monthly users | 1.5 billion across 200+ countries | Google |
| Click reduction from AI Overviews | up to 58% | Multiple studies |
| AI-referred sessions growth | 527% (Jan–May 2025) | SparkToro |
| ChatGPT weekly active users | 900 million | OpenAI |
| Perplexity monthly queries | 500+ million | Perplexity |
| Optimized vs non-optimized citation rate | 3× higher with optimization | Princeton GEO |
| Statistics+citations citation lift | +40% across queries | Princeton GEO |
| Schema markup AI citation lift | ~2.5× higher | Google + Microsoft, Mar 2025 |
| Brand mention vs backlink correlation with AI citations | ~0.737 (YouTube) vs ~0.266 (DR) | Ahrefs Dec 2025 (75K brands) |

**Bottom line:** AI search is no longer optional. By 2026, optimizing only for traditional Google rankings means missing roughly half of the search opportunity.

## The platform landscape

| Platform | How it picks sources | Optimization focus |
|---|---|---|
| **Google AI Overviews** | Summarizes top-ranking pages. ~92% of citations come from top-10 results, but 47% come from below position 5 — selection logic differs from raw ranking | Traditional SEO + extractable passage structure |
| **ChatGPT (with search)** | Searches the web, cites sources. Heavy reliance on Wikipedia (~47.9% of citations), Reddit (~11.3%), and authoritative third-party sources | Earned Wikipedia/Wikidata presence, authentic Reddit/community presence, authoritative tone |
| **Perplexity** | Always cites sources with links. Favors recent, well-structured, community-validated content. Reddit ~46.7% of citations | Reddit presence, freshness, structured content |
| **Gemini** | Google's AI assistant. Pulls from Google index + Knowledge Graph + Google-Extended crawler | Traditional Google SEO + entity presence |
| **Copilot** | Bing-powered. Bing index + authoritative sources | Bing SEO, IndexNow protocol |
| **Claude** | Brave Search results + training data | Public web presence + authoritative sources |

**Key insight:** Only 11% of domains are cited by both ChatGPT and Google AI Overviews for the same query. **Platform-specific optimization is essential** if you target multiple platforms.

## Critical insight: brand mentions > backlinks

Per Ahrefs December 2025 study of 75,000 brands:

| Signal | Correlation with AI citations |
|---|---|
| YouTube mentions | 0.737 (strongest) |
| Reddit mentions | High |
| Earned Wikipedia/Wikidata presence | High |
| LinkedIn presence | Moderate |
| Domain Rating (backlinks) | 0.266 (weak) |

**Brand mentions correlate ~3× more strongly with AI visibility than backlinks.** Building entity presence on YouTube, Reddit, Wikipedia, and LinkedIn matters more than chasing backlinks for AI visibility.

## Traditional SEO vs AI SEO

| | Traditional SEO | AI SEO |
|---|---|---|
| Goal | Rank on page 1 | Get cited as a source |
| Win condition | Top 10 positions | Quality + structure (rank less critical) |
| Click outcome | User clicks your link | User reads cited summary, may not click |
| Optimization unit | Page | Passage / claim |
| Critical signals | Backlinks, content depth | Brand mentions, structure, citations, freshness |
| Format | Long-form articles | Extractable answer blocks (134-167 words) |

In traditional search, you need to rank to be seen. In AI search, **a well-structured page can get cited even if it ranks on page 2 or 3** — AI systems select sources based on content quality, structure, and citability, not just rank position.

## The three pillars

### Pillar 1: Structure — make content extractable

AI systems extract passages, not pages. Every key claim should work as a standalone statement.

**Patterns:**
- Definition blocks ("X is...") for "What is X?" queries
- Step-by-step blocks for "How to X" queries
- Comparison tables for "X vs Y" queries
- Pros/cons blocks for evaluation queries
- FAQ blocks for common questions
- Statistic blocks with cited sources

**Rules:**
- Lead every section with a direct answer (don't bury it)
- Optimal passage length: 134–167 words for AI citation
- Use H2/H3 headings that match how people phrase queries
- Tables beat prose for comparisons
- Numbered lists beat paragraphs for processes
- Each paragraph: one clear idea

See `ai-content-patterns.md` for templates.

### Pillar 2: Authority — make content citable

The Princeton GEO research (KDD 2024, studied across Perplexity.ai) ranked 9 optimization methods:

| Method | Visibility lift | How |
|---|---|---|
| Cite sources | **+40%** | Authoritative references with links |
| Add statistics | **+37%** | Specific numbers with sources |
| Add quotations | **+30%** | Expert quotes with name and title |
| Authoritative tone | +25% | Demonstrated expertise |
| Improve clarity | +20% | Simplify complex concepts |
| Technical terms | +18% | Domain-specific terminology |
| Unique vocabulary | +15% | Higher word diversity |
| Fluency optimization | +15-30% | Improve readability |
| ~~Keyword stuffing~~ | **-10%** | **Actively hurts AI visibility** |

**Best combination:** Fluency + Statistics = maximum boost. Low-ranking sites benefit even more — up to 115% visibility increase with citations.

### Pillar 3: Presence — be where AI looks

AI systems cite where you appear, not just your own site:

| Source | ChatGPT citation share |
|---|---|
| Wikipedia | ~47.9% |
| Industry publications | varies |
| Reddit | ~11.3% |
| YouTube | High (especially for AI Overviews) |
| Quora | Moderate |
| Review sites (G2, Capterra, TrustRadius) | High for B2B |

**Actions:**
- Earn/maintain Wikipedia or Wikidata presence only when notability standards are genuinely met
- Authentic Reddit participation in relevant subreddits — no astroturfing, sockpuppets, or undisclosed promotion
- Industry roundups and guest posts
- Updated profiles on G2, Capterra, TrustRadius
- YouTube content for key how-to queries
- Quora answers with depth and clear disclosure where relevant

## What gets cited most

| Content type | % of AI citations | Why |
|---|---|---|
| Comparison articles | ~33% | Structured, balanced, high-intent |
| Definitive guides | ~15% | Comprehensive, authoritative |
| Original research/data | ~12% | Unique, citable statistics |
| Best-of / listicles | ~10% | Clear structure, entity-rich |
| Product pages | ~10% | Specific extractable details |
| Opinion / analysis | ~10% | Quotable expert perspective |
| How-to guides | ~8% | Step-by-step structure |

**Underperformers:**
- Generic blog posts without structure
- Thin product pages with marketing fluff
- Gated content (AI can't access it)
- Content without dates or author attribution
- PDF-only content (harder to parse)

## Citability score (rough guide)

For each priority page, score these:

| Check | Pass/Fail |
|---|---|
| Clear definition in first paragraph? | |
| Self-contained answer blocks (work without surrounding context)? | |
| Statistics with sources cited? | |
| Comparison tables for "X vs Y" queries? | |
| FAQ section with natural-language questions? | |
| Schema markup (Article, Product, FAQ)? | |
| Expert author attribution (name, credentials)? | |
| Recently updated (within 6 months)? | |
| Heading structure matches query patterns? | |
| AI bots allowed in robots.txt? | |
| Server-side rendered (not JS-only)? | |

7+/11 = good citability. Below 7 = needs work.

## Quick wins (low effort)

1. Add "What is [topic]?" definition in first 60 words of pillar pages
2. Create 134-167 word self-contained answer blocks for top queries
3. Add question-based H2/H3 headings
4. Include specific statistics with cited sources
5. Add publication and last-updated dates prominently
6. Implement Person schema for authors
7. Allow GPTBot, ClaudeBot, PerplexityBot in robots.txt

## Medium effort

1. Create `/llms.txt` file (see `machine-readable-files.md`)
2. Add `/pricing.md` for AI agent buyers (see `machine-readable-files.md`)
3. Add author bio with credentials + LinkedIn/Wikidata/Wikipedia links where they already exist naturally
4. Ensure SSR for content (AI crawlers don't execute JavaScript)
5. Earn entity presence on Reddit, YouTube, and third-party publications through genuine participation and useful content
6. Add comparison tables with structured data
7. Implement FAQ sections (structured, not necessarily schema for commercial sites — see schema-types-status.md)

## High impact (more effort)

1. Create original research/surveys (unique citability)
2. Earn Wikipedia/Wikidata presence for the brand and key people through independent coverage, if they are truly notable
3. Establish YouTube channel covering target topics
4. Comprehensive entity linking (`sameAs` across all platforms)
5. Develop unique tools, calculators, or interactive content

## Common mistakes

- **Ignoring AI search entirely** — half of Google searches now show AI Overviews
- **Treating AI SEO as separate from SEO** — good traditional SEO is the foundation
- **Writing for AI, not humans** — content that gamed an algorithm won't get cited or convert
- **No freshness signals** — undated content loses to dated content
- **Gating all content** — AI can't access gated content
- **Ignoring third-party presence** — a Wikipedia mention often beats a blog post
- **Trying to game third-party platforms** — astroturfing Reddit, spamming Quora, or creating promotional Wikipedia pages is short-lived and high-risk
- **No structured data** — schema gives AI clear context
- **Keyword stuffing** — actively reduces AI visibility (Princeton: -10%)
- **Hiding pricing** — AI agent buyers can't parse what they can't read (see `machine-readable-files.md`)
- **Blocking AI bots** — if GPTBot/ClaudeBot/PerplexityBot are blocked, those platforms can't cite you
- **Generic content** — "We're the best" won't get cited; "Our customers see 3× improvement" will
- **No monitoring** — check AI visibility monthly minimum

## Monitoring AI visibility

### What to track
| Metric | What it measures |
|---|---|
| AI Overview presence | Do AI Overviews appear for your top queries? |
| Brand citation rate | How often you're cited in AI answers |
| Share of AI voice | Your citations vs competitors |
| Citation sentiment | How AI describes your brand |
| Source attribution | Which of your pages get cited |

### Tools (paid)
| Tool | Coverage | Best for |
|---|---|---|
| Otterly AI | ChatGPT, Perplexity, Google AI Overviews | Share of voice |
| Peec AI | ChatGPT, Gemini, Perplexity, Claude, Copilot | Multi-platform monitoring |
| ZipTie | Google AIO, ChatGPT, Perplexity | Brand mention + sentiment |
| LLMrefs | ChatGPT, Perplexity, AIO, Gemini | Keyword → AI visibility mapping |

### DIY monitoring (no tools)
1. Pick top 20 queries
2. Run each through ChatGPT, Perplexity, Google
3. Record: are you cited? Who is? What page?
4. Spreadsheet, track month-over-month
