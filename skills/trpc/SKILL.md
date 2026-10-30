---
name: trpc
description: tRPC v11 client and server patterns, and React components that fetch data via tRPC/React Query. Use when working with tRPC procedures, queries, mutations, error handling, or component data fetching.
---

# tRPC v11 Patterns

## Client-Side Usage

Always use the hook pattern with TanStack Query integration:

```tsx
import { useTRPC } from "@/lib/trpc";
import { skipToken, useQuery, useMutation } from "@tanstack/react-query";

function MyComponent() {
  const trpc = useTRPC();

  // Queries - use queryOptions pattern
  const { data, isLoading } = useQuery({
    ...trpc.songs.get.queryOptions({ id: songId }),
  });

  // Mutations - use mutationOptions pattern
  const createSong = useMutation({
    ...trpc.songs.create.mutationOptions(),
  });

  // Call mutation
  createSong.mutate({ title: "New Song" });
}
```

## Conditional Queries with skipToken

Use `skipToken` from `@tanstack/react-query` to disable queries conditionally. This is the type-safe way to skip queries.

```tsx
import { skipToken, useQuery } from "@tanstack/react-query";

function InvoiceSheet() {
  const trpc = useTRPC();
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false });

  // Only load data when editing an existing invoice
  const shouldLoadData = params.invoiceId && search.action === "editInvoice";

  const {
    data: existingInvoice,
    isLoading: invoiceLoading,
    error: invoiceError,
    refetch: refetchInvoice,
  } = useQuery({
    ...trpc.invoices.getById.queryOptions(
      shouldLoadData ? { id: Number(params.invoiceId) } : skipToken,
    ),
  });

  // Handle loading and error states
  const isLoadingData = shouldLoadData && invoiceLoading;
  const hasLoadingError = shouldLoadData && invoiceError;
}
```

**Key points:**
- Import `skipToken` from `@tanstack/react-query`, not from tRPC
- Use ternary: `condition ? { input } : skipToken`
- Never use `enabled: false` - use skipToken for type safety

## Error Handling with handleTRPCError

**CRITICAL**: Never expose database or internal errors to clients. Use the `handleTRPCError` helper to sanitize errors.

```typescript
import { handleTRPCError } from "../../lib/trpc-error-handler";
import { loggers } from "../../lib/logger";

// In a procedure
create: protectedProcedure
  .input(CreateSchema)
  .mutation(async ({ input, ctx }) => {
    try {
      return await repository.create(input, ctx.user.id);
    } catch (error) {
      // Logs full error details, throws sanitized message to client
      handleTRPCError(
        error,
        loggers.myDomain,
        "Failed to create resource",  // User-friendly message
        { userId: ctx.user.id },       // Context for logging
        "INTERNAL_SERVER_ERROR",       // tRPC error code
      );
    }
  }),
```

The `handleTRPCError` function:
- Logs the full error details (including stack traces) for debugging
- Throws a sanitized `TRPCError` with a user-friendly message
- Preserves intentional `TRPCError`s (NOT_FOUND, BAD_REQUEST, etc.)
- Strips database-specific error messages (SQL, Drizzle, Postgres errors)

## Schemas

Derive input schemas from the DB table; see the drizzle skill.

## Components Fetch Their Own Data

- A component that needs data calls `useQuery` itself; the parent does not fetch and drill server data down.
- Props are IDs (`songId`), configuration (columns, `showActions`), callbacks (`onEdit`), and UI state only.
- Derive types from the API, never hand-write them:

```tsx
import type { RouterOutputs } from "@/lib/trpc";

type Song = RouterOutputs["songs"]["get"];
type SongListItem = RouterOutputs["songs"]["list"][number];
```

- Duplicate fetches across components are fine; TanStack Query dedupes and caches identical requests.

```tsx
function SongCard({ songId, showActions, onEdit }: { songId: number; showActions?: boolean; onEdit?: () => void }) {
  const trpc = useTRPC();
  const { data: song } = useQuery({ ...trpc.songs.get.queryOptions({ id: songId }) });
  // ...
}
```

## Common Mistakes to Avoid

1. **Don't use `.useQuery()` directly** - Use `useQuery({ ...trpc.x.queryOptions() })`
2. **Use skipToken for conditional queries** - not `enabled: false`
3. **Always access `ctx.user.id`** - Not `ctx.session.userId`
4. **Import Zod as the repo already does** (`zod` or `zod/v4`); don't mix
5. **Never expose raw errors** - Always use `handleTRPCError` in catch blocks
6. **Don't prop drill server data or hand-type API responses**
