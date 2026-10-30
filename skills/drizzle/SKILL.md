---
name: drizzle
description: Drizzle ORM patterns for PostgreSQL. Use when defining schemas, writing queries, or deriving types from database tables.
---

# Drizzle ORM Patterns

## Version

Follow the installed Drizzle version. `relations()` is the v0 API; Drizzle 1.0 uses `defineRelations`. In Drizzle 1.0 drizzle-zod may live at `drizzle-orm/zod`; use whichever the repo has installed.

## Derive Types from Schema

**CRITICAL**: Never hand-write types that duplicate the database schema; they drift.

```typescript
import { createInsertSchema } from "drizzle-zod";

const CreateSongSchema = createInsertSchema(song).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});
const UpdateSongSchema = CreateSongSchema.partial();

type Song = typeof song.$inferSelect;
type NewSong = typeof song.$inferInsert;
```

Routers reuse these schemas rather than redefining them.

## Schema Organization

Schemas live in `apps/api/src/domains/{domain}/{domain}-schema.ts` and are re-exported from `apps/api/src/db/schema.ts`. Keep that registry updated.

## Schema Definition

```typescript
import { pgTable, integer, text, timestamp } from "drizzle-orm/pg-core";

export const song = pgTable("song", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id").notNull(),
  songTitle: text("song_title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
```

Prefer identity columns over `serial`, and `withTimezone: true` on timestamps.

## Common Mistakes to Avoid

1. **Never hand-write types** - use `$inferSelect`, `$inferInsert`, or drizzle-zod
2. **Always include userId in queries** - multi-tenant data isolation
3. **Use transactions for related writes** - `db.transaction(async (tx) => { ... })`
