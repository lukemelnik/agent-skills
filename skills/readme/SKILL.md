---
name: readme
description: Create well-structured, polished README files for open source projects. Use when asked to create or rewrite a README.
user-invocable: true
---

# README Creation

Create a README that gets to the point fast, looks professional on GitHub, and scales from quick scan to deep dive.

## Structure

Follow this order. Every section is optional except the title block — include what the project actually needs.

### 1. Title Block (required)

```markdown
# Project Name — short tagline that explains what it does

![Banner](assets/banner.png)

[![License: MIT](https://img.shields.io/badge/...)](...)
[![Language](https://img.shields.io/badge/...)](...)

One sentence that expands on the tagline. What does this tool do and why should someone care?
```

Rules:
- Title is `# Name — tagline` on one line. The tagline is a fragment, not a sentence.
- Banner image goes directly after the H1, before badges. If no image exists, skip it — don't use a placeholder.
- Badges go on one line. Only include badges that are genuinely useful: license, language/runtime version, platform. Skip vanity badges (stars, downloads) unless the project is established.
- Follow with one sentence (two max) that gives the elevator pitch. Not a paragraph.

### 2. Hero Example

Show the tool in action in 1-3 lines of code. No explanation needed — the code should speak for itself.

```markdown
\```bash
tool create something
# comment showing what happened
\```
```

### 3. Feature Bullets

5-7 bullets max. Each one is `**Bold label** — explanation`. Keep explanations to one line.

Rules:
- Lead with the benefit, not the implementation
- No bullet should require knowledge of the project to understand
- Don't list every feature — list the ones that matter most
- Don't start every bullet with "Supports" or "Provides"

### 4. Remaining sections

Include only what the project needs, in roughly this order: Install (shortest path, one command), Quick Start (end-to-end workflow with comments), Configuration (minimal then full; field table), Commands/API (one-line description plus example per command; let clear `--help` speak), How It Works (only if non-obvious), Examples (3-4, each labeled by use case), Requirements (optional deps last), License (one line).

---

## Style Rules

### Tone
- Direct and confident. No hedging ("might", "should be able to", "it is possible to").
- Write for someone scanning, not reading. They will read the parts that catch their eye.
- No marketing language. Don't call the project "powerful", "blazing fast", "elegant", or "simple". Show, don't tell.
- Don't address the reader as "you" excessively. State facts about the tool.

### Formatting
- Use `##` for main sections, `###` for subsections. Never use `####` — if you need it, your structure is too deep.
- Code blocks get a language tag. Always.
- Tables for structured reference data. Prose for explanations.
- Bold for key terms on first use. Not for emphasis on random words.
- Em dashes (—) for asides, not parentheses or commas.
- No emojis in headers or body text unless the user specifically asks for them.

### What to Leave Out
- "Table of Contents" — GitHub auto-generates one. Don't duplicate it.
- "Contributing" section — put this in CONTRIBUTING.md if needed.
- "Changelog" — put this in CHANGELOG.md.
- Badges for build status, coverage, or code quality unless the project has CI set up.
- Screenshots of terminal output — use code blocks instead. Screenshots can't be searched, copied, or read by screen readers.
- "FAQ" sections — fold answers into the relevant sections instead.

### Images
- If the user provides a banner/hero image, place it right after the H1 title.
- Use relative paths (`assets/banner.png`) not absolute URLs.
- Keep images in an `assets/` directory at the repo root.
- Add alt text that describes the image content.

---

## Process

1. **Read the codebase first.** Understand what the project does, its commands/API, config format, and any interesting internals. Don't guess.
2. **Check for existing docs.** Look for project agent instructions (AGENTS.md or equivalent), existing README, doc comments, `--help` output. Build on what exists.
3. **Draft the README** following the structure above. Include only sections the project needs.
4. **Review for length.** If the README is over 400 lines, look for sections to trim or move to separate doc files. A README should be comprehensive but not exhaustive.
5. **Check all code examples** are accurate — commands, flags, config keys, output formats should match the actual implementation.
