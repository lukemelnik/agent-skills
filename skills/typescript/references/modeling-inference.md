# Modeling and inference

## Derive rather than duplicate

Prefer a single source of truth:

```ts
const statuses = ["draft", "sent", "paid"] as const;
type InvoiceStatus = (typeof statuses)[number];

const labels = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
} satisfies Record<InvoiceStatus, string>;
```

Use this pattern for local constants, config, route names, event names, action maps, schema outputs, generated clients, and library result types. Do not duplicate a union that can be derived from the runtime value or authoritative type source.

## `as const` vs `satisfies`

- `as const` changes inference: literals are preserved, object properties become readonly, arrays become readonly tuples.
- `satisfies` checks assignability while retaining the value's inferred type.
- Use both when you need literal/readonly inference and shape checking.

```ts
const routes = {
  home: "/",
  settings: "/settings",
} as const satisfies Record<string, `/${string}`>;

type RouteName = keyof typeof routes;
type RoutePath = (typeof routes)[RouteName];
```

Avoid broad annotations that erase useful inference:

```ts
// Loses literal keys and values.
const routesBad: Record<string, string> = { home: "/" };
```

## Indexed access and arrays

Use indexed access to extract related types:

```ts
type User = Awaited<ReturnType<typeof fetchUsers>>[number];
type UserId = User["id"];
```

When `noUncheckedIndexedAccess` is enabled, array lookup returns `T | undefined`. Narrow before use:

```ts
const first = users[0];
if (!first) return;
return first.id;
```

If the invariant is non-empty, model it explicitly:

```ts
type NonEmptyArray<T> = [T, ...T[]];
function head<T>(items: NonEmptyArray<T>): T {
  return items[0];
}
```

## Generics that preserve inference

A generic should connect input types to other inputs or outputs. If a type parameter does not appear in a value position or an inferable context, TypeScript cannot infer it usefully.

```ts
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

Prefer constraints that describe the operation:

```ts
function withId<T extends { id: string }>(value: T) {
  return { ...value, cacheKey: `item:${value.id}` };
}
```

Use `const` type parameters when a helper should preserve literal object/tuple shapes from inline arguments without forcing callers to write `as const` everywhere:

```ts
function defineEvents<const T extends Record<string, { payload: unknown }>>(events: T) {
  return events;
}

const events = defineEvents({
  uploaded: { payload: { id: "example" } },
});
type EventName = keyof typeof events;
```

Do not use `const` type parameters to preserve huge incidental literals that make public types noisy.

## Generic defaults and inference control

Use a generic default when callers genuinely have a sensible fallback type:

```ts
type Result<TData, TError = Error> =
  | { ok: true; data: TData }
  | { ok: false; error: TError };
```

Do not use broad defaults such as `any` to conceal a type parameter that cannot be inferred. Reconsider whether the generic is connected to a value or should be explicit.

When the project's TypeScript version supports the built-in `NoInfer`, use it to prevent a secondary argument from widening or driving an inference that should come from the primary input:

```ts
declare function choose<C extends string>(
  choices: readonly C[],
  fallback: NoInfer<C>,
): C;

const colors = ["red", "blue"] as const;
choose(colors, "red");
```

Use `NoInfer` narrowly; it changes where inference comes from, not whether values must be assignable.

## Callbacks and variance

Callback parameters are values the caller may supply. A callback that accepts a narrower type than the API can pass is unsafe, even if a method-shaped or library type happens to be checked bivariantly. Do not rely on assignment acceptance as proof that invocation is safe.

Place generics where TypeScript can infer them from concrete producer inputs or return relationships. If a consuming callback or fallback should not influence an already established type, restructure the API or use `NoInfer` rather than casting inside the callback.

## Builder and fluent APIs

Use type accumulation only when each step needs to expose a real invariant to later steps or callers. Keep runtime state honest and keep casts at audited boundaries.

```ts
class Builder<T extends object = {}> {
  private values: Record<string, unknown> = {};

  set<const K extends string, V>(key: K, value: V): Builder<T & Record<K, V>> {
    this.values[key] = value;
    return this as unknown as Builder<T & Record<K, V>>;
  }

  build(): T {
    return this.values as T;
  }
}
```

This pattern is acceptable for public DSLs, test factories, and config builders where inference materially improves safety. Its assertions are internal proof obligations: each method must perform the runtime write represented by its return type. For ordinary application code, a plain object and validation are usually clearer.
