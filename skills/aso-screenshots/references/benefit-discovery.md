# Benefit Discovery

## Step 1: Analyze the Codebase

Explore thoroughly:
- UI files, views, screens, components — what can the user DO?
- Models, data structures — what domain?
- IAP, subscriptions — what's the premium offering?
- Onboarding flows — what does the app highlight first?
- App name, bundle ID, any marketing copy
- README, App Store metadata if present

Build a mental model of: core functionality, target audience, unique value, problems solved.

## Step 2: Clarifying Questions

Present what you learned and ask targeted questions to fill gaps:

- "Based on the code, this appears to be [X]. Is that right?"
- "Who is your target audience?"
- "What's the #1 reason someone downloads this app?"
- "Who are your main competitors?"
- "What do your best reviews say?"

Don't ask what the code already answers.

## Step 3: Draft Benefits

Draft 3-5 core benefits. Each MUST:

1. **Lead with an action verb** — TRACK, SEARCH, CREATE, BOOST, FIND, BUILD, SHARE, SAVE, etc.
2. **Focus on what the USER gets**, not technical features
3. **Be specific** — "TRACK TRADING CARD PRICES" not "MANAGE YOUR COLLECTION"
4. **Answer**: "Why should I download this instead of scrolling past?"

Present as:
```
1. [VERB] + [BENEFIT] — [why this drives downloads]
2. [VERB] + [BENEFIT] — [why this drives downloads]
3. [VERB] + [BENEFIT] — [why this drives downloads]
```

## Step 4: Iterate

Do NOT proceed until user explicitly confirms. Let them reorder, reword, add, remove. Push back politely on generic choices. User has final say.

## Step 5: Save

Write confirmed benefits to `.aso-screenshots/state.json` with app context, target audience, and refinement notes.
