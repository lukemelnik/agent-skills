# Remix SEO Notes

SEO implementation patterns for Remix.

## Core tools

Use:
- `meta()` export for title/meta
- `links()` export for canonicals and alternates
- loader data for dynamic metadata
- resource routes for `sitemap.xml` and `robots.txt`

## Static metadata

```tsx
import type { MetaFunction, LinksFunction } from "@remix-run/node";

export const meta: MetaFunction = () => [
  { title: "Pricing | Example" },
  { name: "description", content: "Transparent pricing for Example." },
  { property: "og:title", content: "Pricing | Example" },
];

export const links: LinksFunction = () => [
  { rel: "canonical", href: "https://example.com/pricing" },
];
```

## Dynamic metadata from loader data

```tsx
export async function loader({ params }) {
  const post = await getPost(params.slug);
  return json({ post });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [{ title: "Not found" }];

  return [
    { title: `${data.post.title} | Example` },
    { name: "description", content: data.post.excerpt },
    { property: "og:title", content: data.post.title },
  ];
};
```

## JSON-LD

Render JSON-LD in the route component so it lands in server HTML.

```tsx
const schema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: data.post.title,
};

export default function PostRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <article>...</article>
    </>
  );
}
```

## Sitemap route

Create a resource route such as `app/routes/sitemap[.]xml.ts`.

```ts
export async function loader() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>...`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
```

## Robots route

Either:
- static file in `public/robots.txt`
- resource route returning text

## Remix gotchas

- Make sure SEO metadata is derived from loader data, not client-only state
- Return real `404` responses for missing content
- Avoid rendering important content only after client transitions
- Keep canonical logic explicit on nested routes
- Ensure paginated/filter routes are intentionally indexed or intentionally controlled
