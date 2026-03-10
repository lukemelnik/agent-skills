---
name: video-studio
description: "Create product videos, help docs, and promotional content using Remotion. Use when asked to create promo videos, tutorial videos, or set up video creation capabilities in a project."
---

# Video Studio Skill

Create product videos, help documentation, and promotional content using Remotion.

## When to use

Use this skill when the user asks to:
- Create a promo/product video for an app or feature
- Create help documentation videos
- Capture screenshots or recordings of a running app
- Set up video creation capabilities in a project
- Render video compositions

## Capabilities

1. **Scaffold** - Set up a `remotion/` folder in any project (pnpm, gitignored)
2. **Product Promos** - Animated screenshots, text overlays, transitions, music
3. **Help Videos** - Tutorial-style content with narration (TTS integration TBD)
4. **Screen Capture** - Use Chrome DevTools MCP to capture screenshots from running apps
5. **Render** - Output final MP4 videos

## How to use

Read the relevant rule files in `rules/` for detailed patterns:

- [rules/scaffold.md](rules/scaffold.md) - Setting up remotion in a project
- [rules/promo.md](rules/promo.md) - Product promo video patterns
- [rules/help.md](rules/help.md) - Help documentation video patterns
- [rules/capture.md](rules/capture.md) - Screenshot and recording workflow
- [rules/render.md](rules/render.md) - Rendering commands and options

## Project structure

When scaffolded, creates:
```
project/
├── remotion/              ← gitignored
│   ├── public/
│   │   └── captures/      ← screenshots from app
│   ├── src/
│   │   └── compositions/  ← video compositions
│   ├── package.json
│   └── pnpm-lock.yaml
└── .gitignore             ← includes /remotion
```

## Dependencies

- **Remotion** - Video creation framework
- **Chrome DevTools MCP** - For screen capture (optional but recommended)
- **TTS API** - For voiceovers (TBD - currently manual)
