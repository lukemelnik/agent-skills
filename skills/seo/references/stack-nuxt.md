# Nuxt 3 SEO Notes

SEO implementation patterns for Nuxt 3.

## Core tools

Use:
- `useSeoMeta()` for common SEO meta tags
- `useHead()` for links, scripts, and advanced tags
- Nitro server routes for `sitemap.xml` and `robots.txt`

## Page metadata

```vue
<script setup lang="ts">
useSeoMeta({
  title: 'Pricing | Example',
  description: 'Transparent pricing for Example.',
  ogTitle: 'Pricing | Example',
  ogDescription: 'Transparent pricing for Example.',
  ogUrl: 'https://example.com/pricing',
  twitterCard: 'summary_large_image',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://example.com/pricing' },
  ],
})
</script>
```

For dynamic routes, derive these values from `useAsyncData()` or server data.

## JSON-LD

Use `useHead()` to inject JSON-LD.

```vue
<script setup lang="ts">
const schema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: post.title,
}

useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify(schema),
    },
  ],
})
</script>
```

Prefer SSR output, not client-only mutation.

## Sitemap

For a custom sitemap without third-party modules, create a Nitro server route:
- `server/routes/sitemap.xml.ts`

Return XML with `Content-Type: application/xml`.

## Robots

Use:
- `public/robots.txt` for static sites
- or `server/routes/robots.txt.ts` if it must be dynamic

## Nuxt gotchas

- `definePageMeta()` is for page behavior, not full SEO metadata
- Do not rely on client-only data for title/meta
- Keep canonical URLs absolute
- Ensure important content is rendered in SSR HTML
- Control filter/search routes explicitly; do not let them index by accident
