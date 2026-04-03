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

Present the available layout options and let the user choose. Each layout has its own reference doc with prompts and generation instructions.

### Project folder conventions for screenshot work

When working in a repo that already has a `screenshots/` folder at the project root, prefer using that folder instead of inventing a parallel structure.

### Context-size safety for screenshot work

To avoid API payload overages and `413 request_too_large` errors:

- Do **not** load multiple high-resolution screenshots into model context unless absolutely necessary
- Prefer working from file paths, repo assets, and script outputs instead of repeatedly opening large image files
- Only open a single full-resolution image at a time when visual inspection is necessary
- Do not batch-read many PNGs in one turn
- Prefer updating `config.md` and rerunning the skill scripts over repeatedly attaching or reading source images

- Store screenshot sets under `screenshots/<version>/` such as `screenshots/v3/`
- Reuse the current version folder for iterative tweaks within the same session
- Ask the user before creating a new version folder if the work feels like a new direction or a major reset
- Within each version folder, prefer this structure:

```text
screenshots/
  v3/
    config.md   ← style, copy, font suggestions, layout tuning, panel mapping
    raw/        ← original simulator captures or raw panoramic source
    enhanced/   ← AI-enhanced panoramic source + review composites
    final/      ← final App Store-ready numbered panels
```

For centered-spread iterations, treat the AI-enhanced panoramic as the working source of truth for slicing. Run the skill's slicing script against the current version folder so it reads `screenshots/<version>/enhanced/panoramic.png` and `screenshots/<version>/config.md` rather than unrelated desktop exports or temporary files.

| Layout | Description | Reference |
|--------|-------------|-----------|
| **Vertical** | Classic — one upright phone per screenshot, headline above. Reliable, crisp text guaranteed via Pillow scaffold. | [references/layouts/vertical.md](references/layouts/vertical.md) |
| **Centered Spread** | Panoramic — 3 phones in a fan formation, one wide image sliced into panels. Creates continuous swipe effect. Requires AI image generation. | [references/layouts/centered-spread.md](references/layouts/centered-spread.md) |

### If Vertical:
Read [references/composition.md](references/composition.md) and [references/layouts/vertical.md](references/layouts/vertical.md). Determine brand color → set `style: vertical` in `screenshots/<version>/config.md` → use each panel section's `raw:`/`screenshot:` + `big:`/`small:` values to run `scripts/compose.py` → present scaffolds → ask if user wants AI enhancement (optional polish pass). If no enhancement, write approved finished screenshots to `final/`.

### If Centered Spread:
Read [references/layouts/centered-spread.md](references/layouts/centered-spread.md). Requires AI image generation (Google Flow, Gemini MCP, or similar). Determine brand color → fill in the prompt template → user generates the panoramic → save that panoramic in `screenshots/<version>/enhanced/panoramic.png` → store style, copy, and optional font suggestions in `screenshots/<version>/config.md` → run the skill's `scripts/slice_panoramic.py` against that version folder so finished screenshots are written to `screenshots/<version>/final/`.

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

Only generate 6.7" by default — it's the current App Store standard. The 6.5" size is no longer required.

| Display | Portrait | Required |
|---------|----------|----------|
| iPhone 6.7" (default) | 1290 × 2796 | ✅ |
| iPhone 6.9" | 1320 × 2868 | No |
| iPhone 6.5" | 1242 × 2688 | No |

Do **not** generate additional sizes unless the user explicitly asks for them.

## Key Principles

- Benefits over features: "BOOST ENGAGEMENT" not "ADD SUBTITLES"
- Specific over generic: "TRACK CARD PRICES" not "MANAGE YOUR STUFF"
- Every headline starts with a strong action verb
- First screenshot is most important — single biggest reason to download
- Never use empty states, loading screens, or settings pages
- Screenshots should tell a story when swiped through

## Attribution

Scaffold/enhance pipeline concept inspired by [adamlyttleapps/claude-skill-aso-appstore-screenshots](https://github.com/adamlyttleapps/claude-skill-aso-appstore-screenshots) (MIT).
