# Design-System Discovery

Discover the design system from the repo. Do not require a separate `DESIGN.md` or similar artifact. If one exists, treat it as guidance and verify it against current source.

## Source order

Use this order when sources disagree:

1. Project instructions and platform requirements (`AGENTS.md`, `CLAUDE.md`, README, HIG docs, accessibility requirements).
2. Canonical tokens and theme code: Tailwind config, CSS variables, theme files, design-token JSON, asset catalogs.
3. Shared components and component APIs.
4. Comparable screens already shipped in the app/site.
5. Rendered computed styles and browser/simulator inspection.
6. Design docs or screenshots, if still current.

If docs and code disagree, trust code for implementation and report the drift. Do not silently update docs unless asked.

## What to inspect

Search for:

- Theme files: `tailwind.config.*`, `theme.*`, `tokens.*`, `design-tokens.*`, `globals.css`, `app.css`, asset catalogs.
- CSS custom properties: `--color-*`, `--font-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--duration-*`, `--ease-*`.
- Component library: `components/ui`, `src/components`, `app/components`, `Button`, `Card`, `Input`, `Dialog`, `Sheet`, `Table`, `Toast`, navigation.
- Typography: font imports, font stacks, heading/body/label styles, type scale, line-height, max-widths.
- Color semantics: background, foreground, muted, border, primary, destructive, success, warning, selection, focus.
- Shape and elevation: radii, borders, shadows, material/blur usage, surface hierarchy.
- Spacing/layout: grid, container widths, section rhythm, density, breakpoints/container queries.
- Motion: duration/easing tokens, enter/exit patterns, reduced-motion handling.
- Icon/image system: icon set, image component, asset treatment, alt text patterns.
- Copy voice: button labels, empty states, errors, onboarding, capitalization, terminology.

## Discovery workflow

1. Read project instructions first.
2. Find tokens/theme files and shared components.
3. Inspect one or two comparable shipped surfaces before designing a new one.
4. Identify the surface mode: product UI or brand UI.
5. Write a short working note for yourself: palette roles, typography, spacing/radius/elevation, component vocabulary, motion, copy tone, and hard project rules.
6. Implement with existing tokens/components by default. Add new tokens/components only when the system has a real gap.

## When adding new UI

- Start from the nearest existing pattern, not a blank aesthetic.
- Use semantic tokens, not raw visual values, when the project has them.
- Prefer shared components over one-off markup.
- If the project lacks a component for a repeated pattern, extract only when the pattern appears or is clearly about to appear multiple times with the same intent.
- Ask before introducing a new dependency, icon set, font family, or design-system architecture.

## Drift handling

Report drift by root cause:

- **Missing token**: a value belongs in the design system but only exists inline.
- **One-off implementation**: a shared component exists but was bypassed.
- **Conceptual mismatch**: the flow or hierarchy does not match neighboring features.
- **Stale documentation**: docs describe a system the code no longer uses.

Fix the root cause when in scope. Otherwise, name it clearly in the final response.
