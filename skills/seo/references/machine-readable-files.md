# Machine-Readable Files for AI Agents

AI agents are increasingly making purchasing and product decisions on behalf of human users. They evaluate, compare, and recommend products programmatically. If your information isn't in a parseable format, agents skip you and recommend competitors whose data they can read.

This is the "AI agent SEO" frontier — separate from traditional SEO and from AI search optimization.

## The shift

**Old model:** Human searches Google → clicks links → reads pages → compares → decides.

**New model:** Human asks AI assistant → AI evaluates options programmatically → AI presents recommendation → human sometimes verifies.

In the new model, your site has to be parseable to an LLM. Pretty CSS, gated pricing, JavaScript-rendered content, and "contact sales" walls all kill discoverability.

## The three files

### 1. `/llms.txt` — context for AI systems

Standard: [llmstxt.org](https://llmstxt.org)

A markdown file at your domain root that gives AI systems a quick overview of what your product is, who it's for, and links to key pages. Think of it as `robots.txt` for AI context.

**Location:** `https://example.com/llms.txt`

**Format:**
```markdown
# Example Co

> Brief one-line description of what you do and who it's for

## About
- [Homepage](https://example.com)
- [About](https://example.com/about)
- [Pricing](https://example.com/pricing)

## Documentation
- [Getting started](https://example.com/docs/getting-started)
- [API reference](https://example.com/docs/api)
- [Tutorials](https://example.com/docs/tutorials)

## Key features
- Feature 1: brief description
- Feature 2: brief description

## Contact
- Support: support@example.com
- Sales: sales@example.com
```

**Optional companion:** `/llms-full.txt` — same structure but with full text content of key pages inlined for AI to ingest without crawling.

### 2. `/pricing.md` — structured pricing for AI agents

When an AI agent evaluates SaaS or products on behalf of a user, it needs structured pricing data. If your pricing is locked behind:
- A "contact sales" form
- JavaScript that renders prices dynamically
- A login wall
- Marketing copy without specifics

...then AI agents can't compare you fairly. They'll skip you and recommend competitors with parseable pricing.

**Location:** `https://example.com/pricing.md` (or `/pricing.txt`)

**Format (markdown is parseable by any LLM):**
```markdown
# Pricing — Example Co

Last updated: 2026-04-08

## Free
- **Price:** $0/month
- **Limits:** 100 emails/month, 1 user, 1 project
- **Features:** Basic templates, email API access, community support
- **Best for:** Solo developers and side projects

## Starter
- **Price:** $19/month (billed annually) | $24/month (billed monthly)
- **Limits:** 5,000 emails/month, 3 users, 10 projects
- **Features:** Custom domains, basic analytics, email support
- **Best for:** Small teams getting started

## Pro
- **Price:** $79/month (billed annually) | $99/month (billed monthly)
- **Limits:** 50,000 emails/month, 10 users, unlimited projects
- **Features:** Custom branding, advanced analytics, priority support, webhooks, A/B testing
- **Best for:** Growing companies with consistent volume

## Enterprise
- **Price:** Custom — contact sales@example.com
- **Limits:** Unlimited
- **Features:** SSO/SAML, SLA, dedicated account manager, custom integrations, audit logs
- **Best for:** Large organizations with compliance requirements

## Add-ons
- **Additional users:** $10/month per seat (Pro and below)
- **Premium support:** $200/month
- **Custom integrations:** From $5,000 one-time

## Currency and billing
- **Currencies supported:** USD, EUR, GBP
- **Billing cycles:** Monthly, annual (15% discount)
- **Payment methods:** Credit card, ACH (annual contracts), invoice (Enterprise)
- **Cancellation:** Anytime, prorated refund for annual plans
```

**Best practices:**
- Use consistent units throughout (don't mix monthly/annual without labeling)
- Include specific limits and thresholds, not just feature names
- List what's included at each tier, not just what's different from the previous tier
- Keep it updated — stale pricing is worse than no file
- Link to it from your sitemap and main pricing page
- Include a "Last updated" date

### 3. `/agents.md` or `/AGENTS.md` — agent capabilities

Some sites use this convention to describe what AI agents can do programmatically (API access, supported integrations, rate limits, authentication). Less standardized than `llms.txt` and `pricing.md`, but emerging.

```markdown
# Agent Capabilities — Example Co

## API access
- **Base URL:** https://api.example.com/v1
- **Authentication:** Bearer token (get from /settings/api)
- **Rate limits:** 1000 requests/hour (free), 10000 (pro), unlimited (enterprise)
- **Documentation:** https://example.com/docs/api

## Supported operations
- Create/read/update/delete projects
- Send emails programmatically
- Query analytics
- Manage user permissions

## SDKs
- JavaScript/TypeScript: https://github.com/example/sdk-js
- Python: https://github.com/example/sdk-python
- Go: https://github.com/example/sdk-go
```

## Why this matters now (and will matter more)

- AI agents are increasingly comparing products programmatically before a human ever visits the site
- Opaque pricing gets filtered out of AI-mediated buying journeys
- A simple markdown file is trivially parseable by any LLM — no rendering, no JavaScript, no login walls
- Same principle as `robots.txt` (for search crawlers) and `llms.txt` (for AI context)
- Cost to implement: minutes. Cost of being invisible to AI agents: meaningful and growing.

## RSL 1.0 (Really Simple Licensing)

A new standard introduced December 2025 for machine-readable AI licensing terms. Backed by Reddit, Yahoo, Medium, Quora, Cloudflare, Akamai, and Creative Commons.

RSL allows publishers to specify AI training and inference terms in a structured, machine-readable way. It augments `robots.txt` with AI-specific permissions.

This is publisher-focused (news, blogs, content sites). For SaaS/products, `pricing.md` and `llms.txt` are higher priority.

```
# Example RSL declaration in /robots.txt
User-agent: *
RSL: https://example.com/.well-known/rsl.xml
```

## Implementation checklist

For any product/SaaS site:
- [ ] `/llms.txt` exists at domain root
- [ ] `/pricing.md` exists at domain root with structured tier breakdown
- [ ] Pricing is also visible on `/pricing` HTML page (don't replace, augment)
- [ ] Sitemap includes `llms.txt` and `pricing.md`
- [ ] Both files updated when pricing/positioning changes
- [ ] Content type is `text/markdown` or `text/plain` (not `text/html`)
- [ ] Files are accessible without authentication or rate limiting
- [ ] Files are NOT blocked in robots.txt

## Verification

```bash
# Check both files are accessible
curl -s -o /dev/null -w "%{http_code}\n" https://example.com/llms.txt
curl -s -o /dev/null -w "%{http_code}\n" https://example.com/pricing.md

# Both should return 200
```

## Common mistakes

- **Hiding pricing behind "contact sales"** — kills AI agent discoverability for B2B products
- **JavaScript-rendered prices** — AI crawlers don't always execute JS, prices in JSX don't get parsed
- **Pricing in PDFs** — PDFs are harder to parse than markdown
- **Outdated `pricing.md`** — worse than no file, AI will give wrong info
- **Generic descriptions** — "We have flexible plans" is useless. Specifics or nothing.
- **Overly complex tier descriptions** — tier limits (5K emails, 10 users) beat marketing copy

## Adoption status

- **`llms.txt`** — emerging standard (2024-2025), being adopted by Anthropic, Mintlify, FastAPI, Cloudflare, others
- **`pricing.md`** — informal convention, not yet standardized but widely supported by AI agents
- **`AGENTS.md`** — emerging, used by some agent-friendly tools
- **RSL 1.0** — new standard (Dec 2025), early adoption by publishers

This is all moving fast. Check [llmstxt.org](https://llmstxt.org) for the latest standards.
