# AI Enhancement

Optional phase — only run if user opts in after reviewing scaffolds.

## Prerequisites

Check for available image generation MCP tools. Look for tools like `edit_image`, `generate_image`, or similar. If none available, tell the user what's needed and skip this phase.

## Process

For each scaffold, generate **3 enhanced versions in parallel** so the user can pick.

### First Screenshot (Style Template)

Use the scaffold as input. Prompt:

```
Transform this App Store screenshot scaffold into a polished, professional marketing image.

KEEP EXACTLY:
- Headline text (wording, position, approximate size)
- App screenshot shown on phone screen
- Background color

ENHANCE:
- Replace device frame with photorealistic iPhone mockup — sleek, with reflections and subtle shadows
- Refine overall visual quality to professional App Store standard
- Optionally add a breakout element: if an obvious UI panel on screen directly relates to the headline, scale it up to extend beyond both edges of the device frame with a drop shadow. Only use complete panels/cards, never individual buttons or icons. Skip if nothing clearly reinforces the headline.
- Background must remain clean solid color — no glows, gradients, or radial patterns
- Text must be crisp, bold, highly readable

No watermarks, no extra text, no App Store UI chrome.
```

### Subsequent Screenshots

Use **two images**: the scaffold (layout) + first approved screenshot (style template).

```
Create the next screenshot in this App Store set. It must match the style reference exactly.

FIRST IMAGE: SCAFFOLD — defines layout (text, device position, screen content)
SECOND IMAGE: STYLE TEMPLATE — match its device frame, text treatment, background, and polish exactly

Requirements:
- Device frame MUST match style template (same rendering, shadows, reflections)
- Same text treatment, background style
- Optionally add breakout element following same rules as above
- Visual cohesion — these must look like a professional set when side by side

No watermarks, no extra text, no App Store UI chrome.
```

### Post-Processing

After enhancement, ALWAYS crop/resize to exact App Store dimensions:

```bash
TARGET_W=1290 && TARGET_H=2796 && \
for INPUT in .aso-screenshots/01-*/v1.png .aso-screenshots/01-*/v2.png .aso-screenshots/01-*/v3.png; do
  OUTPUT="${INPUT%.png}-resized.png"
  cp "$INPUT" "$OUTPUT"
  W=$(sips -g pixelWidth "$OUTPUT" | tail -1 | awk '{print $2}')
  H=$(sips -g pixelHeight "$OUTPUT" | tail -1 | awk '{print $2}')
  CROP_W=$(python3 -c "print(round($H * $TARGET_W / $TARGET_H))")
  OFFSET_X=$(python3 -c "print(round(($W - $CROP_W) / 2))")
  sips --cropOffset 0 $OFFSET_X --cropToHeightWidth $H $CROP_W "$OUTPUT"
  sips -z $TARGET_H $TARGET_W "$OUTPUT"
done
```

Show only resized versions to user. Never show raw AI output.

### Review & Iterate

Present all 3 resized versions. User picks favorite or requests changes.

For iterations, use **three images**: scaffold (layout) + style template (consistency) + user's preferred version (creative direction). Generate 3 new variants.

### Finalize

Copy approved enhanced version to final:
```bash
cp ".aso-screenshots/01-slug/v2-resized.png" ".aso-screenshots/final/01-slug.png"
```

The first approved screenshot becomes the style template for remaining screenshots.
