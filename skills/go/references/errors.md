# Go Error Handling

Use this when designing error semantics, reviewing error code, or fixing propagation/logging behavior.

## Principles

- Errors are values. Design with them instead of treating `if err != nil` as boilerplate to hide.
- Return errors for normal failure paths. Do not use `panic` for ordinary error handling.
- Add useful operation context as errors move up the stack.
- Handle an error once. Logging is handling; usually either log and stop, or wrap and return.
- Keep public error semantics intentional and tested.

## Creating and wrapping errors

Use lower-case error strings without trailing punctuation:

```go
return fmt.Errorf("load config %q: %w", path, err)
```

Use `%w` when callers may need to inspect the underlying error with `errors.Is`, `errors.As`, or Go 1.26+ `errors.AsType`.

Use `%v` or create a new error when you deliberately want to hide an implementation detail from callers:

```go
return fmt.Errorf("load user %s: %v", id, err) // does not expose err for Is/As
```

Do not wrap `nil`; `fmt.Errorf("x: %w", nil)` creates a non-nil error.

## Sentinel errors and error types

Use sentinel errors for stable, expected states callers can branch on:

```go
var ErrNotFound = errors.New("not found")
```

Use custom error types when callers need structured fields:

```go
type ValidationError struct {
    Field string
    Err   error
}

func (e *ValidationError) Error() string { return "validate " + e.Field + ": " + e.Err.Error() }
func (e *ValidationError) Unwrap() error { return e.Err }
```

Guidelines:

- Expected category/state: sentinel value plus `errors.Is`.
- Structured/programmatic details: error type plus `errors.As` / `errors.AsType`.
- Human-only context: `fmt.Errorf` with `%w` if exposing source is OK.
- Avoid comparing wrapped errors with `==` except for `nil`; use `errors.Is`.
- Avoid string matching in callers and tests unless testing a human-facing message property.

## Propagation and logging

Bad:

```go
if err != nil {
    log.Printf("save user: %v", err)
    return fmt.Errorf("save user: %w", err)
}
```

Better:

```go
if err != nil {
    return fmt.Errorf("save user %s: %w", id, err)
}
```

Log near the boundary that owns the final outcome: command `main`, HTTP middleware, worker supervisor, or queue consumer.

## Ignoring errors

Do not discard errors casually. If an error is intentionally ignored, make that explicit and local:

```go
if err := tx.Rollback(); err != nil && !errors.Is(err, sql.ErrTxDone) {
    return fmt.Errorf("rollback transaction: %w", err)
}
```

For best-effort cleanup, `_ = closer.Close()` can be acceptable only when the error truly cannot affect the result or has already been handled elsewhere.

## Defer errors

`defer f.Close()` drops close errors. That is fine for read-only resources where close cannot change the result, but not always fine for writers, transactions, files being flushed, or network streams.

For write-like resources, capture close/flush errors:

```go
func writeFile(path string, data []byte) (err error) {
    f, err := os.Create(path)
    if err != nil {
        return fmt.Errorf("create %s: %w", path, err)
    }
    defer func() {
        if closeErr := f.Close(); err == nil && closeErr != nil {
            err = fmt.Errorf("close %s: %w", path, closeErr)
        }
    }()

    if _, err := f.Write(data); err != nil {
        return fmt.Errorf("write %s: %w", path, err)
    }
    return nil
}
```

Use named return values for this pattern when they clarify the deferred mutation. Avoid naked returns in medium/large functions.

## Context errors

- If a context-aware operation returns because the context ended, return or wrap `ctx.Err()` or `context.Cause(ctx)` when using cause-aware contexts.
- Preserve cancellation semantics so callers can detect `context.Canceled` or `context.DeadlineExceeded` with `errors.Is`.
- Do not convert context cancellation into vague messages like `errors.New("failed")`.

## Panic and recover

Use `panic` sparingly:

- Programmer errors / impossible states.
- Initialization failure where the program cannot run.
- Internal package control flow only if recovered and converted to `error` before crossing the package boundary.

If a goroutine boundary must protect a long-running process, recover there, log with stack/context, and let the goroutine exit or restart under supervisor policy. Do not swallow panics silently.

## Public API error contract

For exported functions, decide and document:

- Which errors callers may inspect with `errors.Is` / `errors.As`.
- Whether wrapped implementation errors are intentionally exposed.
- Whether nil result plus nil error is possible.
- Whether partial results are valid when error is non-nil.

Then test those semantics directly.
