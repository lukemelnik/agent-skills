# Next.js SEO Notes

SEO implementation patterns for Next.js.

Covers:
- App Router
- Pages Router
- metadata, canonicals, robots, sitemap
- JSON-LD

## App Router

Primary tools:
- `app/layout.tsx` for site-wide defaults
- `export const metadata` for static metadata
- `export async function generateMetadata()` for dynamic metadata
- `app/robots.ts`
- `app/sitemap.ts`

## Site-wide metadata

Use `metadataBase` so canonicals and Open Graph URLs resolve correctly.

```ts
// app/layout.tsx
export const metadata = {
  metadataBase: new URL("https://example.com"),
  title: {
    default: "Example",
    template: "%s | Example",
  },
  description: "Default site description",
};
```

## Per-page metadata

```ts
// app/features/audio-converter/page.tsx
export const metadata = {
  title: "Free Audio Converter",
  description: "Convert WAV, FLAC, and MP3 in your browser.",
  alternates: {
    canonical: "/features/audio-converter",
  },
  openGraph: {
    title: "Free Audio Converter",
    description: "Convert WAV, FLAC, and MP3 in your browser.",
    url: "/features/audio-converter",
    type: "website",
  },
};
```

For dynamic routes:

```ts
export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}
```

## Robots

Use `app/robots.ts`:

```ts
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: "https://example.com/sitemap.xml",
  };
}
```

Add AI bot rules if needed; see `ai-bot-config.md`.

## Sitemap

Use `app/sitemap.ts` for simple cases.

```ts
export default async function sitemap() {
  const posts = await getPosts();

  return [
    {
      url: "https://example.com/",
      lastModified: new Date(),
    },
    ...posts.map((post) => ({
      url: `https://example.com/blog/${post.slug}`,
      lastModified: post.updatedAt,
    })),
  ];
}
```

For large sites, generate segmented sitemap routes instead of one huge file.

## JSON-LD

The metadata API does not replace JSON-LD. Render JSON-LD manually in the page or layout.

```tsx
const schema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: post.title,
  datePublished: post.publishedAt,
  dateModified: post.updatedAt,
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <article>{/* ... */}</article>
    </>
  );
}
```

Prefer server-rendered JSON-LD on initial HTML.

## Pages Router

Use:
- `next/head` for per-page title/meta/canonical
- `pages/sitemap.xml.ts` or API route for sitemap generation
- `pages/robots.txt.ts` or static file for robots

```tsx
import Head from "next/head";

export default function Page() {
  return (
    <>
      <Head>
        <title>Free Audio Converter | Example</title>
        <meta name="description" content="Convert audio files online." />
        <link rel="canonical" href="https://example.com/features/audio-converter" />
      </Head>
      <main>...</main>
    </>
  );
}
```

## Next.js gotchas

- Do not rely on client-side head updates for SEO-critical tags
- Ensure canonical URLs are absolute in output
- Avoid rendering important content only after hydration
- If using ISR, keep `dateModified` honest
- Verify dynamic routes return real `200`/`404` behavior
- Make sure pagination/filter URLs are controlled explicitly
