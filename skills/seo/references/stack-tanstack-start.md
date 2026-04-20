# TanStack Start SEO Notes

SEO implementation patterns for TanStack Start / TanStack Router apps.

## Core pattern

Use route-level `head` functions for metadata and canonical tags.

Typical shape:

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing | Example" },
      { name: "description", content: "Transparent pricing for Example." },
      { property: "og:title", content: "Pricing | Example" },
    ],
    links: [{ rel: "canonical", href: "https://example.com/pricing" }],
  }),
  component: PricingPage,
});
```

## Root defaults

Set site-wide defaults in the root route.

```tsx
export const Route = createRootRoute()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Example" },
      { name: "description", content: "Default site description" },
    ],
  }),
});
```

Make sure the root document renders `HeadContent`.

## Canonicals

Use absolute canonicals in `links`:

```tsx
links: [{ rel: "canonical", href: "https://example.com/blog/post-slug" }]
```

Do not rely on relative canonical paths.

## JSON-LD

TanStack Start route heads can include `scripts`.

```tsx
const articleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: post.title,
  datePublished: post.publishedAt,
};

export const Route = createFileRoute("/blog/$slug")({
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData.post.title }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(articleLd),
      },
    ],
  }),
  component: PostPage,
});
```

Prefer building JSON-LD from loader data on the server.

## Dynamic metadata

If metadata depends on content, fetch in a loader and derive head tags from `loaderData`.

```tsx
export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => ({
    post: await getPost(params.slug),
  }),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData.post.title },
      { name: "description", content: loaderData.post.excerpt },
    ],
    links: [
      { rel: "canonical", href: `https://example.com/blog/${loaderData.post.slug}` },
    ],
  }),
  component: PostPage,
});
```

## Sitemap and robots

Common approaches:
- static files in `public/` for small sites
- server-generated routes for dynamic sites

Preferred rule:
- small fixed sites: `public/robots.txt` + `public/sitemap.xml`
- dynamic content sites: generate sitemap from data source during build or via server route

## SSR matters

SEO-critical content should be present in server-rendered HTML.

Avoid:
- rendering titles/descriptions only after client fetch
- hiding main content behind `ssr: false` unless the route truly cannot be SSR'd
- JS-only navigation elements that do not render real anchors

## TanStack Start gotchas

- `ssr: false` pages are much weaker SEO candidates unless the content is otherwise accessible
- Head tags should be derived from real route data, not placeholders
- Keep canonical logic centralized when many route families share patterns
- If you use helper functions for SEO, ensure they return `meta`, `links`, and `scripts` in the shape TanStack expects
