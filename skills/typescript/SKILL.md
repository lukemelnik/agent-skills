---
name: typescript
description: TypeScript/TSX language-level development for robust, maintainable code. Use when writing, reviewing, refactoring, or debugging TypeScript; fixing compiler diagnostics; improving type inference, generics, narrowing, or data modeling; replacing unsafe any/assertions; or working through tsconfig, module-boundary, declaration, or external-library typing issues.
---

# TypeScript Development

## Quick start

Before changing code, inspect the local TypeScript shape:

- Use the repository's TypeScript version, `tsconfig`, package boundaries, module system, lint rules, commands, and dependency policy.
- Prefer the project's existing proof command (`pnpm check-types`, package script, framework build, test runner, etc.). Do not assume `tsc --noEmit` is the universal gate.
- Treat framework-specific skills as authoritative for their APIs and workflows. Use this skill for language-level reasoning alongside them.
- Fix the type model instead of silencing the compiler. Avoid `any`, assertions, and non-null assertions unless a boundary genuinely cannot be expressed safely.

Load the narrowest reference for the task:

- `references/diagnostics.md` — compiler-error triage, root-cause isolation, type-level tests, verification.
- `references/modeling-inference.md` — derived types, `as const`, `satisfies`, indexed access, safe array indexing, generics, const type parameters, builder inference.
- `references/narrowing-runtime.md` — `unknown`, type guards, assertion functions, discriminated unions, runtime validation boundaries.
- `references/type-tools.md` — utility, conditional, mapped, template-literal types, `infer`, overloads, branded/opaque types.
- `references/boundaries-config.md` — external library boundaries, module augmentation, declaration files, `tsconfig`, module/package boundaries.

## Core defaults

- Favor the smallest readable solution that preserves a real invariant. Avoid type gymnastics for private implementation details.
- Derive types from values, schemas, route definitions, query results, generated clients, or library outputs instead of duplicating handwritten types.
- Preserve inference at call sites. Add generic parameters only when the result or another parameter depends on the input type.
- Prefer `unknown` plus narrowing for untrusted data. Use `any` only at unavoidable legacy or external boundaries, and contain it immediately.
- Use `satisfies` to check a value against a shape while retaining its inferred literal type. Use `as const` when literal/readonly inference is actually wanted.
- Distinguish compile-time guarantees from runtime validation. A TypeScript type does not validate JSON, user input, environment variables, or network responses.
- Avoid `@ts-ignore`. Use `@ts-expect-error` only for intentional negative type tests when project convention permits it or the user explicitly approves.
- Do not add dependencies merely for clever typing. Reuse existing libraries and generated types.

## Diagnostic and implementation workflow

1. Capture the exact diagnostic and the command that produced it. If editor and CLI disagree, verify the active `tsconfig` and package context.
2. Locate the first wrong type, not just the red squiggle. Inspect inferred types, source declarations, generic constraints, widened literals, and boundary inputs.
3. Decide whether the fix belongs in the caller, callee, type definition, runtime validator, declaration augmentation, or package/config boundary.
4. Apply the least powerful TypeScript feature that models the invariant clearly.
5. Add or update tests where the type behavior is part of the API. Prefer ordinary runtime tests for runtime behavior; use type-level assertions only for public or tricky type contracts.
6. Run the repository's scoped verification command and any relevant lint/test command already used by the project.

## Framework boundary

For tRPC, Drizzle, TanStack Router/Form/Table, React, Vitest, and other framework-specific APIs, load and follow the dedicated skill first. This skill should still guide TypeScript decisions such as narrowing, inference preservation, unsafe assertion removal, derived types, and module-boundary diagnosis.

## Verification

- Use the repo's configured typecheck/build/test scripts; do not invent a new universal command.
- For public type APIs, verify both positive inference and intentional failures when the project supports type tests.
- For runtime boundaries, prove validation at runtime instead of relying on compile-time types.
