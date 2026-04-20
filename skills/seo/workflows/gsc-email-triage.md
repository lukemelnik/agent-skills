# Search Console Email Triage Workflow

Use when the user forwards or paraphrases a Google Search Console email.

## Goal

Determine:
- what the alert actually means
- whether it is critical or routine noise
- what URLs/templates are affected
- what to fix first

## Step 1: Identify the alert type

Common categories:
- sitemap fetch/read issue
- page indexing issue
- canonical/duplicate issue
- structured data / rich results issue
- Core Web Vitals regression
- manual action / security issue

## Step 2: Ask for the exact email text if needed

If the alert is vague, ask for:
- subject line
- issue type
- affected URL samples
- screenshot or pasted text

Do not guess the issue category if the email wording is ambiguous.

## Step 3: Map to the right references

| Alert type | Load |
|---|---|
| Sitemap | `references/sitemap.md` |
| Indexing / duplicate / canonical | `references/audit-checklist.md` |
| Structured data | `references/schema-types-status.md` + `references/schema-implementation.md` |
| Core Web Vitals | `references/core-web-vitals.md` |

## Step 4: Inspect representative URLs

Pick a small sample of affected URLs and check:
- status code
- canonical
- robots meta
- sitemap inclusion
- internal links
- template patterns

If Search Console API access exists, use URL Inspection for representative URLs.

## Step 5: Decide severity

### Critical
- Manual action
- security issue / hacked content
- key money pages suddenly deindexed
- sitemap completely broken

### High
- large template family affected
- canonical/duplicate issue on important pages
- sharp CWV regression on key templates

### Medium
- isolated structured-data warnings
- a small set of non-critical pages affected
- routine low-volume duplicate discoveries

## Step 6: Give a fix plan

Return:
- what the email means in plain English
- likely root cause
- exact checks/fixes
- whether the user needs to request validation or just wait for recrawl

## Important behavior

- Do not overreact to every Search Console warning
- Distinguish syntax warnings from indexing blockers
- Do not recommend HowTo schema
- Treat FAQPage issues carefully given current restrictions
