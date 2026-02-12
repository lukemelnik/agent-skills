---
name: tanstack-router
description: TanStack Router patterns for type-safe navigation. Use when working with routes, links, navigation, search params, or URL state.
---

# TanStack Router Patterns

## Basic Navigation

```tsx
import { Link, useNavigate, useSearch, useParams } from "@tanstack/react-router";

function MyComponent() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }); // Get search params
  const params = useParams({ strict: false }); // Get route params

  return (
    <>
      {/* Link component for declarative navigation */}
      <Link to="/songs/$songId" params={{ songId: 123 }}>
        View Song
      </Link>

      {/* Navigate function for imperative navigation */}
      <button onClick={() => navigate({ to: "/songs" })}>
        Go to Songs
      </button>
    </>
  );
}
```

## Search Params for Modal/Sheet State

Use search params to control modal visibility - this enables deep linking and back button support:

```tsx
// Open a sheet by adding search param
<Link to="." search={{ action: "createSong" }}>
  Create Song
</Link>

// Check search params to control sheet visibility
const search = useSearch({ strict: false });
const isOpen = search.action === "createSong" || search.action === "editSong";

// Close by removing the search param
const handleClose = () => {
  navigate({
    to: ".",
    search: (prev) => ({
      ...prev,
      action: undefined,
      songId: undefined,
    }),
  });
};
```

## linkOptions for Reusable Navigation

Use `linkOptions` to create type-safe, reusable navigation options:

```tsx
import { linkOptions, Link, useNavigate } from "@tanstack/react-router";

// Define reusable link options
const dashboardLinkOptions = linkOptions({
  to: "/dashboard",
  search: { tab: "overview" },
});

// Use in Link
<Link {...dashboardLinkOptions}>Dashboard</Link>

// Use in navigate
const navigate = useNavigate();
navigate(dashboardLinkOptions);

// Use in redirect (in route loaders)
throw redirect(dashboardLinkOptions);
```

## Array of linkOptions for Navigation Menus

When generating navigation programmatically:

```tsx
const navItems = linkOptions([
  {
    to: "/dashboard",
    label: "Dashboard",
    activeOptions: { exact: true },
  },
  {
    to: "/songs",
    label: "Songs",
  },
  {
    to: "/projects",
    label: "Projects",
  },
]);

function Navigation() {
  return (
    <nav>
      {navItems.map((item) => (
        <Link
          {...item}
          key={item.to}
          activeProps={{ className: "font-bold" }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
```

## Dynamic Link Generation

For programmatically generated links (like command palette results):

```tsx
import { linkOptions } from "@tanstack/react-router";

// Generate link options from data
const songLinks = songs.map((song) => ({
  label: song.title,
  getLinkOptions: () =>
    linkOptions({
      to: "/songs/$songId",
      params: { songId: song.id },
    }),
}));

// Use in component
function CommandItem({ item }) {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate(item.getLinkOptions())}>
      {item.label}
    </button>
  );
}
```

## useSearch and useParams

```tsx
// Strict mode - requires exact route match
const search = useSearch({ from: "/(authed)/songs" });
const params = useParams({ from: "/(authed)/songs/$songId" });

// Non-strict mode - works across routes
const search = useSearch({ strict: false });
const params = useParams({ strict: false });
```

## Preserving Search Params During Navigation

```tsx
// Keep existing search params, add/modify specific ones
navigate({
  to: ".",
  search: (prev) => ({
    ...prev,
    action: "editSong",
    songId: 123,
  }),
});

// Remove specific search params
navigate({
  to: ".",
  search: (prev) => ({
    ...prev,
    action: undefined,
    songId: undefined,
  }),
});
```

## Route Context

Access route context (like user settings) from parent routes:

```tsx
import { useRouteContext } from "@tanstack/react-router";

function MyComponent() {
  const { userSettings } = useRouteContext({ from: "/(authed)" });

  return <div>Currency: {userSettings.currency}</div>;
}
```

## Common Mistakes to Avoid

1. **Don't use string concatenation for URLs** - Use `to` and `params` for type safety
2. **Don't forget `strict: false`** - When accessing params/search across routes
3. **Use `linkOptions` for reusable links** - Ensures type safety at definition time
4. **Preserve search params with spread** - `search: (prev) => ({ ...prev, newParam })`
5. **Use search params for modals** - Enables deep linking and browser history
