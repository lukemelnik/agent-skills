# Boundaries, libraries, and configuration

## Respect package and module boundaries

Before editing types across packages, inspect how the repo exports and consumes them:

- workspace/package entry points and `exports`
- generated type files and whether they should be edited by hand
- project references, composite builds, path aliases, and package-local `tsconfig` files
- ESM/CJS settings such as `module`, `moduleResolution`, `type`, `verbatimModuleSyntax`, and import extension rules

Fix the boundary that owns the type. Do not duplicate shared types in downstream packages to make an error disappear.

## External-library boundaries

For library return types, prefer deriving from the library's public API:

```ts
type Client = ReturnType<typeof createClient>;
type QueryResult = Awaited<ReturnType<Client["query"]>>;
```

If a library is poorly typed:

1. Check whether the project already has wrapper utilities or local declarations.
2. Contain unsafe values at the wrapper boundary and expose a safe typed API internally.
3. Use `unknown` plus validation when runtime data is not guaranteed.
4. Add module augmentation only when the library explicitly supports it or the repo already uses that pattern.

## Declaration files and module augmentation

Use `.d.ts` files for ambient declarations and augmentation, not for ordinary application models. Keep them close to the package that needs them and ensure they are included by the relevant `tsconfig`.

```ts
import "some-library";

declare module "some-library" {
  interface CustomOptions {
    traceId?: string;
  }
}
```

Augmentation changes global understanding of a module. Verify it compiles in every package that consumes it and avoid augmenting private/internal library modules.

## `tsconfig` diagnosis

Do not loosen strictness to fix one diagnostic unless the user explicitly asks and understands the tradeoff. Common settings that affect diagnosis:

- `strict`, `noImplicitAny`, `strictNullChecks`
- `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- `moduleResolution`, `paths`, `baseUrl`, `types`, `typeRoots`
- `jsx`, `lib`, `target`, `module`, `isolatedModules`
- project references and `include`/`exclude`

If the same code typechecks in one package but not another, compare effective configs with the project's existing tooling or TypeScript's config inspection command when appropriate.

## Generated and framework-owned types

Do not hand-edit generated types, route trees, schema outputs, OpenAPI clients, or framework declaration artifacts. Regenerate them with the repo's documented command or fix the source definition.

Framework-specific recipes belong to their dedicated skills. For example, defer API usage and testing patterns to tRPC, Drizzle, TanStack, React, or Vitest skills; apply this reference only to language-level issues such as inferred output extraction, narrowing, unsafe assertions, and module resolution.

## Import/export hygiene

- Use type-only imports/exports when required by the repo's compiler/lint settings.
- Avoid importing through deep private paths unless the package documents them.
- Keep runtime values and type-only symbols distinct when `verbatimModuleSyntax` or isolated transpilation is enabled.
- Do not introduce circular dependencies to share a type; move the type to the package that owns the concept or derive it from an existing public export.
