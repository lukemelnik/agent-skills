---
name: ios-onboarding
description: Design ethical onboarding flows for iOS SwiftUI apps. Use when planning, reviewing, or implementing first-run onboarding, questionnaire flows, permission priming, first-value demos, first-launch gating, onboarding copy, or paywall-adjacent onboarding. Focus on onboarding-specific strategy and iOS constraints; defer standard SwiftUI architecture, navigation, theming, and StoreKit work to the ios skill.
---

# iOS Onboarding

## Quick start

Choose the narrowest path that matches the request:

- **Plan or review an onboarding flow**: read `references/anti-patterns.md` first, then `references/framework.md`.
- **Write or tighten onboarding copy**: read `references/copy.md`.
- **Handle iOS permissions in onboarding**: read `references/permission-priming.md`.
- **Implement onboarding-specific behavior**: read `references/ios-differences.md`, then use the `ios` skill for ordinary SwiftUI work.

Always decide whether the app should have a questionnaire flow at all. Many iOS apps are better served by a short welcome screen, an excellent empty state, or immediate product use.

## Workflow

1. Inspect the app before proposing screens.
   - Read `CLAUDE.md`, README, App Store copy, and any existing onboarding or paywall code.
   - Inspect the app entry point, first-launch gating, and the first real user action.
   - Inspect `Info.plist`, entitlements, and permission request sites in code.
2. Decide whether questionnaire onboarding is appropriate.
   - Prefer immediate use when the app's value is obvious within one action.
   - Prefer a questionnaire only when answers materially personalize the next experience.
3. Define the transformation and first value.
   - State the user's **before**, **after**, and **aha moment** in plain language.
   - Identify the smallest version of the core loop that can run inside onboarding.
4. Propose the leanest screen sequence that earns its keep.
   - Default to 4-8 screens, not a fixed funnel.
   - Explain why each screen exists and why any screen was skipped.
5. Draft copy that sounds human.
   - Keep headlines short and specific.
   - Make every question answerable in the user's own words.
   - Make every CTA describe the next action.
6. Implement only the onboarding-specific pieces.
   - Add first-launch gating, permission timing, and first-value demo behavior.
   - Reuse ordinary SwiftUI patterns from the `ios` skill instead of restating them here.

## Core rules

- Optimize for user clarity and speed to value, not screen count.
- Ask only questions that change the next screen, the demo, or later product behavior.
- Show real value before asking for sign-in, tracking, or payment whenever possible.
- Ask for permissions in context, as late as possible, and only when the benefit is obvious.
- Use real app models or high-fidelity sample data for onboarding demos.
- Keep onboarding skippable, restartable, testable, and accessible.
- Refuse manipulative patterns even if they might increase short-term conversion.

## Deliverables

When planning or reviewing, produce:

1. A one-paragraph transformation summary.
2. A recommended screen sequence with rationale and skip decisions.
3. Draft copy for each included screen.
4. iOS-specific implementation notes only where onboarding differs from ordinary SwiftUI work.
5. A short anti-pattern audit.

## Use adjacent skills

- Use `ios` for standard SwiftUI architecture, navigation, state, components, theming, and testing details.
- Use `swift-concurrency` for actor isolation or Swift 6 diagnostics.
- Use `app-review` when the task becomes an App Store readiness audit rather than onboarding design.
