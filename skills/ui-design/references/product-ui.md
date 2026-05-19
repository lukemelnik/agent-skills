# Product UI

Product UI covers task-focused surfaces: app shells, dashboards, settings, forms, tables, admin tools, editors, authenticated workflows, and anything users operate repeatedly.

Design serves the task. The user should trust the interface and move faster because the patterns are familiar, consistent, and complete.

## Product UI principles

- Earned familiarity beats novelty. Use standard navigation, forms, tables, breadcrumbs, tabs, dialogs, and command palettes when those are the expected affordances.
- Consistency is a feature. Same action type, same visual vocabulary, same interaction pattern.
- Density is allowed when the task needs it. Do not make professional tools airy at the cost of scanning efficiency.
- Visual hierarchy should reduce decisions: one primary action, a small number of secondary actions, the rest grouped or deferred.
- Use restrained color by default. Accent color marks primary action, selection, focus, or state, not decoration.
- System/native fonts are often correct for product UI. Distinctive display fonts usually belong to brand surfaces, not labels, tables, and settings.
- Motion communicates state. Avoid decorative entrance choreography on screens users visit often.

## Product surface checklist

- Primary task is obvious within 3 seconds.
- Navigation shows current location and preserves user control.
- Controls use the project's shared component vocabulary.
- Every interactive element has relevant states: default, hover where supported, focus, active, disabled, loading, error, success.
- Loading states preserve layout with skeletons or stable placeholders when practical.
- Empty states teach the next action instead of saying only "No items".
- Error states explain recovery and preserve user work.
- Destructive actions use undo when practical; confirmations are reserved for irreversible/high-cost actions.
- Forms have visible labels, helpful validation, logical tab order, and field-level errors.
- Tables support scanning: aligned numbers, sensible columns, empty/loading/error states, overflow behavior, and mobile adaptation.
- Long names, missing data, many items, permissions, and offline/network failure states do not break layout.

## Layout and hierarchy

- Use predictable grids and alignment. Surprise in product UI should be rare and useful.
- Group related controls by proximity and headings, not by wrapping everything in cards.
- Avoid nested cards. Flatten with spacing, dividers, section headers, or background tone.
- Cap prose line length around 65-75ch. Data tables and dense lists can be wider.
- Keep touch targets at least 44px/44pt where touch input is possible.
- Use responsive structure: collapse navigation, convert wide tables, stack forms, and preserve actions near the content they affect.

## Color and typography

- Use semantic tokens. Do not hard-code colors when the project has tokens.
- Neutral surfaces should have clear roles: app background, panel/sidebar, card/surface, border, muted text.
- Status colors must be consistent: destructive, warning, success, info.
- Do not use low-contrast gray text, especially on colored backgrounds.
- Use fixed type scales for app UI. Fluid hero typography is usually a brand-surface tool.
- Use tabular numbers for aligned financial, timing, count, or metric data when the platform supports it.

## Motion

- Most product transitions should be 100-250ms.
- Animate opacity/transform or platform-native equivalents; avoid casual layout-property animation.
- Respect reduced motion.
- Never make frequent keyboard-driven actions wait for animation.

## Common product UI failures

- Pretty but incomplete: no loading/error/empty/disabled states.
- Custom controls that fight expected platform behavior.
- Too many visible actions with no priority.
- Decorative color on inactive elements.
- Modal-first flows where inline editing, a route, or progressive disclosure would be clearer.
- Generic card grids for settings or dashboards where hierarchy should come from information architecture.
