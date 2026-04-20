# Programmatic SEO Reference

How to scale landing pages safely without creating thin, duplicative, or spammy content.

## Definition

Programmatic SEO is the practice of generating many pages from a repeatable template plus structured data.

Examples:
- `/integrations/[app-a]-to-[app-b]`
- `/alternatives/[competitor]`
- `/locations/[city]/[service]`
- `/templates/[workflow]`
- `/compare/[product-a]-vs-[product-b]`

Done well, it captures long-tail demand at scale.
Done badly, it becomes scaled content abuse.

## Critical quality gates

These are hard rules for this skill.

### Location pages
- **0-29 location pages:** allowed if each page has real local value
- **30+ location pages:** **WARNING** — require **60%+ unique content per page** and real local differentiation
- **50+ location pages:** **HARD STOP** — require explicit user justification and evidence the pages have genuine value beyond city-name swapping

### Any programmatic set
Do not ship at scale unless:
- pages serve a distinct query pattern
- each page has enough unique data or insight
- internal linking and sitemap plans exist
- canonical strategy is defined
- low-value combinations are excluded

## When programmatic SEO works

Programmatic SEO works when the page template combines:
1. **Real search demand**
2. **Distinct intent per page**
3. **Substantial structured data**
4. **Enough uniqueness in the output**
5. **A clear internal linking model**

Strong examples:
- Integrations pages for real app pairs
- Competitor comparison pages for known competitors
- Template/gallery pages with actual assets or examples
- Location pages with real local inventory, staff, reviews, examples, pricing, or regulations
- Marketplace listing pages backed by rich database content

Weak examples:
- 500 city pages with identical copy except city name
- 1000 adjective variations with no unique value
- Comparison pages where every section is identical except product names
- Empty directory pages with 2 listings and no editorial content

## The template formula

Good programmatic page =
**template structure** + **unique data** + **manual/editorial layer** + **clear intent**

### Template structure
Reusable scaffolding:
- H1
- intro
- comparison/spec blocks
- FAQs
- related links
- schema

### Unique data
Examples:
- app names, features, supported actions
- city-specific stats, reviews, case studies, staff, addresses
- product specs, prices, ratings, availability
- job salaries, requirements, locations

### Editorial layer
What prevents the page from being a database dump:
- curated summary
- expert notes
- real examples
- recommendations
- caveats and trade-offs

## Pre-build checklist

Before approving a programmatic set, answer all of these:

- What exact query pattern does the page family target?
- How many unique pages actually have search demand?
- What data makes each page meaningfully different?
- Which combinations should be excluded from indexation?
- How will pages be linked internally?
- How will sitemap generation work?
- What makes these pages better than current SERP results?
- How will freshness be maintained?

If those answers are weak, do not scale yet.

## Good programmatic patterns by site type

### SaaS
- integration pages
- template pages
- competitor alternative pages
- use-case pages by role/workflow
- import/export compatibility pages

### E-commerce
- curated category + use-case combinations
- brand + category pages
- style / material / intended-use landing pages

### Marketplace / directory
- category + location pages
- comparison pages between entities
- best-of editorial pages

### Education / careers
- career path pages by role
- salary pages by title + location only when backed by real data
- school/course comparison pages

## Quality controls

## Unique content thresholds

These are heuristics, not legal standards, but useful:

| Page family | Suggested uniqueness |
|---|---|
| Integrations | 50%+ |
| Competitor comparisons | 50%+ |
| Templates/gallery pages | 40%+ if backed by strong assets/data |
| Location pages | 60%+ once scaling past 30 pages |
| Category-location pages | 60%+ |

Uniqueness can come from:
- unique intro copy
- data blocks
- examples
- testimonials/reviews
- FAQs
- local/business specifics
- screenshots/media

## Manual review sampling

Before scaling to hundreds of pages:
- build 10-20 examples first
- manually review them for sameness
- compare them against live SERPs
- prune bad combinations
- only then expand

## Exclusion rules

Do **not** generate/index pages for combinations that:
- have no search demand
- lack enough unique data
- create near-duplicates
- serve purely machine-generated filler
- cannot be linked naturally
- cannot be maintained over time

Common exclusion examples:
- low-population cities with no real local footprint
- app combinations with no integration or migration story
- competitor pages for irrelevant competitors
- category combinations with zero inventory

## Canonical strategy

Every programmatic page needs explicit canonical rules.

Usually:
- self-canonical if the page is intended to rank and is unique enough
- canonical to parent hub if the generated page is just a filtered duplicate

Never leave large generated sets without a canonical strategy.

## Internal linking model

Programmatic pages fail when they are only in the sitemap.

Must define:
- parent hub pages
- related pages modules
- breadcrumb hierarchy
- sideways links where relevant
- discovery from key site sections

Examples:
- `/integrations` hub links to major integration pages
- each integration page links to related integrations and relevant feature pages
- `/alternatives` hub links to comparison pages

## Sitemap strategy

For large sets:
- segment sitemap by template family
- consider separate sitemap files for integrations, comparisons, locations, templates
- exclude low-value combinations from sitemap

## Schema for programmatic pages

Use only schema that genuinely matches the content.

Examples:
- `SoftwareApplication` for tool/app pages
- `Product` for ecommerce pages
- `ItemList` for list pages
- `FAQPage` only with caution per current Google restrictions
- `BreadcrumbList` for hierarchy

Schema does not rescue low-quality pages.

## Measuring success

Track:
- indexed pages vs generated pages
- impressions by template family
- click-through rate by page family
- ranking distribution
- pages stuck in Crawled - currently not indexed
- template-level cannibalization

If 60-80% of a generated set does not get indexed, that is usually a quality/duplication signal.

## Warning signs of scaled content abuse

- Pages differ only by swapped variables
- No human review before launch
- No local proof on local pages
- No original data on comparison pages
- Same screenshots and FAQs on every page
- Massive sitemap submission but low indexation
- Search Console shows many pages as Duplicate or Crawled - currently not indexed

## Recommended rollout process

1. Choose one page family
2. Validate demand with keyword/competitor checks
3. Build 10-20 pages
4. Review quality manually
5. Add internal links and sitemap inclusion
6. Monitor indexation for 2-4 weeks
7. Expand only if the sample performs

## Templates that often work

### Integration pages
Sections:
- what connects to what
- who it is for
- supported workflows
- setup steps
- common use cases
- limitations
- related integrations

### Competitor pages
Sections:
- who each option is for
- feature comparison table
- pricing comparison
- strengths/limitations
- migration notes
- CTA to your product only if the page stays honest

### Location pages
Sections must include real local proof:
- address/service area specifics
- local testimonials/case studies
- city-specific regulations/logistics
- local staff/team info
- local examples/photos

If you cannot provide those, do not scale location pages.
