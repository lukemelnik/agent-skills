# SEO Audit Checklist

A comprehensive audit framework. Work through this in priority order. Don't fix step 4 if step 1 is broken.

## Critical limitation: schema detection

`web_fetch` and `curl` strip `<script>` tags during HTML conversion, including `<script type="application/ld+json">`. They CANNOT detect schema injected by JavaScript (which is how Yoast, RankMath, AIOSEO, and most CMS plugins work).

**To accurately check for schema markup, use one of these:**
1. Browser tool — render the page and run `document.querySelectorAll('script[type="application/ld+json"]')`
2. [Google Rich Results Test](https://search.google.com/test/rich-results) — renders JS
3. Screaming Frog export — if the client provides one

**Reporting "no schema found" based on `web_fetch` alone is a false finding.**

---

## 1. Crawlability and indexation

### robots.txt

Check `/robots.txt` exists and:
- [ ] Doesn't accidentally block important pages or directories
- [ ] Lists the sitemap (`Sitemap: https://example.com/sitemap.xml`)
- [ ] Allows AI search bots if AI visibility is a goal (see `ai-bot-config.md`)
- [ ] Blocks only what should be blocked (admin, search results, infinite parameter URLs)
- [ ] Uses correct syntax — invalid lines silently fail

Common mistakes:
- `Disallow: /` (blocks everything — usually unintentional in production)
- Blocking `/wp-content/` or `/static/` (blocks CSS/JS, breaks rendering for Googlebot)
- Blocking parameter URLs that other pages link to internally
- Forgetting to update after restructuring URLs

### XML sitemap

- [ ] Exists at standard location (`/sitemap.xml` or `/sitemap_index.xml`)
- [ ] Returns HTTP 200 and valid XML
- [ ] Listed in robots.txt
- [ ] Submitted in Google Search Console
- [ ] Contains only canonical, indexable URLs (no noindex, no redirects, no 404s, no HTTP)
- [ ] Has accurate `<lastmod>` dates (not all the same date)
- [ ] Under 50,000 URLs per file (split with sitemap index above this)
- [ ] All URLs match the canonical domain (consistent www/non-www, https)

Skip these — Google ignores them: `<priority>`, `<changefreq>`.

### Site architecture

- [ ] Important pages within 3 clicks of homepage
- [ ] Logical hierarchy (`/category/subcategory/page`)
- [ ] No orphan pages (every page has at least one internal link pointing to it)
- [ ] Internal linking is descriptive (not "click here")
- [ ] Breadcrumbs implemented for nested pages

For large sites, also check:
- [ ] Crawl budget: parameter URLs under control
- [ ] Faceted navigation handled (noindex,follow on filter combos)
- [ ] Pagination has rel=next/prev OR is replaced with infinite scroll + paginated fallback
- [ ] Session IDs not in URLs

### Indexation status

Check these:
- [ ] `site:example.com` in Google → expected page count?
- [ ] Search Console Pages report → Indexed vs Not indexed
- [ ] Compare crawled URLs vs sitemap URLs vs indexed count

Common issues:
| Issue | Fix |
|---|---|
| `noindex` on important pages | Remove the noindex tag |
| Wrong canonical (pointing to homepage) | Self-reference or correct canonical |
| Redirect chain (more than 1 hop) | Update internal links to final URL |
| Soft 404 | Page returns 200 but Google sees no content. Usually empty state during SSR |
| Duplicate content without canonical | Add `<link rel="canonical">` |
| Server error (5xx) | Real bug, fix immediately |

### Canonicalization

- [ ] Every page has a canonical tag
- [ ] Self-referencing canonicals on unique pages
- [ ] HTTP redirects to HTTPS (301, not 302)
- [ ] Consistent www vs non-www (one redirects to the other)
- [ ] Consistent trailing slash policy (with or without — pick one and enforce)
- [ ] Canonical points to absolute URL, not relative
- [ ] Canonical matches the URL in the sitemap

---

## 2. Technical foundations

### Core Web Vitals

See `core-web-vitals.md` for thresholds and optimization details.

Quick check:
- [ ] LCP ≤ 2.5s (75th percentile, mobile)
- [ ] INP ≤ 200ms (75th percentile, mobile)
- [ ] CLS ≤ 0.1 (75th percentile, mobile)

Measure with:
- PageSpeed Insights ([web tool](https://pagespeed.web.dev/) or curl-based PSI API)
- Search Console → Core Web Vitals report (real user data)

### HTTPS and security

- [ ] HTTPS across the entire site
- [ ] Valid SSL certificate (not expired, correct domain)
- [ ] No mixed content warnings (HTTPS pages loading HTTP resources)
- [ ] HTTP redirects to HTTPS (301)
- [ ] HSTS header (bonus, not required)

### Mobile

- [ ] Responsive design (not separate `m.` site)
- [ ] Tap target sizes adequate (48px minimum)
- [ ] Viewport meta tag configured (`<meta name="viewport" content="width=device-width, initial-scale=1">`)
- [ ] No horizontal scroll on mobile
- [ ] Same content on mobile as desktop (mobile-first indexing)
- [ ] Font sizes readable without zoom (16px minimum body text)

### URL structure

- [ ] Readable, descriptive (`/features/analytics`, not `/f/a123`)
- [ ] Hyphens, not underscores
- [ ] Lowercase only (uppercase paths should redirect)
- [ ] Short but descriptive
- [ ] No unnecessary parameters
- [ ] Reflects site hierarchy

---

## 3. On-page SEO

### Title tags

- [ ] Unique title per page
- [ ] Primary keyword near the beginning
- [ ] 30-60 characters (Google truncates around 60)
- [ ] Compelling (not just keyword-stuffed)
- [ ] Brand at the end (or omitted — Google often appends it anyway)
- [ ] No duplicate titles across pages

Common issues:
- Generic ("Home", "Untitled")
- Way too long (truncated mid-word)
- Same title on every page
- Missing entirely

### Meta descriptions

- [ ] Unique per page
- [ ] 120-160 characters
- [ ] Includes primary keyword naturally
- [ ] Has a clear value proposition or CTA
- [ ] Not auto-generated from page content (or if so, well-curated)

### Heading structure

- [ ] Exactly one H1 per page
- [ ] H1 contains the primary keyword
- [ ] Logical hierarchy (H1 → H2 → H3, no skipping levels)
- [ ] Headings describe content, not used for styling

### Images

- [ ] Descriptive file names (`product-blue-large.jpg`, not `IMG_1234.jpg`)
- [ ] Alt text on all non-decorative images
- [ ] Alt text describes the image (not "image" or filename or keywords)
- [ ] Compressed file sizes
- [ ] Modern formats (WebP, AVIF) where supported
- [ ] Lazy loading on below-fold images
- [ ] Width and height attributes set (prevents CLS)
- [ ] Responsive (`srcset` or `<picture>`)

### Internal linking

- [ ] Important pages well-linked from other important pages
- [ ] Anchor text is descriptive
- [ ] No broken internal links
- [ ] 5-10 internal links per 1000 words of content (rough guide)
- [ ] No orphan pages

---

## 4. Content quality

See `content-quality.md` for word counts and `eeat-framework.md` for E-E-A-T detail.

### Per-page checks
- [ ] Answers the search intent
- [ ] Sufficient depth (see `content-quality.md` for minimums by page type)
- [ ] Better than top-ranking competitors
- [ ] Original insights, data, or examples
- [ ] Author credentials visible (E-E-A-T)
- [ ] Last updated date visible

### Site-wide checks
- [ ] No keyword cannibalization (multiple pages targeting the same query)
- [ ] No thin content (tag pages with 1 result, empty category pages, etc.)
- [ ] No duplicate content (or canonical tags pointing to the original)
- [ ] No doorway pages

---

## 5. Common issues by site type

### SaaS / product sites
- Product/feature pages too thin on content
- Blog not internally linked to product pages
- Missing comparison and alternative pages
- No glossary or educational content
- Pricing hidden behind "contact sales" (kills AI agent discoverability)

### E-commerce
- Thin category pages (just product grid, no unique content)
- Duplicate product descriptions across variants
- Missing product schema markup
- Faceted navigation creating duplicate URLs
- Out-of-stock pages 404 instead of staying live with "out of stock" status

### Content / blog sites
- Outdated content not refreshed
- Keyword cannibalization across similar posts
- No topical clustering / hub-and-spoke
- Poor internal linking
- Missing author bio pages
- No publication or update dates visible

### Local business
- Inconsistent NAP (Name, Address, Phone) across web
- Missing LocalBusiness schema
- No Google Business Profile optimization
- Missing dedicated location pages
- No local content or community signals

---

## Output format

Group findings by priority. For each:

### [Priority: Critical | High | Medium | Low] — [Issue title]

**Issue:** What's wrong (one sentence)

**Impact:** Why it matters (SEO, conversions, AI visibility, etc.)

**Evidence:** How you verified it (file path + line, screenshot, tool output)

**Fix:** Specific actionable steps. Include code where relevant.

---

## Tools

### Free
- [Google Search Console](https://search.google.com/search-console) — essential
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [Rich Results Test](https://search.google.com/test/rich-results) — renders JS, accurate schema detection
- [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [Schema.org Validator](https://validator.schema.org/)

### Paid (if available)
- Screaming Frog (renders JS, exports everything)
- Ahrefs / Semrush (backlinks, keyword research)
- Sitebulb (technical audits)
- ContentKing (continuous monitoring)

### From this skill
- `references/google-api-curl.md` — curl-based access to GSC, PSI, CrUX (no third-party deps)
