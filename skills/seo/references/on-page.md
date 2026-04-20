# On-Page SEO Reference

Title tags, meta descriptions, headings, URL structure, and image optimization. The fundamentals that every public page needs.

## Title tags

The most important on-page SEO element. Affects rankings AND CTR.

### Requirements
| Aspect | Rule |
|---|---|
| Length | 30–60 characters (Google truncates around 60) |
| Uniqueness | Every page must have a unique title |
| Primary keyword | Near the beginning |
| Brand name | At the end (or omitted — Google often appends it) |
| Format | `Primary Keyword - Secondary Keyword | Brand` |

### Patterns by page type

| Page type | Pattern | Example |
|---|---|---|
| Homepage | `[Brand] - [Tagline]` or `[Brand] | [Category]` | `Example Co - Music Production Management` |
| Product/feature | `[Feature] | [Brand]` | `Audio Converter - Free Online Tool | Example Co` |
| Blog post | `[Title] - [Brand Blog]` or just `[Title]` | `How to Master Vocals at Home - Example Co Blog` |
| Category | `[Category] - [Modifier] | [Brand]` | `Songwriting Tools - Free and Premium | Example Co` |
| Comparison | `[A] vs [B]: [Hook] | [Brand]` | `Logic Pro vs Pro Tools: Which to Pick in 2026 | Example Co` |
| Documentation | `[Topic] - [Brand] Docs` | `Creating Your First Project - Example Co Docs` |

### Good vs bad examples

**Good:**
- `Free MP3 Metadata Editor — Edit Tags Online | Example Co` (53 chars, keyword first, brand at end)
- `How to Master Vocals at Home in 2026 | Example Co` (50 chars)
- `Logic Pro vs Pro Tools: Honest Comparison [2026]` (49 chars)

**Bad:**
- `Home` (4 chars, generic, useless)
- `Best MP3 Tag Editor and Music Tag Editor and Free Music Metadata Editor Online for All Music Files in 2026` (way too long, keyword stuffed)
- `Untitled` (literally no thought)
- `Example Co - Example Co - Example Co Music Tools` (brand stuffing)

### Common mistakes
- **Same title on every page** (often happens with bad CMS templates)
- **Generic** ("Page", "Welcome", "Untitled")
- **Truncated mid-word** (over 60 chars)
- **Keyword stuffing** (`Best plumber Austin Texas plumbing services Austin TX best plumber`)
- **Missing entirely** (just `<title></title>` or no title tag)
- **Misleading** (title doesn't match page content — kills CTR and trust)

### Title tag in HTML
```html
<title>Free MP3 Metadata Editor — Edit Tags Online | Example Co</title>
```

For per-stack implementation, see `stack-*.md` references.

## Meta descriptions

Doesn't directly affect rankings, but affects CTR significantly. Google rewrites ~70% of meta descriptions in SERPs, but yours becomes the fallback and a strong signal.

### Requirements
| Aspect | Rule |
|---|---|
| Length | 120–160 characters (Google truncates around 155-160) |
| Uniqueness | Every page must have a unique description |
| Primary keyword | Include naturally (Google bolds it in SERPs) |
| Value proposition | What does the user get? |
| Call to action | Ideal but optional |

### Patterns

**Product/feature pages:**
```
[What it does] for [target audience]. [Key benefit/differentiator]. [CTA].
```
Example: `Edit MP3 metadata in your browser. Add album art, ID3 tags, and ISRC codes for free — no upload required. Try it now.`

**Blog posts:**
```
[Promise of value]. [Specific detail]. [Why this matters].
```
Example: `Learn how to master vocals at home with consumer gear. Step-by-step guide covering EQ, compression, and de-essing for vocal recordings.`

**Category pages:**
```
[What's listed]. [Filter/value angle]. [Quantity if relevant].
```
Example: `Free music production tools for independent artists. Audio converter, metadata editor, drum machine, and more — no signup required.`

### Good vs bad examples

**Good:**
- `Convert audio files online for free. Supports MP3, WAV, FLAC, M4A, OGG, and more. No upload to servers — runs entirely in your browser.` (139 chars)
- `Manage songs, contacts, and production workflow in one place. Built for producers, mixers, and mastering engineers. Free 14-day trial.` (138 chars)

**Bad:**
- `Welcome to our website` (22 chars, no value)
- `[no description set]` (CMS default)
- `Example Co Example Co Example Co music music music tools tools` (keyword stuffing)
- A 250-character description that gets truncated mid-sentence

### Common mistakes
- **Auto-generated from page content** without curation (often nonsense)
- **Missing entirely** (Google creates one from page content, but yours sets the default)
- **Generic** (could apply to any page)
- **Way too long** or way too short
- **Misleading** (doesn't match page content)
- **No CTA when one would help** (especially for landing pages)

## Heading structure

### Rules
- **Exactly one H1 per page** (not zero, not two)
- **H1 contains the primary keyword** (or close variant)
- **Logical hierarchy:** H1 → H2 → H3 → H4. No skipping levels (H1 → H3 is bad)
- **Headings describe content,** not used purely for styling
- **H2s for major sections,** H3s for subsections
- **Headings should help scanning** — readers and AI extract from headings

### Good structure
```
H1: Complete Guide to Mastering Vocals at Home
  H2: What you'll need
  H2: Setting up your DAW
    H3: Choosing the right plugins
    H3: Buffer size and latency
  H2: The mastering process
    H3: EQ
    H3: Compression
    H3: De-essing
    H3: Limiting
  H2: Common mistakes
  H2: Frequently asked questions
```

### Bad structure
```
H1: Welcome
  H3: Some content (skipped H2)
H1: Another H1 (multiple H1s)
  H2: Section
    H4: Subsection (skipped H3)
```

### H2/H3 patterns for AI search
Match heading text to how people phrase queries:

**Bad headings (don't match queries):**
- `Our Approach`
- `Methodology`
- `Section 3`
- `More Information`

**Good headings (query-matched):**
- `What is vocal mastering?`
- `How to compress vocals at home`
- `Logic Pro vs Pro Tools for vocals`
- `Best vocal compression plugins for beginners`

See `ai-content-patterns.md` for more on query-matched headings.

## URL structure

### Principles
1. **Readable by humans** — `/features/audio-converter` not `/f/a123`
2. **Hyphens, not underscores** — `audio-converter` not `audio_converter`
3. **Lowercase only** — `/About` should redirect to `/about`
4. **Reflects hierarchy** — URL path matches site structure
5. **Consistent trailing slash policy** — pick one (with or without) and enforce
6. **Short but descriptive** — long enough to convey meaning, short enough to read
7. **No unnecessary parameters** — `/blog/post` not `/blog?id=123`
8. **Stable** — URLs shouldn't change. If they do, 301 redirect always.

### URL patterns by page type

| Page type | Pattern | Example |
|---|---|---|
| Homepage | `/` | `example.com` |
| Feature/product | `/[category]/[name]` | `/features/audio-converter` |
| Blog post | `/blog/[slug]` | `/blog/mastering-vocals-at-home` |
| Blog category | `/blog/category/[slug]` | `/blog/category/mixing` |
| Documentation | `/docs/[section]/[page]` | `/docs/getting-started/installation` |
| Pricing | `/pricing` | `/pricing` |
| Legal | `/[name]` | `/privacy`, `/terms` |
| Comparison | `/compare/[a]-vs-[b]` or `/[a]-vs-[b]` | `/compare/logic-pro-vs-pro-tools` |
| Alternative | `/alternatives/[competitor]` | `/alternatives/notion` |
| Integration | `/integrations/[name]` | `/integrations/spotify` |
| Template | `/templates/[slug]` | `/templates/album-launch` |
| Customer story | `/customers/[slug]` | `/customers/acme-corp` |
| Landing page | `/[slug]` or `/lp/[slug]` | `/free-trial` |

### Common mistakes
- **Dates in blog URLs:** `/blog/2024/01/15/post-title` adds no value, makes URLs long. Use `/blog/post-title`.
- **Over-nesting:** `/products/category/subcategory/item/detail` is too deep. Flatten.
- **Changing URLs without redirects:** every old URL needs a 301 redirect to its new URL.
- **IDs in URLs:** `/product/12345` is not human-readable. Use slugs.
- **Query parameters for content:** `/blog?id=123` should be `/blog/post-title`.
- **Inconsistent patterns:** don't mix `/features/x` and `/product/y`. Pick one parent.
- **Uppercase mixed in:** `/About` and `/about` create duplicate content unless redirected.
- **Trailing slash inconsistency:** `/page/` and `/page` create duplicates. Pick one.

### Breadcrumb-URL alignment
Breadcrumb trail should mirror the URL path:

| URL | Breadcrumb |
|---|---|
| `/features/audio-converter` | Home > Features > Audio Converter |
| `/blog/mastering-vocals` | Home > Blog > Mastering Vocals |
| `/docs/api/auth` | Home > Docs > API > Authentication |

## Image optimization

### Requirements
- **Descriptive filenames** — `vocal-eq-cheatsheet.jpg` not `IMG_1234.jpg`
- **Alt text** on all non-decorative images
- **Width and height** attributes set (prevents CLS)
- **Compressed** file sizes
- **Modern formats** (WebP, AVIF) where supported, with fallback
- **Lazy loading** on below-fold images (`loading="lazy"`)
- **Responsive** (`srcset` or `<picture>`)

### Alt text rules
- **Length:** 10–125 characters
- **Describes the image content,** not "image" or filename
- **Includes keywords** naturally where relevant
- **Decorative images:** use `alt=""` or `role="presentation"` to skip

### Good vs bad alt text

**Good:**
- `Close-up of audio mixing console showing EQ knobs adjusted for vocal frequencies`
- `Project dashboard showing five active song projects with status indicators`
- `Drum machine interface with kick, snare, and hi-hat patterns programmed`

**Bad:**
- `image.jpg` (filename, not description)
- `vocal vocal vocal mixing mixing` (keyword stuffing)
- `Click here` (not descriptive)
- `Image of a thing` (uselessly vague)
- `` (empty when image is meaningful)

### Image HTML pattern
```html
<img
  src="vocal-eq-cheatsheet.jpg"
  alt="Vocal EQ cheatsheet showing frequency ranges for low cut, body, presence, and air"
  width="1200"
  height="800"
  loading="lazy"
  decoding="async"
/>
```

For above-the-fold hero images, omit `loading="lazy"` and add `fetchpriority="high"`:

```html
<img
  src="hero.webp"
  alt="..."
  width="1920"
  height="1080"
  fetchpriority="high"
/>
```

## Open Graph and Twitter cards

For social sharing previews. Not direct ranking factors but affect click-throughs from social.

```html
<!-- Open Graph (Facebook, LinkedIn, Slack, Discord, etc.) -->
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Page description, 1-2 sentences.">
<meta property="og:image" content="https://example.com/og-image.jpg">
<meta property="og:url" content="https://example.com/page">
<meta property="og:type" content="article"> <!-- or website, product, etc. -->
<meta property="og:site_name" content="Brand Name">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Page Title">
<meta name="twitter:description" content="Page description.">
<meta name="twitter:image" content="https://example.com/og-image.jpg">
<meta name="twitter:site" content="@brand">
```

### OG image best practices
- **Dimensions:** 1200 × 630 (1.91:1 ratio)
- **File size:** under 1 MB ideally, under 5 MB max
- **Format:** JPEG or PNG (not WebP — some clients don't support it)
- **Text in image:** large enough to read at thumbnail size
- **Branded** but not just a logo — include the page topic
- **Per-page** ideally, fall back to a default if needed

### Common mistakes
- Same OG image on every page
- OG image is just the company logo (boring, low CTR)
- OG image too small (gets pixelated)
- Missing `og:image` (no preview shows in shares)
- Wrong dimensions (gets cropped weirdly)

## Canonical tags

Every page needs a canonical tag. See `audit-checklist.md` for canonical rules.

```html
<link rel="canonical" href="https://example.com/page">
```

- **Self-referencing canonicals** on unique pages (the page points to itself)
- **Cross-referencing canonicals** when content is duplicated (the duplicate points to the original)
- **Absolute URLs** only, not relative
- **Match the URL in the sitemap**
- **Match the protocol/host you want indexed** (https vs http, www vs non-www)

## Robots meta tag

Per-page indexing control. Most pages should NOT have a robots meta tag (defaults to `index, follow`).

```html
<!-- Default behavior (no tag needed) -->
<meta name="robots" content="index, follow">

<!-- Don't index but follow links (e.g., thank-you pages, search results) -->
<meta name="robots" content="noindex, follow">

<!-- Don't index AND don't follow (rare — usually a mistake) -->
<meta name="robots" content="noindex, nofollow">

<!-- Don't show snippet in SERP -->
<meta name="robots" content="nosnippet">

<!-- Don't show snippet longer than X chars -->
<meta name="robots" content="max-snippet:160">
```

### When to noindex
- Internal search results pages
- Filter/facet URLs that don't add unique value
- Thank-you pages after form submission
- Print versions of pages
- Duplicate content where canonical isn't enough
- Login/admin pages

### When NOT to noindex
- Pages you want ranking
- Anything you'd link in your sitemap
- Pages with substantial unique content
