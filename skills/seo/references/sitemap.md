# Sitemap Reference

XML sitemap rules, generation patterns, and audit steps.

## What a sitemap is

A sitemap is a machine-readable list of canonical URLs you want search engines to crawl and index.

It does **not** guarantee indexing. It helps discovery, prioritization, and monitoring.

## Core rules

Only include URLs that are:
- Indexable (`200` status)
- Canonical to themselves
- Not blocked by `robots.txt`
- Not `noindex`
- Valuable enough to rank

Do **not** include:
- Redirects (`3xx`)
- Errors (`4xx`/`5xx`)
- Parameter/facet duplicates unless intentionally indexable
- Thin internal search pages
- Staging URLs
- URLs canonicalized elsewhere

## Limits

Per XML sitemap file:
- **50,000 URLs max**
- **50 MB uncompressed max**

If you exceed either limit, split into multiple sitemap files and use a sitemap index.

## Basic XML format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-04-08</lastmod>
  </url>
  <url>
    <loc>https://example.com/features/audio-converter</loc>
    <lastmod>2026-04-08</lastmod>
  </url>
</urlset>
```

## Sitemap index format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemaps/pages.xml</loc>
    <lastmod>2026-04-08</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemaps/blog.xml</loc>
    <lastmod>2026-04-08</lastmod>
  </sitemap>
</sitemapindex>
```

## Recommended segmentation

Split by content type when the site is medium/large:

- `pages.xml`
- `blog.xml`
- `docs.xml`
- `products.xml`
- `categories.xml`
- `images.xml` (optional)

Benefits:
- Easier debugging
- Faster pinpointing of indexation problems
- Cleaner Search Console reporting

## What to put in `<lastmod>`

Use the real last meaningful update date for the page content.

Good uses:
- Article content updated
- Product price/specs materially changed
- Docs page rewritten
- Category intro significantly changed

Bad uses:
- Build time on every deploy
- Timestamp updated even though content did not change
- File generation time instead of page update time

Fake `lastmod` data makes the sitemap less trustworthy.

## Optional fields

`<changefreq>` and `<priority>` are effectively ignored by Google. Do not spend time maintaining them.

Use only:
- `<loc>`
- `<lastmod>` when you can do it accurately

## Image, video, and news sitemaps

### Image sitemap
Useful for image-heavy sites when discovery matters.

### Video sitemap
Useful if video pages are a core traffic channel.

### News sitemap
Only for news publishers. Tight freshness requirements.

For most sites, a normal XML sitemap is enough.

## hreflang and sitemaps

For international sites, hreflang can be declared in:
- HTML head
- HTTP headers
- XML sitemap

Pick one system and keep it consistent. Sitemap hreflang is useful at scale, but HTML is usually easier to verify during development.

## robots.txt entry

Always expose the sitemap in `robots.txt`:

```txt
User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
```

If you use a sitemap index, point to the index file.

## Search Console submission

Submit the sitemap in Google Search Console under **Indexing → Sitemaps**.

Then monitor:
- Discovered URLs
- Successfully read vs fetch errors
- Indexed vs submitted gaps
- Sudden drops after deploys

## Sitemap quality checks

For any sitemap audit, verify:

### 1. Fetchability
```bash
curl -I https://example.com/sitemap.xml
```
Expect:
- `200 OK`
- `Content-Type: application/xml` or `text/xml`
- Not blocked behind auth

### 2. URL count sanity
```bash
curl -s https://example.com/sitemap.xml | grep -o "<loc>" | wc -l
```
Check whether the count matches what the site should roughly expose.

### 3. Canonical alignment
Sample a few URLs from the sitemap and verify:
- page returns `200`
- canonical points to itself
- no `noindex`

### 4. Freshness
Confirm `lastmod` values look believable and vary by page.

### 5. Coverage gaps
Ask:
- Are important templates missing?
- Are blog posts included?
- Are new product pages missing?
- Are deleted URLs still present?

## Common sitemap mistakes

- **Including non-canonical URLs**
- **Including noindex pages**
- **Including redirects**
- **Forgetting newly launched route groups**
- **Static sitemap that goes stale**
- **Wrong host or protocol** (`http` instead of `https`, `www` vs non-`www` mismatch)
- **Staging URLs leaked into production sitemap**
- **Every page using today's date as `lastmod`**
- **Missing sitemap in `robots.txt`**
- **Huge monolithic sitemap** when splitting would be easier to debug

## Static vs dynamic generation

### Static sitemap
Good for:
- Small marketing sites
- Mostly fixed pages
- Infrequent updates

Risk:
- Easy to forget updates

### Dynamic sitemap
Good for:
- Blogs
- Docs
- E-commerce
- SaaS apps with public collections
- Any site with ongoing content creation

Preferred for most non-trivial sites.

## Page eligibility checklist

Before adding a route/template to the sitemap:
- [ ] Returns `200`
- [ ] Meant to rank
- [ ] Self-canonical
- [ ] Not blocked in `robots.txt`
- [ ] Not `noindex`
- [ ] Has sufficient content quality
- [ ] Linked internally from somewhere

## Priority order when fixing sitemap issues

### Critical
- Sitemap missing entirely
- Sitemap returns non-200
- Sitemap includes large volumes of redirects/errors/noindex URLs
- Wrong domain/protocol in sitemap URLs

### High
- Important page groups missing
- Static sitemap badly out of date
- Fake `lastmod` across entire site

### Medium
- Overly large unsplit sitemap
- Missing robots.txt entry
- No segmentation by content type on larger sites

## Framework notes

Use the relevant stack guide for implementation details:
- `stack-nextjs.md`
- `stack-tanstack-start.md`
- `stack-astro.md`
- `stack-remix.md`
- `stack-nuxt.md`
- `stack-sveltekit.md`
- `stack-wordpress.md`
- `stack-plain-html.md`
