# Rendering Videos

## Basic render

```bash
cd remotion
pnpm run render <CompositionId> -- --output=out/video.mp4
```

## Common options

### Output location
```bash
--output=out/my-video.mp4
```

### Quality vs speed

**Fast preview (lower quality):**
```bash
pnpm run render MyVideo -- --output=out/preview.mp4 --scale=0.5 --quality=50
```

**Production quality:**
```bash
pnpm run render MyVideo -- --output=out/final.mp4 --quality=100 --codec=h264
```

### Scale

Reduce resolution for faster previews:
```bash
--scale=0.5    # Half resolution
--scale=0.25   # Quarter resolution
```

### Codec options

```bash
--codec=h264        # Default, widely compatible
--codec=h265        # Smaller files, less compatible
--codec=prores      # High quality, large files (for editing)
--codec=gif         # Animated GIF output
```

### Frame range

Render only a portion:
```bash
--frame-range=0-90   # First 3 seconds at 30fps
```

### Props

Pass props to the composition:
```bash
--props='{"headline": "New Feature!", "screenshots": ["s1.png", "s2.png"]}'
```

## Useful scripts

Add to `package.json`:

```json
{
  "scripts": {
    "studio": "remotion studio",
    "render": "remotion render",
    "preview": "remotion render --scale=0.5 --quality=50",
    "render:promo": "remotion render ProductPromo --output=out/promo.mp4",
    "render:help": "remotion render HelpVideo --output=out/help.mp4"
  }
}
```

## Render and open

```bash
pnpm run render MyVideo -- --output=out/video.mp4 && open out/video.mp4
```

## Batch rendering

Render multiple compositions:
```bash
pnpm run render Promo1 -- --output=out/promo1.mp4
pnpm run render Promo2 -- --output=out/promo2.mp4
```

Or create a script:
```bash
#!/bin/bash
for comp in Promo1 Promo2 Promo3; do
  pnpm run render $comp -- --output=out/$comp.mp4
done
```

## Troubleshooting

### Out of memory
- Reduce `--concurrency` (default is CPU count)
- Use `--scale` to reduce resolution
- Close other applications

### Slow renders
- Use `--gl=angle` on Windows
- Ensure GPU acceleration is enabled
- Reduce composition complexity

### Audio issues
- Ensure audio files are MP3/AAC (not WAV)
- Check audio file paths are correct
