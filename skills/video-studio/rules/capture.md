# Screen Capture Workflow

## When to use

When you need to capture screenshots or recordings from a running application for use in videos.

## Prerequisites

- App running locally (e.g., `http://localhost:3000`)
- Chrome DevTools MCP configured (recommended)
- Or manual screenshot fallback

## With Chrome DevTools MCP

If the user has Chrome DevTools MCP set up, use it to:

1. **Navigate to the page:**
```
Navigate to http://localhost:3000/settings
```

2. **Take a screenshot:**
```
Take a screenshot and save it to remotion/public/captures/settings-page.png
```

3. **Interact and capture:**
```
Click the "Save" button, wait for the success message, then screenshot
```

## Manual fallback

If DevTools MCP isn't available:

1. Ask the user to take screenshots manually
2. Have them save to `remotion/public/captures/`
3. Provide naming convention: `feature-step-description.png`

## Organizing captures

```
remotion/public/captures/
├── onboarding/
│   ├── 01-welcome-screen.png
│   ├── 02-enter-name.png
│   └── 03-complete.png
├── settings/
│   ├── 01-settings-panel.png
│   └── 02-save-confirmation.png
└── dashboard/
    └── overview.png
```

## Screenshot best practices

- **Consistent dimensions**: Capture at the same viewport size
- **Clean state**: Clear any dev tools, console errors
- **Realistic data**: Use realistic-looking sample data, not "test123"
- **Cursor position**: Consider where the cursor should be for context
- **Highlight ready**: Leave room for callout overlays

## Recommended viewport sizes

| Type | Size | Use case |
|------|------|----------|
| Desktop | 1920x1080 | Full app screenshots |
| Desktop cropped | 1280x800 | Focused feature area |
| Mobile | 390x844 | Mobile app / responsive |
| Tablet | 1024x768 | Tablet views |

## Video recording (future)

For capturing video clips instead of screenshots:
- Chrome DevTools can record via Performance panel
- Or use screen recording tools
- Import clips with `<OffthreadVideo>` in Remotion
