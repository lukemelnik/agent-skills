# Narrowing and runtime boundaries

## Prefer `unknown` for untrusted data

Use `unknown` at boundaries: JSON, `catch` values, message events, storage, environment/config input, dynamic imports, and loosely typed libraries. Narrow before use.

```ts
function hasStringId(value: unknown): value is { id: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string"
  );
}
```

A TypeScript annotation on parsed JSON is not validation. If invalid data can arrive at runtime, validate it with existing project validators or local guards.

## Discriminated unions

Use a stable discriminant for state machines, result types, actions, and protocol messages:

```ts
type LoadState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

function render<T>(state: LoadState<T>) {
  switch (state.status) {
    case "success":
      return state.data;
    case "error":
      throw state.error;
    case "idle":
    case "loading":
      return undefined;
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}
```

Avoid parallel booleans such as `{ isLoading, isError, data }` when they can represent impossible states.

## Type predicates

Use `value is T` when a boolean helper narrows for callers:

```ts
function isError(value: unknown): value is Error {
  return value instanceof Error;
}
```

Keep predicates honest. A predicate is a promise to the compiler; incomplete checks are worse than no check.

## Assertion functions

Use assertion functions when invalid data should throw and all following code may assume the type:

```ts
function assertDefined<T>(value: T): asserts value is NonNullable<T> {
  if (value == null) throw new Error("Expected value to be defined");
}
```

Prefer assertion functions over postfix `!` when the invariant is checked at runtime. Prefer ordinary `if` narrowing when throwing is not the desired behavior.

## Narrowing pitfalls

- Truthiness removes `""`, `0`, and `false`; use explicit `value != null` for nullish checks.
- The `in` operator proves a property exists, not that its value has the right type.
- `Array.isArray(value)` narrows to `unknown[]`; validate element types if they matter.
- Narrowing can be lost across mutation, callbacks, or aliases. Store narrowed values in constants when needed.
- Catch variables are often `unknown`; normalize them before reading `.message`.

## Runtime validation boundary

If the project already uses a schema library, generated validator, or framework-specific parser, derive TypeScript types from it and defer API-specific usage to that framework's skill. If no validator exists, write the smallest local guard needed for the boundary rather than pretending the data is safe.
