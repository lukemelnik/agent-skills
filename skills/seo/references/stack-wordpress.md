# WordPress SEO Notes

SEO implementation patterns for WordPress.

## First rule: one SEO owner

Use **one** primary SEO system.

Good options:
- Yoast SEO
- Rank Math
- custom theme/plugin implementation

Do **not** run multiple SEO plugins that all manage:
- titles
- canonicals
- robots meta
- sitemaps
- schema

That creates conflicting output.

## Built-in sitemap

WordPress ships with a core sitemap at:
- `/wp-sitemap.xml`

If Yoast or Rank Math is active, they usually replace this with their own sitemap system. Make sure only one sitemap system is effectively used and referenced in `robots.txt`.

## Titles and meta descriptions

### With Yoast / Rank Math
- configure templates by post type, taxonomy, and archive
- override per post/page when needed
- keep title templates short and readable

### Without a plugin
Use theme hooks to output title/meta in `wp_head`.

## Canonicals

Ensure every public post/page/archive has the correct canonical.

Common trouble spots:
- paginated archives
- filtered WooCommerce/category URLs
- duplicate attachment pages
- tag archives with thin/duplicate content

## Robots control

Useful hooks/functions:
- `wp_robots`
- SEO plugin settings

Common pages to consider `noindex`:
- internal search results
- thin tag archives
- author archives on single-author blogs if redundant
- low-value faceted WooCommerce URLs

## Schema

Yoast and Rank Math both output schema graphs.

If adding custom schema:
- do not duplicate the same entity/type unnecessarily
- extend what exists when possible
- inject JSON-LD with `wp_json_encode()`

Example:

```php
add_action('wp_head', function () {
  if (!is_singular('post')) {
    return;
  }

  $schema = [
    '@context' => 'https://schema.org',
    '@type' => 'Article',
    'headline' => get_the_title(),
    'datePublished' => get_the_date('c'),
    'dateModified' => get_the_modified_date('c'),
  ];

  echo '<script type="application/ld+json">' . wp_json_encode($schema) . '</script>';
});
```

## WordPress-specific SEO cleanup

Common fixes:
- disable thin tag archives or noindex them
- redirect attachment pages if useless
- clean up category/tag sprawl
- improve archive intro text
- remove duplicate pagination/canonical mistakes
- optimize image alt text and filenames in media library

## WooCommerce notes

For WooCommerce sites, pay close attention to:
- category page content
- filter/facet indexation
- product schema completeness
- review markup quality
- canonical behavior on variations

## WordPress gotchas

- theme output and plugin output can conflict
- page builders sometimes hide meaningful text in poor HTML structures
- too many plugins can hurt performance/CWV
- archive pages often exist by default even when they add no SEO value
- staging sites sometimes leak into indexation if not blocked correctly
