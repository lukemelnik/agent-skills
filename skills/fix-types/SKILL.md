---
name: fix-types
description: Fix TypeScript type errors without using 'any' or unsafe casts
disable-model-invocation: true
---

# Fix Type Errors

Fix TypeScript type errors following strict type safety rules.

## Rules - NEVER VIOLATE

1. **NEVER use `any`** - Find the actual type
2. **NEVER use type assertions (`as`)** to silence errors - Fix the underlying issue
3. **NEVER use `@ts-ignore` or `@ts-expect-error`**
4. **NEVER use `!` non-null assertion** unless you've verified the value exists

## Step 1: Get Errors

If no errors provided, run:
```bash
pnpm check --max-diagnostics=10 --diagnostic-level=error
```

Errors to fix:
$ARGUMENTS

## Step 2: Analyze Each Error

For each error, determine the root cause:

### Common Causes & Solutions

**"Type 'X' is not assignable to type 'Y'"**
- Check if you're using the wrong type
- Derive type from source (Drizzle schema, tRPC RouterOutputs)
- Add proper type narrowing with conditionals

**"Property 'X' does not exist on type 'Y'"**
- Check if the property name is correct
- Check if you need to narrow the type first
- Check if the type definition is incomplete

**"Object is possibly 'undefined' or 'null'"**
- Add null checks before accessing
- Use optional chaining `?.`
- Provide default values with `??`

**"Argument of type 'X' is not assignable to parameter of type 'Y'"**
- Check function signature
- Transform data to match expected shape
- Derive input type from function definition

## Step 3: Fix Using Proper Types

### Derive types from source - DON'T hand-write

```typescript
// From Drizzle
type Song = typeof song.$inferSelect;
type NewSong = typeof song.$inferInsert;

// From Zod
type FormValues = z.infer<typeof FormSchema>;

// From tRPC
type SongData = RouterOutputs["songs"]["get"];
```

### Narrow types properly

```typescript
// Instead of: (data as Song).title
// Do:
if (data && "title" in data) {
  console.log(data.title);
}

// Or use type guards
function isSong(data: unknown): data is Song {
  return data !== null && typeof data === "object" && "title" in data;
}
```

## Step 4: Verify

After fixing, run:
```bash
pnpm check
```

Ensure no new errors were introduced.

## Step 5: If Stuck

If you cannot fix an error without violating the rules:
1. Explain the type issue clearly
2. Show what the ideal fix would look like
3. Explain why it's not possible with current types
4. Suggest changes to source types/schemas that would enable a proper fix

**Do NOT apply a workaround. Surface the issue instead.**
