# Anti-patterns

Read this file before proposing or implementing any onboarding flow.

## Hard bans

Do not do any of the following:

- Fake a loading or personalization step when nothing meaningful is happening.
- Ask questions whose answers do not change the next experience.
- Ask for notifications, tracking, contacts, or location on the first screen by default.
- Put sign-in before first value unless the product truly cannot function otherwise.
- Put a paywall before the user has seen believable value unless the product is explicitly pay-to-enter.
- Invent testimonials, ratings, user counts, or outcome statistics.
- Clone a trendy onboarding pattern just because another subscription app uses it.
- Use guilt, urgency, or shame in skip buttons or secondary actions.

## Common traps

### Survey instead of product
Trap: turning onboarding into a long quiz because it feels strategic.

Safer move:
- cut questions aggressively
- let the user do the product sooner

### Personalization theater
Trap: claiming the app is building something personal while the result is generic.

Safer move:
- personalize only what actually changes
- skip the ceremony if the next screen is not meaningfully different

### Permission batching
Trap: stacking multiple system prompts because the user is already in onboarding.

Safer move:
- ask one permission at the moment of need
- separate product permissions from ATT

### Account harvesting
Trap: gating value only to collect an email.

Safer move:
- show value first
- explain saving, syncing, or cross-device access honestly if an account is needed

### Paywall warming with filler
Trap: adding weak persuasion screens because the paywall needs more runway.

Safer move:
- tighten the promise
- make the demo stronger
- remove filler screens

## Review checklist

Before finalizing, verify:
- the app would still feel respectable if the flow were shown to an App Review human
- the flow is shorter than the team's first draft
- every screen changes understanding, output, or product behavior
- the user can say no to non-essential asks and still proceed
- the flow teaches the app mainly through use, not just claims
