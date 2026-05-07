# Composition

## Brand Color Selection

Determine automatically — do NOT ask the user to pick:

1. Check codebase for accent colors, tint colors, brand colors in asset catalogs, theme files, color constants
2. Study simulator screenshots — dominant colors, palette
3. Consider app domain and audience

Pick a color that:
- **Complements screenshots** — makes app screens pop. If app UI is light, use bold saturated background.
- **Stops the scroll** — vibrant, bold, saturated. No pastels.
- **Suits the app's personality**
- **Avoids pitfalls** — no white/light grey (disappears), avoid colors too close to app UI's dominant color

Present your choice with brief reasoning. User can override but don't present as a question.

## Scaffold Generation

Run `scripts/compose.py` for each benefit/screenshot pair:

```bash
SKILL_DIR="$(dirname "$(readlink -f "$0")")"  # or resolve from skill location
# The compose.py script is in the skill's scripts/ directory

python3 "$SKILL_DIR/scripts/compose.py" \
  --bg "#2563EB" \
  --verb "TRACK" \
  --desc "CARD PRICES" \
  --screenshot .aso-screenshots/raw/prices.png \
  --output .aso-screenshots/01-track-card-prices/scaffold.png
```

Batch all scaffolds in a single bash call:
```bash
mkdir -p .aso-screenshots/01-track-card-prices .aso-screenshots/02-search-any-card && \
python3 "$SKILL_DIR/scripts/compose.py" \
  --bg "#2563EB" --verb "TRACK" --desc "CARD PRICES" \
  --screenshot .aso-screenshots/raw/prices.png \
  --output .aso-screenshots/01-track-card-prices/scaffold.png && \
python3 "$SKILL_DIR/scripts/compose.py" \
  --bg "#2563EB" --verb "SEARCH" --desc "ANY CARD" \
  --screenshot .aso-screenshots/raw/search.png \
  --output .aso-screenshots/02-search-any-card/scaffold.png
```

The script resolves its own `assets/` directory for the device frame template.

## Crop & Resize to App Store Dimensions

The scaffold outputs at 1290×2796 by default. If generating at a different size or after AI enhancement, crop and resize:

```bash
TARGET_W=1290 && TARGET_H=2796 && \
for INPUT in .aso-screenshots/*/scaffold.png; do
  OUTPUT="${INPUT%.png}-final.png"
  cp "$INPUT" "$OUTPUT"
  W=$(sips -g pixelWidth "$OUTPUT" | tail -1 | awk '{print $2}')
  H=$(sips -g pixelHeight "$OUTPUT" | tail -1 | awk '{print $2}')
  CROP_W=$(python3 -c "print(round($H * $TARGET_W / $TARGET_H))")
  OFFSET_X=$(python3 -c "print(round(($W - $CROP_W) / 2))")
  sips --cropOffset 0 $OFFSET_X --cropToHeightWidth $H $CROP_W "$OUTPUT"
  sips -z $TARGET_H $TARGET_W "$OUTPUT"
done
```

## Review

Present all scaffold screenshots to the user via Read tool. For each one, show the benefit headline and which simulator screenshot was used. Ask if they're happy or want adjustments.

If adjustments needed:
- **Different screenshot**: swap the pairing and re-run compose.py
- **Different headline**: update benefit and re-run compose.py
- **Different color**: update brand color and re-run all scaffolds

Once approved, copy to final:
```bash
mkdir -p .aso-screenshots/final
cp .aso-screenshots/01-track-card-prices/scaffold.png .aso-screenshots/final/01-track-card-prices.png
```

Then ask about AI enhancement (Phase 5).
