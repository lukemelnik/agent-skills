# Site Architecture Reference

How to structure a site so search engines and users can understand, navigate, and prioritize it.

## Goals of good architecture

A strong site architecture makes it obvious:
- what the site is about
- which sections matter most
- how topics relate to each other
- where important commercial pages live
- how a crawler can reach every indexable page efficiently

## Core principles

### 1. Clear hierarchy
Most sites should follow a predictable structure:

- Homepage
- Section hubs / categories
- Subcategory hubs (if needed)
- Detail pages

Example:
- `/`
- `/features`
- `/features/audio-tools`
- `/features/audio-converter`

### 2. Keep depth shallow
Important pages should not be buried.

Targets:
- Main commercial pages: 1-3 clicks from homepage
- Main content hubs: 1-2 clicks
- Most indexable pages: ideally within 4 clicks

### 3. One intent per URL
Each page should have a clear job:
- category hub
- feature page
- product page
- comparison page
- tutorial
- docs page

If one URL tries to serve five different intents, it becomes muddled and hard to rank.

### 4. URL structure should mirror hierarchy
Users and search engines should infer page role from the path.

Good:
- `/blog/mastering-vocals-at-home`
- `/docs/api/authentication`
- `/compare/notion-vs-example-co`

Bad:
- `/page?id=123`
- `/x/y/z/q`
- unrelated mixed patterns across the site

### 5. Section hubs matter
Every meaningful content cluster should usually have a hub page.

Examples:
- `/features`
- `/blog`
- `/docs`
- `/compare`
- `/integrations`
- `/templates`

Hub pages help:
- distribute internal authority
- group related pages
- create crawl paths
- target broad head terms

## Common architecture models

## Marketing / SaaS
Typical hierarchy:
- `/`
- `/features`
- `/features/[feature]`
- `/use-cases`
- `/use-cases/[audience]`
- `/integrations`
- `/integrations/[partner]`
- `/compare` or `/alternatives`
- `/pricing`
- `/blog`
- `/docs`

## E-commerce
Typical hierarchy:
- `/`
- `/categories`
- `/category/[slug]`
- `/category/[slug]/[sub-category]`
- `/product/[slug]`
- `/brands/[slug]`
- `/guides/[slug]`

## Content / media
Typical hierarchy:
- `/`
- `/topics/[slug]` or `/category/[slug]`
- `/blog/[slug]`
- `/authors/[slug]`

## Docs / developer site
Typical hierarchy:
- `/docs`
- `/docs/getting-started`
- `/docs/guides/[slug]`
- `/docs/api/[slug]`
- `/changelog`

## Architecture requirements by section

### Homepage
Should link to:
- top commercial pages
- primary section hubs
- brand-defining content
- pricing/contact if relevant

### Section hub pages
Should:
- explain the section's topic or purpose
- link to priority child pages
- use clean, scannable hierarchy
- not be empty "list only" shells when ranking matters

### Detail pages
Should:
- belong clearly to a section
- link back to parent hub
- link sideways to related pages where natural

## Avoiding cannibalization through architecture

Cannibalization often starts as an architecture problem.

Bad example:
- `/music-tools`
- `/tools-for-music`
- `/free-music-tools`
- `/music-production-tools`

These may all target overlapping intent.

Better:
- `/music-production-tools` as hub
- children under it or clearly differentiated subpages

If multiple pages target the same main intent, choose:
- one primary ranking page
- supporting pages with narrower intent
- internal links reinforcing the primary page

## Faceted navigation and filters

E-commerce and directory sites often expose filters like:
- color
- size
- genre
- location
- price
- rating

This creates URL explosion.

Rules:
- Only index facet combinations with real search demand and enough unique value
- Noindex or canonical low-value combinations
- Avoid letting every filter URL into the sitemap
- Keep crawl waste under control

Good indexed facet examples:
- `/plugins/vocal-compressor`
- `/studios/los-angeles`

Bad indexed facet examples:
- `/products?color=red&size=m&sort=price_desc&page=7`

## Pagination

Use pagination for large archives when needed. Make sure:
- pages are linked via crawlable anchors
- page 1 is canonical to itself
- paginated pages are indexable if they contain unique discoverable items
- you do not canonical every paginated page to page 1 unless you explicitly want them deindexed

## Search pages

Internal site search result pages are usually poor index targets.

Default:
- `noindex, follow`
- do not include in sitemap

Only make them indexable if they are intentionally curated landing pages with unique value.

## International / multi-region architecture

Common valid patterns:
- subfolders: `/us/`, `/uk/`, `/de/`
- subdomains: `de.example.com`
- ccTLDs: `example.de`

Subfolders are usually simplest operationally.

Requirements:
- proper hreflang
- consistent template parity
- unique localized content where needed
- region-aware pricing/contact/legal details

## Signs of weak architecture

- Important pages buried several layers deep
- No clear hubs
- Page templates added ad hoc with inconsistent paths
- Overlapping route groups targeting the same intent
- Orphan pages only discoverable via sitemap
- Unbounded filter URLs getting crawled
- Category pages with no unique value
- Hard-to-understand nav labels like `Resources` containing everything

## Architecture review checklist

- [ ] Is the primary business model obvious from the main nav?
- [ ] Are top revenue pages within 1-3 clicks?
- [ ] Does each major topic have a hub page?
- [ ] Do URLs reflect hierarchy clearly?
- [ ] Are there redundant sections targeting the same intent?
- [ ] Are filter/search URLs controlled?
- [ ] Are new pages added into existing architecture instead of bolted on?
- [ ] Can a crawler discover all important URLs through links alone?

## Priority fixes

### Critical
- Orphaned or buried money pages
- URL duplication/cannibalization across major sections
- Crawl traps from faceted navigation

### High
- Missing section hubs
- Inconsistent path conventions
- Thin category pages intended to rank

### Medium
- Overly generic nav labels
- Weak sideways linking between related pages
- Excessive nesting without real need
