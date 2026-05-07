---
name: component-patterns
description: React component patterns for data fetching and state management. Use when building components that need data, to avoid prop drilling and ensure type safety.
---

# Component Patterns

## Components Should Fetch Their Own Data

**CRITICAL**: When a component needs data, fetch it internally with `useQuery`. This:
- Provides full type information from tRPC
- Eliminates prop drilling
- Reduces type maintenance burden
- Enables component reusability

### Bad - Prop Drilling

```tsx
// Parent fetches everything and drills props down
function ParentPage() {
  const { data: songs } = useQuery(trpc.songs.list.queryOptions({}));
  const { data: contacts } = useQuery(trpc.contacts.list.queryOptions({}));
  const { data: projects } = useQuery(trpc.projects.list.queryOptions({}));

  return (
    <SongsList
      songs={songs}
      contacts={contacts}
      projects={projects}
    />
  );
}

// Child receives props (loses type inference, requires maintaining prop types)
function SongsList({ songs, contacts, projects }: {
  songs: Song[];  // Manual type - can drift from API
  contacts: Contact[];
  projects: Project[];
}) {
  // ...
}
```

### Good - Internal Data Fetching

```tsx
// Parent just renders the component
function ParentPage() {
  return <SongsList />;
}

// Component fetches its own data
function SongsList() {
  const trpc = useTRPC();

  // Full type inference from tRPC
  const { data: songs = [] } = useQuery({
    ...trpc.songs.list.queryOptions({}),
  });

  // Fetch related data as needed
  const { data: contacts = [] } = useQuery({
    ...trpc.contacts.list.queryOptions({}),
  });

  // Types are automatically inferred
  return (
    <Table>
      {songs.map((song) => (
        <TableRow key={song.id}>
          <TableCell>{song.title}</TableCell>
          {/* Full type safety */}
        </TableRow>
      ))}
    </Table>
  );
}
```

## When Props Are Appropriate

Props are still appropriate for:
1. **Configuration** - How to display data (columns to show, sort order)
2. **Callbacks** - Actions to take (onSelect, onDelete)
3. **IDs** - What specific item to fetch (songId, projectId)
4. **UI State** - isOpen, isEditing, etc.

```tsx
// Good use of props - configuration and callbacks
function SongCard({
  songId,          // ID to fetch
  showActions,     // Configuration
  onEdit,          // Callback
}: {
  songId: number;
  showActions?: boolean;
  onEdit?: () => void;
}) {
  const trpc = useTRPC();

  // Fetch data internally
  const { data: song } = useQuery({
    ...trpc.songs.get.queryOptions({ id: songId }),
  });

  return (
    <Card>
      <CardTitle>{song?.title}</CardTitle>
      {showActions && (
        <Button onClick={onEdit}>Edit</Button>
      )}
    </Card>
  );
}
```

## Co-locate Data Requirements

Each component should declare what data it needs. This makes components:
- Self-contained and reusable
- Easy to understand (data deps are visible)
- Type-safe without manual type maintenance

## Derived Types from API

Use `RouterOutputs` to derive types from your API:

```tsx
import type { RouterOutputs } from "@/lib/trpc";

// Type is automatically correct
type Song = RouterOutputs["songs"]["get"];
type SongListItem = RouterOutputs["songs"]["list"][number];
```

## Query Caching Benefits

When components fetch their own data:
- TanStack Query deduplicates identical requests
- Data is cached and shared across components
- Stale-while-revalidate provides instant UI

```tsx
// Both components fetch the same data
// Only ONE network request is made
function SongHeader() {
  const { data } = useQuery(trpc.songs.get.queryOptions({ id: songId }));
  return <h1>{data?.title}</h1>;
}

function SongDetails() {
  const { data } = useQuery(trpc.songs.get.queryOptions({ id: songId }));
  return <p>{data?.notes}</p>;
}
```

## Common Mistakes to Avoid

1. **Don't prop drill data** - Fetch in the component that needs it
2. **Don't manually type API responses** - Derive from `RouterOutputs`
3. **Don't worry about duplicate fetches** - Query caching handles this
4. **Do pass IDs as props** - Let components fetch their own data
5. **Do use props for configuration** - How to render, not what to render
