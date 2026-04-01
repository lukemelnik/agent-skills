# Layout: Centered Spread

Panoramic layout — one wide image with phones in a fan formation, sliced into individual App Store screenshots. Creates a continuous swipe effect in the App Store.

## How It Works

1. Generate a single wide 4:3 panoramic image with all phones and headlines in one scene
2. AI generates the full composition (phones, background, text)
3. Slice into equal vertical panels at exact App Store dimensions
4. Each panel works standalone but forms a continuous scene when swiped

## Phone Arrangement

Three phones in a symmetrical fan formation:
- **Center phone**: Hero, facing straight at viewer with slight backward tilt (~5°). Most prominent, slightly in front.
- **Left phone**: Angled ~20° inward (top leans toward center). Partially behind center phone.
- **Right phone**: Mirrors left phone, angled ~20° inward. Partially behind center phone.

## Prompt Template

Adapt the background elements and brand colors to the specific app. The `[APP_DOMAIN_ELEMENTS]` placeholder should be replaced with something relevant — e.g., "sound wave shapes and audio waveforms" for a music app, "chart lines and data visualization curves" for a finance app.

```
Create a single wide cinematic marketing banner for a [APP_TYPE] app. This is ONE continuous scene — not divided into sections or panels.

BACKGROUND: A single unified gradient flowing smoothly from [BRAND_COLOR] on the left to [BRAND_COLOR_DARK] on the right. The gradient must be completely smooth and continuous with NO color breaks, NO borders, NO visible divisions anywhere. Behind everything, add soft, blurred abstract [APP_DOMAIN_ELEMENTS] that stretch across the entire width continuously. These should be subtle, out of focus, and atmospheric — NOT icons, NOT small individual elements. Think large, gentle, sweeping shapes that span the full image width.

TEXT RENDERING (CRITICAL — highest priority):
All headline text MUST be perfectly sharp, crisp, and geometrically precise — as if typeset by a professional graphic designer. Use clean, heavy-weight sans-serif block capitals with perfectly straight edges, uniform letter spacing, and consistent stroke width. No wobble, no warping, no handwritten quality. All headlines must use the EXACT same font, size, weight, and spacing.

PHONE ARRANGEMENT (CRITICAL — precise positioning):
Three phones arranged in a symmetrical fan formation, like cards fanned out in a hand:

- CENTER PHONE: Positioned dead center of the image. Facing straight toward the viewer, tilted back very slightly (about 5° backward tilt for subtle 3D perspective). This is the hero phone — it should be the most prominent and slightly in front of the other two. Shows the [CENTER_SCREENSHOT_DESCRIPTION].

- LEFT PHONE: Positioned to the left, angled about 20° inward (rotated clockwise so the top leans toward center). Tilted back slightly more than the center phone. Partially behind the center phone. Shows the [LEFT_SCREENSHOT_DESCRIPTION].

- RIGHT PHONE: Positioned to the right, angled about 20° inward (rotated counter-clockwise so the top leans toward center). Mirrors the left phone exactly. Partially behind the center phone. Shows the [RIGHT_SCREENSHOT_DESCRIPTION].

The phones should have noticeable spacing between them — enough that when the panoramic is sliced into thirds, you can clearly see the gap between the center phone and each side phone. No phones should overlap or touch each other. All three phones should be iPhone 15 Pro mockups with titanium frames, dynamic island visible, casting soft shadows.

TEXT LAYOUT:
- Upper left: "[LEFT_VERB]" (very large, bold, white) with "[LEFT_DESC]" below (smaller, bold, white)
- Upper center: "[CENTER_VERB]" (very large, bold, white) with "[CENTER_DESC]" below (smaller, bold, white)
- Upper right: "[RIGHT_VERB]" (very large, bold, white) with "[RIGHT_DESC]" below (smaller, bold, white)

Professional, high-budget App Store quality. No watermarks, no extra text, no App Store UI chrome.
```

## Slicing

After generating the 4:3 panoramic, slice into panels and resize to App Store dimensions:

**Important:** If the source image isn't wide enough, `crop_w` can exceed `panel_w`, causing the edge panels to extend beyond the image bounds and produce black bars. The script below detects this and trims the source height to fit. A 4:3 panoramic at 2400×1792 needs ~29px trimmed — barely visible.

```python
from PIL import Image

img = Image.open("panoramic.png")
w, h = img.size
panel_w = w // 3
target_ratio = 1290 / 2796  # iPhone 6.7"

crop_w = int(h * target_ratio)

# If crop_w > panel_w, the edge panels would extend beyond
# the image and produce black bars. Trim the height to fit.
if crop_w > panel_w:
    h = int(panel_w / target_ratio)
    top = (img.height - h) // 2
    img = img.crop((0, top, w, top + h))
    crop_w = int(h * target_ratio)

offset = (panel_w - crop_w) // 2

for i in range(3):
    left = i * panel_w + offset
    panel = img.crop((left, 0, left + crop_w, h))
    panel = panel.resize((1290, 2796), Image.LANCZOS)
    panel.save(f"final/0{i+1}.png", "PNG")
```

Only generate 6.7" (1290×2796) — it's the current App Store standard. Do not generate 6.5" or other sizes unless explicitly asked.

## Scaling to More Screenshots

This layout works best with 3 screenshots. For 4-5, options:
- Generate two panoramics (e.g., 3 + 2)
- Use a wider aspect ratio if the AI model supports it
- Mix with other layouts — centered-spread for the first 3, vertical for the rest

## Pros
- Creates a continuous swipe effect — encourages users to keep swiping
- More visually dynamic and premium-feeling
- Fan arrangement draws attention to the hero/center phone

## Cons
- AI must render text (may need multiple attempts for crisp results)
- Phone screen content is AI-reproduced, not pixel-perfect from simulator
- Harder to redo a single screenshot — regenerates the whole panoramic
- Limited to 3 screenshots per panoramic
