# CLI Usage & ID Resolution

## Command discovery
```bash
asc --help
asc builds --help
asc builds list --help
```

## Flag conventions
- Use explicit long flags (`--app`, `--output`)
- Destructive operations require `--confirm`
- Use `--paginate` for complete results
- Prefer explicit flags in automation; some commands prompt interactively for missing fields

## Output formats
- TTY-aware defaults: `table` in terminal, `json` when piped
- `--output table` / `--output markdown` for human display
- `--pretty` is only valid with JSON output

## Authentication
- Keychain: `asc auth login --name "MyApp" --key-id "ABC" --issuer-id "DEF" --private-key /path/to/AuthKey.p8 --network`
- Env vars: `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_PRIVATE_KEY_PATH`, `ASC_PRIVATE_KEY`, `ASC_PRIVATE_KEY_B64`
- Default app: `ASC_APP_ID`
- CI/headless: add `--bypass-keychain`
- Validate: `asc auth status --validate` / `asc auth doctor`

## Timeouts
- `ASC_TIMEOUT` / `ASC_TIMEOUT_SECONDS` for request timeouts
- `ASC_UPLOAD_TIMEOUT` / `ASC_UPLOAD_TIMEOUT_SECONDS` for upload timeouts

## ID Resolution

### App ID
```bash
asc apps list --bundle-id "com.example.app"
asc apps list --name "My App"
asc apps --paginate
```

### Build ID
```bash
asc builds latest --app "APP_ID" --version "1.2.3" --platform IOS
asc builds list --app "APP_ID" --sort -uploadedDate --limit 5
```

### Version ID
```bash
asc versions list --app "APP_ID" --paginate
```

### TestFlight IDs
```bash
asc testflight groups list --app "APP_ID" --paginate
asc testflight testers list --app "APP_ID" --paginate
```

### Pre-release version IDs
```bash
asc testflight pre-release list --app "APP_ID" --platform IOS --paginate
```

### Review submission IDs
```bash
asc review submissions-list --app "APP_ID" --paginate
```

## Tips
- Prefer `--paginate` to avoid missing IDs.
- Use `--sort` where available for deterministic results.
- JSON default; `--pretty` for debug; `--output table` for human viewing.
