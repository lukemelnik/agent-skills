# Plain HTML / Static Site SEO Notes

SEO implementation patterns for plain HTML and static sites.

## Core principle

Plain HTML is often the easiest environment for SEO because everything is explicit.

You must manage:
- title
- meta description
- canonical
- Open Graph / Twitter
- structured data
- robots.txt
- sitemap.xml

## Basic page template

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pricing | Example</title>
    <meta name="description" content="Transparent pricing for Example." />
    <link rel="canonical" href="https://example.com/pricing" />

    <meta property="og:title" content="Pricing | Example" />
    <meta property="og:description" content="Transparent pricing for Example." />
    <meta property="og:url" content="https://example.com/pricing" />
    <meta property="og:image" content="https://example.com/og/default.png" />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body>
    <h1>Pricing</h1>
  </body>
</html>
```

## JSON-LD

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Example",
  "url": "https://example.com"
}
</script>
```

## Sitemap

For small sites, a hand-maintained sitemap can work, but it often goes stale.

Better:
- generate it from your build system if possible
- or maintain a simple script that outputs all public URLs

## Robots

Place at site root:
- `/robots.txt`

Example:

```txt
User-agent: *
Allow: /
Sitemap: https://example.com/sitemap.xml
```

## Static-site gotchas

- forgetting to update sitemap after adding pages
- duplicate pages at `/page` and `/page.html`
- inconsistent trailing slash rules
- no redirects after changing file paths
- missing canonical tags on duplicated templates
- large images hurting LCP because optimization is manual

## Good defaults

- keep URLs clean and stable
- pre-compress images
- use explicit width/height on images
- create one reusable head partial/template if your tooling supports it
- make sure every public page is linked internally and listed in the sitemap
