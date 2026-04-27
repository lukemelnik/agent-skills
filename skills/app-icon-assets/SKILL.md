---
name: app-icon-assets
description: Create and replace macOS AppIcon.appiconset assets from a raster source image with edge-connected background removal, Apple-sized 1024px source output, visual padding, generated Contents.json, and Dock/Launch Services cache refresh guidance. Use when an agent needs to turn a PNG/JPEG/webp image into native macOS app icon assets, fix an oversized Dock icon, remove a white/transparent background around icon artwork, or update an Xcode/SwiftUI app icon reliably.
---

# App Icon Assets

## Workflow

1. Locate the app icon source image and the target asset catalog folder.
   - Source examples: `~/Downloads/icon.jpeg`, `Assets/IconSource/icon.png`.
   - Target example: `Sources/App/Assets.xcassets/AppIcon.appiconset`.

2. Copy the source image into the repo before generating icons when the icon should be reproducible.

3. Run the bundled script:

```bash
python3 /Users/lukeroes/agent-skills/skills/app-icon-assets/scripts/generate_app_icon.py \
  --source Assets/IconSource/icon.jpeg \
  --output Sources/App/Assets.xcassets/AppIcon.appiconset \
  --prefix app-icon \
  --artwork-scale 0.88
```

4. Inspect the generated `1024x1024` PNG before rebuilding. Use `view_image` when available.

5. Rebuild the app so Xcode compiles `AppIcon.icns`.

6. If the Dock still shows the old icon, verify the compiled `.icns`, then refresh macOS caches:

```bash
APP=".build/xcode/Build/Products/Debug/AppName.app"
pkill -x AppName || true
touch "$APP"
/System/Library/Frameworks/CoreServices.framework/Versions/Current/Frameworks/LaunchServices.framework/Versions/Current/Support/lsregister -f -R -trusted "$APP"
qlmanage -r cache >/dev/null 2>&1 || true
killall Dock || true
open -n "$APP"
```

## Script Notes

- The script emits macOS icon PNGs at `16`, `32`, `64`, `128`, `256`, `512`, and `1024` px, plus a matching `Contents.json`.
- The 1024px output canvas stays exactly `1024x1024`, matching Apple’s app icon source-size guidance.
- `--artwork-scale` controls visual size inside the 1024px canvas. Use `0.84` to `0.90` when a Dock icon looks too large compared to neighboring apps.
- Background removal only removes pale, low-contrast areas connected to the source image edges, preserving internal light regions.
- The script requires Pillow and NumPy. It uses SciPy when available for faster connected-background propagation and falls back to a built-in flood fill otherwise.

