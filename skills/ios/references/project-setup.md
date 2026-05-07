# Project Setup

How to scaffold a new iOS project using XcodeGen, SwiftLint, SwiftFormat, and a Makefile-driven workflow. Covers every file needed to go from `git clone` to coding in one command.

---

## 1. Directory Layout

```
myapp/
├── ios/
│   ├── MyApp/
│   │   ├── Sources/
│   │   │   ├── App/          # @main entry point
│   │   │   ├── Models/       # Data types
│   │   │   └── UI/
│   │   │       ├── Theme/    # Colors, Typography, Spacing
│   │   │       ├── Components/
│   │   │       └── ...       # Feature views
│   │   └── Resources/
│   │       └── Assets.xcassets/
│   │           ├── Contents.json
│   │           └── AppIcon.appiconset/
│   │               └── Contents.json
│   ├── MyAppTests/
│   ├── ExportOptions.plist   # App Store distribution config
│   └── project.yml           # XcodeGen source of truth
├── .gitignore
├── .swiftlint.yml
├── .swiftformat
├── Makefile
└── CLAUDE.md
```

The `.xcodeproj` is generated — never committed.

---

## 2. XcodeGen `project.yml`

Minimal working config for iOS 17+:

```yaml
name: MyApp
options:
  bundleIdPrefix: com.myapp
  deploymentTarget:
    iOS: "17.0"
  xcodeVersion: "15.0"
  generateEmptyDirectories: true
  groupSortPosition: top

settings:
  base:
    SWIFT_VERSION: "5.9"
    MARKETING_VERSION: "0.1.0"
    CURRENT_PROJECT_VERSION: "1"
    DEVELOPMENT_TEAM: "XXXXXXXXXX"
    CODE_SIGN_STYLE: Automatic

targets:
  MyApp:
    type: application
    platform: iOS
    sources:
      - path: MyApp/Sources
      - path: MyApp/Resources/Assets.xcassets
    settings:
      base:
        PRODUCT_BUNDLE_IDENTIFIER: com.myapp.app
        PRODUCT_NAME: MyApp
        ASSETCATALOG_COMPILER_APPICON_NAME: AppIcon
        TARGETED_DEVICE_FAMILY: "1"          # iPhone only; "1,2" for universal
        GENERATE_INFOPLIST_FILE: YES
        INFOPLIST_KEY_UILaunchScreen_Generation: YES  # CRITICAL — see §9

  MyAppTests:
    type: bundle.unit-test
    platform: iOS
    sources:
      - path: MyAppTests
    dependencies:
      - target: MyApp
    settings:
      base:
        PRODUCT_BUNDLE_IDENTIFIER: com.myapp.app.tests
        TEST_HOST: "$(BUILT_PRODUCTS_DIR)/MyApp.app/$(BUNDLE_EXECUTABLE_FOLDER_PATH)/MyApp"
        BUNDLE_LOADER: "$(TEST_HOST)"
        GENERATE_INFOPLIST_FILE: YES

schemes:
  MyApp:
    build:
      targets:
        MyApp: all
        MyAppTests: [test]
    run:
      config: Debug
    test:
      config: Debug
      targets:
        - MyAppTests
    profile:
      config: Release
    analyze:
      config: Debug
    archive:
      config: Release
```

---

## 3. Makefile

```makefile
PROJECT   = ios/MyApp.xcodeproj
SCHEME    = MyApp
BUNDLE_ID = com.myapp.app
SIM_NAME  = iPhone 16
DEST      = platform=iOS Simulator,name=$(SIM_NAME)

ARCHIVE_PATH = build/MyApp.xcarchive
EXPORT_PATH  = build/export

.PHONY: setup run build test generate clean lint lint-fix format format-check bump archive tag \
        release\:patch release\:minor release\:major _bump_patch _bump_minor _bump_major _release

# ── Setup ─────────────────────────────────────────────────────────────

## First-time setup: install tools, generate project, install git hooks
setup:
	@echo "Checking dependencies..."
	@command -v xcodegen >/dev/null || (echo "Installing XcodeGen..." && brew install xcodegen)
	@command -v swiftlint >/dev/null || (echo "Installing SwiftLint..." && brew install swiftlint)
	@command -v swiftformat >/dev/null || (echo "Installing SwiftFormat..." && brew install swiftformat)
	@$(MAKE) generate
	@$(MAKE) hooks
	@echo "✅ Ready — opening Xcode..."
	@open $(PROJECT)

## Install git pre-commit hook
hooks:
	@mkdir -p .git/hooks
	@echo '#!/bin/sh' > .git/hooks/pre-commit
	@echo 'make pre-commit' >> .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@echo "✅ Pre-commit hook installed"

## Run lint + format check (called by pre-commit hook)
pre-commit:
	@echo "Running pre-commit checks..."
	@swiftformat --lint ios/MyApp/Sources 2>&1 | grep -v "Running SwiftFormat" || true
	@if ! swiftformat --lint ios/MyApp/Sources > /dev/null 2>&1; then \
		echo "❌ Formatting issues found. Run 'make format' to fix."; \
		exit 1; \
	fi
	@if ! swiftlint --strict --quiet 2>/dev/null; then \
		echo "❌ Lint errors found. Run 'make lint' to see details."; \
		exit 1; \
	fi
	@echo "✅ All checks passed"

# ── Build & Run ───────────────────────────────────────────────────────

## Build for simulator
build: generate
	xcodebuild -project $(PROJECT) -scheme $(SCHEME) -destination '$(DEST)' build

## Build and run on simulator
run: build
	@xcrun simctl boot "$(SIM_NAME)" 2>/dev/null || true
	@open -a Simulator
	@xcrun simctl install "$(SIM_NAME)" "$$(xcodebuild -project $(PROJECT) -scheme $(SCHEME) \
		-destination '$(DEST)' -showBuildSettings 2>/dev/null \
		| grep -m1 'BUILT_PRODUCTS_DIR' | awk '{print $$3}')/MyApp.app"
	@xcrun simctl launch "$(SIM_NAME)" $(BUNDLE_ID)

## Run tests
test: generate
	xcodebuild -project $(PROJECT) -scheme $(SCHEME) -destination '$(DEST)' test

## Regenerate Xcode project from project.yml
generate:
	cd ios && xcodegen generate

# ── Code Quality ──────────────────────────────────────────────────────

## Lint — check style and architecture rules
lint:
	swiftlint --strict

## Auto-fix what SwiftLint can
lint-fix:
	swiftlint --fix

## Format — auto-format all source files
format:
	swiftformat ios/MyApp/Sources

## Check formatting without modifying files
format-check:
	swiftformat --lint ios/MyApp/Sources

# ── Versioning ────────────────────────────────────────────────────────

## Bump build number in project.yml
bump:
	@BUILD=$$(grep 'CURRENT_PROJECT_VERSION' ios/project.yml | head -1 | sed 's/[^0-9]//g'); \
	NEXT=$$((BUILD + 1)); \
	sed -i '' "s/CURRENT_PROJECT_VERSION: \"$$BUILD\"/CURRENT_PROJECT_VERSION: \"$$NEXT\"/" ios/project.yml; \
	echo "Build number: $$BUILD -> $$NEXT"

## Bump version: make release:patch / release:minor / release:major
define bump_version
	@CURRENT=$$(grep 'MARKETING_VERSION' ios/project.yml | head -1 | sed 's/.*"\(.*\)"/\1/'); \
	MAJOR=$$(echo $$CURRENT | cut -d. -f1); \
	MINOR=$$(echo $$CURRENT | cut -d. -f2); \
	PATCH=$$(echo $$CURRENT | cut -d. -f3); \
	$(1); \
	NEW="$$MAJOR.$$MINOR.$$PATCH"; \
	sed -i '' "s/MARKETING_VERSION: \"$$CURRENT\"/MARKETING_VERSION: \"$$NEW\"/" ios/project.yml; \
	echo "Version: $$CURRENT -> $$NEW"
endef

## IMPORTANT: Every release MUST bump the marketing version. Use one of these three.
## Do NOT create a plain `make release` target that skips version bumping.
release\:patch: _bump_patch _release
release\:minor: _bump_minor _release
release\:major: _bump_major _release

_bump_patch:
	$(call bump_version,PATCH=$$((PATCH + 1)))

_bump_minor:
	$(call bump_version,MINOR=$$((MINOR + 1)); PATCH=0)

_bump_major:
	$(call bump_version,MAJOR=$$((MAJOR + 1)); MINOR=0; PATCH=0)

# ── Release ───────────────────────────────────────────────────────────

## Archive for distribution (auto-bumps build number)
archive: bump generate
	xcodebuild -project $(PROJECT) -scheme $(SCHEME) \
		-destination 'generic/platform=iOS' \
		-archivePath $(ARCHIVE_PATH) \
		-configuration Release \
		-allowProvisioningUpdates \
		archive

## Export and upload to App Store Connect (TestFlight)
## Requires APPLE_ID and APPLE_PASSWORD env vars.
## Create a .env.apple file (NOT committed to git) with:
##   APPLE_ID=your@email.com
##   APPLE_PASSWORD=app-specific-password
## The APPLE_PASSWORD should be an app-specific password generated at
## https://appleid.apple.com/account/manage — NOT your Apple ID password.
## The .env.apple file can live in the repo root or a shared location.
## Set ENV_APPLE to override the default path.
##
## There is NO plain `make release` target — always use release:patch,
## release:minor, or release:major so the marketing version is bumped.
## Every release must bump the version.
ENV_APPLE ?= .env.apple
## App Store Connect IDs for auto-distribution to internal TestFlight group.
## Set these after creating the app and internal group in ASC.
## Find APP_ID: asc apps list --output table
## Find GROUP_ID: asc testflight groups list --app <APP_ID> --internal --output table
ASC_APP_ID   ?=
ASC_GROUP_ID ?=
_release: archive
	set -a && . $(ENV_APPLE) && set +a && \
	xcodebuild -exportArchive \
		-archivePath $(ARCHIVE_PATH) \
		-exportPath $(EXPORT_PATH) \
		-exportOptionsPlist ios/ExportOptions.plist \
		-allowProvisioningUpdates && \
	xcrun altool --upload-app \
		-f $(EXPORT_PATH)/MyApp.ipa \
		-t ios \
		-u "$$APPLE_ID" \
		-p "$$APPLE_PASSWORD"
ifneq ($(ASC_APP_ID),)
ifneq ($(ASC_GROUP_ID),)
	@echo "⏳ Waiting for build to process..."
	asc builds wait --app $(ASC_APP_ID) --newest
	@echo "📲 Distributing to internal TestFlight group..."
	@BUILD_ID=$$(asc builds latest --app $(ASC_APP_ID) --output json | grep '"id"' | head -1 | sed 's/.*"id": *"\([^"]*\)".*/\1/') && \
	asc builds add-groups --build "$$BUILD_ID" --group $(ASC_GROUP_ID)
endif
endif

## Tag current commit with the marketing version
tag:
	@VERSION=$$(grep 'MARKETING_VERSION' ios/project.yml | head -1 | sed 's/.*"\(.*\)"/\1/'); \
	git tag "v$$VERSION" && \
	echo "Tagged v$$VERSION"

# ── Cleanup ───────────────────────────────────────────────────────────

## Clean build artifacts
clean:
	xcodebuild -project $(PROJECT) -scheme $(SCHEME) clean
	rm -rf ~/Library/Developer/Xcode/DerivedData/MyApp-*
```

---

## 4. `.swiftformat`

SwiftFormat configuration. Lives at the repo root.

```
# SwiftFormat Configuration
# Complements .swiftlint.yml — SwiftFormat handles formatting,
# SwiftLint handles architecture and semantic rules.
#
# Paths to format are passed via Makefile (make format / make format-check).
# This file only contains options and exclusions.

--swiftversion 5.9
--exclude ios/MyApp/Sources/UI/Theme

# Formatting
--indent 4
--indentcase false
--trimwhitespace always
--voidtype void
--wraparguments before-first
--wrapparameters before-first
--wrapcollections before-first
--wrapconditions after-first
--maxwidth 140
--closingparen balanced
--guardelse auto

# Braces
--allman false

# Imports
--importgrouping alpha

# Stripping
--stripunusedargs closure-only
--self remove

# Wrapping
--funcattributes prev-line
--typeattributes prev-line
--varattributes same-line

# Disable rules that conflict with SwiftLint or are too aggressive
# NOTE: must be a single comma-separated --disable line; multiple lines don't accumulate
--disable acronyms,blankLinesAroundMark,markTypes,organizeDeclarations,sortSwitchCases,wrapSwitchCases,blockComments,numberFormatting,consecutiveSpaces,wrapPropertyBodies
```

---

## 5. `.swiftlint.yml`

SwiftLint configuration. Enforces architecture, theming, HIG, and code quality conventions from the iOS skill references. Lives at the repo root.

Every custom rule message explains **why** and **what to do instead** so agents can self-correct without human intervention.

**Severity guide:** errors = must fix (architectural violations, deprecated APIs), warnings = should fix (best practices).

```yaml
# SwiftLint Configuration — MyApp
#
# Enforces architecture, theming, HIG, and code quality conventions
# from the iOS skill references (architecture.md, theming.md,
# code-review.md, hig.md, performance.md, components.md, localization.md).
#
# Run: make lint          (check)
#      make lint-fix      (auto-fix what SwiftLint can)

included:
  - ios/MyApp/Sources

excluded:
  - ios/MyApp/Sources/UI/Theme  # Theme definitions legitimately use raw colors/font sizes

# ── Built-in rule tuning ──────────────────────────────────────────────

disabled_rules:
  - trailing_whitespace           # Handled by SwiftFormat
  - trailing_comma                # SwiftFormat adds trailing commas (modern convention, less diff noise)
  - opening_brace                 # Conflicts with SwiftFormat's guard-else auto (brace on next line for multi-line conditions)
  - type_body_length
  - file_length
  - function_body_length
  - cyclomatic_complexity
  - todo                          # TODOs are fine during development
  - nesting                       # Nested types are idiomatic Swift

opt_in_rules:
  - empty_count                   # .count == 0 → .isEmpty
  - closure_spacing
  - contains_over_filter_count
  - discouraged_optional_boolean
  - empty_string
  - fallthrough
  - fatal_error_message
  - first_where                   # .filter { }.first → .first(where:)
  - flatmap_over_map_reduce
  - last_where
  - modifier_order
  - overridden_super_call
  - redundant_nil_coalescing
  - sorted_first_last
  - unowned_variable_capture
  - vertical_parameter_alignment_on_call

line_length:
  warning: 140
  error: 200

identifier_name:
  min_length: 1                   # Allow single-char names (i, x, etc.)
  excluded:
    - id
    - to
    - db

large_tuple:
  warning: 4
  error: 5

# ── Custom rules ──────────────────────────────────────────────────────

custom_rules:

  # ═══════════════════════════════════════════════════════════
  # THEMING — theming.md
  # ═══════════════════════════════════════════════════════════

  no_raw_color_in_views:
    name: "No Raw Colors in Views"
    regex: 'Color\(red:|Color\(hex:|#colorLiteral|Color\(\.sRGB|Color\(\.displayP3|Color\(uiColor:'
    included: ".*(UI|App)/(?!.*Theme).*\\.swift"
    message: "Use Color.theme.* tokens instead of raw color values. Raw colors bypass the theme system, break visual consistency, and make theme changes impossible. See theming.md §2."
    severity: error

  no_named_color_in_views:
    name: "No Named Colors in Views"
    regex: '\bColor\.(red|blue|green|orange|yellow|purple|pink|brown|cyan|indigo|mint|teal|gray|white|black|primary|secondary)\b|Color\(\.system'
    included: ".*(UI|App)/(?!.*Theme).*\\.swift"
    message: "Use Color.theme.* tokens instead of SwiftUI named colors (Color.red, .white, etc.). Named colors bypass the theme and won't match your palette. See theming.md §3."
    severity: error

  no_shape_style_color_literal:
    name: "No Color Literals as ShapeStyle"
    regex: 'foregroundStyle\(\.(white|black|red|blue|green|orange|yellow|purple|pink|gray|cyan|indigo|mint|teal|brown)\)|\.background\(\.(white|black|red|blue|green|orange|yellow|purple|pink|gray|cyan|indigo|mint|teal|brown)\)'
    included: ".*(UI|App)/(?!.*Theme).*\\.swift"
    message: "Use Color.theme.* tokens instead of ShapeStyle color literals (.white, .black, etc.). These bypass the theme system. Use .foregroundStyle(Color.theme.foreground) or .background(Color.theme.background) instead. See theming.md §3."
    severity: error

  no_hardcoded_font_size:
    name: "No Hardcoded Font Sizes"
    regex: 'Font\.system\(size:'
    included: ".*(UI|App)/(?!.*Theme).*\\.swift"
    message: "Use Font.app* extensions (e.g. .appHeadline, .appBody) or semantic text styles (.headline, .body) instead of Font.system(size:). Hardcoded sizes bypass Dynamic Type scaling. See theming.md §6, hig.md §3.1."
    severity: error

  no_hardcoded_padding:
    name: "No Hardcoded Padding Values"
    regex: '\.padding\(\d'
    included: ".*(UI|App)/.*\\.swift"
    message: "Consider defining spacing constants (Spacing.sm/.md/.lg) instead of hardcoded padding values. Consistent spacing improves visual rhythm across the app. See theming.md §7."
    severity: warning

  # ═══════════════════════════════════════════════════════════
  # ARCHITECTURE — architecture.md
  # ═══════════════════════════════════════════════════════════

  no_navigation_view:
    name: "No NavigationView"
    regex: 'NavigationView\b'
    message: "Use NavigationStack (iOS 16+) instead of NavigationView. NavigationView is deprecated and doesn't support programmatic value-based navigation. See architecture.md §7, code-review.md §1."
    severity: error

  no_state_object:
    name: "No @StateObject"
    regex: '@StateObject\b'
    message: "Use @State with @Observable instead of @StateObject. This project targets iOS 17+ and uses @Observable, not ObservableObject. See architecture.md §5."
    severity: error

  no_observable_object:
    name: "No ObservableObject"
    regex: ': ObservableObject\b|ObservableObject\b'
    included: ".*Sources/.*\\.swift"
    message: "Use @Observable macro instead of ObservableObject protocol. @Observable provides better performance with automatic property tracking — no @Published needed. See architecture.md §2."
    severity: error

  no_observed_object:
    name: "No @ObservedObject"
    regex: '@ObservedObject\b'
    message: "Use @Environment or pass @Observable objects as regular properties with @Bindable. @ObservedObject belongs to the ObservableObject pattern which this project doesn't use. See architecture.md §5."
    severity: error

  no_published:
    name: "No @Published"
    regex: '@Published\b'
    message: "Remove @Published — @Observable tracks all stored properties automatically. @Published only works with ObservableObject, which this project doesn't use. See architecture.md §2."
    severity: error

  no_uikit_in_models:
    name: "No UIKit in Model Layers"
    regex: 'import UIKit'
    included: ".*(Database|MusicTheory|Store|Models)/.*\\.swift"
    message: "Use Foundation instead of UIKit in model/data layers. UIKit creates unnecessary platform coupling and prevents code reuse on macOS/watchOS. See architecture.md §1."
    severity: error

  no_singleton_in_features:
    name: "No Direct Singleton Access in Views"
    regex: '\w+\.shared\b'
    included: ".*(UI)/(?!.*Theme).*\\.swift"
    message: "Inject dependencies via initializer or @Environment instead of accessing .shared singletons. Direct singleton access hides dependencies and makes testing/previewing harder. See architecture.md §2."
    severity: warning

  no_app_storage_in_class:
    name: "No @AppStorage in Classes"
    regex: '@AppStorage\b'
    included: ".*ViewModel\\.swift|.*Manager\\.swift|.*Store\\.swift|.*Service\\.swift"
    message: "@AppStorage is designed for View structs, not classes. In @Observable classes, use UserDefaults with a didSet pattern to persist values. See theming.md §4."
    severity: error

  # ═══════════════════════════════════════════════════════════
  # DEPRECATED APIs — code-review.md §1
  # ═══════════════════════════════════════════════════════════

  no_corner_radius:
    name: "No .cornerRadius() (Deprecated)"
    regex: '\.cornerRadius\('
    message: "Use .clipShape(.rect(cornerRadius:)) instead of .cornerRadius(). cornerRadius is deprecated, clips content, and can't be combined with borders. See code-review.md §1."
    severity: error

  no_navigation_link_destination:
    name: "No NavigationLink(destination:)"
    regex: 'NavigationLink\(destination:'
    message: "Use NavigationLink(value:) with .navigationDestination(for:) instead of NavigationLink(destination:). Value-based navigation is type-safe and supports programmatic control. See code-review.md §1, architecture.md §7."
    severity: error

  no_animation_without_value:
    name: "No .animation() Without Value"
    regex: '\.animation\(\.[a-zA-Z]+(|\([^)]*\))\)\s*$'
    message: "Use .animation(.spring(), value: someState) instead of .animation(.spring()). Animations without a value parameter apply implicitly to the entire subtree, causing unexpected animations. See code-review.md §1."
    severity: warning

  no_any_view:
    name: "No AnyView"
    regex: '\bAnyView\b'
    message: "Use @ViewBuilder, Group, or generics instead of AnyView. AnyView erases type information, preventing SwiftUI from diffing efficiently, which hurts performance. See code-review.md §1, performance.md."
    severity: error

  no_preview_provider:
    name: "No PreviewProvider (Deprecated)"
    regex: 'PreviewProvider\b'
    message: "Use #Preview { } macro instead of PreviewProvider. #Preview is simpler and supports multiple named previews. See code-review.md §1."
    severity: error

  no_deprecated_toolbar_placement:
    name: "No Deprecated Toolbar Placement"
    regex: '\.navigationBarTrailing|\.navigationBarLeading'
    message: "Use .topBarTrailing / .topBarLeading instead of .navigationBarTrailing / .navigationBarLeading. The navigationBar* placements are deprecated. See code-review.md §1."
    severity: error

  no_geometry_reader:
    name: "Prefer Modern Layout Over GeometryReader"
    regex: '\bGeometryReader\b'
    message: "Consider containerRelativeFrame(), visualEffect(), or the Layout protocol instead of GeometryReader. GeometryReader causes parent-dependent sizing issues. Only use it when no modern alternative works. See code-review.md §1."
    severity: warning

  # ═══════════════════════════════════════════════════════════
  # SWIFT IDIOMS — code-review.md §2
  # ═══════════════════════════════════════════════════════════

  no_force_unwrap:
    name: "No Force Unwraps in Views"
    regex: '[a-zA-Z0-9_\])\.]!\s*[^=")\]]'
    included: ".*View\\.swift|.*ViewModel\\.swift"
    message: "Avoid force unwraps (!) — use if let, guard let, or nil-coalescing. Force unwraps crash at runtime on unexpected nil. If failure is truly unrecoverable, use fatalError() with a description. See code-review.md §2."
    severity: warning

  no_force_try:
    name: "No Force Try"
    regex: '\btry!\b'
    message: "Avoid try! — use do/catch or try? with fallback handling. Force try crashes on any thrown error. See code-review.md §2."
    severity: warning

  no_print_in_production:
    name: "No print() in Production Code"
    regex: '^\s*print\('
    included: ".*Sources/.*\\.swift"
    message: "Use os.Logger or a structured logging system instead of print(). print() has no log levels, no filtering, and clutters the console. See architecture.md §8."
    severity: warning

  no_silent_catch:
    name: "No Silent Error Swallowing"
    regex: '\}\s*catch\s*\{?\s*\n?\s*\}'
    included: ".*Sources/.*\\.swift"
    message: "Don't silently swallow errors with empty catch blocks. Log the error or surface it to the user. Silent catches hide bugs. See code-review.md §2."
    severity: warning

  # ═══════════════════════════════════════════════════════════
  # SWIFTUI BEST PRACTICES — code-review.md, hig.md, components.md
  # ═══════════════════════════════════════════════════════════

  no_foreground_color:
    name: "Use .foregroundStyle()"
    regex: '\.foregroundColor\('
    message: "Use .foregroundStyle() instead of .foregroundColor(). foregroundColor is soft-deprecated and doesn't support ShapeStyle (gradients, materials). See code-review.md §1."
    severity: warning

  no_ignores_safe_area_bare:
    name: "Specify ignoresSafeArea Edges"
    regex: '\.ignoresSafeArea\(\)'
    message: "Specify which edges to ignore: .ignoresSafeArea(.container, edges: .bottom). Bare .ignoresSafeArea() ignores ALL safe areas including the Dynamic Island and home indicator. See hig.md §1.2."
    severity: warning

  no_on_tap_gesture_for_buttons:
    name: "Prefer Button Over onTapGesture"
    regex: '\.onTapGesture\s*\{'
    included: ".*View\\.swift"
    message: "Prefer Button over .onTapGesture for interactive elements. Button provides accessibility traits (.isButton), keyboard focus, and proper hit testing automatically. If onTapGesture is unavoidable, add .accessibilityAddTraits(.isButton). See hig.md §5.6."
    severity: warning

  no_binding_get_set:
    name: "No Binding(get:set:) in Views"
    regex: 'Binding\(get:|Binding\(\s*get:'
    included: ".*View\\.swift"
    message: "Avoid Binding(get:set:) in view body code — it creates a new Binding each render, causing unnecessary invalidation. Use @State/@Binding with .onChange() instead. See components.md §1."
    severity: warning

  # ═══════════════════════════════════════════════════════════
  # CONCURRENCY — architecture.md §3
  # ═══════════════════════════════════════════════════════════

  no_bare_task_in_views:
    name: "Prefer .task Modifier in Views"
    regex: 'onAppear[^}]*Task\s*\{'
    included: ".*View\\.swift"
    message: "Replace .onAppear { Task { } } with .task { }. The .task modifier automatically cancels work when the view disappears, preventing memory leaks. See architecture.md §3."
    severity: warning

  # ═══════════════════════════════════════════════════════════
  # PERFORMANCE — performance.md
  # ═══════════════════════════════════════════════════════════

  no_uuid_in_foreach_id:
    name: "No UUID() in ForEach Identity"
    regex: '\.id\(UUID\(\)\)'
    message: "Never use .id(UUID()) — it generates a new identity every render, destroying view state and forcing full recreation. Use a stable identifier from your model. See performance.md."
    severity: error

  # ═══════════════════════════════════════════════════════════
  # LOCALIZATION — localization.md §7
  # ═══════════════════════════════════════════════════════════

  no_left_right_padding:
    name: "No .leading/.trailing as .left/.right"
    regex: '\.padding\(\.left|\.padding\(\.right|alignment:\s*\.left|alignment:\s*\.right'
    message: "Use .leading/.trailing instead of .left/.right. Left/right don't adapt for RTL languages (Arabic, Hebrew). See localization.md §3."
    severity: error
```

**Customization notes:**
- Replace `MyApp` in the `included` paths with the actual app name.
- Add project-specific exclusions to `no_geometry_reader` or other rules when justified (e.g., a circular piano view that genuinely needs GeometryReader).
- The Theme exclusion assumes theme definitions live in `Sources/UI/Theme/`.

---

## 6. `.gitignore`

```gitignore
# macOS
.DS_Store
*.swp
*~

# Build artifacts
build/

# Xcode (generated by XcodeGen — never commit)
ios/*.xcodeproj
ios/build/
ios/DerivedData/
ios/**/*.xcworkspace
ios/**/xcuserdata/
ios/**/*.xcscheme

# SPM
ios/.build/
ios/Package.resolved

# Environment
.env
.env.*
```

---

## 7. `ExportOptions.plist`

Lives at `ios/ExportOptions.plist`. Required for `xcodebuild -exportArchive`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store-connect</string>
    <key>teamID</key>
    <string>XXXXXXXXXX</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>uploadSymbols</key>
    <true/>
    <key>destination</key>
    <string>export</string>
</dict>
</plist>
```

Replace `XXXXXXXXXX` with your Apple Developer Team ID.

---

## 8. `CLAUDE.md`

Every project gets a `CLAUDE.md` at the repo root so agents have immediate context.

```markdown
# MyApp

One-line description of what the app does.

## Project Structure

- `ios/` — Native iOS app (SwiftUI)

## iOS App

- **Build**: Uses XcodeGen (`project.yml`) — run `make generate` to create `.xcodeproj`
- **Target**: iOS 17+, iPhone only
- **Architecture**: @Observable + SwiftUI-native state, dependency injection, no singletons in views, view models only when they earn their keep
- **Theme**: [describe palette], centralized in UI/Theme/
- **No backend** — everything runs locally

## Linting

- Run `make lint` before committing to check style and architecture rules
- Run `make lint-fix` to auto-fix what SwiftLint can
- **Errors** are architectural violations (must fix) — **warnings** are best practices (should fix)

## Formatting

- Run `make format` to auto-format all source files
- Run `make format-check` to check without modifying
- Formatting is enforced by the pre-commit hook

## Key Decisions

- [Monetization strategy, if any]
- [Data storage approach]
- [Privacy stance]
```

---

## 9. Asset Catalog

The asset catalog needs both a root `Contents.json` and an `AppIcon.appiconset/Contents.json`, or the build will fail:

**`Assets.xcassets/Contents.json`:**
```json
{
  "info": { "author": "xcode", "version": 1 }
}
```

**`Assets.xcassets/AppIcon.appiconset/Contents.json`:**
```json
{
  "images": [
    { "idiom": "universal", "platform": "ios", "size": "1024x1024" }
  ],
  "info": { "author": "xcode", "version": 1 }
}
```

---

## 10. Pre-Commit Hook

The `make setup` target installs a git pre-commit hook automatically. The hook runs:

1. **SwiftFormat lint** — checks all source files are formatted. Fails fast with a message to run `make format`.
2. **SwiftLint strict** — checks architecture and code quality rules. Fails with a message to run `make lint`.

If you need to bypass the hook for a WIP commit: `git commit --no-verify`

**Important:** The hook runs on every commit. If `make setup` hasn't been run (e.g., fresh clone), remind the user to run it first.

---

## 11. Common Gotchas

### App letterboxed / doesn't fill the full screen

**Symptom:** Black bars above and below the app content on modern iPhones. The app renders in a smaller, centered rectangle.

**Cause:** No launch screen is configured. Without one, iOS assumes the app doesn't support the device's full screen size and runs it in compatibility mode.

**Fix:** Add both of these to the target's build settings in `project.yml`:

```yaml
GENERATE_INFOPLIST_FILE: YES
INFOPLIST_KEY_UILaunchScreen_Generation: YES
```

This generates an empty launch screen automatically. No `LaunchScreen.storyboard` file needed.

**Important:** After adding this, you may need to **uninstall** the app from the simulator before reinstalling — the old cached launch screen can persist.

### Background color doesn't extend behind status bar / home indicator

**Symptom:** The app's background fills the content area but the status bar and home indicator regions show black (or the system default).

**Fix:** Use a ZStack with the background color ignoring safe areas, inside each tab's root view:

```swift
var body: some View {
    ZStack {
        Color.theme.background
            .ignoresSafeArea(.container, edges: .all)

        VStack { /* actual content */ }
    }
}
```

Also configure UIKit tab bar appearance in the `@main` app struct `init()`:

```swift
init() {
    let tabAppearance = UITabBarAppearance()
    tabAppearance.configureWithOpaqueBackground()
    tabAppearance.backgroundColor = UIColor(Color.theme.background)
    UITabBar.appearance().standardAppearance = tabAppearance
    UITabBar.appearance().scrollEdgeAppearance = tabAppearance
}
```

### Asset catalog build error: "No matching app icon set named AppIcon"

**Cause:** The `AppIcon.appiconset` directory or its `Contents.json` is missing from the asset catalog.

**Fix:** Create the directory and JSON file as shown in §9. You don't need an actual icon image for development — just the manifest.

### `Cannot code sign because the target does not have an Info.plist`

**Cause:** Using XcodeGen with `GENERATE_INFOPLIST_FILE` not set.

**Fix:** Add `GENERATE_INFOPLIST_FILE: YES` to the target settings in `project.yml`. This tells Xcode to auto-generate the Info.plist from build settings instead of requiring a physical file.

### SwiftFormat and SwiftLint conflicts

**Symptom:** SwiftFormat reformats something, then SwiftLint flags it (or vice versa).

**Prevention:** The `.swiftformat` config disables rules that overlap with SwiftLint (e.g., `organizeDeclarations`, `markTypes`), and `.swiftlint.yml` disables `trailing_whitespace` since SwiftFormat handles it. If you find a new conflict, disable the rule in whichever tool is less opinionated about it.

**Run order:** Always format first, then lint: `make format && make lint`.

### Upload fails with "Export Compliance" / encryption error

**Symptom:** `xcrun altool --upload-app` fails with "This bundle is invalid. The key UIRequiredDeviceCapabilities..." or the build shows as "Missing Compliance" in App Store Connect and can't be distributed to TestFlight.

**Cause:** The app doesn't declare its encryption usage. Without `ITSAppUsesNonExemptEncryption`, Apple requires a manual compliance declaration for every build before it can be tested.

**Fix:** Add via XcodeGen's `info` block in `project.yml` (NOT as an `INFOPLIST_KEY_` build setting — that prefix doesn't work for this key):

```yaml
targets:
  MyApp:
    info:
      path: MyApp/Info.plist
      properties:
        ITSAppUsesNonExemptEncryption: false
```

When using `info:` with a `path:`, also move `UILaunchScreen`, `NSCameraUsageDescription`, etc. into the `properties` block and remove the corresponding `INFOPLIST_KEY_` build settings.

**⚠️ CRITICAL:** When using `info: path:`, XcodeGen **regenerates the Info.plist on every `make generate`**, overwriting any manual edits. You must add the version variables to `project.yml`'s `info: properties:` block so XcodeGen writes them correctly:

```yaml
targets:
  MyApp:
    info:
      path: MyApp/Info.plist
      properties:
        CFBundleShortVersionString: "$(MARKETING_VERSION)"
        CFBundleVersion: "$(CURRENT_PROJECT_VERSION)"
        ITSAppUsesNonExemptEncryption: false
```

Without these, XcodeGen writes hardcoded defaults (`1.0` / `1`) to the plist, silently overriding `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` from build settings. Every upload will fail with "bundle version must be higher than previously uploaded version" because `make bump` updates `project.yml` but the regenerated plist wins.

This tells Apple the app doesn't use non-exempt encryption (standard HTTPS is exempt). If your app uses custom encryption beyond HTTPS, set this to `true` and file a compliance declaration in App Store Connect.

### Upload succeeds but build not visible in TestFlight

**Cause:** The build is missing an encryption compliance declaration, or there's no internal TestFlight group with the developer added.

**Fix:**
1. Add `ITSAppUsesNonExemptEncryption: false` as above
2. Ensure an internal TestFlight group exists with testers added (see §12)
3. Set `ASC_APP_ID` and `ASC_GROUP_ID` in the Makefile so builds auto-distribute to the internal group

### `UIRequiredDeviceCapabilities` rejection on upload

**Symptom:** Upload fails with "The key UIRequiredDeviceCapabilities contains value '[arm64]' which is incompatible with the MinimumOSVersion value of '17.0'."

**Cause:** Explicitly setting `UIRequiredDeviceCapabilities` to `[arm64]` is redundant for iOS 17+ (all iOS 17 devices are arm64) and Apple rejects it.

**Fix:** Remove `INFOPLIST_KEY_UIRequiredDeviceCapabilities` from `project.yml`. Don't set it at all — iOS 17 minimum deployment target implies arm64.

### Version not bumping — uploads fail with "bundle version must be higher"

**Symptom:** `xcrun altool --upload-app` fails with "The bundle version must be higher than the previously uploaded version" even after running `make bump`.

**Cause:** A physical `Info.plist` (referenced via `info: path:` in `project.yml`) has hardcoded `CFBundleShortVersionString` and `CFBundleVersion` values like `1.0` / `1`. These override `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` build settings — `make bump` updates `project.yml` but the plist wins.

**Fix:** In the physical Info.plist, replace hardcoded values with build setting variables:

```xml
<key>CFBundleShortVersionString</key>
<string>$(MARKETING_VERSION)</string>
<key>CFBundleVersion</key>
<string>$(CURRENT_PROJECT_VERSION)</string>
```

**Prevention:** When creating a project with `info: path:`, always verify the plist uses variables, not literals. Alternatively, use `GENERATE_INFOPLIST_FILE: YES` without a physical plist (but then `ITSAppUsesNonExemptEncryption` must be set via XcodeGen `info: properties:` instead).

---

## 12. TestFlight Internal Group Setup

After the first release, the agent should help the user set up an internal TestFlight group for auto-distribution. Internal groups are **per-app** in App Store Connect — they don't carry over from other apps.

### Agent behavior

After the first successful upload to App Store Connect (or when setting up release infrastructure), **ask the user**:

> "Would you like to set up an internal TestFlight group so builds auto-distribute to your team? I'll need to know which email addresses to add as testers."

Then walk through these steps:

### Steps

1. **Find the app ID:**
   ```
   asc apps list --output table
   ```

2. **Create an internal group** (if one doesn't exist):
   ```
   asc testflight groups create --app <APP_ID> --name "Team" --internal
   ```

3. **Ask the user which testers to add.** Do NOT assume emails or hardcode them. Prompt:
   > "Which email addresses should I add to the internal TestFlight group? These must be Apple IDs of people in your App Store Connect team."

4. **Add testers:**
   ```
   asc testflight groups add-testers --id <GROUP_ID> --email "person@example.com"
   ```

5. **Enable automatic distribution** for the internal group in App Store Connect:
   - Go to **TestFlight** → click the internal group (e.g. "Team") → **Settings** tab
   - Under **Build Distribution**, change from "Manual" to **"Automatic"** for Xcode builds
   - This ensures every new build is automatically distributed to the internal group without manual action
   - **Do NOT enable automatic distribution for external groups** — external groups require manual assignment and beta review

   Note: The ASC web UI may not always show a toggle for this. As a fallback, the Makefile auto-distribute (step 6) handles it via the API.

6. **Set the Makefile variables** so future builds auto-distribute to the internal group only:
   ```makefile
   ASC_APP_ID   ?= 1234567890
   ASC_GROUP_ID ?= xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

### Important

- **Always enable automatic distribution for internal groups.** This is per-app and must be set for each new app.
- **Never enable automatic distribution for external groups.** External groups require manual build assignment and beta review.
- The `ASC_GROUP_ID` in the Makefile must point to an **internal** group only.
- Internal group testers must already be members of the App Store Connect team with the Developer, Admin, or App Manager role.
