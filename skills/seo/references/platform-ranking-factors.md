# Platform-Specific Ranking Factors

How each major AI search platform selects sources, and what to optimize per platform. Use this when you need to target a specific platform rather than general AI optimization.

## Why platform-specific matters

**Only 11% of domains are cited by both ChatGPT and Google AI Overviews for the same query.** Selection logic differs dramatically between platforms. If you target multiple platforms, you need to optimize separately.

## Quick comparison

| Platform | Primary source | Selection logic | Where citations come from |
|---|---|---|---|
| **Google AI Overviews** | Google index | Top-10 ranked pages (mostly) | 92% top-10, but 47% from below position 5 |
| **ChatGPT** | Web search + training | Authoritative third-party sources | Wikipedia 47.9%, Reddit 11.3%, news/industry sites |
| **Perplexity** | Live web search | Recent + community-validated | Reddit 46.7%, Wikipedia, news, blogs |
| **Gemini** | Google index + Knowledge Graph | Similar to Google but with KG bias | Google index, structured data, KG entities |
| **Copilot** | Bing index + IndexNow | Authoritative + freshness | Bing index, well-structured pages |
| **Claude** | Brave Search + training | Mix of Brave results and training data | Brave search, public web |

## Google AI Overviews

**How it works:** Summarizes top-ranking pages for the query. Similar to a featured snippet but synthesized from multiple sources.

**Selection logic:**
- ~92% of citations come from top-10 organic results
- ~47% come from positions below 5 — meaning page rank isn't the only factor
- Tends to cite pages with clear extractable answer blocks
- Heavy bias toward authoritative domains (Wikipedia, government, well-known publishers)
- Strong correlation with structured data presence

**Key stats:**
- Appears in ~50% of all Google searches (rising)
- Reduces clicks to source pages by up to 58%
- 1.5 billion monthly users across 200+ countries

**To optimize:**
1. **Rank in top 10 traditionally** — this is the foundation. Without ranking, you won't be in the candidate set.
2. **Create extractable 134-167 word answer blocks** for your target queries
3. **Lead sections with direct answers** — buried answers don't get extracted
4. **Add comprehensive schema markup** — Article, Product, FAQPage (where appropriate), Person for authors
5. **Improve `dateModified`** — recent updates signal freshness
6. **Build entity presence** — Wikipedia, Knowledge Graph, sameAs across platforms
7. **Allow `Google-Extended` in robots.txt** (note: this is separate from `Googlebot` — blocking it only blocks AI Overviews/Gemini, not regular search)

**Distinct characteristics:**
- Pulls from your own site if you rank
- Strongly favors pages with clear hierarchical structure (H2/H3 question patterns)
- Penalizes "thin" pages — depth and comprehensiveness matter
- Values fresh content (recent updates)

## ChatGPT (with web search enabled)

**How it works:** Uses Bing search to find sources, then synthesizes a response with inline citations.

**Source distribution (industry analyses):**
| Source type | Citation share |
|---|---|
| Wikipedia | ~47.9% |
| Reddit | ~11.3% |
| News and industry publications | ~15% |
| Blogs and content sites | ~10% |
| Q&A sites (Quora, StackExchange) | ~5% |
| Other | ~10% |

**Selection logic:**
- Heavy bias toward third-party authoritative sources
- Favors community-validated information (Reddit threads with engagement)
- Wikipedia is the dominant single source
- Less correlation with traditional Google rank than AI Overviews

**To optimize:**
1. **Earn/maintain a Wikipedia or Wikidata presence** — for your brand, key people, or products only when notability standards are genuinely met through independent reliable coverage.
2. **Authentic Reddit participation** in relevant subreddits — don't spam, astroturf, or use sockpuppet accounts.
3. **Get featured in industry publications** — TechCrunch, The Verge, Wired, industry trades.
4. **Contribute genuinely useful Quora answers** for high-volume questions in your space, with disclosure where relevant.
5. **Allow `GPTBot`, `ChatGPT-User`, and `OAI-SearchBot`** in robots.txt.
6. **Make pricing parseable** (`/pricing.md`) — ChatGPT actively uses pricing data when comparing tools.

**Distinct characteristics:**
- Less reliance on your own site than Google AIO
- Strong third-party signal weighting
- Heavy influence from Wikipedia citations
- Pricing transparency matters (more than for traditional SEO)

## Perplexity

**How it works:** Live web search with always-cited sources. Conversational interface with citation links visible inline.

**Source distribution:**
| Source type | Citation share |
|---|---|
| Reddit | ~46.7% |
| Wikipedia | ~12% |
| News sites | ~15% |
| Blogs | ~10% |
| Industry sites | ~10% |
| Other | ~5% |

**Selection logic:**
- **Reddit dominates** — far more than for ChatGPT
- Strong recency bias
- Favors well-structured, scannable content
- Always cites multiple sources per response
- Less filtered than Google — more variety in cited sources

**To optimize:**
1. **Reddit presence is critical** — participate in relevant subreddits genuinely; do not astroturf, brigading-bait, or post undisclosed promotions
2. **Recent content** — Perplexity favors recently updated articles
3. **Clean structure** — H2/H3, bullet lists, tables — extracts cleanly
4. **Statistics with sources** — Perplexity citations include reasoning, so cited stats get pulled
5. **Allow `PerplexityBot`** in robots.txt
6. **Author bylines and dates** — visible at the top of every article

**Distinct characteristics:**
- Highest Reddit reliance of any major platform
- Most lenient about "non-authoritative" sources
- Citation visibility is a feature — citation-worthy content benefits more here than elsewhere
- Less domain-authority bias than Google or ChatGPT

## Google Gemini

**How it works:** Google's AI assistant. Uses Google search index + Knowledge Graph + Google-Extended crawler.

**Selection logic:**
- Similar to Google AI Overviews but with stronger Knowledge Graph influence
- Entity-aware: knows about brands, people, places via the Knowledge Graph
- Pulls from Google's index (must be indexed normally first)

**To optimize:**
1. **Optimize for Google traditionally** — same as Google AI Overviews
2. **Build entity presence in the Knowledge Graph** — ideally via real-world entities such as Wikidata, Google Business Profile, and structured data with `sameAs`; use Wikipedia only when independently notable
3. **Comprehensive Organization and Person schema** — helps Google understand entity relationships
4. **Allow `Google-Extended`** in robots.txt

**Distinct characteristics:**
- Knowledge Graph dependency — entity-based queries work better
- Same crawl infrastructure as Google Search

## Microsoft Copilot

**How it works:** Bing-powered AI search. Uses Bing index + IndexNow protocol + authoritative sources.

**Selection logic:**
- Similar source quality bias to Bing search
- Strong recency from IndexNow protocol
- Authoritative sites favored

**To optimize:**
1. **Submit sitemap to Bing Webmaster Tools** — Bing index, not Google
2. **Implement IndexNow protocol** for faster discovery of new/updated pages — `bing.com/indexnow`
3. **Allow `Bingbot`** in robots.txt
4. **Do not spend time on `meta keywords`** — Bing may treat them as a spam signal; they are not a worthwhile optimization target
5. **Get listed in Microsoft Start (MSN)** for news content

**Distinct characteristics:**
- Bing Webmaster Tools is a separate ecosystem from Google Search Console
- IndexNow protocol enables push-based indexing (faster than crawl-based)
- Less competitive than Google — easier to rank

## Claude (Anthropic)

**How it works:** Uses Brave Search results when web search is enabled, plus training data for general knowledge.

**Selection logic:**
- Brave Search is a smaller index than Google or Bing
- Less dependent on backlinks than Google
- Mix of search results and trained knowledge

**To optimize:**
1. **Submit your site to Brave Search** if not already indexed
2. **Allow `ClaudeBot`** in robots.txt; allow `anthropic-ai` only if you also permit training crawling
3. **General authoritative content** — Claude favors well-sourced, accurate content
4. **Less specific platform optimization needed** — Claude users are a smaller % of AI search market

**Distinct characteristics:**
- Smallest user base among major AI search platforms
- Powered by Brave (not Google or Bing)
- Less competitive optimization landscape

## Cross-platform optimization checklist

If you want to be cited by all major platforms:

### Critical (do these first)
- [ ] Allow all major AI bots in robots.txt (see `ai-bot-config.md`)
- [ ] Server-side rendering for content (AI crawlers don't always execute JS)
- [ ] Author attribution with credentials (Person schema + visible byline)
- [ ] Publication and last-updated dates visible
- [ ] Comprehensive schema markup (Organization, WebSite, Article/Product, BreadcrumbList)
- [ ] `/llms.txt` and `/pricing.md` for SaaS sites
- [ ] Earned entity presence for the brand and key people (Wikidata/Wikipedia where independently justified)

### Platform-specific
- [ ] Top 10 Google rankings for target queries (for AI Overviews + Gemini)
- [ ] Authentic Reddit presence in relevant subreddits (for Perplexity + ChatGPT)
- [ ] Industry publication coverage (for ChatGPT + Copilot)
- [ ] Bing Webmaster Tools setup + IndexNow protocol (for Copilot)
- [ ] G2/Capterra/TrustRadius profiles updated (for B2B SaaS in ChatGPT comparisons)
- [ ] YouTube content for key topics (cited heavily by AI Overviews)

### Content patterns (universal)
- [ ] 134-167 word self-contained answer blocks
- [ ] Lead-with-answer in every major section
- [ ] Specific statistics with cited sources
- [ ] Question-format H2/H3 headings matching query patterns
- [ ] Tables for comparisons, numbered lists for processes

## Where to focus by business type

### B2B SaaS
1. **Pricing transparency** (`/pricing.md`) — biggest single win for AI agent buyers
2. **G2/Capterra profiles** — heavily cited by ChatGPT for "best [category]" queries
3. **Comparison/alternative pages** — feed "X vs Y" and "alternatives to X" queries
4. **Authentic Reddit presence** in the tools/SaaS subreddits

### Content / publishing
1. **Topic authority** — comprehensive coverage of a niche
2. **Author E-E-A-T** — visible bylines, credentials, ProfilePage schema
3. **Original research** — unique data is highly citable
4. **Earned Wikipedia/Wikidata presence** for the publication and key writers, if independently justified

### E-commerce
1. **Product schema with all fields** — price, availability, ratings, shipping, returns
2. **`/pricing.md`** for product catalogs (or product API)
3. **Review aggregation** — high review counts boost AI confidence
4. **Comparison pages** for product categories

### Local business
1. **Google Business Profile** — fully optimized
2. **Reviews on multiple platforms** (Google, Yelp, industry-specific)
3. **LocalBusiness schema** with full NAP and hours
4. **Local Wikipedia mentions** if culturally significant

## Monitoring across platforms

| Platform | Free monitoring | Paid monitoring |
|---|---|---|
| Google AIO | Manual SERP checks, Search Console | Otterly, Peec AI, ZipTie, LLMrefs |
| ChatGPT | Manual prompts | Otterly, Peec AI, ZipTie |
| Perplexity | Manual prompts | Otterly, Peec AI |
| Gemini | Manual via gemini.google.com | Peec AI |
| Copilot | Manual via bing.com | Peec AI |
| Claude | Manual via claude.ai | Limited tooling |

For early-stage monitoring, the free DIY approach (manual prompts in spreadsheet, monthly cadence) is sufficient. Tool spend makes sense once you have meaningful traffic from AI sources.
