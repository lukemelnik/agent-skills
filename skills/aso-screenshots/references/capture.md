# Screenshot Capture

## Automated Capture with axe

### Prerequisites
- App built and installed on simulator
- Simulator booted: `xcrun simctl boot "$UDID" || true`

### Clean Status Bar
Always set before capturing:
```bash
xcrun simctl status_bar "$UDID" override \
  --time "9:41" \
  --batteryState charged \
  --batteryLevel 100 \
  --cellularBars 4 \
  --wifiBars 3 \
  --operatorName ""
```

### Capture Flow

1. **Discover UI elements**:
   ```bash
   axe describe-ui --udid "$UDID"
   ```

2. **Navigate to target screen**:
   ```bash
   axe tap --id "tab_search" --udid "$UDID"
   axe type "hiking trails" --udid "$UDID"
   axe wait --duration 800 --udid "$UDID"
   ```

3. **Capture**:
   ```bash
   mkdir -p .aso-screenshots/raw
   axe screenshot --output ".aso-screenshots/raw/search.png" --udid "$UDID"
   ```

Or use a plan file with `asc screenshots run --plan`:
```json
{
  "version": 1,
  "app": {
    "bundle_id": "com.example.app",
    "udid": "booted",
    "output_dir": ".aso-screenshots/raw"
  },
  "steps": [
    { "action": "launch" },
    { "action": "wait", "duration_ms": 800 },
    { "action": "screenshot", "name": "home" },
    { "action": "tap", "id": "search_tab" },
    { "action": "wait", "duration_ms": 500 },
    { "action": "type", "text": "hiking trails" },
    { "action": "wait", "duration_ms": 800 },
    { "action": "screenshot", "name": "search" }
  ]
}
```

### Tips for Ideal Screenshots
- Populate with realistic data — full lists, real names, upward trends
- Use consistent appearance (pick light or dark, stick with it)
- Show the app at its best — rich content, activity, visual hierarchy
- Avoid: empty states, placeholder data, debug UI, settings pages

## Screenshot Assessment

Rate every screenshot **Great**, **Usable**, or **Retake**:

### Great
- Rich, realistic content visible
- Clear visual hierarchy
- Feature being shown is immediately obvious
- Looks good at thumbnail size

### Usable
- Shows the right screen but could be better
- Minor issues (slightly sparse content, non-ideal data)
- Acceptable if no better option exists

### Retake
- Empty state or placeholder data
- Debug UI, console logs visible
- Settings page, onboarding, or login screen
- Too much small text, no visual hierarchy
- Status bar clutter (carrier name, low battery, debug text)
- Content is cut off or key feature isn't visible

### Coaching Retakes
For each Retake, provide specific guidance:
- Which exact screen to navigate to
- What data state to set up (e.g., "have 5+ items in the list")
- Appearance mode to use
- Content suggestions (realistic names, prices, etc.)
- Remind about clean status bar
