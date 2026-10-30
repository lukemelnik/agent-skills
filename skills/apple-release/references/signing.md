# Code Signing & Provisioning

## Table of Contents

1. [Certificates](#1-certificates)
2. [Provisioning Profiles](#2-provisioning-profiles)
3. [App IDs and Bundle Identifiers](#3-app-ids-and-bundle-identifiers)
4. [Automatic vs Manual Signing](#4-automatic-vs-manual-signing)
5. [Capabilities and Entitlements](#5-capabilities-and-entitlements)
6. [Hardened Runtime (macOS)](#6-hardened-runtime-macos)
7. [Keychain Management for CI](#7-keychain-management-for-ci)
8. [Common Signing Errors and Fixes](#8-common-signing-errors-and-fixes)

---

## 1. Certificates

### Certificate Types

| Certificate | Purpose | Created Via |
|-------------|---------|-------------|
| Apple Development | Run on devices during development | Xcode or Developer Portal |
| Apple Distribution | App Store and TestFlight | Xcode or Developer Portal |
| Developer ID Application | Distribute macOS apps outside App Store | Developer Portal only |
| Developer ID Installer | Sign macOS `.pkg` installers | Developer Portal only |
| Mac Installer Distribution | Sign `.pkg` for Mac App Store | Developer Portal only |

### Certificate Lifecycle

```bash
# List installed signing identities
security find-identity -v -p codesigning

# Example output:
# 1) ABC123... "Apple Development: name@example.com (TEAMID)"
# 2) DEF456... "Apple Distribution: Company Name (TEAMID)"
# 3) GHI789... "Developer ID Application: Company Name (TEAMID)"
```

- Certificates expire after **1 year** (development and Apple Distribution) or **5 years** (Developer ID only).
- Revoking a certificate invalidates all provisioning profiles that reference it.
- Limits per team: 3 Apple Distribution, 3 Developer ID Application. Revoking a distribution certificate affects all team members.

### Exporting for CI

```bash
# Export as .p12 from Keychain Access (includes private key)
# Or via command line:
security export -k login.keychain-db -t identities -f pkcs12 -o certs.p12 -P "password"

# Base64-encode for GitHub Actions secrets
base64 -i certs.p12 | pbcopy
```

---

## 2. Provisioning Profiles

### Profile Types

| Profile | Devices | Distribution |
|---------|---------|--------------|
| Development | Registered devices only | Xcode direct install |
| Ad Hoc | Up to 100 registered devices | Direct `.ipa` install |
| App Store | Any device | Via App Store / TestFlight |
| Enterprise | Any device | In-house (requires Enterprise account) |
| Developer ID (macOS) | Any Mac | Outside App Store |

### Inspecting Profiles

```bash
ls ~/Library/MobileDevice/Provisioning\ Profiles/
# Inspect a profile
security cms -D -i profile.mobileprovision
```

---

## 3. App IDs and Bundle Identifiers

### App Extensions

Extensions must use the parent app's bundle ID as prefix:

```
com.company.myapp              # Main app
com.company.myapp.widget       # Widget extension
com.company.myapp.share        # Share extension
com.company.myapp.intents      # Intents extension
```

Each extension needs its own App ID, provisioning profile, and entitlements file.

---

## 4. Automatic vs Manual Signing

### Automatic Signing (development)

In `project.pbxproj`:
```
CODE_SIGN_STYLE = Automatic;
DEVELOPMENT_TEAM = "TEAMID";
```

### Manual Signing (Required for CI)

```
CODE_SIGN_STYLE = Manual;
DEVELOPMENT_TEAM = "TEAMID";
CODE_SIGN_IDENTITY = "Apple Distribution: Company Name (TEAMID)";
PROVISIONING_PROFILE_SPECIFIER = "MyApp AppStore Profile";
```

### xcodebuild Overrides

```bash
xcodebuild archive \
  -scheme MyApp \
  -archivePath MyApp.xcarchive \
  CODE_SIGN_STYLE=Manual \
  DEVELOPMENT_TEAM=TEAMID \
  CODE_SIGN_IDENTITY="Apple Distribution: Company Name (TEAMID)" \
  PROVISIONING_PROFILE_SPECIFIER="MyApp AppStore Profile"
```

---

## 5. Capabilities and Entitlements

### Capability Registration

Capabilities must be enabled in **three** places:
1. **Developer Portal** — App ID configuration
2. **Entitlements file** — embedded in the binary
3. **Provisioning profile** — must include the entitlement

Xcode's automatic signing handles all three. Manual signing requires you to update the portal and download a new profile when adding capabilities.

### Common Entitlements

| Entitlement Key | Purpose |
|----------------|---------|
| `com.apple.security.app-sandbox` | App Sandbox (required for Mac App Store) |
| `com.apple.security.network.client` | Outgoing network connections |
| `com.apple.security.network.server` | Incoming network connections |
| `com.apple.security.files.user-selected.read-write` | User-selected file access |
| `com.apple.security.files.bookmarks.app-scope` | Security-scoped bookmarks |
| `com.apple.security.application-groups` | Shared container between app and extensions |
| `aps-environment` | Push notifications (`development` or `production`) |
| `com.apple.developer.icloud-container-identifiers` | iCloud containers |
| `com.apple.developer.associated-domains` | Universal links, Handoff |
| `com.apple.security.device.camera` | Camera access |
| `com.apple.security.device.microphone` | Microphone access |

### Extension Entitlements

Extensions get their own entitlements file. The Finder Sync, Share, or Widget extension must share the parent's App Group:

```xml
<!-- Extension entitlements -->
<key>com.apple.security.application-groups</key>
<array>
    <string>$(TeamIdentifierPrefix)com.company.shared</string>
</array>
```

---

## 6. Hardened Runtime (macOS)

**Required** for notarization and Developer ID distribution. Restricts runtime behavior for security.

### What Hardened Runtime Restricts

| Protection | Effect | Exception Entitlement |
|-----------|--------|----------------------|
| Code injection | No loading unsigned dylibs | `com.apple.security.cs.disable-library-validation` |
| DYLD env vars | DYLD_* ignored | `com.apple.security.cs.allow-dyld-environment-variables` |
| JIT | No writable+executable memory | `com.apple.security.cs.allow-jit` |
| Unsigned memory | No unsigned executable pages | `com.apple.security.cs.allow-unsigned-executable-memory` |

### Enabling Hardened Runtime

In Xcode: **Signing & Capabilities > + Capability > Hardened Runtime**.

In `xcodebuild`:
```bash
xcodebuild archive \
  -scheme MyApp \
  OTHER_CODE_SIGN_FLAGS="--options=runtime" \
  ...
```

With `codesign` directly:
```bash
codesign --sign "Developer ID Application: Company (TEAMID)" \
  --options=runtime \
  --timestamp \
  --force \
  MyApp.app
```

### Framework and Embedded Binary Signing

When distributing outside the App Store, you must re-sign embedded frameworks with Hardened Runtime. Sign inside-out:

```bash
# Sign each embedded framework individually
codesign --sign "$CODESIGN_SIGN" --verbose --strict \
  --options=runtime --force --timestamp \
  "MyApp.xcarchive/Products/Applications/MyApp.app/Contents/Frameworks/SomeFramework.framework"

# Sign app extensions with their own entitlements
codesign --sign "$CODESIGN_SIGN" --verbose --strict \
  --options=runtime --force --timestamp \
  --entitlements "Extension/Extension.entitlements" \
  "MyApp.xcarchive/Products/Applications/MyApp.app/Contents/PlugIns/Extension.appex"

# Sign the main app last (outermost)
codesign --sign "$CODESIGN_SIGN" --verbose --strict \
  --options=runtime --force --timestamp \
  "MyApp.xcarchive/Products/Applications/MyApp.app"
```

**Critical**: Sign inside-out. Frameworks first, then extensions, then the main app. If you re-sign the outer bundle after signing inner components, you invalidate them.

---

## 7. Keychain Management for CI

### GitHub Actions Pattern

Based on the CodeEdit CI pipeline:

```yaml
- name: Install codesign certificate
  env:
    DEV_CERT_B64: ${{ secrets.DEV_CERT_B64 }}
    DEV_CERT_PWD: ${{ secrets.DEV_CERT_PWD }}
    KEYCHAIN_TIMEOUT: 21600  # 6 hours
  run: |
    # Decode certificate
    CERT_P12="$RUNNER_TEMP/cert.p12"
    echo -n "$DEV_CERT_B64" | base64 --decode -o "$CERT_P12"

    # Create a temporary keychain
    KEYCHAIN_DB="$RUNNER_TEMP/signing.keychain-db"
    KEYCHAIN_PWD=$(openssl rand -base64 24)
    security create-keychain -p "$KEYCHAIN_PWD" "$KEYCHAIN_DB"
    security set-keychain-settings -lut "$KEYCHAIN_TIMEOUT" "$KEYCHAIN_DB"
    security unlock-keychain -p "$KEYCHAIN_PWD" "$KEYCHAIN_DB"

    # Import certificate
    security import "$CERT_P12" -P "$DEV_CERT_PWD" -A -t cert -f pkcs12 -k "$KEYCHAIN_DB"

    # Add to search list so codesign can find it
    security list-keychain -d user -s "$KEYCHAIN_DB" $(security list-keychains -d user | sed s/\"//g)
```

### Cleanup (Always Run)

```yaml
- name: Clean up keychain
  if: ${{ always() }}
  run: |
    security delete-keychain "$RUNNER_TEMP/signing.keychain-db"
    rm -rf "~/Library/MobileDevice/Provisioning Profiles"
```

### Key Points

- **Always create a temporary keychain** — never import into the default keychain on CI.
- **`-A` flag** on `security import` allows all apps to access (avoids UI prompts on CI).
- **`security list-keychain -d user -s`** sets the search list so `codesign` finds the cert.
- **Set a timeout** (`-lut`) so the keychain auto-locks if the build hangs.
- **Clean up in `always()`** to avoid leaking secrets on failure.

### Fastlane Match Alternative

```bash
# Store certs/profiles in a private Git repo or Google Cloud Storage
fastlane match appstore --git_url https://github.com/company/certs.git
fastlane match development
fastlane match adhoc
```

Match encrypts everything with a passphrase. All team members and CI use the same certs, eliminating "works on my machine" signing issues.

---

## 8. Common Signing Errors and Fixes

### "No signing certificate found"

```
error: No signing certificate "Apple Distribution" found
```

**Causes and fixes**:
1. Certificate not installed — download from portal or run `fastlane match`
2. Certificate expired — create a new one in Developer Portal
3. Private key missing — re-export `.p12` from the Mac that created the cert
4. Wrong keychain — run `security find-identity -v -p codesigning` to verify

### "Provisioning profile doesn't include signing certificate"

Profile was built with a different certificate. Regenerate the profile or use the matching cert.

```bash
# Check which cert a profile expects
security cms -D -i profile.mobileprovision | grep -A1 "DeveloperCertificates"
```

### "Profile doesn't match bundle identifier"

```bash
# Verify bundle ID in project matches profile
/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" Info.plist
```

### "Code signature invalid"

```bash
# Verify signature
codesign --verify --deep --strict --verbose=4 MyApp.app

# Check if Hardened Runtime is enabled
codesign -dvv MyApp.app 2>&1 | grep "flags="
# Should include "runtime" flag
```

### "The executable was signed with invalid entitlements"

Entitlements in the binary don't match what the provisioning profile allows.

```bash
# Extract entitlements from a signed binary
codesign -d --entitlements :- MyApp.app

# Compare with profile entitlements
security cms -D -i embedded.mobileprovision
```

### "A valid provisioning profile for this executable was not found"

On device: the app's provisioning profile has expired or doesn't include this device's UDID.

```bash
# Check device UDID
xcrun xctrace list devices

# Check profile expiration
security cms -D -i profile.mobileprovision | grep ExpirationDate
```

### Xcode "Revoke certificate" Warning

Xcode will sometimes offer to revoke and recreate certificates. **Never do this on a shared team** — it invalidates all profiles and breaks other developers' signing. Use manual certificate management or Fastlane match for teams.

### Resetting Signing State

When signing is thoroughly broken:

```bash
# Remove all provisioning profiles
rm -rf ~/Library/MobileDevice/Provisioning\ Profiles/*

# In Xcode: clean build folder (Cmd+Shift+K), then re-download profiles
# Or: Xcode > Settings > Accounts > Download Manual Profiles
```
