# What's New Writer

Release notes from git history, bullets, or free text, then upload via `asc`.

## Preconditions
- Metadata pulled locally: `asc metadata pull --app "APP_ID" --version "1.2.3" --dir "./metadata"`
- Primary locale is `en-US` unless specified otherwise.

## Phase 1: Gather input

### Git log
Run `scripts/collect_release_changes.sh [since_ref] [until_ref]` (defaults: last tag via `git describe --tags --abbrev=0`, `HEAD`). It prints the commit list and files touched for the range. With no tags it falls back to full history.

Triage for user impact: drop internal-only work (refactors, dependency bumps, CI, build scripts, dev tooling, internal logging, analytics unless they change privacy or behavior). Group by New / Improved / Fixed and dedupe. If a change is ambiguous, ask rather than guess. Every bullet must map to a real change in the range.

### Bullets / free text
Use the user's rough bullets or description as the change list.

## Phase 2: Draft (primary locale)
- Omit empty New / Improved / Fixed sections; describe user impact, one sentence per bullet, no codenames, ticket IDs, or file paths.
- The first ~170 characters show before "more": lead with the most impactful change.
- Echo relevant `keywords` from `metadata/version/{latest}/{primary-locale}.json` only where natural.
- Target 500-1500 characters; hard limit 4,000.
- Show the draft with a character count and wait for approval before localizing.

## Phase 3: Localize
- Use formal register where the language has one (German Sie, French vous, Spanish usted, Russian вы); adapt idioms, do not translate literally.
- Echo each locale's own `keywords`.
- Validate: notes <= 4,000 chars, promotional text <= 170 per locale. Shorten rather than truncate mid-sentence.

## Phase 4: Upload
```bash
asc apps info edit --app "APP_ID" --version-id "VERSION_ID" --locale "en-US" --whats-new "Notes here"

asc metadata push --app "APP_ID" --version "1.2.3" --dir "./metadata" --dry-run
asc metadata push --app "APP_ID" --version "1.2.3" --dir "./metadata"
```

## Don't
- "Bug fixes and improvements" (says nothing)
- Version numbers in headings, or competitor mentions (Review Guidelines)
- Keyword stuffing: What's New is not indexed

Promotional text (170 chars) is the only metadata field updatable without a new submission.
