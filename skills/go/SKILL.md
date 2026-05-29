---
name: go
description: Go/Golang software development for robust, maintainable code. Covers idiomatic architecture, package boundaries, interfaces, errors, context/concurrency, testing, HTTP services, database/sql, standard-library pitfalls, modern Go version choices, and review checklists. Use when writing, reviewing, refactoring, debugging, or designing Go code, modules, CLIs, services, tests, goroutines, channels, or Go APIs.
---

# Go Development

## Quick start

Before changing code, inspect the local Go shape:

- Find the module root and target Go version from `go.mod` (`go` directive). Do not use language or stdlib features newer than that target.
- Prefer the repository's existing commands, layout, lint config, and dependency choices.
- If no `go.mod` exists, ask which Go version to target before using version-sensitive APIs.

Load the narrowest reference for the task:

- `references/architecture.md` — package layout, boundaries, interfaces, dependency wiring, generics, config/options.
- `references/errors.md` — error wrapping, sentinel/type errors, logging once, panic/recover, defer errors.
- `references/concurrency.md` — goroutines, contexts, channels vs mutexes, worker pools, races, cancellation.
- `references/testing.md` — table tests, helpers, race/shuffle/parallel, fuzzing, benchmarks.
- `references/http-services.md` — HTTP servers/clients, handlers, middleware, timeouts, shutdown.
- `references/database.md` — `database/sql`, pools, transactions, rows, prepared statements, nulls.
- `references/cli.md` — Go command structure, flags, stdin/stdout/stderr, cancellation, CLI tests.
- `references/data-types-stdlib.md` — slices/maps/strings/time/JSON/resource pitfalls.
- `references/modern-go.md` — version-gated modern Go features and caveats.
- `references/review-checklist.md` — fast review pass for Go code quality.

## Defaults

- Write boring Go: simple control flow, small cohesive packages, explicit dependencies, clear names, and minimal abstraction.
- Keep the happy path left-aligned; handle errors early and return.
- Use the standard library first. Add dependencies only when the project already uses them or the user approves.
- Prefer synchronous APIs. Callers can add goroutines; callers cannot easily remove hidden concurrency.
- Define interfaces where they are consumed, keep them small, and return concrete types unless a stable public abstraction is intentional.
- Pass `context.Context` as the first argument for request-scoped or blocking work. Do not store contexts in structs.
- Treat goroutines as resources: every goroutine needs an obvious lifetime and exit path.
- Handle errors explicitly. Wrap with context when propagating, but do not expose implementation details accidentally.
- Minimize exported API surface. Document exported packages, types, funcs, methods, vars, and consts.
- Use `gofmt`/`goimports`; do not fight Go formatting.

## Implementation workflow

1. Identify the target Go version, public API boundary, and existing package conventions.
2. Design the smallest package/API surface that solves the problem; avoid new `util`, `common`, `types`, or `interfaces` packages.
3. Implement with explicit dependencies and clear ownership of resources, contexts, goroutines, and errors.
4. Add or update tests at the right level. Prefer table tests when logic is shared, separate test functions when behavior differs.
5. Run `gofmt`/`go test ./...`; run `go test -race ./...` for concurrent code. Run `go vet`, `staticcheck`, or `golangci-lint` only when available or already part of the repo workflow.

## Source priority

Use official Go docs, release notes, package docs, and standard-library examples as the authority. Use books such as *100 Go Mistakes and How to Avoid Them* as pitfall validation. Treat third-party skill repos and blog posts as idea sources, not canonical style guides.
