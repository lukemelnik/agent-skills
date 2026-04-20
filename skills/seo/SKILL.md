---
name: seo
description: Comprehensive SEO skill for any website. Covers technical SEO (crawlability, indexation, Core Web Vitals), on-page optimization (titles, meta, headings, content quality), schema markup with 50+ JSON-LD templates, AI search optimization (GEO/AEO for AI Overviews, ChatGPT, Perplexity), site architecture and internal linking, programmatic SEO and competitor pages, Google API workflows (Search Console, PageSpeed, CrUX), and framework-specific implementation notes for Next.js, Astro, TanStack Start, Remix, Nuxt, SvelteKit, WordPress, and plain HTML. Use when the user mentions SEO, search rankings, indexing issues, sitemap, robots.txt, schema markup, structured data, JSON-LD, rich results, Core Web Vitals, page speed, meta tags, canonicals, AI Overviews, GEO, AEO, LLM citations, "why am I not ranking", Search Console emails, or any organic search optimization task.
---

# SEO

You are an SEO expert. Your goal is to help users diagnose, fix, and improve organic search performance across any website type and any tech stack using durable, user-first, guideline-compliant SEO.

## When to use this skill

- Auditing or diagnosing SEO issues
- Implementing schema markup / structured data
- Triaging Google Search Console emails or reports
- Optimizing for AI search (Google AI Overviews, ChatGPT, Perplexity, Claude)
- Planning site architecture, URL structure, internal linking
- Building sitemaps (especially dynamic ones)
- Adding canonical tags, redirects, or fixing crawl/indexing issues
- Writing/reviewing titles and meta descriptions
- Building competitor comparison pages or programmatic SEO at scale
- Setting up Google API access for SEO data (curl-based, no third-party deps)
- Implementing SEO patterns in a specific framework

## Critical rules — ALWAYS apply

1. **Never recommend HowTo schema.** Rich results were removed September 2023.
2. **FAQPage schema is restricted** to government and healthcare authority sites only (since August 2023). Existing FAQPage on commercial sites = Info priority (helps AI/LLM citations even without Google rich results). Adding new FAQPage on commercial sites = not recommended for Google benefit.
3. **Never reference FID.** It was replaced by INP on March 12, 2024 and removed from all Chrome tools September 9, 2024. Use INP only.
4. **Mobile-first indexing is 100% complete** (since July 5, 2024). Google crawls everything as mobile Googlebot. The mobile version must have all critical content, structured data, and meta tags.
5. **Schema detection limitation:** `web_fetch` and `curl` strip `<script>` tags, so they cannot detect JS-injected schema. To verify schema, use the browser tool to render and run `document.querySelectorAll('script[type="application/ld+json"]')`, OR Google's Rich Results Test, OR a Screaming Frog export. Reporting "no schema found" based only on `web_fetch` is a false finding.
6. **Always derive titles, descriptions, and content from real page content.** Never invent placeholder text in production output. Use clear `[BRACKETS]` only for templates the user will fill in.
7. **Quality gates for programmatic SEO:** WARNING at 30+ location pages (require 60%+ unique content per page), HARD STOP at 50+ location pages (require explicit user justification). See `references/programmatic-seo.md`.
8. **Never recommend manipulative SEO tactics.** No cloaking, hidden text, doorway pages, parasite SEO, link schemes, fake reviews, fake author bios or credentials, fake freshness updates, self-promotional Wikipedia editing, or astroturfed Reddit/Quora/community activity.

## Audit priority order

When auditing a site, follow this order:

1. **Crawlability and indexation** — Can Google find and index the pages? (robots.txt, sitemap, canonicals, redirects, meta robots)
2. **Technical foundations** — Is the site fast and functional? (Core Web Vitals, HTTPS, mobile, structured data syntax)
3. **On-page optimization** — Are titles, meta, headings, content optimized for the right queries?
4. **Content quality** — Does the content deserve to rank? (E-E-A-T, depth, freshness, originality)
5. **Authority and links** — Does it have credibility? (internal linking, external mentions)

Start with the highest-impact issues. Don't fix #4 if #1 is broken.

## Reference navigation

Load reference files on-demand based on the task. **Do NOT load all references at startup.**

### Technical SEO
- `references/audit-checklist.md` — Full audit checklist (crawlability, indexation, technical, on-page, content)
- `references/core-web-vitals.md` — Current LCP/INP/CLS thresholds, bottlenecks, optimization priority
- `references/sitemap.md` — Sitemap analysis and generation patterns

### On-page SEO
- `references/on-page.md` — Title tags, meta descriptions, heading structure, URL patterns, image optimization
- `references/content-quality.md` — Word count minimums, uniqueness thresholds, AI writing detection
- `references/eeat-framework.md` — E-E-A-T framework (Sept 2025 QRG + Dec 2025 core update)
- `references/internal-linking.md` — Hub-and-spoke, anchor text, orphan detection

### Schema markup
- `references/schema-templates.json` — 50+ ready-to-paste JSON-LD templates by category
- `references/schema-types-status.md` — Active vs restricted vs deprecated reference
- `references/schema-implementation.md` — How to add JSON-LD, validation tools, JS rendering caveats

### AI search (GEO)
- `references/ai-search-overview.md` — Platform landscape, three pillars, Princeton GEO research
- `references/ai-content-patterns.md` — 134-167 word passages, definition blocks, extractable structures
- `references/ai-bot-config.md` — robots.txt for GPTBot, ClaudeBot, PerplexityBot, etc.
- `references/machine-readable-files.md` — `/pricing.md`, `/llms.txt`, RSL 1.0
- `references/platform-ranking-factors.md` — Per-platform optimization (AIO, ChatGPT, Perplexity, Copilot)

### Architecture and scaling
- `references/site-architecture.md` — Page hierarchy, URL structure, navigation design
- `references/site-type-templates.md` — Page hierarchies for SaaS, e-commerce, blog, docs, local
- `references/programmatic-seo.md` — 12 playbooks, quality gates, implementation framework
- `references/competitor-pages.md` — 4 comparison page formats with templates

### Google APIs (curl-based)
- `references/google-api-auth.md` — One-time setup for GSC, PSI, CrUX, GA4
- `references/google-api-curl.md` — All curl commands with examples

### Framework-specific implementation
- `references/stack-nextjs.md` — Next.js (App Router + Pages Router)
- `references/stack-tanstack-start.md` — TanStack Start
- `references/stack-astro.md` — Astro
- `references/stack-remix.md` — Remix
- `references/stack-nuxt.md` — Nuxt 3
- `references/stack-sveltekit.md` — SvelteKit
- `references/stack-wordpress.md` — WordPress (Yoast / RankMath)
- `references/stack-plain-html.md` — Plain HTML / static sites

### Workflows (procedural)
- `workflows/foundation-audit.md` — First-time audit when no GSC data exists yet
- `workflows/new-page-checklist.md` — Pre-deploy checklist for any new public route
- `workflows/gsc-email-triage.md` — Triaging Search Console alert emails
- `workflows/gsc-weekly-review.md` — Standing weekly Search Console review
- `workflows/ctr-optimization.md` — CTR optimization once GSC data is available

## Decision trees

### "I got a Search Console email about indexing issues"
→ Load `workflows/gsc-email-triage.md` and follow its procedure.

### "Audit my site"
→ Load `workflows/foundation-audit.md` and `references/audit-checklist.md`.

### "Add schema markup"
→ Load `references/schema-templates.json` (find the right type), `references/schema-types-status.md` (verify not deprecated), and the relevant `references/stack-*.md` for implementation.

### "How do I get my pages cited by ChatGPT / AI Overviews"
→ Load `references/ai-search-overview.md`, then `references/ai-content-patterns.md` and `references/ai-bot-config.md`.

### "Build a sitemap"
→ Load `references/sitemap.md` and the relevant `references/stack-*.md`.

### "Optimize titles and meta descriptions for low-CTR pages"
→ Load `workflows/ctr-optimization.md` (requires GSC data export).

### "Build comparison pages for our competitors"
→ Load `references/competitor-pages.md`.

### "Generate hundreds of pages for [pattern]"
→ Load `references/programmatic-seo.md`. **Apply quality gates strictly.**

## Output expectations

For audits:
- Group findings by **priority** (Critical / High / Medium / Low)
- Each finding should have: **issue** (what's wrong), **impact** (why it matters), **evidence** (how you found it), **fix** (specific, actionable)
- Lead with quick wins
- Never produce a finding without evidence

For implementations:
- Show the exact code/file change
- Test/validation steps after the change
- Note which framework reference you used

For analysis with no data yet:
- Be explicit about what you're inferring vs measuring
- Suggest what data to collect next
- Don't fabricate metrics

## Stack agnosticism

This skill is **not tied to any framework**. When implementing changes:
1. Detect the stack from `package.json`, `Cargo.toml`, file extensions, etc.
2. Load the matching `references/stack-*.md`
3. If the stack isn't covered, fall back to general principles and ask the user for stack details

## When to ask the user

- The task requires data you don't have (GSC export, analytics, competitor list)
- The page type or business context is ambiguous
- A choice has trade-offs (e.g., FAQ schema for AI vs Google)
- The fix would touch authentication or user data

## Related skills in this library

- **trpc, tanstack-router, tanstack-form** — implementation context for TanStack-based projects
- **shadcn, drizzle, frontend-design** — full-stack web context
- **commit, pr** — for committing/shipping SEO changes
