# Google API curl Workflows

Ready-to-use curl examples for official Google APIs used in SEO work.

Placeholders used below:
- `YOUR_API_KEY`
- `YOUR_ACCESS_TOKEN`
- `PROPERTY` = `sc-domain:example.com` or `https://example.com/`
- URL-encode the property when used in path segments

Example encoded domain property:
- raw: `sc-domain:example.com`
- encoded: `sc-domain%3Aexample.com`

## Search Console API

Base:
- `https://www.googleapis.com/webmasters/v3`

## 1. List accessible properties
```bash
curl -s \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "https://www.googleapis.com/webmasters/v3/sites"
```

## 2. Query top pages for the last 28 days
```bash
curl -s \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST \
  "https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aexample.com/searchAnalytics/query" \
  -d '{
    "startDate": "2026-03-01",
    "endDate": "2026-03-28",
    "dimensions": ["page"],
    "rowLimit": 25
  }'
```

## 3. Query low-CTR opportunities by query + page
```bash
curl -s \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST \
  "https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aexample.com/searchAnalytics/query" \
  -d '{
    "startDate": "2026-03-01",
    "endDate": "2026-03-28",
    "dimensions": ["query", "page"],
    "rowLimit": 250,
    "dimensionFilterGroups": [
      {
        "filters": [
          {
            "dimension": "query",
            "operator": "contains",
            "expression": "metadata editor"
          }
        ]
      }
    ]
  }'
```

## 4. Query branded vs non-branded terms
```bash
curl -s \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST \
  "https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aexample.com/searchAnalytics/query" \
  -d '{
    "startDate": "2026-03-01",
    "endDate": "2026-03-28",
    "dimensions": ["query"],
    "rowLimit": 250,
    "dimensionFilterGroups": [
      {
        "filters": [
          {
            "dimension": "query",
            "operator": "excludingRegex",
            "expression": "(?i)(example co|exampleco)"
          }
        ]
      }
    ]
  }'
```

## 5. Query device split
```bash
curl -s \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST \
  "https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aexample.com/searchAnalytics/query" \
  -d '{
    "startDate": "2026-03-01",
    "endDate": "2026-03-28",
    "dimensions": ["device"],
    "rowLimit": 10
  }'
```

## 6. Query country split
```bash
curl -s \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST \
  "https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aexample.com/searchAnalytics/query" \
  -d '{
    "startDate": "2026-03-01",
    "endDate": "2026-03-28",
    "dimensions": ["country"],
    "rowLimit": 50
  }'
```

Note: country values are ISO alpha-3 codes.

## 7. URL Inspection API

Endpoint:
- `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`

```bash
curl -s \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST \
  "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect" \
  -d '{
    "inspectionUrl": "https://example.com/pricing",
    "siteUrl": "sc-domain:example.com",
    "languageCode": "en-US"
  }'
```

Useful fields to inspect in the response:
- `indexStatusResult.verdict`
- `coverageState`
- `robotsTxtState`
- `indexingState`
- `googleCanonical`
- `userCanonical`
- `lastCrawlTime`

## 8. List submitted sitemaps
```bash
curl -s \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aexample.com/sitemaps"
```

## 9. Submit a sitemap
```bash
curl -s -X PUT \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aexample.com/sitemaps/https%3A%2F%2Fexample.com%2Fsitemap.xml"
```

## PageSpeed Insights API

Base:
- `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`

## 10. Mobile PSI report
```bash
curl -s \
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&strategy=MOBILE&category=PERFORMANCE&category=SEO&key=YOUR_API_KEY"
```

## 11. Desktop PSI report
```bash
curl -s \
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&strategy=DESKTOP&category=PERFORMANCE&key=YOUR_API_KEY"
```

Useful response fields:
- `loadingExperience` = URL-level field data
- `originLoadingExperience` = origin-level field data
- `lighthouseResult.categories.performance.score`
- `lighthouseResult.audits`

PSI is best for Lighthouse lab data plus a quick field-data snapshot. For field data workflows, prefer CrUX directly.

## Chrome UX Report API

Base:
- `https://chromeuxreport.googleapis.com/v1`

## 12. Origin-level CrUX data
```bash
curl -s \
  -H "Content-Type: application/json" \
  -X POST \
  "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=YOUR_API_KEY" \
  -d '{
    "origin": "https://example.com",
    "formFactor": "PHONE",
    "metrics": [
      "largest_contentful_paint",
      "interaction_to_next_paint",
      "cumulative_layout_shift",
      "first_contentful_paint",
      "experimental_time_to_first_byte"
    ]
  }'
```

## 13. URL-level CrUX data
```bash
curl -s \
  -H "Content-Type: application/json" \
  -X POST \
  "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=YOUR_API_KEY" \
  -d '{
    "url": "https://example.com/pricing",
    "formFactor": "PHONE",
    "metrics": [
      "largest_contentful_paint",
      "interaction_to_next_paint",
      "cumulative_layout_shift"
    ]
  }'
```

Important:
- `404` from CrUX often means **no field data available**, not bad auth
- CLS percentile values are string-encoded in the API response

## 14. CrUX history data
```bash
curl -s \
  -H "Content-Type: application/json" \
  -X POST \
  "https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord?key=YOUR_API_KEY" \
  -d '{
    "origin": "https://example.com",
    "formFactor": "PHONE",
    "metrics": [
      "largest_contentful_paint",
      "interaction_to_next_paint",
      "cumulative_layout_shift"
    ]
  }'
```

This returns up to ~25 weekly periods, useful for trend analysis.

## GA4 Data API (optional)

Base:
- `https://analyticsdata.googleapis.com/v1beta`

## 15. Organic landing pages report
```bash
curl -s \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST \
  "https://analyticsdata.googleapis.com/v1beta/properties/123456789:runReport" \
  -d '{
    "dateRanges": [{"startDate": "28daysAgo", "endDate": "yesterday"}],
    "dimensions": [
      {"name": "landingPagePlusQueryString"},
      {"name": "sessionDefaultChannelGroup"}
    ],
    "metrics": [
      {"name": "sessions"},
      {"name": "engagedSessions"},
      {"name": "conversions"}
    ],
    "dimensionFilter": {
      "filter": {
        "fieldName": "sessionDefaultChannelGroup",
        "stringFilter": {"matchType": "EXACT", "value": "Organic Search"}
      }
    },
    "limit": 100
  }'
```

## Useful SEO workflows with these APIs

### Find low-CTR winners
- GSC Search Analytics by query + page
- Filter for high impressions, average position 1-10, low CTR
- Rewrite titles/meta and monitor 2-4 weeks later

### Confirm indexing problem on a specific URL
- URL Inspection API
- compare `userCanonical` vs `googleCanonical`
- review `coverageState`, `robotsTxtState`, `indexingState`

### Validate sitemap ingestion
- Sitemaps API list/get
- compare submitted counts with current XML sitemap

### Diagnose field vs lab CWV
- PSI for Lighthouse lab findings
- CrUX for field p75 metrics
- fix lab bottlenecks that map to bad field metrics

## jq helpers

### Top 10 page rows from GSC response
```bash
jq '.rows[:10]'
```

### Pull PSI performance score
```bash
jq '.lighthouseResult.categories.performance.score'
```

### Pull CrUX p75 metrics
```bash
jq '.record.metrics'
```

## Common mistakes

- Using the wrong Search Console property string
- Forgetting to URL-encode `siteUrl` in path segments
- Treating CrUX `404` as an auth failure
- Comparing PSI lab data directly to CrUX field data without context
- Using stale date ranges when reviewing GSC changes
- Trying to use the Indexing API for normal pages
