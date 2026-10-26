# Mobile Web Hardening

For browser and PWA surfaces on phones/tablets—not iOS SwiftUI or React Native.
Use when mobile Safari/Chrome behavior, full-screen shells, sheets, keyboards, or touch interactions fail.
Pair with the existing product/brand surface guidance; a website need not imitate a native app.

## Contents

- [Start with the symptom](#start-with-the-symptom)
- [Viewport height and chrome](#viewport-height-and-browser-chrome)
- [Safe areas](#safe-areas-without-doubled-padding)
- [Inputs and keyboard](#inputs-and-the-software-keyboard)
- [Hover, press, activation](#hover-press-feedback-and-activation)
- [Gestures and scroll ownership](#gestures-and-scroll-ownership)
- [Browser chrome and theme](#browser-chrome-and-theme)
- [Proof on target](#proof-on-the-target)

## Start with the symptom

Inspect existing viewport metadata, layout ownership, shared controls, browser support, and PWA targets.
Prefer platform capabilities and CSS over user-agent sniffing or a generic “is mobile” hook.
Touch, mouse, keyboard, and stylus can coexist; viewport width does not identify input capability.
Audits remain read-only: propose changes and design choices before applying fixes unless implementation is authorized.
Do not add a universal native-feeling baseline, dependency, haptics, or permission request.
Preserve selection, links, zoom, and standard browser affordances unless a specific custom control needs a narrower change.

## Viewport height and browser chrome

- An app shell that must follow expanding/collapsing browser chrome can use `100dvh`.
- A stable marketing hero generally wants `min-height: 100svh`, avoiding resize while scrolling.
- Choose `height` versus `min-height` deliberately: growing content must remain reachable.
- Keep a legacy fallback only if the project's support matrix requires it.
- Test chrome expanded and collapsed, orientation changes, nested scroll areas, and bottom actions.
- Do not assume dynamic viewport units alone solve software-keyboard occlusion.

## Safe areas without doubled padding

Use `viewport-fit=cover` only for intended edge-to-edge layouts, with `width=device-width, initial-scale=1`.
Never add `user-scalable=no` or `maximum-scale=1`.
Apply `env(safe-area-inset-*, 0px)` at the surface that owns the edge: header, bottom bar, sheet, or toast.
Inspect ancestor padding first so nested components do not each add the same inset.
Choose the spacing intent explicitly:

```css
/* Add the inset to normal content spacing. */
.bottom-bar { padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px)); }
/* Or require at least the safe inset, without adding it twice. */
.edge-action { padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px)); }
```

Backgrounds may extend to the edge while interactive content stays clear of cutouts and the home indicator.
Verify landscape side insets and installed PWA mode where supported.

## Inputs and the software keyboard

- Keep mobile editable input text at least 16 CSS pixels to avoid Safari focus zoom; do not suppress user zoom instead.
- `1rem` is not necessarily 16px when the root size is customized; inspect computed styles.
- Use semantic `type` values (`email`, `tel`, `search`) and appropriate `autocomplete` tokens.
- Use `inputmode` (`inputMode` in JSX) for keyboard hints such as numeric codes or decimal amounts.
- Keyboard hints do not validate input; preserve locale-aware parsing and the actual field contract.
- Codes and account identifiers may need `autocapitalize="none"`; avoid disabling correction for ordinary prose.
- Use `enterkeyhint` where its action matches the form, without replacing semantic submit behavior.
- Check the focused field, error text, and submit action with the keyboard open; scrolling must reach all of them.

First use normal flow and the correct scroll container; avoid pinning everything to the screen.
If occlusion remains, investigate actual layout versus visual viewport behavior on supported browsers.
Use `VisualViewport` handling only when needed for a specific anchored control, accounting for resize, scroll, zoom, and listener cleanup.
`interactive-widget=resizes-content` may help supported browsers; it is not a cross-browser keyboard guarantee.
Do not infer keyboard height solely from a viewport-height difference, which may also reflect browser chrome or zoom.

## Hover, press feedback, and activation

Gate decorative hover effects by input capability, commonly `@media (hover: hover) and (pointer: fine)`.
Check what the framework's hover variant actually emits before adding redundant overrides.
Never hide an essential action behind hover without a visible touch and keyboard route.
Keep focus-visible styling independent of hover; provide press feedback through existing control states.
Do not add press scaling universally or remove tap highlights globally to look native.
If a custom control requires scoped highlight/selection changes, retain equivalent feedback and test accessibility.
Use semantic buttons/links and normal click/keyboard activation; pointer-down feedback must not commit an action before release/cancellation.

## Gestures and scroll ownership

Prefer native overflow scrolling and scroll snap for a carousel when they meet the interaction need.
For custom gestures, `touch-action` describes what the browser may still handle, not the axis your code handles.
A horizontally dragged custom surface may use `pan-y pinch-zoom` to retain page scrolling and pinch zoom.
A vertical drag handle may use `pan-x pinch-zoom`; scope it to the handle, not the entire sheet content.
Do not disable all touch actions on content people must scroll past or zoom.
Use `touch-action: manipulation` only for a justified control interaction; it changes double-tap behavior.
Check cancellation, diagonal gestures, keyboard alternatives, and hybrid input devices.

Contain scroll chaining only on the actual scrollable panel/sheet when background scrolling is the defect:

```css
.sheet-content {
  overflow-y: auto;
  overscroll-behavior-y: contain;
}
```

Do not blanket-disable overscroll on `html, body`, suppress ordinary document pull-to-refresh, or block every `touchmove`.
Selection and link/image long-press menus remain useful for copying, opening, and sharing; preserve them by default.

## Browser chrome and theme

Match `theme-color` to the actual top-level surface, using supported per-scheme metadata where appropriate.
If theme selection is app-controlled, synchronize metadata with that selection rather than only the OS preference.
Declare `color-scheme` only for schemes the page actually supports; inspect native form controls too.
For installed PWAs, check existing manifest theme/background colors and platform status-bar configuration before changing them.
Browser support and presentation differ; metadata is a hint, not proof of a particular status-bar result.

## Proof on the target

Desktop responsive emulation is useful for width/overflow checks, not proof of real touch, keyboard, chrome, or safe-area behavior.
Use authorized device access and remote inspection; do not expose a dev server publicly as an incidental test step.
Test supported mobile Safari and Chrome on physical devices, including an older supported phone when available.
Exercise keyboard open/closed, chrome expanded/collapsed, portrait/landscape, text enlargement, and pinch zoom.
Test installed mode separately if PWA is a target; preserve back navigation, selection, link menus, and ordinary document scrolling.
Report device/browser/mode, symptom, scoped change or recommendation, observed result, and remaining gaps.
If hardware is unavailable, label code review and emulation as such and state exactly what still needs device confirmation.

## Attribution

Adapted selectively from Emil Kowalski's [mobile-native guidance](https://github.com/emilkowalski/skills/blob/2d228630ba1446365f614a108cb8252f1feda202/skills/mobile-native/SKILL.md).
See the upstream [license](../LICENSE-emil-kowalski.txt).
