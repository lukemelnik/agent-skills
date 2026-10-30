---
name: ui-design
description: >-
  Platform-neutral UI/UX design for product and marketing surfaces. Use when
  designing, reviewing, polishing, or hardening visible interfaces: layout,
  hierarchy, typography, color, states, accessibility, responsive behavior, UX
  copy, design-system discovery, and AI-slop anti-patterns. Not for API,
  database, or backend design.
---

# UI Design

Use this skill for what humans see and touch. It is platform-neutral: pair it with framework- or project-specific skills for implementation details.

## First move: discover the existing system

Before changing UI, read `references/discovery.md` and inspect the project. Code is canonical. Design docs are useful only when they match the current tokens/components.

Never create or maintain a separate design-system document unless the user explicitly asks. Work from existing source files, project instructions, components, tokens, platform conventions, and rendered behavior.

## Surface mode

Classify the surface before making taste decisions:

- **Product UI**: app shells, dashboards, settings, forms, tables, tools, authenticated workflows. Design serves the task. Load `references/product-ui.md`.
- **Brand UI**: landing pages, marketing sites, launch pages, portfolios, editorial/content pages, campaign surfaces. Design creates the impression. Load `references/brand-ui.md`.

If a product has a marketing homepage and an authenticated app, classify the specific surface you are editing, not the whole repo.

## Route by task

Load only the references that match the work:

- Building or redesigning product surfaces: `discovery.md` + `product-ui.md` + relevant platform skill.
- Building or redesigning marketing/brand surfaces: `discovery.md` + `brand-ui.md` + relevant platform skill.
- Reviewing/auditing UI: `discovery.md` + `review.md` + `antipatterns.md`.
- Final polish: `discovery.md` + `polish.md` + `antipatterns.md`.
- Production hardening: `discovery.md` + `hardening.md`.
- Breaking UI, worst-case data, schema-limit content, or adversarial layout testing: [stress-testing.md](references/stress-testing.md).
- Mobile web/PWA viewport, safe-area, keyboard, touch, or browser-chrome bugs (not native apps): [mobile-web.md](references/mobile-web.md).
- Copy, labels, errors, empty states, or language cleanup: `copy.md`.
- AI-looking design or recurring model tells: `antipatterns.md` and, for language, `copy.md`.

Adjacent skills:

- `design-engineering`: web animation and interaction implementation details.
- `ios`, `macos`, `liquid-glass`: platform-specific UI and native conventions.
- `shadcn`: shadcn/ui component usage.

## Core rules

- Source-truth first: existing tokens, shared components, platform HIGs, and project instructions beat generic taste.
- Do not invent a new visual system when extending an existing product. Reuse or extend the system deliberately.
- Product UI rewards trust, consistency, state coverage, and speed. Brand UI rewards specificity, art direction, and memorable choices.
- Avoid global AI-slop patterns unless a project explicitly and convincingly overrides the rule.
- Verify visible changes in the target UI when tooling and project policy allow it. A passing build is not visual proof.

## Response posture

Be a design lead, not a gallery critic. Name the issue, explain why it matters to the user, and give the concrete fix. For implementation tasks, make the change; for review tasks, prioritize the few issues that matter most.
