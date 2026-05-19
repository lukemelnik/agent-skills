# UI Copy

UI copy helps users act. It should be specific, brief, recoverable, and consistent with the product's terminology.

Use this reference for button labels, forms, errors, empty states, onboarding, confirmation dialogs, marketing copy cleanup, and model-prose anti-patterns.

## Button and action labels

Use outcome-specific labels:

- Bad: `OK`, `Submit`, `Yes`, `Click here`, `Continue` when the destination is unclear.
- Good: `Save changes`, `Create project`, `Delete 5 files`, `Send invite`, `View billing`.

For destructive actions, name the destructive outcome. If the action affects multiple items, include the count.

## Error messages

Good errors answer:

1. What happened?
2. Why, if known?
3. How to recover?

Patterns:

- Format: `[Field] needs [format]. Example: [example].`
- Required: `Enter [field] to continue.`
- Permission: `You do not have access to [thing]. Ask an admin for access.`
- Network: `We could not reach [service]. Check your connection and try again.`
- Server: `Something went wrong on our end. Try again, or contact support if it keeps happening.`

Do not blame the user. Do not make jokes in high-friction or high-stakes errors.

## Empty states

Useful empty states:

- Acknowledge what is missing.
- Explain what will appear here or why it matters.
- Offer the next action when one exists.

Bad: `No data`.
Good: `No invoices yet. Paid invoices will appear here after your first billing cycle.`

## Confirmation dialogs

Avoid confirmation dialogs for low-risk actions. Prefer undo when practical.

When confirmation is required:

- Title names the action.
- Body states consequence.
- Buttons are specific: `Delete workspace` and `Keep workspace`, not `Yes` and `No`.

## Terminology

Pick one term and use it everywhere. Do not vary words for style.

Examples:

- `Sign in` vs `Log in`.
- `Delete` vs `Remove` vs `Trash`.
- `Settings` vs `Preferences`.
- `Create` vs `Add` vs `New`.

If project vocabulary exists, follow it even if a generic UX rule would choose a different word.

## Translation-friendly copy

- Keep full sentences together as one string.
- Do not concatenate fragments around variables.
- Use pluralization/localization utilities when available.
- Avoid narrow fixed-width controls for labels.
- Avoid idioms, puns, and culture-specific jokes in core flows.

## Model-prose anti-pattern registry

Flag these in user-facing copy unless the project style explicitly wants them or the term is technical in context:

- `delve`, `dive into`, `let's dive in`
- `elevate`, `empower`, `seamless`, `robust`, `unlock`, `leverage`
- `in today's...`, `gone are the days`, `whether you're...`
- `moreover`, `furthermore`, `in conclusion`, `in summary`
- `tapestry`, `journey`, `landscape` when used as filler metaphors
- `not just X, but Y` / `more than X, it's Y` as a repeated structure
- perfect triads like `fast, simple, and powerful` when they say nothing specific
- vague claims: `powerful`, `intuitive`, `beautiful`, `delightful`, `world-class` without evidence

Do not mechanically remove every occurrence in technical docs, quotes, changelogs, or code comments. The rule is for visible product/marketing copy and help text.

## Punctuation and rhythm

Avoid model-default punctuation habits in polished copy:

- Do not overuse em dashes as a universal connector.
- Do not stack semicolons to sound sophisticated.
- Mix sentence lengths deliberately. Uniform medium-length paragraphs feel generated.
- Cut throat-clearing openings. Start with the useful sentence.

## Copy review checklist

- Does every button say what happens?
- Does every error give a recovery path?
- Does every empty state help the user move?
- Is terminology consistent with the app?
- Can the sentence belong only to this product, or could any competitor say it?
- Is there any model prose that should be cut?
