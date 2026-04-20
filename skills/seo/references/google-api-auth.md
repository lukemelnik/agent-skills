# Google API Authentication

Official Google API setup for SEO workflows using curl and first-party APIs.

This reference covers:
- Search Console API
- URL Inspection API
- Sitemaps API
- PageSpeed Insights API
- Chrome UX Report (CrUX) API
- CrUX History API
- GA4 Data API (optional)

## Credential types

## 1. API key
Use for:
- PageSpeed Insights API
- CrUX API
- CrUX History API

Fastest setup. Good for read-only performance data.

## 2. OAuth 2.0 / service account bearer token
Use for:
- Search Console API
- URL Inspection API
- Sitemaps API
- GA4 Data API

Needed for property-specific data.

## Recommended setup

For most SEO work, create both:
- **API key** for PSI + CrUX
- **Service account** for Search Console / GA4

## Step 1: Create a Google Cloud project

1. Open Google Cloud Console
2. Create/select a project
3. Enable the APIs you need

## Step 2: Enable APIs

Enable these in **APIs & Services → Library**:
- Google Search Console API
- PageSpeed Insights API
- Chrome UX Report API
- Google Analytics Data API (optional)

## Step 3: Create an API key

1. Go to **APIs & Services → Credentials**
2. Create **API key**
3. Restrict it to the APIs above where applicable
4. Store it securely outside the repo

Use this key with:
- PageSpeed Insights
- CrUX
- CrUX History

## Step 4: Create a service account

1. Go to **IAM & Admin → Service Accounts**
2. Create a service account
3. Create a JSON key only if you truly need one locally
4. Prefer secure local storage or workload identity in CI

Important field:
- `client_email` — this is what you grant access to in Search Console / GA4

## Step 5: Grant Search Console access

In Search Console:
1. Open the property
2. Go to **Settings → Users and permissions**
3. Add the service account `client_email`
4. Grant **Full** access for read-only query/inspection/sitemap work

### Property formats

Use the exact property identifier in API calls:

| Property type | Example |
|---|---|
| Domain property | `sc-domain:example.com` |
| URL-prefix property | `https://example.com/` |

Use the same format the property was verified with.

## Step 6: Grant GA4 access (optional)

If using the GA4 Data API:
1. Open GA4 Admin
2. Add the service account email as a user
3. Give at least Viewer/Analyst access
4. Note the numeric property ID

## Service account caveat for Search Console

A service account works only if its email has been explicitly added to the Search Console property.

If you skip that step, Search Console API calls return `403` even if the Google Cloud project is configured correctly.

## Access tokens

Your curl calls for Search Console / GA4 need a bearer token.

Typical approaches:
- OAuth access token from your own Google OAuth flow
- official Google auth tooling if you already use it
- service-account token generation in CI/server environments

In examples below, use:
- `YOUR_API_KEY`
- `YOUR_ACCESS_TOKEN`

## Minimal verification checklist

### API key test
```bash
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&strategy=MOBILE&key=YOUR_API_KEY" | head
```

### Search Console token test
```bash
curl -s \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "https://www.googleapis.com/webmasters/v3/sites" | head
```

If you see your sites list, auth is working.

## Common errors

### `403 Forbidden`
Usually one of:
- API not enabled
- wrong OAuth scope / invalid token
- service account not added to Search Console or GA4
- using the wrong property identifier

### `404 Not Found`
Often means:
- wrong Search Console property format
- wrong endpoint path
- CrUX has insufficient field data for the URL/origin

### `429 Too Many Requests`
You're hitting quota. Back off and retry later.

## Rate-limit notes

Useful mental model:
- Search Console: generous enough for normal audit/reporting use
- CrUX + CrUX History: much stricter shared quota
- URL Inspection: lower quotas than Search Analytics, avoid large batch abuse

## Indexing API warning

Google's Indexing API is **not** a general-purpose force-indexing API.

Per Google's policy, it is primarily for:
- `JobPosting`
- `BroadcastEvent` embedded in `VideoObject`

Do not recommend it as a generic SEO indexing shortcut for normal pages.

## Security guidance

- Never commit keys or tokens to git
- Keep service-account files outside the repo
- Rotate keys if they leak
- Use least privilege where possible
- Prefer short-lived access tokens over long-lived secrets
