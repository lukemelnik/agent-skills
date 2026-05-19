# UI Hardening

Hardening makes a UI survive real users, real data, real networks, and real devices. Use this when shipping production UI, handling edge cases, or fixing layouts that only work with perfect content.

## Stress inputs

Test or reason through:

- Very long names, titles, email addresses, file names, URLs, and notes.
- Empty strings, missing optional fields, deleted related records.
- Emoji, accents, CJK, RTL text, and mixed-direction strings.
- Large counts, long dates, currency formats, percentages, and pluralization.
- 0 items, 1 item, typical item count, and very large lists.
- Slow network, offline, timeout, 401/403/404/429/500, validation errors.
- Concurrent operations and double-click/double-submit.
- Permission/read-only states.

## Text overflow

- Flex/grid children that contain text usually need `min-width: 0`.
- Choose intentionally: wrap, truncate, clamp, or scroll.
- Do not truncate critical information without a way to reveal it.
- Avoid fixed-width buttons for text that can translate or vary.
- Test labels at roughly 30-40% longer than English.

## Internationalization and localization

- Use locale-aware date, time, number, and currency formatting.
- Avoid string concatenation that breaks word order or plural rules.
- Prefer logical CSS properties for directional spacing when supporting RTL.
- Do not rely on icons alone when cultural meaning may vary.
- Leave room for translated button labels and navigation items.

## Loading and async states

- Initial load: show stable structure, not a blank flash.
- Partial load: preserve already loaded content where possible.
- Mutations: show pending state, prevent duplicate submission where needed.
- Optimistic updates: use only when rollback is clear and low-risk.
- Long tasks: communicate progress or expectation.

## Error and recovery states

Each recoverable error should answer:

1. What happened?
2. Why, if known?
3. What can the user do next?

Examples:

- Network: retry, check connection, keep existing content visible.
- Validation: field-level message near the field, preserve input.
- Permission: explain access level and where to request access.
- Not found: explain whether the item was deleted, moved, or unavailable.
- Server error: avoid exposing internals; provide retry/support path.

## Empty states

An empty state should usually include:

- What is empty.
- Why it matters or what will appear here.
- The next useful action, if one exists.

Avoid decorative empties that do not help the user move.

## Accessibility resilience

- Keyboard path covers all actions.
- Focus moves predictably after dialogs, sheets, route changes, and deletes.
- Dynamic updates are announced when screen-reader users need them.
- Reduced motion does not remove essential feedback.
- Zoom/text scaling does not clip controls or hide content.
- Color is not the only carrier of status.

## Responsive and device resilience

- Use content-driven breakpoints, not only device presets.
- Detect input capability where relevant: pointer, hover, coarse pointer.
- Touch targets are large enough on touch devices.
- Mobile keyboards, safe areas, and sticky bars do not block inputs/actions.
- Wide screens do not create unreadable line lengths.

## Performance resilience

- Large lists use pagination, windowing, or incremental loading.
- Images have dimensions to avoid layout shift.
- Expensive motion/effects are bounded and disabled/reduced when needed.
- Heavy computation does not block typing, scrolling, or button feedback.

## Hardening report

When hardening, mention which edge cases were handled and which were not verified. If a case is impossible in the product model, say so briefly.
