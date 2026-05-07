# Signing Setup

Create or renew signing assets for iOS/macOS apps.

## Preconditions
- Know the bundle identifier and target platform.
- Have a CSR file for certificate creation.

## Workflow

1. Create or find the bundle ID:
   - `asc bundle-ids list --paginate`
   - `asc bundle-ids create --identifier "com.example.app" --name "Example" --platform IOS`

2. Configure capabilities:
   - `asc bundle-ids capabilities list --bundle "BUNDLE_ID"`
   - `asc bundle-ids capabilities add --bundle "BUNDLE_ID" --capability ICLOUD`
   - With settings: `--settings '[{"key":"ICLOUD_VERSION","options":[{"key":"XCODE_13","enabled":true}]}]'`

3. Create signing certificate:
   - `asc certificates list --certificate-type IOS_DISTRIBUTION`
   - `asc certificates create --certificate-type IOS_DISTRIBUTION --csr "./cert.csr"`

4. Create provisioning profile:
   - `asc profiles create --name "AppStore Profile" --profile-type IOS_APP_STORE --bundle "BUNDLE_ID" --certificate "CERT_ID"`
   - For dev/ad-hoc, include devices: `--device "DEVICE_ID"`

5. Download the profile:
   - `asc profiles download --id "PROFILE_ID" --output "./profiles/AppStore.mobileprovision"`

## Rotation and cleanup
```bash
asc certificates revoke --id "CERT_ID" --confirm
asc profiles delete --id "PROFILE_ID" --confirm
```

## Notes
- Check `--help` for exact enum values (certificate types, profile types).
- `--certificate` accepts comma-separated IDs.
- Device management: `asc devices` commands (UDID required).
