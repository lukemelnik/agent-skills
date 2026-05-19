# UI Review

Use this reference when the user asks for a UI critique, UX review, design audit, accessibility check, or asks whether a screen feels good enough to ship.

Review the real surface when possible. Source-only review misses spacing, contrast, text wrapping, and interaction feel.

## Review workflow

1. Discover the design system first (`discovery.md`).
2. Classify the surface as product UI or brand UI.
3. Inspect the relevant source and, when available, the rendered UI.
4. Check against project rules, platform conventions, and `antipatterns.md`.
5. Prioritize issues by user impact, not by how easy they are to notice.

## What to evaluate

### Purpose and hierarchy

- Is the primary user action or message obvious?
- Does the visual hierarchy match user importance?
- Are secondary actions clearly secondary?
- Does anything visually loud fail to matter?

### Cognitive load

- Can the user make the next decision without holding information from elsewhere?
- Are choices grouped into digestible sets?
- Are there more than 4-5 competing options at a decision point?
- Does the UI reveal complexity progressively?
- Are labels specific enough to avoid guessing?

### Design-system fit

- Does it use shared tokens and components?
- Does it match nearby screens in density, spacing, terminology, and control vocabulary?
- Are new values or patterns justified, or are they drift?

### Interaction and state coverage

- Default, hover, focus, active, disabled, loading, error, success states.
- Keyboard path and visible focus.
- Touch target size where touch applies.
- Loading, empty, error, no-permission, long-content, and many-items states.
- Destructive action recovery.

### Accessibility

- Semantic structure and headings.
- Labels and accessible names for controls.
- Contrast for text, icons, borders, and focus indicators.
- Screen-reader announcements for dynamic changes when relevant.
- Reduced motion support.
- Zoom/text-size resilience.

### Responsive behavior

- No horizontal overflow at narrow widths.
- Navigation and tables adapt structurally.
- Text wraps or truncates intentionally.
- Hover-only affordances have touch equivalents.
- Safe areas and keyboard overlays are considered on mobile.

### Copy

- Buttons name the outcome.
- Empty states explain value and next action.
- Errors explain what happened and how to recover.
- Terminology is consistent with the rest of the product.
- No generic model prose or marketing filler.

### Visual quality

- Alignment, spacing rhythm, type hierarchy, color roles, elevation, icon consistency.
- No hard global anti-patterns.
- Brand surfaces: distinct and memorable.
- Product surfaces: trustworthy, efficient, and calm.

## Report format

Keep reviews direct and actionable:

1. **Verdict**: ship / ship after fixes / not ready.
2. **Top issues**: 3-5 items max, ordered by impact.
3. **For each issue**: what, why it matters, concrete fix.
4. **What works**: 2-3 specific strengths worth preserving.
5. **Verification gaps**: states or devices not inspected.

Severity guide:

- **P0**: blocks task completion or creates serious accessibility failure.
- **P1**: major confusion, likely abandonment, WCAG AA issue, or broken responsive behavior.
- **P2**: noticeable friction or inconsistency with a workaround.
- **P3**: polish issue with low user impact.

Do not bury a critical issue under many polish notes. If everything is important, the review is not prioritized.
