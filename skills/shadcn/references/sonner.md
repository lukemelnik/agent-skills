# Sonner: Optional Toast Reference

Load this only when the project actually uses Sonner or the user requests it. A generic notification task is not permission to introduce Sonner or replace the project's existing toast system. Check installed versions and the existing shadcn wrapper first: a component named `Toast` or `Toaster` does not prove it uses Sonner.

Adapted from Emil Kowalski's [author-written Sonner guide](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202/skills/ask-sonner). See [the upstream MIT notice](../LICENSE-emil-kowalski.txt). Use the installed types and [Sonner documentation](https://sonner.emilkowal.ski/) for exact props, defaults, and version-specific behavior.

## Mount and call through the existing integration

- Reuse the project's existing styled `Toaster`; mount it once at a persistent app/root boundary, not per page or conditionally.
- Call `toast()` from client event handlers or callbacks. In server-action flows, return a result and notify from the receiving client code; do not attempt a server-side toast.
- Prefer the project's toast abstraction/import path. Do not add a second raw Sonner integration alongside its shadcn wrapper.
- Multiple toasters are an intentional exception: verify the installed version supports IDs, give each an ID, and target calls with `toasterId`. Untargeted calls may appear in every toaster.

## Choose the notification lifecycle

- Use plain, success, error, info, or warning calls for a completed event.
- Use `toast.promise()` when one promise owns loading → success/error. Ensure the promise actually settles and provide useful failure copy.
- Use a loading toast and update its stable ID when the operation has multiple stages or owns its own state.
- Use `duration: Infinity` only when a persistent notice is justified and the user has an accessible dismissal or resolution path.
- Distinguish explicit dismissal (`onDismiss`) from timeout (`onAutoClose`) when these callbacks exist in the installed version. Do not assume one callback covers every close path.

```tsx
// Use the project's wrapper instead if it provides this API.
import { toast } from "sonner";

async function uploadFile(file: File) {
  const id = toast.loading("Uploading file…");
  try {
    await upload(file);
    toast.success("File uploaded", { id });
  } catch {
    toast.error("Couldn't upload the file. Try again.", { id });
  }
}
```

Updating the same ID avoids stacking separate loading and completion notices. Use a stable operation ID to deduplicate repeated calls where necessary; do not conceal genuinely separate operations behind one global ID.

## Styling and theme

1. Keep the existing shadcn styling and semantic tokens.
2. Use supported Sonner options for small changes; inspect the cascade before adding overrides.
3. For substantial custom markup, consider headless `toast.custom()` behind the project's notification abstraction. It retains Sonner's positioning/stacking behavior while giving the project control over the content.

Do not blindly mark every class `!important`, introduce raw light/dark colors, or bypass the wrapper to solve a styling conflict. Check whether stylesheet order, an unstyled option, or a headless renderer is the appropriate boundary.

Wire the toaster to the application's resolved theme (or supported system-theme option); do not assume it automatically tracks OS or app changes. Verify safe-area spacing and mobile offsets against the installed API and existing layout.

## Troubleshooting

- **Missing toast:** confirm the root toaster remains mounted and the call runs on the client. Check intentional toaster targeting.
- **Duplicate toast:** look for duplicate mounts and effect-driven calls replayed by React StrictMode. Prefer the event handler that owns the action; use stable IDs when repeated delivery should update one notification.
- **Loading never finishes:** confirm the promise settles and every managed loading path updates or dismisses the notice, including failures.
- **Styles disappear:** inspect whether the injected stylesheet was lost during navigation or whether content lives in Shadow DOM. Use the installed version's documented stylesheet/portal integration rather than copying arbitrary global styles.
- **Behind or clipped by an overlay:** inspect stacking contexts, overflow, portals, and native top-layer dialogs. Raising `z-index` alone cannot escape an ancestor clip or the browser's top layer. Verify notification visibility with the actual modal open.
- **Wrong theme:** inspect the resolved theme passed to the existing toaster.
- **Swipe or offset mismatch:** inspect the configured position, supported swipe directions, safe-area handling, and mobile offset options.

## Verify the user flow

Trigger success and failure through the real action. Check loading completion, deduplication, theme changes, navigation persistence, modal interactions, and small-screen placement where applicable. Preserve Sonner's accessibility and reduced-motion handling when customizing its renderer.

Do not move focus to routine notices. Keep critical validation/recovery information inline or persistently discoverable; a disappearing toast must not be the only place the user can learn why their action failed. Keep errors useful without exposing server internals or sensitive data.
