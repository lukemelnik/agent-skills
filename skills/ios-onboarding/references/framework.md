# Onboarding Framework

## Start with a fit check

Decide whether the app needs questionnaire onboarding at all.

Prefer **no questionnaire** when:
- the app reaches value in one obvious step
- the first screen can already teach the product by being used
- personalization does not materially change the first session
- the only reason for extra screens is to warm up a paywall

Prefer a **short questionnaire** when:
- the app serves multiple clear user intents
- the first output depends on preferences, goals, or constraints
- the app benefits from sequencing before a first-value demo
- the team needs to route the user into one of several first experiences

## Define three anchors before writing screens

Write these first:

- **Before**: what is frustrating, confusing, or slow without the app?
- **After**: what feels easier, clearer, or more in control with the app?
- **First value**: what is the smallest believable win the user can get in under a minute?

Use these anchors to decide whether a screen belongs.

## Screen library

Choose from this set. Use only the screens that directly support first value.

### 1. Welcome / outcome
Use to orient the user and state the benefit.

Include:
- outcome-focused headline
- one product visual or preview of the best screen
- clear primary CTA
- log-in link only if existing users need it

Skip when:
- the app can open directly into a useful first action without explanation

### 2. Goal selection
Use when the app supports multiple first-session intents.

Include:
- one question
- 3-6 distinct options
- single select unless multiple answers change behavior immediately

Skip when:
- all users start with the same job to be done

### 3. Friction / constraints
Use when the next experience must account for blockers, preferences, or limitations.

Include:
- one concise question
- only options that change recommendation or demo content

Skip when:
- answers would be interesting for analytics but do not change the product

### 4. Personalized solution
Use to bridge from what the user said to what the app will do next.

Include:
- one short summary of how the app helps
- 2-4 concrete outcomes tied to the selected goal or friction

Skip when:
- the demo itself already makes the solution obvious

### 5. Preference selection
Use only when preferences directly change the next screen or first output.

Include:
- visible choices that shape the demo
- no speculative profile-building questions

Skip when:
- the app can infer or ask later without harming first value

### 6. Permission priming
Use only for permissions that are needed before or during first value.

Include:
- benefit-framed headline
- 2-3 specific reasons to allow
- allow / not now actions

Skip when:
- the permission is better requested in context later

### 7. Core-loop demo
Use to let the user do one real version of the product's main interaction.

Include:
- one simple task
- a completion target
- real interaction, not a slideshow
- local or curated data that produces a believable result

This is the highest-value screen in the flow.

### 8. Value delivery
Use to reveal the output from the demo.

Include:
- the result the user just created or unlocked
- next step to keep using it
- optional share action only if genuinely natural

### 9. Account gate
Use only when account creation is necessary to save, sync, or continue the result.

Include:
- what the user keeps by signing in
- minimal auth options
- honest explanation of why an account matters

Skip when:
- anonymous use is viable
- the gate exists only to harvest email before value

### 10. Paywall
Use only when the app is already subscription-driven and the user has seen real value.

Include:
- clear plan and trial details
- concise explanation of premium value
- restore purchases
- option hierarchy that is easy to understand

Skip when:
- the app has not yet earned the ask
- the product is better monetized later in context

## Good default sequences

### Minimal utility app
Use when the product is easy to understand.

1. Welcome / outcome
2. Core-loop demo or direct product entry
3. Value delivery
4. Ask for permission later in context if needed

### Personalized plan app
Use when answers shape the first output.

1. Welcome / outcome
2. Goal selection
3. Friction or preference selection
4. Personalized solution
5. Core-loop demo
6. Value delivery
7. Account gate or paywall if justified

### Habit or reminder app
Use when notifications matter but should not lead.

1. Welcome / outcome
2. Goal selection
3. Personalized solution
4. Core-loop demo
5. Value delivery
6. Notification priming after the user understands what will be reminded
7. Paywall if the model requires it

## Review rules

- Remove any screen that does not change user understanding, behavior, or output.
- Prefer one great demo screen over three abstract persuasion screens.
- Let the product prove itself instead of narrating every promise.
- Keep the flow short enough that the user still feels they are starting the app, not taking a survey.
