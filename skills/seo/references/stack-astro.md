# Astro SEO Notes

SEO implementation patterns for Astro sites.

## Why Astro is SEO-friendly

Astro ships HTML-first by default, which is excellent for:
- crawlability
- fast LCP
- predictable metadata output
- static sitemap generation

## Page metadata

Use the page frontmatter and render tags in a shared layout.

```astro
---
const title = "Pricing | Example";
const description = "Transparent pricing for Example.";
const canonical = new URL(Astro.url.pathname, "https://example.com").toString();
---

<html lang="en">
  <head>
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
  </head>
</html>
```

Better: centralize this in a reusable SEO/layout component.

## Open Graph and Twitter tags

```astro
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
<meta property="og:image" content="https://example.com/og/default.png" />
<meta name="twitter:card" content="summary_large_image" />
```

## JSON-LD

Astro can render JSON-LD cleanly in the head:

```astro
---
const schema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: post.title,
  datePublished: post.publishedAt,
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

## Dynamic routes

For static generation, use `getStaticPaths()` and ensure each page has:
- unique title
- unique description
- canonical
- indexable content in HTML

## Sitemap

Options:
- small site: static `public/sitemap.xml`
- dynamic/static-generated site: generate sitemap during build
- custom endpoint: `src/pages/sitemap.xml.ts`

Typical endpoint shape:

```ts
export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>...`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
```

## Robots

Use `public/robots.txt` for simple sites.

```txt
User-agent: *
Allow: /
Sitemap: https://example.com/sitemap.xml
```

## Astro gotchas

- Do not hide important text in client-only islands
- If content is loaded client-side, crawlers may miss it or deprioritize it
- Keep canonical generation consistent across pages
- If using Markdown content collections, expose publish/update dates cleanly
- For blogs/docs, ensure archive and topic pages have enough unique intro content to rank
