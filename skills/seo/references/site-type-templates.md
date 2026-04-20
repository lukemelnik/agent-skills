# Site Type Templates

Default SEO page hierarchies and must-have page types for common site models.

Use these as starting templates, then adapt to the business.

## SaaS / software product

### Core architecture
- `/`
- `/features`
- `/features/[feature]`
- `/use-cases`
- `/use-cases/[audience-or-job]`
- `/integrations`
- `/integrations/[partner]`
- `/compare` or `/alternatives`
- `/compare/[competitor]`
- `/pricing`
- `/customers` or `/case-studies`
- `/blog`
- `/docs`
- `/security`
- `/about`
- `/contact`

### Must-have SEO pages
- Feature pages for major capabilities
- Use-case pages by role/industry
- Pricing page with transparent tiers
- Comparison / alternative pages for competitors
- Integration pages if integrations matter to acquisition
- Docs pages if developer adoption matters

### Common gaps
- One generic features page instead of individual feature pages
- No comparison pages
- Pricing hidden or vague
- Docs disconnected from marketing site
- No customer proof pages

## E-commerce

### Core architecture
- `/`
- `/category/[primary]`
- `/category/[primary]/[secondary]` (if needed)
- `/product/[slug]`
- `/brands/[slug]`
- `/collections/[slug]` (if curated)
- `/guides/[slug]`
- `/compare/[product-a]-vs-[product-b]` (selectively)
- `/shipping`
- `/returns`
- `/about`

### Must-have SEO pages
- Category pages with unique intro copy
- Product pages with complete specs and original descriptions
- Brand pages where users search by brand
- Buying guides for major categories
- Shipping/returns pages for trust and schema

### Common gaps
- Thin category pages with no content
- Manufacturer descriptions duplicated everywhere
- Filter URLs accidentally indexed at scale
- No buying guides linking to products

## Blog / media / publisher

### Core architecture
- `/`
- `/topics/[slug]` or `/category/[slug]`
- `/blog/[slug]` or article paths by section
- `/authors/[slug]`
- `/about`
- `/contact`
- `/newsletter`

### Must-have SEO pages
- Topic hubs
- Author pages
- Article pages with dates and bios
- About/editorial policy page
- Corrections/update policy if news-oriented

### Common gaps
- Tag sprawl
- Weak author pages
- No topical hubs beyond archives
- Articles only discoverable chronologically

## Docs / developer platform

### Core architecture
- `/docs`
- `/docs/getting-started`
- `/docs/guides/[slug]`
- `/docs/concepts/[slug]`
- `/docs/api/[slug]`
- `/examples/[slug]`
- `/changelog`
- `/status` (if public)

### Must-have SEO pages
- Getting started
- Core concept pages
- Task-oriented guides
- API reference
- Example projects
- Changelog or release notes

### Common gaps
- API reference with no task guides
- Guides hidden behind client-side search only
- Version confusion and bad canonicals
- No public examples/templates

## Local business / service area business

### Core architecture
- `/`
- `/services`
- `/services/[service]`
- `/locations/[city]` or `/[city]/[service]`
- `/about`
- `/contact`
- `/reviews`
- `/faq`

### Must-have SEO pages
- One page per core service
- One page per primary service area only if there is genuine local relevance
- About/contact/reviews pages with strong trust signals
- LocalBusiness schema

### Common gaps
- Hundreds of thin city pages with swapped city names
- No service pages, only location pages
- Weak local proof (address, reviews, staff, photos)
- No geographic internal linking

### Warning
Location page expansion must follow the quality gates in `programmatic-seo.md`.

## Marketplace / directory

### Core architecture
- `/`
- `/categories/[slug]`
- `/locations/[slug]`
- `/[entity-type]/[slug]`
- `/best/[category]-in-[location]`
- `/compare/[entity-a]-vs-[entity-b]` (selectively)
- `/guides/[slug]`

### Must-have SEO pages
- Category-location landing pages with real demand
- Entity detail pages with substantial unique data
- Editorial best-of pages
- Comparison pages for head terms

### Common gaps
- Empty directory pages with only names
- Massive indexation of low-value combinations
- No editorial content to support commercial pages

## Course / education

### Core architecture
- `/`
- `/courses`
- `/courses/[slug]`
- `/instructors/[slug]`
- `/topics/[slug]`
- `/pricing`
- `/outcomes`
- `/blog`

### Must-have SEO pages
- Course pages with clear outcomes and syllabus
- Instructor pages
- Pricing/financial aid page
- Topic hubs
- Reviews/testimonials

## B2B service / agency

### Core architecture
- `/`
- `/services/[slug]`
- `/industries/[slug]`
- `/case-studies/[slug]`
- `/about`
- `/team`
- `/pricing` or `/engagement-model`
- `/blog`
- `/contact`

### Must-have SEO pages
- Detailed service pages
- Industry-specific landing pages only where truly differentiated
- Case studies with concrete outcomes
- Team pages showing expertise
- Trust/legal/contact pages

## Minimum viable public SEO set

If a site is small and just getting started, make sure it still has:
- Homepage
- At least one strong page per core commercial intent
- Pricing/contact/about
- Sitemap + robots.txt
- Self-canonical tags
- Basic Organization schema

## Choosing what to build first

Prioritize in this order:
1. Core revenue pages
2. Category / hub pages
3. Comparison or alternative pages
4. Supporting educational content
5. Edge-case long-tail pages

Do **not** start with programmatic scale before the core architecture exists.
