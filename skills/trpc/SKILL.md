---
name: trpc
description: tRPC v11 patterns for type-safe API development. Use when working with tRPC routers, procedures, queries, mutations, or API calls.
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

## Server-Side Router Structure

Routers go in `apps/api/src/domains/{domain}/{domain}-router.ts`:

```typescript
import { z } from "zod/v4";
import { protectedProcedure, router } from "../../lib/trpc";
import { repository } from "./repository";

export const myRouter = router({
  // Query with input
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      return await repository.get(input.id, userId);
    }),

  // Query without input
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return await repository.list(ctx.user.id);
    }),

  // Mutation
  create: protectedProcedure
    .input(CreateSchema)
    .mutation(async ({ input, ctx }) => {
      return await repository.create({
        ...input,
        userId: ctx.user.id,
      });
    }),
});
```

## Procedure Types

- `publicProcedure` - No auth required
- `protectedProcedure` - Requires authenticated user, provides `ctx.user` and `ctx.session`
- `adminProcedure` - Requires admin role
- `storageProtectedProcedure` - Protected + checks storage quota

## Error Handling

```typescript
import { TRPCError } from "@trpc/server";

throw new TRPCError({
  code: "NOT_FOUND",
  message: "Resource not found",
});

// With custom error codes for client handling
throw new TRPCError({
  code: "FORBIDDEN",
  message: "Storage quota exceeded",
  cause: {
    code: "STORAGE_QUOTA_EXCEEDED",
    metadata: { usedBytes, quotaBytes },
  },
});
```

## Schema Patterns

Use drizzle-zod for database-derived schemas:

```typescript
import { createInsertSchema } from "drizzle-zod";
import { myTable } from "./schema";

const CreateSchema = createInsertSchema(myTable).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

const UpdateSchema = CreateSchema.partial();
```

## Router Registration

Add new routers to `apps/api/src/routers/index.ts`:

```typescript
import { myRouter } from "../domains/my-domain/my-router";

export const appRouter = router({
  // ... existing routers
  myDomain: myRouter,
});
```

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

## Common Mistakes to Avoid

1. **Don't use `.useQuery()` directly** - Use `useQuery({ ...trpc.x.queryOptions() })`
2. **Don't forget skipToken** - Use it for conditional queries instead of `enabled: false`
3. **Always access `ctx.user.id`** - Not `ctx.session.userId`
4. **Use zod/v4** - Import from `zod/v4`, not `zod`
5. **Never expose raw errors** - Always use `handleTRPCError` in catch blocks
