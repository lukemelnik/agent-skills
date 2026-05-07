# Layout: Vertical

Classic App Store screenshot layout — one phone per screenshot, upright, with headline text above.

Use `screenshots/<version>/config.md` as the per-version source of truth. Set `style: vertical` and define one section per output screenshot with its `panel:`, `raw:` or `screenshot:`, `big:`, and `small:` values.

## How It Works

Each screenshot is generated independently using `scripts/compose.py`:
- Bold headline text (verb + descriptor) in the top ~25%
- Single upright iPhone device frame centered below
- Simulator screenshot composited inside the frame
- Phone bleeds off the bottom edge
- Solid brand color background

## Generation

Run compose.py for each panel defined in `config.md`:
```bash
python3 "$SKILL_DIR/scripts/compose.py" \
  --bg "#6B4FC4" \
  --verb "PRACTICE" \
  --desc "VOCAL EXERCISES" \
  --screenshot ./screenshots/v3/raw/practice.png \
  --output ./screenshots/v3/final/02.png
```

The finished approved screenshot should end up in `screenshots/<version>/final/`.

## AI Enhancement (Optional)

If the user opts for AI enhancement, use this prompt template per screenshot:

```
Transform this App Store screenshot scaffold into a polished, professional marketing image.

KEEP EXACTLY:
- Headline text (wording, position, approximate size)
- App screenshot shown on phone screen
- Background color

ENHANCE:
- Replace device frame with photorealistic iPhone 15 Pro mockup with reflections and subtle shadows
- Add subtle, blurred background elements inspired by the app's domain — atmospheric and out of focus, not icons or small objects
- Background should remain predominantly the solid brand color — no dramatic gradients or hard color changes
- Text must be crisp, bold, highly readable

No watermarks, no extra text, no App Store UI chrome.
```

## Pros
- Simple, reliable, fast
- Scaffold gives guaranteed-crisp text (no AI text rendering issues)
- Each screenshot is independent — easy to redo one without affecting others

## Cons
- Less visually dynamic than multi-phone layouts
- No continuity effect when swiping
