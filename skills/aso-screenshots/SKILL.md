---
name: aso-screenshots
description: Generate high-converting App Store screenshots for iOS apps. Analyzes codebase to discover core benefits, automates simulator screenshot capture via axe, pairs benefits with screenshots, composites marketing-ready images with device frames and headlines, and optionally enhances with AI image generation. Use when asked to create App Store screenshots, generate ASO screenshots, make marketing screenshots, or prepare screenshots for App Store Connect upload.
---

# ASO Screenshots

Multi-phase workflow to produce App Store-ready marketing screenshots. Works standalone or feeds into the `asc` skill for upload.

## State File

All progress is saved to `.aso-screenshots/state.json` in the project root. Check for it before starting — resume from the last completed phase. Present a status summary showing completed phases and offer to resume or redo any phase.

State schema: see [references/state-schema.md](references/state-schema.md)

## Phase 1: Benefit Discovery

Read [references/benefit-discovery.md](references/benefit-discovery.md) for the full process.

**Summary:** Analyze the codebase → ask clarifying questions → draft 3-5 benefit headlines (ACTION VERB + descriptor) → iterate with user → save to state.

## Phase 2: Screenshot Capture

Two paths — ask the user which:

### Path A: Automated capture (recommended)
Read [references/capture.md](references/capture.md). Uses `axe` + `xcrun simctl` to navigate the app, set up ideal screen state, and capture screenshots automatically.

### Path B: Manual screenshots
User provides paths to existing simulator screenshots. Skip to assessment.

### Assessment
For every screenshot, rate **Great / Usable / Retake** with honest feedback. Coach on retakes. See [references/capture.md](references/capture.md) for rating criteria.

## Phase 3: Pairing

Pair each benefit with the best screenshot. Consider relevance, visual impact, clarity at thumbnail size, and uniqueness. Present pairings with reasoning. Confirm with user before proceeding.

## Phase 4: Layout Selection & Composition

Present the available layout options and let the user choose. Each layout has its own reference doc with prompts and generation instructions:

| Layout | Description | Reference |
|--------|-------------|-----------|
| **Vertical** | Classic — one upright phone per screenshot, headline above. Reliable, crisp text guaranteed via Pillow scaffold. | [references/layouts/vertical.md](references/layouts/vertical.md) |
| **Centered Spread** | Panoramic — 3 phones in a fan formation, one wide image sliced into panels. Creates continuous swipe effect. Requires AI image generation. | [references/layouts/centered-spread.md](references/layouts/centered-spread.md) |

### If Vertical:
Read [references/composition.md](references/composition.md). Determine brand color → run `scripts/compose.py` → present scaffolds → ask if user wants AI enhancement (optional polish pass). If no enhancement, scaffolds go straight to `final/`.

### If Centered Spread:
Read [references/layouts/centered-spread.md](references/layouts/centered-spread.md). Requires AI image generation (Google Flow, Gemini MCP, or similar). Determine brand color → fill in the prompt template → user generates the panoramic → slice into panels with the provided Python script.

### AI Enhancement (Vertical layout only, optional)

After reviewing scaffold screenshots, ask: **"Would you like to enhance these with AI image generation for a more polished look?"**

If yes, read [references/ai-enhance.md](references/ai-enhance.md). If no, copy scaffolds directly to `final/`.

Output structure:
```
.aso-screenshots/
  01-benefit-slug/
    scaffold.png          ← compose.py output (vertical only)
    final.png             ← approved version
  02-benefit-slug/
    ...
  final/                  ← App Store-ready, numbered
    01-benefit-slug.png
    02-benefit-slug.png
```

## Phase 6: Upload

Once all screenshots are in `final/`, offer to upload via the `asc` skill:
```bash
asc screenshots upload \
  --version-localization "LOC_ID" \
  --path ".aso-screenshots/final" \
  --device-type "IPHONE_67" \
  --output json
```

## App Store Dimensions

| Display | Portrait |
|---------|----------|
| iPhone 6.5" | 1242 × 2688 |
| iPhone 6.7" (default) | 1290 × 2796 |
| iPhone 6.9" | 1320 × 2868 |

Default to 6.7" unless user specifies otherwise.

## Key Principles

- Benefits over features: "BOOST ENGAGEMENT" not "ADD SUBTITLES"
- Specific over generic: "TRACK CARD PRICES" not "MANAGE YOUR STUFF"
- Every headline starts with a strong action verb
- First screenshot is most important — single biggest reason to download
- Never use empty states, loading screens, or settings pages
- Screenshots should tell a story when swiped through

## Attribution

Scaffold/enhance pipeline concept inspired by [adamlyttleapps/claude-skill-aso-appstore-screenshots](https://github.com/adamlyttleapps/claude-skill-aso-appstore-screenshots) (MIT).
