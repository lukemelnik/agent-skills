# What's New Writer

Generate engaging, localized release notes from git log, bullet points, or free text.

## Preconditions
- Metadata pulled locally: `asc metadata pull --app "APP_ID" --version "1.2.3" --dir "./metadata"`
- Primary locale is `en-US` unless specified otherwise.

## Phase 1: Gather Input

Accept one of three input modes (auto-detect):

### Git Log
```bash
git describe --tags --abbrev=0
git log $(git describe --tags --abbrev=0)..HEAD --oneline --no-merges
```
Filter out: merge commits, dependency bumps, CI changes, formatting-only commits.

### Bullet Points
User provides rough bullets like "improved search", "fixed crash on launch".

### Free Text
User describes changes conversationally. Extract and structure the changes.

## Phase 2: Draft Notes (Primary Locale)

### 1. Classify Changes
- **New** — new features or capabilities
- **Improved** — enhancements to existing features
- **Fixed** — bug fixes users would notice

Omit empty sections.

### 2. Write Benefit-Focused Copy
- Describe user impact, not implementation details
- Use direct address ("you") and action verbs
- Be specific — mention concrete improvements

### 3. Front-Load the Hook
First ~170 characters are visible before "more." Lead with the single most impactful change in a complete, compelling sentence.

### 4. Echo Keywords
Read `keywords` from `metadata/version/{latest}/{primary-locale}.json`. Weave relevant ones naturally — never force or stuff.

### 5. Character Limits
- Target 500-1500 characters (leaves room for localized expansions)
- Hard limit: 4,000 characters

### 6. Present Draft
Show draft with character count. Wait for approval before localizing.

## Phase 3: Localize

### Translation Rules
- Formal register: formal "you" forms (Russian: вы, German: Sie, French: vous, Spanish: usted)
- Adapt tone to local market — playful English may need adjustment for formal markets
- Do NOT literally translate idioms — adapt to local equivalents

### Per-Locale Keyword Echo
Read locale-specific `keywords` from metadata. Echo naturally in translated notes.

### Validate
- All translations ≤ 4,000 characters
- Promotional text ≤ 170 characters per locale
- If exceeds limit, shorten — never truncate mid-sentence

## Phase 4: Upload

```bash
# Individual locale
asc apps info edit --app "APP_ID" --version-id "VERSION_ID" --locale "en-US" --whats-new "Notes here"

# Bulk push
asc metadata push --app "APP_ID" --version "1.2.3" --dir "./metadata" --dry-run
asc metadata push --app "APP_ID" --version "1.2.3" --dir "./metadata"
```

## Anti-Patterns

| Don't | Why |
|-------|-----|
| "Bug fixes and improvements" | Tells the user nothing |
| Version numbers in headings | Violates Apple guidelines |
| Mentioning competitors | Against Review Guidelines |
| Keyword stuffing | What's New is NOT indexed — write for humans |
| Marketing fluff with no substance | Erodes trust |

## Good Examples

**Bad:** "Bug fixes and performance improvements."
**Good:** "Search just got faster — find what you need in seconds. Plus: improved notification accuracy and smoother transitions."

**Bad:** "We've been working hard on improvements!"
**Good:** "New sleep timer options let you drift off to soothing audio. Choose 15, 30, 45, or 60 minutes."

## Promotional Text Pairing

170 chars max. Summarize the update's theme in one punchy line. Updatable without app submission. Refresh monthly or with each major update.

## Notes
- What's New is **not indexed** for App Store search — write for humans.
- Promotional text is the only metadata field updatable without a new submission.
- Ideal update cadence: every 2-4 weeks.
