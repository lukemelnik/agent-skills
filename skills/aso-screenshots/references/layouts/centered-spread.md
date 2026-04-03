# Layout: Centered Spread

Panoramic layout — one wide image with phones in a fan formation, sliced into individual App Store screenshots. Creates a continuous swipe effect in the App Store.

## How It Works

1. Generate a single wide 4:3 panoramic image with all phones in one scene
2. Save it to `screenshots/<version>/enhanced/panoramic.png`
3. Define the style, screenshot copy, optional screenshot mapping, and text settings in `screenshots/<version>/config.md`
4. Run the skill's centered-spread slicing script against that version folder
5. Review the finished screenshots in `final/`
6. Keep iterating in the same version folder unless the user wants a fresh version

## Recommended repo structure

```text
screenshots/
  v3/
    config.md
    raw/
    enhanced/
      panoramic.png
    final/
      01.png
      02.png
      03.png
```

## Headline mapping

The cleanest way to link a headline to a screenshot is with an explicit panel number in `config.md`.

That is slightly better than relying only on ordering, because it stays readable in git diffs and avoids ambiguity during copy rewrites.

Recommended format:

```md
# Screenshot Config

style: centered-spread
font_big: BebasNeue-Regular.ttf
font_small: Oswald-Bold.ttf
big_size_scale: 0.217
small_size_scale: 0.097
text_top_frac: 0.06
text_gap: 18
gap_src: 37

## 01
panel: 1
raw: raw/01.png
big: BUILD
small: CUSTOM WORKOUTS

## 02
panel: 2
raw: raw/02.png
big: PRACTICE
small: VOCAL EXERCISES

## 03
panel: 3
raw: raw/03.png
big: TRACK
small: YOUR PROGRESS
```

### Notes

- `style:` selects the layout workflow for that version folder
- `panel:` is the canonical link between copy and output image number
- `raw:` or `screenshot:` can document which source capture concept belongs to that panel
- if `panel:` is omitted, the script falls back to the section number
- `font_big` and `font_small` are suggestions/overrides for the text treatment
- if those font files are not found, the script falls back to available system fonts
- numbered output files in `final/` are the actual finished screenshots to upload

## Phone Arrangement

Three phones in a symmetrical fan formation:
- **Center phone**: Hero, facing straight at viewer with slight backward tilt (~5°). Most prominent, slightly in front.
- **Left phone**: Angled ~20° inward (top leans toward center). Partially behind center phone.
- **Right phone**: Mirrors left phone, angled ~20° inward. Partially behind center phone.

## Prompt Template

Adapt the background elements and brand colors to the specific app. The `[APP_DOMAIN_ELEMENTS]` placeholder should be replaced with something relevant — e.g., "sound wave shapes and audio waveforms" for a music app, "chart lines and data visualization curves" for a finance app.

```text
Create a single wide cinematic marketing banner for a [APP_TYPE] app. This is ONE continuous scene — not divided into sections or panels.

BACKGROUND: A single unified gradient flowing smoothly from [BRAND_COLOR] on the left to [BRAND_COLOR_DARK] on the right. The gradient must be completely smooth and continuous with NO color breaks, NO borders, NO visible divisions anywhere. Behind everything, add soft, blurred abstract [APP_DOMAIN_ELEMENTS] that stretch across the entire width continuously. These should be subtle, out of focus, and atmospheric — NOT icons, NOT small individual elements. Think large, gentle, sweeping shapes that span the full image width.

PHONE ARRANGEMENT (CRITICAL — precise positioning):
Three phones arranged in a symmetrical fan formation, like cards fanned out in a hand:

- CENTER PHONE: Positioned dead center of the image. Facing straight toward the viewer, tilted back very slightly (about 5° backward tilt for subtle 3D perspective). This is the hero phone — it should be the most prominent and slightly in front of the other two. Shows the [CENTER_SCREENSHOT_DESCRIPTION].
- LEFT PHONE: Positioned to the left, angled about 20° inward (rotated clockwise so the top leans toward center). Tilted back slightly more than the center phone. Partially behind the center phone. Shows the [LEFT_SCREENSHOT_DESCRIPTION].
- RIGHT PHONE: Positioned to the right, angled about 20° inward (rotated counter-clockwise so the top leans toward center). Mirrors the left phone exactly. Partially behind the center phone. Shows the [RIGHT_SCREENSHOT_DESCRIPTION].

The phones should have noticeable spacing between them — enough that when the panoramic is sliced into thirds, you can clearly see the gap between the center phone and each side phone. No phones should overlap or touch each other. All three phones should be iPhone 15 Pro mockups with titanium frames, dynamic island visible, casting soft shadows.

Do not add extra UI chrome, watermarks, labels, or unintended text.
```

## Slicing

Run the reusable skill script, not a repo-local one:

```bash
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"  # Resolve relative to script location
python3 "$SKILL_DIR/scripts/slice_panoramic.py" --version-dir ./screenshots/v3
```

The script defaults to:
- input: `screenshots/v3/enhanced/panoramic.png`
- config: `screenshots/v3/config.md`
- outputs: `screenshots/v3/final/01.png` etc.

## Important cropping note

If the source image is not wide enough relative to its height, a naive crop can create black bars on the outer panels. The slicing script detects that and trims source height slightly to keep all crops inside the image bounds.

## Scaling to More Screenshots

This layout works best with 3 screenshots. For 4-5, options:
- Generate two panoramics (e.g. 3 + 2)
- Use a wider source if the AI model supports it
- Mix with other layouts — centered-spread for the first 3, vertical for the rest

## Pros

- Creates a continuous swipe effect — encourages users to keep swiping
- More visually dynamic and premium-feeling
- Fan arrangement draws attention to the hero/center phone
- Copy and layout settings are editable and versioned in `config.md`

## Cons

- Harder to redo a single screenshot — usually means regenerating the whole panoramic
- Still depends on a strong panoramic composition
- Best suited to 3 screenshots per panoramic
