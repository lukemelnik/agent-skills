# Type tools

Use advanced types to encode invariants at public or shared boundaries. Prefer simple annotations for local implementation details.

## Built-in utility types

Reach for built-ins before custom helpers: `Pick`, `Omit`, `Partial`, `Required`, `Readonly`, `Record`, `Extract`, `Exclude`, `NonNullable`, `Parameters`, `ReturnType`, `ConstructorParameters`, `InstanceType`, `Awaited`.

```ts
type HandlerArgs = Parameters<typeof handleSubmit>;
type LoadedUser = Awaited<ReturnType<typeof loadUser>>;
```

Avoid stacking utilities until the result is unreadable. Name intermediate types when it clarifies intent.

## Conditional types and `infer`

Use conditional types to express type-level branching, especially for reusable public helpers:

```ts
type ArrayItem<T> = T extends readonly (infer U)[] ? U : never;
type PromiseValue<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;
```

Remember that conditional types distribute over unions when the checked type is a naked type parameter. `never` also disappears during distribution because it is the empty union:

```ts
type ToArray<T> = T extends unknown ? T[] : never; // string | number -> string[] | number[]
type ToArrayNonDistributive<T> = [T] extends [unknown] ? T[] : never; // (string | number)[]
```

Constrain an inferred segment when the extracted type must meet another requirement:

```ts
type NumericPart<S> = S extends `${infer N extends number}` ? N : never;
```

## Mapped types

Use mapped types to transform object shapes without duplicating keys:

```ts
type Nullable<T> = { [K in keyof T]: T[K] | null };
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
```

Be careful with optional and readonly modifiers. Preserve or remove them intentionally with `+?`, `-?`, `+readonly`, and `-readonly`.

Remap a key to `never` to filter it from the resulting object type:

```ts
type FunctionMembers<T> = {
  [K in keyof T as T[K] extends (...args: never[]) => unknown ? K : never]: T[K];
};
```

## Template literal types

Use template literal types for small, closed string protocols: event names, route-like keys, CSS variable names, action types, or generated getter names.

```ts
type Entity = "song" | "album";
type EventName = `${Entity}:created` | `${Entity}:deleted`;
```

Do not model arbitrary user strings with complex template types unless the compiler can meaningfully enforce the format and the result remains readable. Each union interpolation multiplies the generated combinations; keep protocols small and avoid recursive parsers or large cross-products that slow the compiler.

## Function overloads

Use overloads when call signatures are genuinely different and cannot be represented cleanly with a generic or union return type.

```ts
function read(id: string): Promise<Item>;
function read(ids: readonly string[]): Promise<Item[]>;
function read(input: string | readonly string[]) {
  return typeof input === "string" ? readOne(input) : readMany(input);
}
```

Callers can use only the declared overloads; the implementation signature is not an extra public call signature. Put specific overloads before broad fallbacks, keep the implementation compatible with every overload, and remember that utilities such as `ReturnType` generally observe the final overload signature. For callback-heavy APIs, a generic mapping from input to output is often simpler than many overloads.

## Branded and opaque types

Use branding only to prevent mixing semantically distinct values with the same runtime representation, especially IDs, tokens, units, and validated strings.

```ts
declare const brand: unique symbol;
type Brand<T, Name extends string> = T & { readonly [brand]: Name };
type UserId = Brand<string, "UserId">;

function parseUserId(value: string): UserId {
  if (!value.startsWith("usr_")) throw new Error("Invalid user id");
  return value as UserId;
}
```

Brands need a trusted constructor or parser. Casting arbitrary strings to a brand removes the safety the brand was meant to provide.

## Escape hatches

Assertions are acceptable at narrow, audited boundaries when TypeScript cannot express a runtime invariant that is actually enforced. Keep them local, explain through code structure when possible, and avoid spreading asserted values through broad APIs.
