---
name: app-review
description: Pre-App Store submission audit. Systematically checks a project for common rejection causes — privacy manifests, missing permissions, IAP compliance, completeness, design quality, metadata readiness, and technical requirements. Reports PASS/FAIL/WARNING per item with fix instructions. Use before submitting any iOS or macOS app to the App Store.
---

# App Review Audit

## When Invoked

Run a systematic pre-submission audit of the current project. The goal is to catch every common App Store rejection cause before the app reaches Apple review.

## Step 1 — Identify the Project

Determine what you're auditing:

1. Look for `.xcodeproj` or `.xcworkspace` files in the project root.
2. Read the project's `Info.plist` or build settings to determine:
   - **Platforms**: iOS, macOS, or both (check `SUPPORTED_PLATFORMS` or target destinations)
   - **Deployment target**: minimum OS version
   - **Bundle identifier**: the app's bundle ID
3. Check for `Package.swift` (SPM), `Podfile` (CocoaPods), or `project.yml` (XcodeGen) to understand dependency management.
4. Identify the main target name and any app extensions (widgets, share extensions, etc.).

Report a summary before proceeding:

```
## Project Summary
- **App**: [name] ([bundle ID])
- **Platforms**: [iOS / macOS / both]
- **Deployment Target**: [version]
- **Dependencies**: [SPM / CocoaPods / Carthage / none]
- **Extensions**: [list or none]
```

## Step 2 — Run the Audit

Read `references/checklist.md` and work through every category sequentially.

For each item, check the actual project files (source code, plists, asset catalogs, build settings) and report one of:

- **PASS** — requirement met, no action needed.
- **FAIL** — requirement not met, will likely cause rejection. Include what to fix.
- **WARNING** — potential issue or couldn't fully verify. Include what to check manually.
- **N/A** — not applicable to this project (e.g., macOS-only checks for an iOS app).

Format each category as a section with a summary count:

```
### 1. Privacy & Data Collection (Guideline 5.1)
| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | PrivacyInfo.xcprivacy exists | PASS | Found at MyApp/PrivacyInfo.xcprivacy |
| 2 | Required API reasons declared | FAIL | Uses FileManager timestamps but no file timestamp reason declared |
| ... | ... | ... | ... |

**Result: 5 PASS, 1 FAIL, 2 WARNING**
```

Skip the macOS-specific category (Section 11) for iOS-only apps. Skip iOS-specific items for macOS-only apps.

## Step 3 — Summary and Action Items

After completing all categories, provide:

1. **Overall Score**: total PASS / FAIL / WARNING counts across all categories.
2. **Blockers**: list every FAIL item — these will likely cause rejection. Ordered by severity.
3. **Warnings**: list every WARNING item — these should be manually verified.
4. **Action Plan**: numbered list of concrete fixes, ordered by priority (blockers first).

If any items are FAIL, read `references/rejection-fixes.md` for the relevant guideline and include the specific fix guidance in the action plan.

## References

### `references/checklist.md`

The complete audit checklist. Read this to execute the audit — it contains every check item organized by App Store Review Guideline category, with specific files/patterns to search for and fix instructions.

### `references/rejection-fixes.md`

Detailed fix guides for the top 10 most common rejection reasons. Read this when a checklist item fails to get the exact guideline text, code-level fixes, and appeal guidance.
