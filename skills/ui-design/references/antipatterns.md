# UI Anti-Patterns

This registry captures recurring AI-looking UI and copy patterns. Add to it over time. Treat the lists as design review tools, not a substitute for project context.

## Policy levels

- **Hard global ban**: avoid unless the user explicitly requests it and the project has a clear reason.
- **Contextual warning**: often bad, sometimes valid. Judge by surface mode and project system.
- **Project rule**: project-specific instructions override generic taste when they are deliberate and accessible.

## Hard global bans

### Colored side-border accents

Do not use thick colored `border-left` or `border-right` accents on cards, list items, callouts, or alerts. This is one of the most recognizable generated-UI tells.

Use a full border, background tint, icon, status badge, spacing, or typography instead.

### Gradient text

Do not use gradient-filled text for headings, metrics, or emphasis. It is usually decorative rather than meaningful and often harms contrast.

Use scale, weight, spacing, or a single semantic color.

### Nested cards

Do not put card surfaces inside card surfaces unless there is a real containment relationship that users need to understand. Nested cards create depth noise.

Flatten with spacing, section headings, dividers, or background tone.

### Gray text on colored backgrounds

Gray text usually looks dead and often fails contrast on colored surfaces. Use a darker/lighter shade related to the background, or a semantic foreground token designed for that surface.

### Decorative glassmorphism

Blurred translucent panels are not a default visual system. Use glass only when the platform/system calls for it or the effect has a real spatial reason.

### Purple/cyan AI gradients

Avoid default purple-to-blue, violet-to-cyan, or neon-on-black gradients unless the actual brand owns that palette. These palettes are saturated model defaults.

### Bounce and elastic easing

Avoid bounce/elastic/wobble easing for serious UI. Use short, smooth easing; reserve spring physics for interactions where physical response matters.

### Generic icon-tile card grids

Avoid repeated cards with a rounded-square icon tile above a heading and paragraph. This pattern reads as generated filler.

Use varied structure, inline icons, stronger content hierarchy, or a different component pattern.

### Hero metric template

Avoid the generic SaaS hero pattern: large headline, gradient accent, supporting metric cards, and three stats as credibility filler. Use real proof, real screenshots, customer evidence, or a more specific narrative.

### Modal as first thought

Do not default to modals for every create/edit/detail flow. Check inline edit, route, drawer/sheet, popover, progressive disclosure, or undo first.

## Contextual warnings

These can be correct in some contexts, especially product UI. Do not ban them blindly.

### Single font family

Often good for product UI. Often bland for brand UI unless the chosen family has enough range and the hierarchy is deliberate.

### System fonts / Inter-like sans

Good for native-feeling tools and dense app UI. Weak for brand surfaces if used without distinctive layout, imagery, or voice.

### Centered hero stacks

Can work for simple announcements. Be suspicious when the entire page is centered stacks and repeated cards.

### Identical card grids

Useful for comparable items. Weak for explaining a brand or story. Vary hierarchy when the content is not actually equal.

### Pure black/white

Can be deliberate in some brands and native systems. For large surfaces, near-black/near-white or semantic tokens often feel more refined and reduce contrast harshness.

### Heavy shadows

Can work for tactile or playful brands. In product UI, heavy shadows often create noise and dated depth.

### Decorative backgrounds

Textures, meshes, particles, and patterns can carry brand identity. They become slop when unrelated to content or copied across projects.

## Visual review questions

- Could this UI belong to any AI SaaS after swapping the logo?
- Is there a real design-system reason for this font, color, radius, shadow, or motion?
- Are cards doing necessary containment, or hiding weak hierarchy?
- Is color carrying meaning, or decoration?
- Would the UI still work with long content, no data, and keyboard navigation?
- Does the surface mode justify the amount of novelty?

## Adding new anti-patterns

When adding to this file, include:

- Pattern name.
- Why it fails.
- When it might be valid, if ever.
- What to use instead.

Avoid adding personal pet peeves. Add patterns that repeatedly hurt clarity, accessibility, trust, or distinctiveness.
