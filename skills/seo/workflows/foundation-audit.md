# Foundation Audit Workflow

Use when the user says:
- "audit my site"
- "why am I not ranking"
- "check our SEO"
- or when there is no GSC export yet

## Goal

Identify the highest-impact SEO issues in priority order:
1. crawlability/indexation
2. technical foundations
3. on-page optimization
4. content quality
5. internal linking / architecture

## Step 1: Establish context

Collect:
- domain
- primary business model (SaaS, ecommerce, publisher, local, docs, etc.)
- target geography/language
- stack/framework if known
- top 5-10 pages or templates that matter most

If stack is known, load the matching `stack-*.md` reference.

## Step 2: Check crawlability and indexation first

Load:
- `references/audit-checklist.md`
- `references/sitemap.md`

Check:
- `robots.txt`
- sitemap existence and quality
- canonical patterns
- obvious `noindex`/redirect issues
- whether key routes are internally linked

Do not skip this step. A site with broken crawl/index controls does not need copy tweaks first.

## Step 3: Check technical foundations

Load:
- `references/core-web-vitals.md`
- `references/schema-implementation.md`

Check:
- HTTPS
- mobile rendering / mobile-first parity
- major CWV bottlenecks
- structured data presence and correctness
- broken JS-only rendering patterns

Remember the schema caveat: plain fetch/curl does not prove schema absence if schema is injected in JS.

## Step 4: Check on-page basics on key pages

Load:
- `references/on-page.md`

For homepage + top commercial pages + 2-3 content pages, review:
- title tags
- meta descriptions
- H1/H2 structure
- URL patterns
- image alt/size issues
- OG/Twitter tags if relevant

## Step 5: Check content quality and E-E-A-T

Load:
- `references/content-quality.md`
- `references/eeat-framework.md`

Review:
- thin content
- freshness
- author/date signals
- original experience/examples
- AI-writing signatures or generic filler

## Step 6: Check architecture and internal linking

Load:
- `references/site-architecture.md`
- `references/internal-linking.md`

Review:
- orphan risks
- hub pages
- page depth
- nav clarity
- weak contextual linking

## Step 7: If the site uses scale patterns, inspect them explicitly

If you see:
- lots of city pages
- integrations/templates pages
- alternatives/comparisons
- database-driven landing pages

Load:
- `references/programmatic-seo.md`
- `references/competitor-pages.md` if relevant

Apply quality gates strictly.

## Output format

Return findings grouped by:
- **Critical**
- **High**
- **Medium**
- **Low**

Each finding must include:
- **Issue**
- **Impact**
- **Evidence**
- **Fix**

Lead with quick wins after the critical blockers.

## Good audit behavior

- State what is measured vs inferred
- Do not fabricate rankings/traffic numbers
- Do not claim schema is missing based only on raw HTML fetch if the stack may inject it client-side
- Prefer 5 real findings over 50 generic ones
