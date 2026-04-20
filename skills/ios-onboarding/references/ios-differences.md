# iOS Implementation Differences

Use this file only for onboarding-specific implementation details that differ from ordinary SwiftUI work. For standard view structure, state, navigation, and styling, use the `ios` skill.

## First-launch gating

Gate onboarding with simple persisted state.
Prefer a small versioned gate over scattered booleans when the flow may evolve.

Example:

```swift
@AppStorage("completedOnboardingVersion")
private var completedOnboardingVersion = 0

private let currentOnboardingVersion = 1

var shouldShowOnboarding: Bool {
    completedOnboardingVersion < currentOnboardingVersion
}
```

Use versioning when:
- the onboarding changed materially
- an old cohort should see the new flow once
- QA needs a stable reset point

## Demo state

Keep the onboarding demo local and deterministic.
Do not make first value depend on account creation, network latency, or remote content that may fail on first launch.

Prefer:
- embedded fixtures
- curated local sample data
- a lightweight adapter around real models

Avoid:
- blank states that require import before the user can see value
- a multi-step wizard that recreates the whole app

## Permission timing hooks

Trigger the system prompt only from a user action on the priming screen.
If the permission is denied, keep the user moving.
Offer a later in-context retry rather than trapping them in onboarding.

## Paywall and account gates

Treat the user's output as something to preserve, not as bait.
If the app gates saving or syncing, say so clearly.
If anonymous use is possible, prefer showing the result first and gating advanced persistence later.

## Reset and testing

Make onboarding easy to reset in debug builds and UI tests.
Support at least one deterministic reset path:
- launch argument
- debug menu action
- app setting in non-production builds

UI tests should be able to:
- start from a fresh onboarding state
- skip directly to the paywall or final screen when needed
- simulate a denied permission path without manual setup

## Analytics

Track drop-off and completion only as needed to improve the flow.
Avoid logging sensitive answers unless the product genuinely needs them and the privacy posture is clear.

Useful events:
- onboarding started
- screen viewed
- goal selected
- permission allowed or skipped
- first value completed
- onboarding completed

## Accessibility and motion

Make onboarding work with Dynamic Type, VoiceOver, and Reduce Motion.
If the design uses animation to explain progress, provide a clear static state as well.
Never rely on animation alone to communicate completion or personalization.
