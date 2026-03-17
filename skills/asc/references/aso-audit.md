# ASO Audit

Two-phase audit: offline checks against local metadata, then optional keyword gap analysis.

## Preconditions
- Metadata pulled: `asc metadata pull --app "APP_ID" --version "1.2.3" --dir "./metadata"`
- Primary locale: `en-US` unless specified otherwise.

## Metadata File Paths
- **App-info fields** (`subtitle`): `metadata/app-info/{locale}.json`
- **Version fields** (`keywords`, `description`, `whatsNew`): `metadata/version/{latest-version}/{locale}.json`

## Phase 1: Offline Checks

### 1. Keyword Waste
Tokenize `subtitle` (and `name`). Flag any token also in `keywords` — it's already indexed and wastes budget.

### 2. Underutilized Fields
| Field | Minimum | Limit | Target |
|-------|---------|-------|--------|
| Keywords | 90 chars | 100 | 90%+ |
| Subtitle | 20 chars | 30 | 65%+ |

### 3. Missing Fields
Flag empty: `subtitle`, `keywords`, `description`, `whatsNew`.

### 4. Bad Keyword Separators
Check for: spaces after commas, semicolons, pipes. All waste characters.

### 5. Cross-Locale Keyword Gaps
Flag locales where keywords are identical to primary locale — likely not localized.

### 6. Description Keyword Coverage
Check if keywords appear in `description`. Not indexed, but improves conversion.

## Phase 2: Astro MCP Keyword Gap Analysis (Optional)

If Astro MCP is available:
1. Get current keywords: `get_app_keywords`
2. Extract competitor keywords: `extract_competitors_keywords` with 3-5 competitor IDs
3. Get suggestions: `get_keyword_suggestions`
4. Check rankings: `search_rankings`
5. Diff against local metadata
6. Surface gaps ranked by popularity

Skip if Astro MCP not connected.

## Output Format

```
### ASO Audit Report

**App:** [name] | **Primary Locale:** [locale]

#### Field Utilization
| Field | Value | Length | Limit | Usage |
|-------|-------|--------|-------|-------|

#### Offline Checks
| # | Check | Severity | Field | Locale | Detail |
|---|-------|----------|-------|--------|--------|

**Summary:** X errors, Y warnings across Z locales

#### Recommendations
1. [Highest priority — errors first]
2. [Keyword waste]
3. [Utilization improvements]
```

## Keyword Field Rules
- Comma-separated, **no spaces after commas**
- Don't duplicate words from title or subtitle
- Prefer single words over phrases (enables more cross-field combinations)
- Always validate with popularity data before making swaps

## Character Limits
| Field | Limit |
|-------|-------|
| Name | 30 |
| Subtitle | 30 |
| Keywords | 100 |
| Description | 4,000 |
| What's New | 4,000 |
| Promotional Text | 170 |

## After the Audit
```bash
asc metadata keywords diff --app "APP_ID" --version "1.2.3" --dir "./metadata"
asc metadata keywords apply --app "APP_ID" --version "1.2.3" --dir "./metadata" --confirm
```
