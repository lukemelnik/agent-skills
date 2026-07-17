# TypeScript diagnostics

## Triage loop

1. Reproduce the error with the repo's existing command and note the package/workspace where it runs.
2. Read nested diagnostics from the innermost mismatch outward. The final property/parameter incompatibility is often the cause.
3. Split complex expressions into named steps and inspect each inferred type.
4. Jump to the declaration that defines the expected type: library overload, generated type, schema output, JSX prop, or local generic.
5. Check for widened literals, lost generics, missing constraints, nullable values, index access under `noUncheckedIndexedAccess`, or an incorrect module/config boundary.
6. Prefer changing the type source or narrowing the value over adding assertions at the use site.

## Common causes and better fixes

- `Type X is not assignable to Y`: identify the first incompatible property; preserve literals with `as const` or `satisfies` when appropriate; do not cast the whole object unless crossing a verified boundary.
- `Property K does not exist on type T`: narrow unions with a discriminant or `in`; for `unknown`, validate object-ness first.
- `Type K cannot be used to index T`: constrain the key (`K extends keyof T`) or model a dynamic dictionary explicitly.
- Generic constraint failures: add the narrowest constraint needed by the operation, not a broad `object` or function-shaped `any`.
- Overload mismatch: inspect every overload; often a union argument cannot satisfy any single overload and the API needs a generic or a narrowed branch.
- `never` unexpectedly appears: look for impossible intersections, unhandled union members, over-narrowed control flow, or conditional types distributing over `never`.

## Debugging techniques

Use small temporary type aliases while diagnosing, then remove or keep only if they clarify the API:

```ts
type Element<T> = T extends readonly (infer U)[] ? U : never;
type Step1 = ReturnType<typeof makeConfig>;
type Step2 = Step1["routes"];
type Route = Element<Step2>;
```

Use explicit annotations sparingly to force an error closer to the source:

```ts
const raw = loadSettings();
const settings: Settings = raw; // If this fails, fix loadSettings or validate raw here.
```

## Type-level tests

Add type tests only when type behavior is part of the contract: exported helpers, builders, overloads, schema-derived types, public component props, or regressions from a compiler diagnostic.

Respect project convention. Possible patterns include existing assertion helpers, `tsd`, `expect-type`, Vitest type assertions, or a dedicated fixture compiled by the repo's typecheck. Do not introduce a new dependency solely for type tests without approval.

Negative tests may use `@ts-expect-error` only when intentional and permitted by the project. Never use `@ts-ignore`.

## Verification

Run the smallest existing command that proves the fix in the correct package. If a diagnostic depends on generated types, route trees, or framework build output, run the project's generation/build step rather than guessing.
