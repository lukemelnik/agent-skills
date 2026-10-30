# UI Hardening

Hardening makes a UI survive real users, real data, real networks, and real devices. Use this when shipping production UI, handling edge cases, or fixing layouts that only work with perfect content.

## Stress inputs

For a concrete field-to-source mapping, realistic input catalog, and permission-aware reproduction workflow, use [adversarial stress testing](stress-testing.md). Audits stay read-only unless edits are authorized; distinguish visual observations from inference.

Test or reason through:

- Long names, emails, file names, URLs; missing optional fields; deleted related records.
- Emoji, CJK, RTL, mixed-direction strings; currency, percentage, plural forms.
- 0, 1, and very large item counts.
- Offline, timeout, 401/403/404/429/500; double-submit; read-only states.

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

- Mutations: show pending state, prevent duplicate submission where needed.
- Optimistic updates: use only when rollback is clear and low-risk.
- Long tasks: communicate progress or expectation.

## Error and empty states

Errors say what happened, why if known, and the next step; keep existing content and input. Do not expose server internals. Empty states say what is empty and the next useful action; no decorative empties.

## Accessibility resilience

- Focus moves predictably after dialogs, sheets, route changes, and deletes.
- Dynamic updates are announced when screen-reader users need them.
- Reduced motion does not remove essential feedback.
- Zoom/text scaling does not clip controls or hide content.
- Color is not the only carrier of status.

## Responsive and device resilience

For browser/PWA viewport, safe-area, keyboard, and gesture details, use [mobile web hardening](mobile-web.md), not native-app guidance.

- Detect input capability where relevant: pointer, hover, coarse pointer.
- Touch targets are large enough on touch devices.
- Mobile keyboards, safe areas, and sticky bars do not block inputs/actions.

## Hardening report

When hardening, mention which edge cases were handled and which were not verified. If a case is impossible in the product model, say so briefly.
