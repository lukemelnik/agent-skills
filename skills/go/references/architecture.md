# Go Architecture and Package Design

Use this when designing or refactoring Go modules, packages, APIs, CLIs, services, or dependency boundaries.

## Default architecture

- Start simple. A single package or command is fine until there is real cohesion to split out.
- Split packages by what they provide, not by generic technical labels.
- Keep domain behavior close to the data and invariants it protects.
- Keep `main` thin: parse config, create dependencies, wire commands/servers, handle shutdown.
- Avoid global mutable state. Prefer constructors that accept dependencies explicitly.
- Avoid import cycles by keeping dependency direction clear and pushing shared abstractions to the consumer side.

## Layout

Prefer official module layout guidance over cargo-cult templates:

- Basic library package: `go.mod`, package files, tests at the module root.
- Basic command: `go.mod`, `main.go` and related files in one `package main` when small.
- Multiple commands: put each command in its own directory; use `cmd/<name>/` for mixed repos or servers.
- Supporting code not intended as public API: put under `internal/`.
- Server repos usually keep Go implementation packages under `internal/` and binaries under `cmd/`.
- Do not create `pkg/` unless you intentionally support those packages as external public API.

Good server shape:

```text
project/
  go.mod
  cmd/api/main.go
  internal/config/
  internal/httpapi/
  internal/users/
  internal/store/
```

## Package boundaries

- Package names are short, lowercase, usually one word: `user`, `auth`, `store`, `httpapi`.
- Name packages after what they provide, not what they contain.
- Avoid `util`, `common`, `shared`, `helpers`, `types`, `models`, `interfaces`, and `api` catchalls.
- Avoid stutter: clients write `user.Service`, not `user.UserService`; `store.New`, not `store.NewStore` when obvious.
- Minimize exports. Default to unexported until another package truly needs the name.
- Keep package APIs small enough that godoc tells a coherent story.

If a package name does not work as a prefix for its exported names, the boundary is probably wrong.

## Interfaces

- Prefer “accept interfaces, return concrete types.”
- Define interfaces in the consuming package, not the producer package, unless you are intentionally publishing a stable abstraction.
- Do not create interfaces only “for mocking.” First see whether tests can use the real concrete type through its public API.
- Keep interfaces minimal and behavior-focused. One or two methods is normal.
- Compose small interfaces instead of designing large ones up front.
- Return an interface only when callers should not depend on the implementation, such as standard-library-style abstractions or intentionally hidden concrete types.

Consumer-side interface example:

```go
type UserStore interface {
    User(ctx context.Context, id string) (User, error)
}

type Service struct {
    store UserStore
}
```

## Dependency wiring

- Use structs with explicit fields for durable dependencies.
- Prefer constructor functions for required dependencies and validation.
- Do not hide dependencies in package globals or service locators.
- Pass `context.Context` to methods that perform request-scoped/blocking work; do not store it in the struct.
- Keep logging, metrics, clocks, ID generation, and external clients injectable when tests or determinism require it.

## Configuration and options

Choose the simplest API that stays readable:

1. A few required arguments: use normal constructor parameters.
2. Many related required settings: use a config struct.
3. Public API with optional settings/defaults: use functional options.

Avoid functional options for small internal constructors where a plain struct is clearer.

## Types and methods

- Make the zero value useful when practical, especially for counters, buffers, simple builders, and sync-protected structs.
- Use pointer receivers when methods mutate, the type contains sync primitives, the type is large, or receiver consistency would otherwise be confusing.
- Use value receivers for small immutable value types such as wrappers around numbers, strings, or `time.Time`-like structs.
- Do not mix pointer and value receivers for the same type without a strong reason.
- Avoid embedding solely to save `x.y.z` typing; embed only to intentionally promote behavior.
- Be careful embedding types with exported fields/methods that should remain hidden.

## Generics

Use generics when they remove real duplication while preserving type safety:

- Generic containers, sets, queues, algorithms, constraints over ordered/comparable types.
- Reusable helpers where all operations are type-independent.

Avoid generics when:

- An interface captures behavior better than type shape.
- A little duplication is clearer than a type-parameter abstraction.
- The constraint is so broad (`any`) that the code communicates nothing.
- The generic API would leak complexity into callers.

## Anti-spaghetti checks

Before adding a new package or abstraction, ask:

- Does this package have a name that explains what it provides?
- Could the code stay in the current package until a real boundary emerges?
- Is this interface used by at least one consumer today?
- Does this dependency direction prevent cycles and preserve testability?
- Can a reader understand construction from `main` or tests without tracing globals?
