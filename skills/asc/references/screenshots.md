# Screenshot Pipeline (xcodebuild -> AXe -> frame -> asc)

Agent-driven screenshot workflow: build and launch with Xcode CLI, drive UI with AXe, upload with `asc`.

## Defaults
- Settings file: `.asc/shots.settings.json`
- Capture plan: `.asc/screenshots.json`
- Raw screenshots dir: `./screenshots/raw`
- Framed screenshots dir: `./screenshots/framed`
- Default frame device: `iphone-air`

## 1) Create settings JSON

Create `.asc/shots.settings.json`:

```json
{
  "version": 1,
  "app": {
    "bundle_id": "com.example.app",
    "project": "MyApp.xcodeproj",
    "scheme": "MyApp",
    "simulator_udid": "booted"
  },
  "paths": {
    "plan": ".asc/screenshots.json",
    "raw_dir": "./screenshots/raw",
    "framed_dir": "./screenshots/framed"
  },
  "pipeline": {
    "frame_enabled": true,
    "upload_enabled": false
  },
  "upload": {
    "version_localization_id": "",
    "device_type": "IPHONE_65",
    "source_dir": "./screenshots/framed"
  }
}
```

## 2) Build and run app on simulator

```bash
xcrun simctl boot "$UDID" || true
xcodebuild \
  -project "MyApp.xcodeproj" \
  -scheme "MyApp" \
  -configuration Debug \
  -destination "platform=iOS Simulator,id=$UDID" \
  -derivedDataPath ".build/DerivedData" \
  build
xcrun simctl install "$UDID" ".build/DerivedData/Build/Products/Debug-iphonesimulator/MyApp.app"
xcrun simctl launch "$UDID" "com.example.app"
```

## 3) Capture screenshots

Prefer plan-driven capture:
```bash
asc screenshots run --plan ".asc/screenshots.json" --udid "$UDID" --output json
```

AXe primitives for plan authoring:
```bash
axe describe-ui --udid "$UDID"
axe tap --id "search_field" --udid "$UDID"
axe type "wwdc" --udid "$UDID"
axe screenshot --output "./screenshots/raw/home.png" --udid "$UDID"
```

Minimal plan example:
```json
{
  "version": 1,
  "app": {
    "bundle_id": "com.example.app",
    "udid": "booted",
    "output_dir": "./screenshots/raw"
  },
  "steps": [
    { "action": "launch" },
    { "action": "wait", "duration_ms": 800 },
    { "action": "screenshot", "name": "home" }
  ]
}
```

## 4) Frame screenshots

Install framing dependency (pinned version):
```bash
pip install koubou==0.14.0
```

List supported frame devices:
```bash
asc screenshots list-frame-devices --output json
```

Frame a screenshot:
```bash
asc screenshots frame \
  --input "./screenshots/raw/home.png" \
  --output-dir "./screenshots/framed" \
  --device "iphone-air" \
  --output json
```

Supported `--device` values: `iphone-air`, `iphone-17-pro`, `iphone-17-pro-max`, `iphone-16e`, `iphone-17`, `mac`

## 5) Upload screenshots

```bash
# Review before upload
asc screenshots review-generate --framed-dir "./screenshots/framed" --output-dir "./screenshots/review"
asc screenshots review-open --output-dir "./screenshots/review"
asc screenshots review-approve --all-ready --output-dir "./screenshots/review"

# Upload
asc screenshots upload \
  --version-localization "LOC_ID" \
  --path "./screenshots/framed" \
  --device-type "IPHONE_65" \
  --output json

# List/validate
asc screenshots sizes --output table
asc screenshots list --version-localization "LOC_ID" --output table
```

## Multi-locale capture

Use simulator-wide locale defaults per UDID:

```bash
declare -A LOCALE_UDID=(
  ["en-US"]="UDID_EN_US"
  ["de-DE"]="UDID_DE_DE"
)

set_simulator_locale() {
  local UDID="$1" LOCALE="$2"
  local LANG="${LOCALE%%-*}" APPLE_LOCALE="${LOCALE/-/_}"
  xcrun simctl boot "$UDID" || true
  xcrun simctl spawn "$UDID" defaults write NSGlobalDomain AppleLanguages -array "$LANG"
  xcrun simctl spawn "$UDID" defaults write NSGlobalDomain AppleLocale -string "$APPLE_LOCALE"
}

for LOCALE in "${!LOCALE_UDID[@]}"; do
  UDID="${LOCALE_UDID[$LOCALE]}"
  set_simulator_locale "$UDID" "$LOCALE"
  xcrun simctl terminate "$UDID" "com.example.app" || true
  asc screenshots capture \
    --bundle-id "com.example.app" --name "home" \
    --udid "$UDID" --output-dir "./screenshots/raw/$LOCALE" --output json
done
```

## Agent behavior
- Confirm exact flags with `--help` — screenshot commands are evolving quickly.
- Default to JSON for machine steps.
- Check `asc screenshots list-frame-devices --output json` before selecting a frame device.
- Ensure screenshot files exist before upload.
- Screenshot-local automation is experimental — call it out in user-facing notes.
- If framing fails, re-install pinned Koubou: `pip install koubou==0.14.0`.
