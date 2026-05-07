---
name: drizzle
description: Drizzle ORM patterns for PostgreSQL. Use when working with database schemas, queries, migrations, or data access.
---

# Drizzle ORM Patterns

## Derive Types from Schema

**CRITICAL**: Always derive TypeScript types from your Drizzle schema. Never hand-write duplicate types - they will drift from the actual database schema.

```typescript
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { song } from "./songs-schema";

// Derive Zod schemas from Drizzle table
const CreateSongSchema = createInsertSchema(song).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

const UpdateSongSchema = CreateSongSchema.partial();

// Derive TypeScript types from Zod schemas
type CreateSong = z.infer<typeof CreateSongSchema>;
type UpdateSong = z.infer<typeof UpdateSongSchema>;

// Or derive directly from Drizzle table
type Song = typeof song.$inferSelect;
type NewSong = typeof song.$inferInsert;
```

## Schema Organization

Schemas live in domain folders: `apps/api/src/domains/{domain}/{domain}-schema.ts`

All schemas are re-exported from `apps/api/src/db/schema.ts`:

```typescript
// apps/api/src/db/schema.ts
export * from "../domains/songs/songs-schema";
export * from "../domains/contacts/contacts-schema";
// ... other domains
```

## Schema Definition Pattern

```typescript
import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const song = pgTable("song", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  songTitle: text("song_title").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const songRelations = relations(song, ({ many, one }) => ({
  recordingVersions: many(recordingVersion),
  project: one(project, {
    fields: [song.projectId],
    references: [project.id],
  }),
}));
```

## Enum Handling

Define enums in schema and derive values:

```typescript
import { pgEnum } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["draft", "active", "archived"]);

// Use in table
export const song = pgTable("song", {
  status: statusEnum("status").default("draft").notNull(),
});

// Get enum values for validation
const ALLOWED_STATUSES = statusEnum.enumValues; // ["draft", "active", "archived"]
```

## Repository Pattern

Repositories handle all database operations:

```typescript
// apps/api/src/domains/songs/songs-repository.ts
import { db } from "../../db";
import { song } from "./songs-schema";
import { eq, and } from "drizzle-orm";

export const songsRepository = {
  async getSong(id: number, userId: string) {
    return db.query.song.findFirst({
      where: and(eq(song.id, id), eq(song.userId, userId)),
    });
  },

  async createSong(data: NewSong) {
    const [created] = await db.insert(song).values(data).returning();
    return created;
  },

  async updateSong(id: number, userId: string, data: Partial<NewSong>) {
    const [updated] = await db
      .update(song)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(song.id, id), eq(song.userId, userId)))
      .returning();
    return updated;
  },
};
```

## Zod Schema Extensions

Extend derived schemas with custom validations:

```typescript
const CreateSongSchema = createInsertSchema(song)
  .omit({ id: true, userId: true, createdAt: true, updatedAt: true })
  .extend({
    // Add custom fields not in database
    projectId: z.number().optional().nullable(),
    artistId: z.number().optional().nullable(),
  });

// Refine with custom validation
const ShareholderSchema = z.object({
  writerShare: z.number().min(0).max(100),
  publishingShare: z.number().min(0).max(100),
}).refine(
  (data) => data.writerShare + data.publishingShare === 100,
  { message: "Shares must total 100%" }
);
```

## Common Mistakes to Avoid

1. **Never hand-write types** - Always derive from Drizzle schema with `$inferSelect`, `$inferInsert`, or drizzle-zod
2. **Always include userId in queries** - For multi-tenant data isolation
3. **Update `updatedAt` manually** - Drizzle doesn't auto-update timestamps
4. **Use transactions for related operations** - `db.transaction(async (tx) => { ... })`
5. **Re-export schemas from db/schema.ts** - Keep central schema registry updated
