# Schema Implementation Guide

How to actually add JSON-LD schema to a page across different stacks. For per-stack details, see `stack-*.md` references.

## Format: always JSON-LD

Google explicitly recommends JSON-LD over Microdata and RDFa. Microdata is harder to maintain (requires inline HTML attributes), and RDFa is rarely used. **Always use JSON-LD.**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  ...
}
</script>
```

## Placement

- **Inside `<head>`** — preferred. Google parses `<head>` first.
- **End of `<body>`** — also valid, slightly worse for crawl efficiency on slow connections.
- **Anywhere in `<body>`** — works but unconventional.

For server-rendered pages, place in `<head>`. For client-rendered, see "JS rendering caveat" below.

## Server-side rendering matters

**Per Google's December 2025 JS SEO guidance:** Schema injected via JavaScript may face delayed processing. Time-sensitive markup should be in the initial server-rendered HTML.

| Schema type | Must be SSR? |
|---|---|
| Product (price, availability) | **Yes** — price changes hourly, must be in initial HTML |
| Offer | **Yes** |
| Article (datePublished, dateModified) | **Yes** — affects freshness signals |
| BreadcrumbList | **Yes** — affects crawl path |
| Organization (homepage) | Recommended |
| FAQPage | Recommended |
| VideoObject | Recommended |
| WebSite | Recommended |
| All others | Strong recommendation, JS-injection works but with delay |

**Rule of thumb:** if the schema represents data that affects user clicks (price, rating, availability, last updated), it MUST be SSR.

## Multiple schema types per page: use @graph

Don't add multiple separate `<script>` blocks if they're related. Use `@graph` to combine them into one block with cross-references via `@id`:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://example.com/#organization",
      "name": "Example Co",
      "url": "https://example.com",
      "logo": "https://example.com/logo.png"
    },
    {
      "@type": "WebSite",
      "@id": "https://example.com/#website",
      "url": "https://example.com",
      "name": "Example",
      "publisher": {
        "@id": "https://example.com/#organization"
      }
    },
    {
      "@type": "WebPage",
      "@id": "https://example.com/page#webpage",
      "url": "https://example.com/page",
      "name": "Page Title",
      "isPartOf": {
        "@id": "https://example.com/#website"
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": []
    }
  ]
}
```

Why `@graph` is better:
- Single network request payload
- Cross-referenceable entities via `@id`
- Easier maintenance (one block to update)
- Cleaner DOM

## Common implementation patterns

### Static sites
- Add JSON-LD directly in HTML template
- Use includes/partials for reusable schema (Organization, WebSite)
- Per-page schema in page-specific templates

### React (Next.js, Remix, TanStack Start)
```jsx
function ProductPage({ product }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD"
    }
  };

  return (
    <>
      {/* Framework-specific head injection — see stack-*.md */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {/* Page content */}
    </>
  );
}
```

**Why `dangerouslySetInnerHTML`:** React escapes content inside `<script>` by default, which breaks JSON-LD. `dangerouslySetInnerHTML` is safe here because you control the data — JSON.stringify handles escaping.

### CMS / WordPress
- Plugins (Yoast, Rank Math, Schema Pro) handle most automatically
- Theme `header.php` for custom global schema (Organization, WebSite)
- Custom fields → JSON-LD for product/event/recipe pages
- See `stack-wordpress.md`

## Validation tools

Always test before deploying:

| Tool | Best for |
|---|---|
| [Google Rich Results Test](https://search.google.com/test/rich-results) | **Use this** — renders JS, shows rich result eligibility, matches what Google sees |
| [Schema.org Validator](https://validator.schema.org/) | Strict spec validation (catches issues Google ignores) |
| [Search Console → Enhancements](https://search.google.com/search-console) | Production monitoring of rich result eligibility for indexed pages |

**Don't use** the deprecated Structured Data Testing Tool — it's been retired.

## Common errors

### Missing required properties
Each schema type has required fields. See `schema-templates.json` for the requirements per type.

Example: `Article` requires `headline`, `author`, `datePublished`. Without these, no rich result.

### Invalid value types
- **Dates must be ISO 8601** (`2026-04-08` or `2026-04-08T08:00:00+00:00`), not `April 8, 2026`
- **URLs must be absolute** (`https://example.com/img.jpg`), not relative (`/img.jpg`)
- **Enumerations must match exact strings** (`https://schema.org/InStock`, not `in stock`)
- **Numbers as strings vs numbers** — `ratingValue: "4.8"` (string) is preferred for compatibility

### Mismatch between schema and visible content
Google penalizes schema that doesn't match what users see. Examples that get penalized:
- Recipe schema with prep time that doesn't appear on the page
- Product schema with rating "5.0" when visible reviews show 3.5
- Article schema author who doesn't have a byline on the page
- Event schema with date that contradicts the page text

**Rule:** schema must mirror what's actually rendered.

### Duplicate properties on same entity
Don't have two separate `Organization` blocks. Use `@graph` with `@id` references.

### Self-referential FAQ on commercial sites
FAQ schema is restricted to gov/health for Google rich results since Aug 2023. Adding new FAQPage to a commercial site won't trigger rich results. See `schema-types-status.md`.

### Trailing comma / invalid JSON
JSON is strict — no trailing commas, quoted keys, double-quoted strings. Use a JSON validator before deploying.

### HowTo schema (deprecated September 2023)
Don't add HowTo to anything. Convert tutorials to Article schema.

## Detection limitations

**`web_fetch` and `curl` cannot detect JS-injected schema** because they strip `<script>` tags during HTML conversion.

To verify schema on a live page:
1. Browser tool — render the page and run `document.querySelectorAll('script[type="application/ld+json"]')`
2. [Google Rich Results Test](https://search.google.com/test/rich-results) — renders JS
3. Screaming Frog with JS rendering enabled — for batch audits

If you only have `web_fetch` available, you can verify SSR'd schema (it appears in the raw HTML), but you cannot rule out JS-injected schema.

## Maintenance

- Schema must update when content updates (Google penalizes stale data)
- For dynamic data (price, availability), regenerate on every render
- For static data (Organization, WebSite), keep in a single source of truth and reuse
- Monitor Search Console → Enhancements for warnings/errors weekly
