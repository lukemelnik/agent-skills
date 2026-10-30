---
name: go
description: Go/Golang software development for robust, maintainable code. Covers idiomatic architecture, package boundaries, interfaces, errors, context/concurrency, testing, HTTP services, database/sql, standard-library pitfalls, and modern Go version choices. Use when writing, reviewing, refactoring, debugging, or designing Go code, modules, CLIs, services, tests, goroutines, channels, or Go APIs.
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

## Defaults

- Use the standard library first. Add dependencies only when the project already uses them or the user approves.
- Prefer synchronous APIs. Callers can add goroutines; callers cannot easily remove hidden concurrency.
- Return concrete types unless a stable public abstraction is intentional.
- Every goroutine needs an obvious lifetime and exit path.
- Run `go test -race ./...` for concurrent code; run `go vet`, `staticcheck`, or `golangci-lint` only when available or already in the repo workflow.

## Red flags

- New package named `utils`, `common`, `models`, or `interfaces`.
- Interface with one implementation and no consumer-defined need.
- Goroutine started in a constructor with no stop method.
- `context.Background()` inside request flow.
- `defer` inside an unbounded loop opening resources.
- `http.DefaultClient` in production client code.
- `fmt.Sprintf` building SQL with values.

## Source priority

Use official Go docs, release notes, package docs, and standard-library examples as the authority. Use books such as *100 Go Mistakes and How to Avoid Them* as pitfall validation. Treat third-party skill repos and blog posts as idea sources, not canonical style guides.
