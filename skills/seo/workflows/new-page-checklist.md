# New Page Checklist

Use before deploying any new public page.

## Goal

Prevent common SEO misses on brand-new routes.

## Checklist

### Metadata
- [ ] Unique title tag
- [ ] Unique meta description
- [ ] Canonical tag points to the intended final URL
- [ ] OG/Twitter tags exist if social sharing matters

### Indexation
- [ ] Page returns `200`
- [ ] Not accidentally `noindex`
- [ ] Not blocked in `robots.txt`
- [ ] Intended final URL shape is stable

### Content
- [ ] H1 clearly matches the page intent
- [ ] Main content is in server-rendered HTML where possible
- [ ] Content is not thin/generic for its page type
- [ ] Dates/authors shown where relevant

### Internal linking
- [ ] Linked from at least one existing page
- [ ] Added to the relevant hub/index page
- [ ] Links out to related pages with descriptive anchors
- [ ] Included in breadcrumb trail if hierarchical

### Sitemap
- [ ] Included in sitemap if it should rank
- [ ] Excluded from sitemap if it should not rank
- [ ] `lastmod` behavior is correct if dynamic

### Schema
- [ ] Relevant schema type added if appropriate
- [ ] Schema matches visible content
- [ ] No deprecated/restricted schema misuse
- [ ] JSON-LD validates

### Performance
- [ ] No obvious LCP killers on first paint
- [ ] Images sized and compressed
- [ ] Width/height on images to avoid CLS

## Final rule

If the page is meant to rank, it should not launch as:
- orphaned
- thin
- missing metadata
- absent from sitemap
- hidden behind client-only rendering
