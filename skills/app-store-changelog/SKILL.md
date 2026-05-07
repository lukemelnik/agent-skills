---
name: app-store-changelog
description: Generate user-facing App Store release notes from git history since the last tag. Use when asked to create a changelog, "What's New" text, or release notes based on git history or tags.
---

# App Store Changelog

## Overview

Generate a comprehensive, user-facing changelog from git history since the last tag, then translate commits into clear App Store release notes.

## Workflow

### 1) Collect changes

Gather commits and touched files since the last tag:

```bash
# Auto-detect last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -z "$LAST_TAG" ]; then
  RANGE="HEAD"
else
  RANGE="$LAST_TAG..HEAD"
fi

# List commits
git log --oneline $RANGE

# List touched files
git diff --name-only $LAST_TAG HEAD 2>/dev/null || git log --name-only --pretty=format: | sort -u
```

If no tags exist, fall back to full history.

### 2) Triage for user impact

- Scan commits and files to identify user-visible changes.
- Group changes by theme (New, Improved, Fixed) and deduplicate overlaps.
- Drop internal-only work (build scripts, refactors, dependency bumps, CI).

### 3) Draft App Store notes

- Write short, benefit-focused bullets for each user-facing change.
- Use clear verbs and plain language; avoid internal jargon.
- Prefer 5 to 10 bullets unless the user requests a different length.

### 4) Validate

- Ensure every bullet maps back to a real change in the range.
- Check for duplicates and overly technical wording.
- Ask for clarification if any change is ambiguous or possibly internal-only.

## Output Format

- Title (optional): "What's New" or product name + version.
- Bullet list only; one sentence per bullet.
- Stick to storefront limits if the user provides one.

## Resources

- `references/release-notes-guidelines.md`: Language, filtering, and QA rules for App Store notes.
