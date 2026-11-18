# UI Polish

Polish is the final quality pass after the feature works. It aligns the UI to the design system, removes drift, fixes small interaction gaps, and makes the result feel intentional.

Do not polish an incomplete flow. If core states are missing or the interaction is wrong, fix those first.

## Polish workflow

1. Discover the design system (`discovery.md`).
2. Use the feature yourself in the primary path.
3. Inspect states: default, loading, empty, error, disabled, success, long content, narrow viewport.
4. Compare to nearby shipped surfaces.
5. Fix root causes, not just visible symptoms.
6. Re-check the rendered UI when possible.

## Alignment and spacing

- Elements align to a clear grid or deliberate optical alignment.
- Spacing uses the project's scale. Remove random one-off values.
- Related elements are close; unrelated sections have breathing room.
- Containers are not added just to make spacing feel safe.
- Cards are not nested. Use typography, spacing, dividers, or background tone.
- Icons are optically centered and sized consistently.
- Nested rounded shapes are concentric: outer radius = inner radius + the padding between them. Equal radii on parent and child make the inner shape look pinched.
- Icon stroke matches the adjacent text weight (roughly 1.5px beside regular text, 2px beside semibold). Keep one icon set per surface; outline is the default and fill marks only the active state.

## Typography

- Type roles match the system: heading, title, body, label, caption.
- Scale has clear hierarchy without unnecessary sizes.
- Labels and metadata are legible, not decorative gray dust.
- Numbers align when scanning matters.
- No orphaned one-word lines in key marketing copy when avoidable (`text-wrap: balance` on headings, `pretty` on body text).

## Color and elevation

- Colors come from semantic tokens when available.
- Accent color is rare enough to remain meaningful.
- Status colors have consistent meaning.
- Focus rings meet contrast and are visible against nearby surfaces.
- Shadows/elevation match the system. Do not add default drop shadows to make cards feel finished.
- Photos and artwork get a 1px outline at about 10% opacity so their edge holds against any surface: pure black in light mode, pure white in dark mode, never a tinted neutral that reads as dirt.
- Dark mode and high-contrast modes are checked when the project supports them.

## Interaction details

- Pointer hover and keyboard focus are both designed.
- Loading states prevent double-submit when needed.
- Disabled states explain themselves when the reason is not obvious.
- Async errors preserve user input and offer recovery.
- Motion: see `design-engineering`.

## Copy polish

- Cut repeated intro text below headings.
- Use specific button labels: `Save changes`, `Create song`, `Delete file`, not `Submit` or `OK`.
- Empty states say what to do next.
- Error text is helpful, not cute or accusatory.
- Terminology matches the rest of the product.

## Responsive polish

- Sticky footers/toolbars do not cover content.
- Tables, grids, and cards reflow intentionally.

## Anti-pattern pass

Before finishing, scan for the hard bans in `antipatterns.md`:

- colored side-border accents
- gradient text
- nested cards
- generic icon-tile card grids
- purple/cyan AI gradients
- decorative glassmorphism
- bounce/elastic easing
- gray text on colored backgrounds

## Done criteria

- Primary path works and feels consistent with the system.
- Critical states exist.
- No obvious AI-slop tells.
- Accessibility basics are intact.
- The UI has been visually inspected, or the final response states why that was not possible.
