---
name: aso-screenshots
description: Generate high-converting App Store screenshots for iOS apps. Analyze benefits, capture real simulator screenshots, generate one polished AI portrait panel per screenshot, normalize to App Store dimensions, and run visual QA before upload.
---

# ASO Screenshots

Use this workflow to produce App Store-ready iPhone screenshot panels. The canonical path is:

```text
benefits -> real simulator screenshots -> one image-gen portrait per panel -> normalize -> QA -> final/
```

The current image model handles headline text and device-framed portrait layouts well enough that the best result comes from generating each final portrait panel individually while treating real app screenshots as strict UI references.

## State File

All progress is saved to `.aso-screenshots/state.json` in the project root when useful. If the file exists, read it first and summarize what is already done.

State schema: see `references/state-schema.md`.

## Phase 1: Benefit Discovery

Read `references/benefit-discovery.md` for the detailed discovery process.

Summary:

1. Inspect the app code, UI screens, README, metadata, and existing screenshots.
2. Identify the target user and the strongest concrete benefits.
3. Draft 3-5 headline pairs in the shape `ACTION VERB` + `SPECIFIC OUTCOME`.
4. Iterate with the user until they approve the exact headline text.

Rules:

- Benefits must describe what the user gets, not implementation details.
- Be specific and concrete.
- Avoid vague claims like “practice smarter” unless the app genuinely supports them.
- Keep headline text short enough for a portrait screenshot.

## Phase 2: Raw Screenshot Capture

Use real app screenshots as the source of truth. Either capture them from the simulator or use user-provided screenshots if they already exist.

Recommended folder structure:

```text
screenshots/
  v1/
    config.md
    raw/
      01-feature-name-full.png
      02-feature-name-full.png
      03-feature-name-full.png
    final/
      01.png
      02.png
      03.png
```

Capture guidance:

- Prefer full simulator screenshots from `xcrun simctl io <device> screenshot`, not optimized/compressed tool screenshots.
- Build useful, populated states before capture. Avoid empty states, loading screens, settings-only screens, and accidental debug UI.
- If temporary seeded data is needed, keep it out of production paths or remove it after capture.
- Open only one full-resolution screenshot in model context at a time unless comparison is necessary.

Assess every raw screenshot before generation:

- **Great:** visually clear, populated, directly supports a headline.
- **Usable:** clear enough but could benefit from better state/data/framing.
- **Retake:** empty, confusing, stale, wrong state, or weak at thumbnail size.

## Phase 3: Pairing

Pair each approved headline with the raw screenshot that proves it.

For each panel, record in `screenshots/<version>/config.md`:

```text
## 01
final: final/01.png
source: raw/01-feature-name-full.png
headline: DIAL IN
subheadline: BPM + METER
```

Pairing rules:

- The screenshot must visibly support the headline.
- The first panel should carry the main reason to download.
- Avoid repeating the same visual state unless the headline clearly changes what the user should notice.

## Phase 4: Image-Gen Portrait Panels

Generate one final portrait App Store screenshot per panel with the built-in `image_gen` tool.

For each panel:

1. Make the raw screenshot visible in context with `view_image`.
2. Call `image_gen` once for that panel.
3. In the prompt, require a complete portrait App Store screenshot with:
   - exact headline and subheadline text
   - the real app screenshot as a strict UI reference
   - a realistic iPhone device frame
   - a polished marketing background
   - no fake UI and no altered app content
4. Copy the generated image from `$CODEX_HOME/generated_images/...` into `screenshots/<version>/final/`.
5. Normalize it to `1290x2796`.

Prompt template:

```text
Use case: ads-marketing
Asset type: single portrait App Store screenshot, final upload panel
Primary request: Create one complete portrait App Store screenshot for <app name> using the visible app screenshot as the strict UI reference. Match the app’s visual style and create a polished App Store marketing panel.

Exact headline text, all caps, spelled exactly:
<HEADLINE>
<SUBHEADLINE>

Composition: tall portrait App Store screenshot. Large headline at the top with generous margins and no overlap. Below it, place the app screenshot inside a realistic iPhone frame. Keep the phone fully inside the image and readable.

Device direction: <left-leaning / straight-on / right-leaning>. For a 3-panel set, vary direction as left / straight / right so the set feels intentional.

Background: <describe brand-relevant background>. Keep brightness, contrast, and saturation consistent with the other panels. No square boxes behind text. No divider lines.

UI fidelity: Preserve the actual app UI content from the source screenshot: <list the visible important labels, values, controls, selected tab, records, etc.>. Do not change text or invent controls.

Typography: bold condensed white uppercase marketing type with black shadow/stroke. The two headline lines must never overlap and must not touch edges.

Constraints: no misspelled words, no extra words, no watermark, no fake UI, no headline cropping, no overlapping text, no inconsistent exposure.
```

For a three-panel set, use these direction defaults:

- Panel 1: slightly left-leaning/counterclockwise.
- Panel 2: centered and nearly straight-on.
- Panel 3: slightly right-leaning/clockwise.

## Phase 5: Normalize

Final iPhone 6.7" portrait screenshots must be `1290x2796`.

Use this normalization pattern after copying generated files into `final/`:

```bash
python3 - <<'PY'
from pathlib import Path
from PIL import Image

target = (1290, 2796)
for path in sorted(Path("screenshots/v1/final").glob("*.png")):
    image = Image.open(path).convert("RGB")
    scale = max(target[0] / image.width, target[1] / image.height)
    resized = image.resize(
        (round(image.width * scale), round(image.height * scale)),
        Image.Resampling.LANCZOS,
    )
    x = (resized.width - target[0]) // 2
    y = (resized.height - target[1]) // 2
    final = resized.crop((x, y, x + target[0], y + target[1]))
    final.save(path)
    print(path, final.size)
PY
```

If the crop damages the headline or phone, regenerate the panel with a stricter portrait composition prompt instead of accepting a bad crop.

## Phase 6: QA

Open each final image and inspect it before finishing.

Required checks:

- File is exactly `1290x2796`.
- Headline and subheadline are spelled exactly as approved.
- No headline overlap, clipping, or edge contact.
- No generated fake app UI, fake records, fake controls, or altered key values.
- Phone framing is readable and crop-safe.
- The set has intentional variation in phone angle and composition.
- Exposure, contrast, and saturation are consistent across panels.
- No hard rectangular blocks, divider lines, watermarks, or artifacts.
- The first panel is the strongest download hook.

If any check fails, regenerate the individual failed panel only. Do not redo the whole set unless the overall direction is wrong.

## Phase 7: Upload

Once approved, final upload-ready images live in:

```text
screenshots/<version>/final/
```

If asked to upload, use the `asc` skill:

```bash
asc screenshots upload \
  --version-localization "LOC_ID" \
  --path "screenshots/<version>/final" \
  --device-type "IPHONE_67" \
  --output json
```

## App Store Dimensions

Only generate 6.7" by default.

| Display | Portrait | Required |
|---------|----------|----------|
| iPhone 6.7" (default) | 1290 × 2796 | yes |
| iPhone 6.9" | 1320 × 2868 | no |
| iPhone 6.5" | 1242 × 2688 | no |

Do not generate additional sizes unless the user explicitly asks for them.

## Key Principles

- Real app screenshots are the source of truth.
- Generate each portrait panel individually.
- Text must be exact, readable, and approved.
- Marketing polish is allowed around the UI; hallucinated UI is not.
- Keep the final folder boring and obvious: numbered upload files only.

## Attribution

Original ASO screenshot workflow concept inspired by `adamlyttleapps/claude-skill-aso-appstore-screenshots` (MIT). The current canonical workflow uses individual image-generated portrait panels with real simulator screenshots as strict UI references.
