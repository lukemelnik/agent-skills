# Core Web Vitals

Current as of February 2026. INP replaced FID on March 12, 2024. FID was fully removed from all Chrome tools on September 9, 2024. **Never reference FID in outputs.**

## Current thresholds

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | 2.5s – 4.0s | > 4.0s |
| **INP** (Interaction to Next Paint) | ≤ 200ms | 200ms – 500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1 – 0.25 | > 0.25 |
| **FCP** (First Contentful Paint) | ≤ 1.8s | 1.8s – 3.0s | > 3.0s |
| **TTFB** (Time to First Byte) | ≤ 800ms | 800ms – 1.8s | > 1.8s |

LCP, INP, CLS are the three Core Web Vitals. FCP and TTFB are diagnostic but not Core Web Vitals themselves.

## Key facts

- **Evaluation uses the 75th percentile** of real user data (field data from CrUX), per page or per origin
- **Field data is what Google uses for ranking** — lab data is for debugging
- **Mobile-first**: Google now crawls everything as mobile Googlebot. Mobile CWV are weighted more heavily after the December 2025 core update
- CWV are a **tiebreaker ranking signal** — they matter most when content quality is similar between competitors
- **Thresholds have not changed** since their original definitions, despite blog claims of "tightened thresholds"
- As of October 2025: 57.1% of desktop sites and 49.7% of mobile sites pass all three CWV

## LCP subparts (CrUX, February 2025+)

LCP can now be broken into diagnostic subparts. Use this to identify which phase is causing slow LCP.

| Subpart | What it measures | Target |
|---|---|---|
| **TTFB** | Server response time | < 800ms |
| **Resource Load Delay** | TTFB → resource request start | Minimize |
| **Resource Load Time** | Time to download the LCP resource | Depends on size |
| **Element Render Delay** | Resource loaded → rendered to screen | Minimize |

**Total LCP = TTFB + Resource Load Delay + Resource Load Time + Element Render Delay**

If TTFB dominates → server/CDN issue. If Load Time dominates → image/font too large. If Render Delay dominates → JavaScript blocking render.

## Soft Navigations API (experimental, no ranking impact yet)

Chrome 139+ Origin Trial (July 2025) is the first step toward measuring CWV in SPAs (React, Vue, Angular, Svelte). Currently experimental — no current ranking impact, but worth knowing about for SPA-heavy sites.

If the site is an SPA, **flag CWV measurement limitations**: the framework's client-side route changes don't count as navigations in current CWV measurement, so per-page CWV data is unreliable.

## Common bottlenecks and fixes

### LCP (Largest Contentful Paint)

**Common causes:**
- Unoptimized hero images (large file size, no compression, wrong format)
- Render-blocking CSS or JavaScript
- Slow server response (TTFB > 200ms)
- Third-party scripts blocking the main thread
- Web font loading delay

**Fixes:**
- Compress hero images, use WebP/AVIF, set explicit `width` and `height`
- Add `<link rel="preload" as="image" href="...">` for the LCP image
- Use `fetchpriority="high"` on the LCP image
- Critical CSS inlining (move above-the-fold styles into `<style>` in `<head>`)
- Defer non-critical JS (`defer` attribute, dynamic import)
- Use a CDN with edge caching
- Use `font-display: swap` and `<link rel="preload">` for fonts

### INP (Interaction to Next Paint)

**Common causes:**
- Long JavaScript tasks on the main thread (> 50ms)
- Heavy event handlers (especially scroll and input)
- Excessive DOM size (> 1,500 elements is concerning)
- Third-party scripts hijacking the main thread
- Synchronous XHR or `localStorage` operations
- Layout thrashing (multiple forced reflows)

**Fixes:**
- Break long tasks into smaller chunks (`scheduler.yield()` or `setTimeout(0)`)
- Debounce event handlers (`requestAnimationFrame`)
- Reduce DOM size (virtualize long lists)
- Defer or remove blocking third-party scripts
- Move work off the main thread (Web Workers for heavy computation)
- Avoid synchronous DOM measurements after writes

### CLS (Cumulative Layout Shift)

**Common causes:**
- Images and iframes without `width` and `height` attributes
- Dynamically injected content above existing content (banners, modals)
- Web fonts causing FOUT/FOIT layout shifts
- Ads or embeds without reserved space
- Late-loading content pushing the page down

**Fixes:**
- Always set `width` and `height` on images (browser computes aspect ratio)
- Use `aspect-ratio` CSS for responsive media
- Reserve space for ads/embeds with min-height or aspect-ratio container
- Use `font-display: swap` AND `<link rel="preload">` for self-hosted fonts
- Avoid injecting content above the fold after page load
- For skeleton screens, match the dimensions of the eventual content

## Optimization priority

Optimize in this order:

1. **LCP** — Most impactful for perceived performance and search ranking
2. **CLS** — Most common user-facing issue
3. **INP** — Matters most for interactive applications

## Measurement sources

### Field data (real users — what Google uses for ranking)
- Chrome User Experience Report (CrUX) — see `google-api-curl.md` for direct API access
- PageSpeed Insights (uses CrUX) — see `google-api-curl.md`
- Search Console → Core Web Vitals report

### Lab data (simulated — for debugging only)
- Lighthouse (Chrome DevTools, CLI, or PSI)
- WebPageTest
- Chrome DevTools Performance tab

## Tooling updates (2025)

- **Lighthouse 13.0** (October 2025): major audit restructuring, reorganized performance categories, updated scoring weights. Lighthouse is a lab tool — always cross-reference with CrUX field data
- **CrUX Vis** (November 2025): replaced the old Looker Studio CrUX Dashboard. Use [CrUX Vis](https://cruxvis.withgoogle.com) or call the CrUX API directly
- **Search Console 2025** (December 2025): AI-powered configuration, branded vs non-branded query filter, hourly data in API, custom chart annotations

## Quick measurement via curl

```bash
# PageSpeed Insights API (lab data, free, requires API key)
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&key=$PSI_KEY&strategy=MOBILE" \
  | jq '.lighthouseResult.audits | {
      lcp: ."largest-contentful-paint".displayValue,
      cls: ."cumulative-layout-shift".displayValue,
      inp: ."interaction-to-next-paint".displayValue,
      ttfb: ."server-response-time".displayValue
    }'

# CrUX API (real user data, free, requires API key)
curl -s -X POST "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=$CRUX_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "metrics": ["largest_contentful_paint", "interaction_to_next_paint", "cumulative_layout_shift"]}'
```

See `google-api-curl.md` for full API reference and `google-api-auth.md` for getting API keys.

## CrUX gotchas

- **CLS percentile is a string** in the API response (e.g., `"0.05"` not `0.05`). Parse as float
- **404 from CrUX = no data** (insufficient Chrome traffic), not an auth error
- CrUX data has a ~2 day lag, updated daily ~04:00 UTC
- CrUX History API returns up to 25 weekly periods, updated Mondays
- For very low-traffic sites, CrUX may have no data — fall back to lab metrics with the caveat that they don't reflect real users
