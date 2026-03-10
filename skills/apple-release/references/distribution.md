# Distribution & Delivery

## Table of Contents

1. [App Store Connect Overview](#1-app-store-connect-overview)
2. [TestFlight](#2-testflight)
3. [xcodebuild Archive and Export](#3-xcodebuild-archive-and-export)
4. [Notarization (macOS)](#4-notarization-macos)
5. [Developer ID Distribution (macOS)](#5-developer-id-distribution-macos)
6. [DMG and Installer Packages](#6-dmg-and-installer-packages)
7. [Sparkle Auto-Updates (macOS)](#7-sparkle-auto-updates-macos)
8. [Fastlane Automation](#8-fastlane-automation)
9. [GitHub Actions CI/CD](#9-github-actions-cicd)
10. [App Store Connect API Key Authentication](#10-app-store-connect-api-key-authentication)
11. [Xcode Cloud](#11-xcode-cloud)

---

## 1. App Store Connect Overview

### Key Concepts

- **App Record**: Created once per app in App Store Connect. Contains metadata, screenshots, pricing.
- **Build**: An uploaded binary. Multiple builds can exist per version.
- **Version**: A release version (e.g., 1.2.0). One version is "Prepare for Submission" at a time.
- **Build Number**: Must be unique per version and must increment. Use `agvtool` to manage.

### Build Number Management

```bash
# Read current version and build
xcrun agvtool mvers -terse1        # Marketing version (CFBundleShortVersionString)
xcrun agvtool vers -terse           # Build number (CFBundleVersion)

# Increment build number
xcrun agvtool next-version -all

# Set specific values
xcrun agvtool new-version -all 42
xcrun agvtool new-marketing-version 1.3.0
```

### Upload Methods

| Method | Best For |
|--------|---------|
| Xcode Organizer | Manual uploads, small teams |
| `xcodebuild` + `altool --upload-package` | CI pipelines (legacy, API key auth) |
| `xcodebuild` + `xcrun notarytool` | macOS notarization |
| Transporter.app | Re-uploading without Xcode |
| `fastlane deliver` / `fastlane pilot` | Full automation |
| Xcode Cloud | Apple-hosted CI/CD |

---

## 2. TestFlight

### Internal vs External Testing

| Feature | Internal | External |
|---------|----------|----------|
| Testers | Up to 100 (App Store Connect users) | Up to 10,000 |
| Beta Review | Not required | Required (first build + significant changes) |
| Availability | Immediate after processing | After beta review approval |
| Groups | Automatic | Custom beta groups |
| Expiration | 90 days | 90 days |

### Upload via xcodebuild

```bash
# Archive
xcodebuild archive \
  -scheme MyApp \
  -archivePath "$PWD/build/MyApp.xcarchive" \
  -destination "generic/platform=iOS"

# Export for App Store / TestFlight
xcodebuild -exportArchive \
  -archivePath "$PWD/build/MyApp.xcarchive" \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath "$PWD/build/export"

# Upload (use exportOptionsPlist with destination=upload above, or use altool --upload-package)
xcrun altool --upload-package "$PWD/build/export/MyApp.ipa" \
  --type ios \
  --apple-id "APP_APPLE_ID" \
  --bundle-id "com.company.myapp" \
  --bundle-version "1.0.0" \
  --bundle-short-version-string "1.0.0" \
  --apiKey "$API_KEY_ID" \
  --apiIssuer "$API_ISSUER_ID"
```

### ExportOptions.plist (App Store)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>TEAMID</string>
    <!-- Note: uploadBitcode is no longer relevant as of Xcode 14; omit it. -->
    <key>uploadSymbols</key>
    <true/>
    <key>destination</key>
    <string>upload</string>
</dict>
</plist>
```

### Managing TestFlight via Fastlane

```bash
# Upload to TestFlight
fastlane pilot upload --ipa "build/MyApp.ipa"

# Distribute to external testers
fastlane pilot distribute --groups "Beta Testers"

# Add a tester
fastlane pilot add "tester@example.com" --group "Beta Testers"

# List builds
fastlane pilot builds
```

---

## 3. xcodebuild Archive and Export

### Full Archive Flow

```bash
# Step 1: Archive
xcodebuild archive \
  -project MyApp.xcodeproj \
  -scheme MyApp \
  -configuration Release \
  -archivePath "$BUILD_DIR/MyApp.xcarchive" \
  -destination "generic/platform=iOS" \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  -skipPackagePluginValidation

# Step 2: Export
xcodebuild -exportArchive \
  -archivePath "$BUILD_DIR/MyApp.xcarchive" \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath "$BUILD_DIR/export"
```

### macOS Archive

```bash
xcodebuild archive \
  -scheme MyApp \
  -configuration Release \
  -archivePath "$BUILD_DIR/MyApp.xcarchive" \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  -skipPackagePluginValidation \
  archive
```

### Export Methods

| `method` value | Use Case |
|---------------|----------|
| `app-store` | App Store, Mac App Store, and TestFlight |
| `ad-hoc` | Direct device install (registered UDIDs) |
| `development` | Debug builds on registered devices |
| `enterprise` | Enterprise in-house distribution |
| `developer-id` | macOS outside App Store |
| `mac-application` | macOS direct distribution (signed but not App Store) |
| `package` | macOS `.pkg` installer |

### ExportOptions.plist (Developer ID)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>developer-id</string>
    <key>teamID</key>
    <string>TEAMID</string>
    <key>signingStyle</key>
    <string>manual</string>
    <key>signingCertificate</key>
    <string>Developer ID Application</string>
</dict>
</plist>
```

### Pretty Output

```bash
# Pipe through xcpretty or xcbeautify
xcodebuild archive ... | xcpretty
xcodebuild archive ... | xcbeautify --renderer github-actions
```

---

## 4. Notarization (macOS)

Notarization is **required** for Developer ID distribution. Apple scans the binary for malware and issues a ticket.

### Using notarytool (Recommended)

```bash
# Store credentials (one-time setup)
xcrun notarytool store-credentials "MyProfile" \
  --apple-id "$APPLE_ID" \
  --team-id "$TEAM_ID" \
  --password "$APP_SPECIFIC_PASSWORD"

# Submit for notarization
xcrun notarytool submit MyApp.dmg \
  --keychain-profile "MyProfile" \
  --wait

# Check status
xcrun notarytool info <submission-id> \
  --keychain-profile "MyProfile"

# View log on failure
xcrun notarytool log <submission-id> \
  --keychain-profile "MyProfile"

# Staple the ticket to the binary
xcrun stapler staple MyApp.dmg
```

### Notarization Requirements

- All code must be signed with a **Developer ID** certificate
- **Hardened Runtime** must be enabled
- **Timestamp** must be included (`--timestamp` flag on `codesign`)
- No unsigned dylibs (or use `com.apple.security.cs.disable-library-validation`)
- App must be packaged as `.dmg`, `.zip`, or `.pkg`

### Legacy altool (Removed)

> **Warning:** `altool` notarization support (`--notarize-app`) was removed in November 2023 and is no longer functional. Use `notarytool` for all notarization workflows. The `--upload-package` subcommand for App Store uploads still functions but API key auth is preferred over Apple ID auth.

### CI Notarization Pattern

From the CodeEdit pipeline:

```bash
# Store credentials in CI keychain
xcrun notarytool store-credentials "CI-Profile" \
  --apple-id "$APPLE_ID" \
  --team-id "$APPLE_TEAM_ID" \
  --password "$APPLE_ID_PWD"

# create-dmg can notarize in one step
create-dmg \
  --volname "MyApp" \
  --codesign "$CODESIGN_SIGN" \
  --notarize "CI-Profile" \
  MyApp.dmg \
  "MyApp.xcarchive/Products/Applications/"
```

---

## 5. Developer ID Distribution (macOS)

For distributing macOS apps outside the App Store.

### Requirements

1. **Developer ID Application** certificate (signing the app)
2. **Developer ID Installer** certificate (optional, for `.pkg`)
3. **Hardened Runtime** enabled
4. **Notarization** completed and stapled
5. **No App Sandbox required** (but recommended)

### Signing Flow

```bash
# Sign frameworks (inside-out order)
codesign --sign "Developer ID Application: Company (TEAMID)" \
  --options=runtime --timestamp --force \
  "MyApp.app/Contents/Frameworks/SomeLib.framework"

# Sign the app
codesign --sign "Developer ID Application: Company (TEAMID)" \
  --options=runtime --timestamp --force \
  "MyApp.app"

# Verify
codesign --verify --deep --strict --verbose=2 "MyApp.app"
spctl --assess --verbose=4 --type execute "MyApp.app"
```

### Gatekeeper

On first launch, macOS checks:
1. Is the app signed with a valid Developer ID?
2. Is the notarization ticket stapled or available online?
3. Has Apple revoked the certificate?

If any check fails, macOS shows "cannot be opened because the developer cannot be verified."

---

## 6. DMG and Installer Packages

### DMG Creation with create-dmg

```bash
# Install
brew install create-dmg

# Create DMG
create-dmg \
  --volname "MyApp" \
  --window-pos 200 120 \
  --window-size 699 518 \
  --background background.png \
  --icon-size 128 \
  --icon "MyApp.app" 170 210 \
  --hide-extension "MyApp.app" \
  --app-drop-link 530 210 \
  --codesign "Developer ID Application: Company (TEAMID)" \
  --notarize "KeychainProfile" \
  MyApp.dmg \
  "path/to/MyApp.app"
```

### DMG Creation with hdiutil

```bash
# Create a temporary DMG
hdiutil create -size 200m -fs HFS+ -volname "MyApp" -otype SPARSE temp.sparseimage
hdiutil attach temp.sparseimage
cp -R MyApp.app /Volumes/MyApp/
ln -s /Applications /Volumes/MyApp/Applications
hdiutil detach /Volumes/MyApp
hdiutil convert temp.sparseimage -format UDZO -o MyApp.dmg

# Sign the DMG
codesign --sign "Developer ID Application: Company (TEAMID)" --timestamp MyApp.dmg
```

### Installer Package (.pkg)

```bash
# Create a component package
pkgbuild \
  --component "build/MyApp.app" \
  --install-location "/Applications" \
  --identifier "com.company.myapp" \
  --version "1.0.0" \
  --sign "Developer ID Installer: Company (TEAMID)" \
  MyApp-component.pkg

# Create a distribution package (recommended for App Store and custom install flows)
productbuild \
  --distribution Distribution.xml \
  --package-path . \
  --sign "Developer ID Installer: Company (TEAMID)" \
  MyApp.pkg
```

### Distribution.xml Example

```xml
<?xml version="1.0" encoding="utf-8"?>
<installer-gui-script minSpecVersion="2">
    <title>MyApp</title>
    <options customize="never" require-scripts="false"/>
    <domains enable_anywhere="true"/>
    <choices-outline>
        <line choice="default"/>
    </choices-outline>
    <choice id="default" title="MyApp">
        <pkg-ref id="com.company.myapp"/>
    </choice>
    <pkg-ref id="com.company.myapp" version="1.0.0">MyApp-component.pkg</pkg-ref>
</installer-gui-script>
```

---

## 7. Sparkle Auto-Updates (macOS)

Sparkle enables auto-updates for macOS apps distributed outside the App Store.

### Setup

1. Add Sparkle as a Swift Package: `https://github.com/sparkle-project/Sparkle`
2. Add `SUFeedURL` to Info.plist pointing to your appcast XML
3. Configure the updater in your app

### Integration

```swift
import Sparkle

@main
struct MyApp: App {
    private let updaterController: SPUStandardUpdaterController

    init() {
        updaterController = SPUStandardUpdaterController(
            startingUpdater: true,
            updaterDelegate: nil,
            userDriverDelegate: nil
        )
    }

    var body: some Scene {
        WindowGroup { ContentView() }
            .commands {
                CommandGroup(after: .appInfo) {
                    CheckForUpdatesView(updater: updaterController.updater)
                }
            }
    }
}
```

```swift
struct CheckForUpdatesView: View {
    @ObservedObject private var checkForUpdatesViewModel: CheckForUpdatesViewModel
    private let updater: SPUUpdater

    init(updater: SPUUpdater) {
        self.updater = updater
        self.checkForUpdatesViewModel = CheckForUpdatesViewModel(updater: updater)
    }

    var body: some View {
        Button("Check for Updates...", action: updater.checkForUpdates)
            .disabled(!checkForUpdatesViewModel.canCheckForUpdates)
    }
}
```

### Generating an Appcast

```bash
# Generate EdDSA signing key (one-time)
./bin/generate_keys

# Export key for CI
./bin/generate_keys -x  # Outputs the private key

# Generate appcast from a directory of DMGs
./bin/generate_appcast \
  --ed-key-file sparkle_key \
  --download-url-prefix "https://example.com/releases/" \
  --link "https://example.com" \
  ./releases/
```

### Sparkle Channels (Dev/Stable)

CodeEdit uses channels to separate pre-release builds:

```bash
./bin/generate_appcast \
  --ed-key-file sparkle_key \
  --channel dev \
  --download-url-prefix "https://github.com/org/repo/releases/download/v1.0/" \
  ./releases/
```

In the app delegate, implement `SPUUpdaterDelegate` to restrict channels:
```swift
func allowedChannels(for updater: SPUUpdater) -> Set<String> {
    return isPreReleaseChannel ? ["dev"] : []  // Empty = default channel only
}
```

---

## 8. Fastlane Automation

### Key Tools

| Tool | Purpose |
|------|---------|
| `match` | Sync certificates and profiles across team via Git repo or cloud storage |
| `gym` / `build_app` | Build and archive |
| `pilot` / `upload_to_testflight` | Upload to TestFlight |
| `deliver` / `upload_to_app_store` | Upload metadata, screenshots, and binary to App Store |
| `snapshot` | Automate screenshot capture |
| `scan` | Run tests |
| `cert` | Create/download certificates |
| `sigh` | Create/download provisioning profiles |

### Fastfile Example

```ruby
default_platform(:ios)

platform :ios do
  desc "Push a new build to TestFlight"
  lane :beta do
    setup_ci if ENV["CI"]

    match(type: "appstore", readonly: is_ci)

    increment_build_number(
      build_number: latest_testflight_build_number + 1
    )

    build_app(
      scheme: "MyApp",
      export_method: "app-store",
      clean: true
    )

    upload_to_testflight(
      skip_waiting_for_build_processing: true,
      distribute_external: false
    )
  end

  desc "Deploy to App Store"
  lane :release do
    setup_ci if ENV["CI"]
    match(type: "appstore", readonly: true)

    build_app(scheme: "MyApp", export_method: "app-store")

    upload_to_app_store(
      skip_screenshots: true,
      force: true,  # Skip HTML preview
      precheck_include_in_app_purchases: false
    )
  end
end
```

### Fastlane Match Setup

```bash
# Initialize match (one-time)
fastlane match init
# Choose: git, google_cloud_storage, or s3

# Generate and store new certs/profiles
fastlane match appstore
fastlane match development

# On CI (read-only to avoid regeneration)
fastlane match appstore --readonly

# Nuke and regenerate everything (destructive)
fastlane match nuke distribution
fastlane match appstore
```

### Matchfile

```ruby
git_url("https://github.com/company/certificates")
storage_mode("git")
type("appstore")
app_identifier(["com.company.myapp", "com.company.myapp.widget"])
username("ci@company.com")
```

---

## 9. GitHub Actions CI/CD

### Complete iOS Build + TestFlight Workflow

```yaml
name: Deploy to TestFlight
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4

      - name: Select Xcode
        run: sudo xcode-select -s /Applications/Xcode_15.2.app

      - name: Install certificate
        env:
          CERT_B64: ${{ secrets.DIST_CERT_B64 }}
          CERT_PWD: ${{ secrets.DIST_CERT_PWD }}
        run: |
          CERT_P12="$RUNNER_TEMP/cert.p12"
          KEYCHAIN_DB="$RUNNER_TEMP/build.keychain-db"
          KEYCHAIN_PWD=$(openssl rand -base64 24)

          security create-keychain -p "$KEYCHAIN_PWD" "$KEYCHAIN_DB"
          security set-keychain-settings -lut 21600 "$KEYCHAIN_DB"
          security unlock-keychain -p "$KEYCHAIN_PWD" "$KEYCHAIN_DB"

          echo -n "$CERT_B64" | base64 --decode -o "$CERT_P12"
          security import "$CERT_P12" -P "$CERT_PWD" -A -t cert -f pkcs12 -k "$KEYCHAIN_DB"
          security list-keychain -d user -s "$KEYCHAIN_DB" $(security list-keychains -d user | sed s/\"//g)

      - name: Install provisioning profile
        env:
          PROFILE_B64: ${{ secrets.PROVISION_PROFILE_B64 }}
        run: |
          mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
          echo -n "$PROFILE_B64" | base64 --decode \
            -o ~/Library/MobileDevice/Provisioning\ Profiles/profile.mobileprovision

      - name: Build archive
        run: |
          xcodebuild archive \
            -scheme MyApp \
            -archivePath "$RUNNER_TEMP/MyApp.xcarchive" \
            -destination "generic/platform=iOS" \
            -skipPackagePluginValidation \
            DEVELOPMENT_TEAM="${{ secrets.TEAM_ID }}" \
            | xcpretty

      - name: Export IPA
        run: |
          xcodebuild -exportArchive \
            -archivePath "$RUNNER_TEMP/MyApp.xcarchive" \
            -exportOptionsPlist ExportOptions.plist \
            -exportPath "$RUNNER_TEMP/export"

      - name: Upload to TestFlight
        run: |
          xcrun altool --upload-package "$RUNNER_TEMP/export/MyApp.ipa" \
            --type ios \
            --apple-id "${{ secrets.APP_APPLE_ID }}" \
            --bundle-id "${{ secrets.BUNDLE_ID }}" \
            --bundle-version "${{ secrets.BUILD_NUMBER }}" \
            --bundle-short-version-string "${{ secrets.VERSION }}" \
            --apiKey "${{ secrets.API_KEY_ID }}" \
            --apiIssuer "${{ secrets.API_ISSUER_ID }}"

      - name: Clean up keychain
        if: always()
        run: security delete-keychain "$RUNNER_TEMP/build.keychain-db"
```

### macOS Build + Notarize + DMG Workflow

Based on the CodeEdit pre-release pipeline:

```yaml
name: Build macOS Release
on:
  workflow_dispatch:

jobs:
  release:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4

      - name: Install certificates
        env:
          DEV_CERT_B64: ${{ secrets.DEV_CERT_B64 }}
          DEV_CERT_PWD: ${{ secrets.DEV_CERT_PWD }}
        run: |
          KEYCHAIN_DB="$RUNNER_TEMP/signing.keychain-db"
          KEYCHAIN_PWD=$(openssl rand -base64 24)
          security create-keychain -p "$KEYCHAIN_PWD" "$KEYCHAIN_DB"
          security set-keychain-settings -lut 21600 "$KEYCHAIN_DB"
          security unlock-keychain -p "$KEYCHAIN_PWD" "$KEYCHAIN_DB"
          echo -n "$DEV_CERT_B64" | base64 --decode -o "$RUNNER_TEMP/cert.p12"
          security import "$RUNNER_TEMP/cert.p12" -P "$DEV_CERT_PWD" -A -t cert -f pkcs12 -k "$KEYCHAIN_DB"
          security list-keychain -d user -s "$KEYCHAIN_DB" $(security list-keychains -d user | sed s/\"//g)

      - name: Archive
        run: |
          xcodebuild archive \
            -scheme MyApp \
            -configuration Release \
            -archivePath "$RUNNER_TEMP/MyApp.xcarchive" \
            -derivedDataPath "$RUNNER_TEMP/DerivedData" \
            -skipPackagePluginValidation \
            DEVELOPMENT_TEAM="${{ secrets.TEAM_ID }}" \
            | xcpretty

      - name: Sign (inside-out)
        env:
          IDENTITY: ${{ secrets.CODESIGN_SIGN }}
        run: |
          APP="$RUNNER_TEMP/MyApp.xcarchive/Products/Applications/MyApp.app"
          # Sign embedded frameworks first
          for fw in "$APP/Contents/Frameworks/"*.framework; do
            codesign --sign "$IDENTITY" --options=runtime --timestamp --force "$fw"
          done
          # Sign app extensions
          for ext in "$APP/Contents/PlugIns/"*.appex; do
            codesign --sign "$IDENTITY" --options=runtime --timestamp --force "$ext"
          done
          # Sign the main app
          codesign --sign "$IDENTITY" --options=runtime --timestamp --force "$APP"

      - name: Create DMG and Notarize
        env:
          IDENTITY: ${{ secrets.CODESIGN_SIGN }}
        run: |
          xcrun notarytool store-credentials "CI" \
            --apple-id "${{ secrets.APPLE_ID }}" \
            --team-id "${{ secrets.TEAM_ID }}" \
            --password "${{ secrets.APPLE_ID_PWD }}"
          brew install create-dmg
          create-dmg \
            --volname "MyApp" \
            --icon-size 128 \
            --icon "MyApp.app" 170 210 \
            --app-drop-link 530 210 \
            --codesign "$IDENTITY" \
            --notarize "CI" \
            "$RUNNER_TEMP/MyApp.dmg" \
            "$RUNNER_TEMP/MyApp.xcarchive/Products/Applications/"

      - name: Upload dSYMs
        uses: actions/upload-artifact@v4
        with:
          name: dSYMs
          path: "${{ runner.temp }}/MyApp.xcarchive/dSYMs"

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: "${{ runner.temp }}/MyApp.dmg"
          draft: true

      - name: Clean up
        if: always()
        run: security delete-keychain "$RUNNER_TEMP/signing.keychain-db"
```

### Secrets Needed

| Secret | Value |
|--------|-------|
| `DEV_CERT_B64` | Base64-encoded `.p12` (Developer ID or Distribution cert) |
| `DEV_CERT_PWD` | Password for the `.p12` |
| `TEAM_ID` | Apple Developer Team ID |
| `APPLE_ID` | Apple ID email for notarytool/altool |
| `APPLE_ID_PWD` | App-specific password (NOT your Apple ID password) |
| `CODESIGN_SIGN` | Signing identity string (e.g., `"Developer ID Application: Company (TEAMID)"`) |
| `PROVISION_PROFILE_B64` | Base64-encoded `.mobileprovision` (iOS only) |

### Generating an App-Specific Password

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in > Security > App-Specific Passwords
3. Generate and store in GitHub Secrets as `APPLE_ID_PWD`

---

## 10. App Store Connect API Key Authentication

API key authentication is the **preferred method for CI/CD**. It avoids 2FA issues, app-specific passwords, and session expiry. Both `notarytool` and `altool` support it.

### Creating an API Key

1. Go to [App Store Connect > Users and Access > Integrations > App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api)
2. Click **Generate API Key**
3. Choose a role (e.g., Developer or Admin)
4. Download the `.p8` private key file (**only downloadable once**)
5. Note the **Key ID** and **Issuer ID**

### Using with notarytool

```bash
# Store credentials using API key (one-time setup)
xcrun notarytool store-credentials "CI-Profile" \
  --key "/path/to/AuthKey_KEYID.p8" \
  --key-id "$API_KEY_ID" \
  --issuer "$API_ISSUER_ID"

# Submit for notarization
xcrun notarytool submit MyApp.dmg \
  --keychain-profile "CI-Profile" \
  --wait
```

### Using with altool (uploads)

```bash
xcrun altool --upload-package MyApp.ipa \
  --type ios \
  --apple-id "APP_APPLE_ID" \
  --bundle-id "com.company.myapp" \
  --bundle-version "42" \
  --bundle-short-version-string "1.0.0" \
  --apiKey "$API_KEY_ID" \
  --apiIssuer "$API_ISSUER_ID"
```

### Using with Fastlane

```ruby
# In Appfile or lane configuration
app_store_connect_api_key(
  key_id: "KEYID",
  issuer_id: "ISSUER_UUID",
  key_filepath: "./AuthKey_KEYID.p8"
)
```

### CI Secrets

| Secret | Value |
|--------|-------|
| `API_KEY_ID` | Key ID from App Store Connect |
| `API_ISSUER_ID` | Issuer ID from App Store Connect |
| `API_PRIVATE_KEY` | Contents of the `.p8` file (base64-encode for storage) |

---

## 11. Xcode Cloud

Xcode Cloud is Apple's first-party CI/CD service, integrated directly into Xcode and App Store Connect. It builds, tests, and distributes your app on Apple-hosted infrastructure.

### Key Features

- **Zero signing configuration** — Xcode Cloud manages certificates and profiles automatically via cloud signing.
- **Integrated TestFlight distribution** — builds are uploaded to TestFlight as a post-action.
- **Pull request workflows** — trigger builds on PR creation or updates.
- **Parallel testing** — run tests across multiple simulators and OS versions.

### Workflow Configuration

Workflows are configured in Xcode (Product > Xcode Cloud > Manage Workflows) or via the App Store Connect web UI. A workflow defines:

- **Start conditions**: branch changes, PR events, tag creation, or manual trigger.
- **Environment**: Xcode version and macOS version.
- **Actions**: build, test, analyze, archive.
- **Post-actions**: deploy to TestFlight (internal or external group), notify via Slack, etc.

### Custom Build Scripts (`ci_scripts/`)

Place scripts in a `ci_scripts/` directory at the project root. Xcode Cloud runs them at specific phases:

| Script | Phase |
|--------|-------|
| `ci_scripts/ci_post_clone.sh` | After cloning the repo (install dependencies, generate files) |
| `ci_scripts/ci_pre_xcodebuild.sh` | Before xcodebuild runs |
| `ci_scripts/ci_post_xcodebuild.sh` | After xcodebuild completes (upload dSYMs, notify, etc.) |

### Environment Variables

Xcode Cloud provides environment variables:

| Variable | Description |
|----------|-------------|
| `CI` | Always `TRUE` in Xcode Cloud |
| `CI_XCODEBUILD_ACTION` | Current action (`build`, `test`, `archive`) |
| `CI_BRANCH` | Current branch name |
| `CI_TAG` | Tag name (if triggered by tag) |
| `CI_COMMIT` | Current commit SHA |
| `CI_BUILD_NUMBER` | Auto-incrementing build number |
| `CI_PRODUCT` | Product name |
| `CI_WORKSPACE` | Path to the workspace |
| `CI_DERIVED_DATA_PATH` | Path to DerivedData |
| `CI_ARCHIVE_PATH` | Path to the `.xcarchive` (post-archive) |

### Example: Install Dependencies Post-Clone

```bash
#!/bin/sh
# ci_scripts/ci_post_clone.sh
set -e

# Install Homebrew dependencies
brew install swiftlint

# Resolve Swift packages (if needed outside Xcode's auto-resolution)
cd "$CI_WORKSPACE"
swift package resolve
```

### TestFlight Integration

When the workflow's post-action is set to distribute via TestFlight:

1. Xcode Cloud archives and signs the build automatically.
2. The build is uploaded to App Store Connect.
3. Internal testers receive it immediately; external groups require beta review.
4. Build numbers are managed by the `CI_BUILD_NUMBER` environment variable.
