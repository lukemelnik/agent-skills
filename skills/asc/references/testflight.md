# TestFlight Orchestration

## Export current config
```bash
asc testflight config export --app "APP_ID" --output "./testflight.yaml"
asc testflight config export --app "APP_ID" --output "./testflight.yaml" --include-builds --include-testers
```

## Manage groups and testers

### Groups
```bash
asc testflight groups list --app "APP_ID" --paginate
asc testflight groups create --app "APP_ID" --name "Beta Testers"
```

### Testers
```bash
asc testflight testers list --app "APP_ID" --paginate
asc testflight testers add --app "APP_ID" --email "tester@example.com" --group "Beta Testers"
asc testflight testers invite --app "APP_ID" --email "tester@example.com"
```

## Distribute builds
```bash
asc builds add-groups --build "BUILD_ID" --group "GROUP_ID"
asc builds remove-groups --build "BUILD_ID" --group "GROUP_ID" --confirm
```

## What to Test notes
```bash
asc builds test-notes create --build "BUILD_ID" --locale "en-US" --whats-new "Test instructions"
asc builds test-notes update --id "LOCALIZATION_ID" --whats-new "Updated notes"
```

## Notes
- Use `--paginate` on large groups/tester lists.
- Use the ID resolver commands when names need to be mapped to IDs.
