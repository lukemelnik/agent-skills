# SvelteKit SEO Notes

SEO implementation patterns for SvelteKit.

## Core tools

Use:
- `<svelte:head>` for title/meta/canonical
- `+page.server.ts` / `+layout.server.ts` for server-side data
- `+server.ts` routes for `sitemap.xml` and `robots.txt`

## Page metadata

```svelte
<script lang="ts">
  export let data;
  const canonical = `https://example.com/blog/${data.post.slug}`;
</script>

<svelte:head>
  <title>{data.post.title} | Example</title>
  <meta name="description" content={data.post.excerpt} />
  <link rel="canonical" href={canonical} />
  <meta property="og:title" content={data.post.title} />
  <meta property="og:description" content={data.post.excerpt} />
</svelte:head>
```

## JSON-LD

```svelte
<script lang="ts">
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.post.title,
  };
</script>

<svelte:head>
  <script type="application/ld+json">{@html JSON.stringify(schema)}</script>
</svelte:head>
```

## Sitemap

Create `src/routes/sitemap.xml/+server.ts`.

```ts
export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>...`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
```

## Robots

Use `static/robots.txt` or a dynamic `+server.ts` route.

## SvelteKit gotchas

- Derive metadata from server-loaded data where possible
- Avoid making core content depend on browser-only code
- Keep canonical generation consistent
- Ensure prerendered and SSR routes both output full head tags
