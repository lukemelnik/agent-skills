# Internal Linking Reference

How to structure internal links so important pages are discoverable, understandable, and reinforced by the rest of the site.

## Why internal links matter

Internal links influence:
- Crawl discovery
- Crawl priority
- Topic understanding
- Page importance
- Anchor text relevance
- User navigation and conversion

A strong page with weak internal links often underperforms. A mediocre page with excellent internal linking can overperform.

## Principles

### 1. No orphan pages
Every indexable page should have at least one crawlable internal link pointing to it from another indexable page.

### 2. Important pages should be close to the homepage
Target:
- Top commercial pages: within **1-3 clicks** from homepage
- Main hubs: within **1-2 clicks**
- Supporting content: ideally within **3-4 clicks**

### 3. Use descriptive anchors
Anchor text should tell both users and search engines what the destination is about.

Good:
- `compare Logic Pro and Pro Tools`
- `vocal mastering guide`
- `pricing for independent artists`

Bad:
- `click here`
- `learn more`
- `this page`
- raw URLs

### 4. Link in context, not only nav
Contextual body links carry more topical meaning than global nav/footer links.

### 5. Build hub-and-spoke structures
A strong hub page links to related spokes, and spokes link back to the hub and sideways to related spokes where useful.

## Recommended patterns

## Hub → spoke model

Example topic cluster:

- Hub: `/vocal-production`
- Spokes:
  - `/blog/how-to-master-vocals`
  - `/blog/best-vocal-compressor-plugins`
  - `/blog/vocal-eq-cheatsheet`
  - `/compare/logic-pro-vs-pro-tools-for-vocals`

Linking rules:
- Hub links to all priority spokes
- Each spoke links back to hub
- Related spokes link to each other where natural

## Commercial → educational → commercial loop

For SaaS/e-commerce/content sites:
- Feature pages link to guides and use cases
- Guides link back to product/feature pages
- Comparison pages link to pricing/demo/signup pages

This helps both rankings and conversion.

## Breadcrumbs

Breadcrumbs help:
- users understand hierarchy
- search engines understand structure
- internal linking depth

Example:
- Home > Blog > Mixing > Vocal EQ Cheatsheet
- Home > Features > Audio Converter
- Home > Docs > API > Authentication

Add `BreadcrumbList` schema where appropriate.

## Related links modules

Useful modules:
- Related articles
- Related docs pages
- Related integrations
- Related tools
- Compare with [X]
- Alternatives to [Competitor]

Rules:
- Keep related links genuinely related
- Avoid giant unrelated link dumps
- Prefer 3-8 strong links over 30 weak ones

## Navigation layers

### Global navigation
Use for:
- Major commercial pages
- Main category hubs
- Docs/blog top-level hubs
- Pricing/about/contact

### Secondary navigation
Use within sections:
- Docs sidebar
- Blog category pages
- Product sub-nav

### In-content links
Use for:
- Supporting concept references
- Conversion paths
- Topic cluster reinforcement

### Footer links
Use for:
- Utility pages
- legal pages
- secondary discovery

Do not rely on footer-only links to make an important page rank.

## Anchor text guidance

### Best practices
- Be specific
- Use natural language
- Vary anchors slightly across pages
- Match destination intent
- Keep anchors short and clear

### Avoid
- Repeating the exact same keyword anchor unnaturally across dozens of pages
- Over-optimized anchors stuffed with modifiers
- Generic CTA-only anchors everywhere

Good anchor variations for one destination:
- `programmatic SEO guide`
- `how programmatic SEO works`
- `scaling landing pages with programmatic SEO`

## Link quantity guidelines

Not strict rules, but useful defaults:

| Page type | Suggested contextual links out |
|---|---|
| Blog post | 3-8 |
| Feature page | 3-6 |
| Docs page | 5-15 |
| Hub page | 10-50 depending on scope |
| Comparison page | 3-8 |

Too few = isolated.
Too many = diluted and noisy.

## Identifying orphans

Using a crawler is easiest, but manually think in sets:
- every new blog post should appear in blog index, category page, and at least one related post
- every new feature should appear in feature index and relevant use-case pages
- every comparison page should be linked from at least one alternatives/comparison hub and relevant product pages

## Common internal linking problems

- **Orphan pages**
- **Important pages only in XML sitemap, nowhere in nav/content**
- **Everything linked only from footer**
- **Generic anchor text across site**
- **Deep pages buried 6+ clicks down**
- **Hub pages that don't actually link to spokes**
- **Pagination-only discovery for important content**
- **Tag pages cannibalizing better hubs**
- **Broken internal links**
- **JS-only links not rendered in HTML**

## Link discovery and JS caveat

Search engines are better at rendering JS than before, but crawl discovery is still safest when links exist in the server-rendered HTML.

Prefer real `<a href="...">` links over click handlers or client-only navigation wrappers that do not render anchors in HTML.

## Internal linking by site type

### SaaS
Must connect:
- homepage → features → use cases → pricing
- feature pages ↔ integrations ↔ templates/docs
- blog guides → relevant features and signup/demo pages
- competitor pages → comparison hub + product pages + pricing

### E-commerce
Must connect:
- homepage → categories → subcategories → products
- product pages ↔ related products / accessories
- buying guides → category pages
- brands ↔ products ↔ category hubs

### Content site
Must connect:
- category hubs → articles
- pillar pages ↔ supporting articles
- evergreen posts updated with links to newer relevant content

### Docs site
Must connect:
- getting started → core concepts → task pages → API reference
- API endpoints ↔ guides that use them
- versioned docs should make canonical/current version obvious

## Link priority system

When adding links, prioritize destination pages that are:
1. Revenue-driving
2. Strategic category hubs
3. Already close to ranking on page 1/page 2
4. Newly published and needing discovery
5. Frequently referenced as prerequisites

## Audit output format

### Critical
- Orphaned revenue pages
- Orphaned new public routes
- Broken internal links in key templates

### High
- Important pages deeper than 4 clicks
- Hub pages missing links to core spokes
- Generic anchor text across major sections

### Medium
- Weak related content modules
- Breadcrumb gaps
- Over-linked pages with noisy modules

## Quick checklist for any new page

- [ ] Linked from at least one existing page
- [ ] Added to relevant hub/index page
- [ ] Links out to related pages
- [ ] Uses descriptive anchors
- [ ] Not dependent on JS-only navigation
- [ ] Included in breadcrumb trail if hierarchy applies
