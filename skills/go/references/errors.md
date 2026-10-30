# Go Error Pitfalls

## Wrapping

- `%w` exposes the source to `errors.Is/As` (Go 1.26+: `errors.AsType`); use `%v` to deliberately hide an implementation error.
- `fmt.Errorf("x: %w", nil)` creates a non-nil error.
- Compare wrapped errors with `errors.Is`, never `==`; don't string-match.
- Handle once: either log or wrap-and-return, not both. Log at the boundary that owns the outcome (main, middleware, worker supervisor).

## Defer errors

`defer f.Close()` drops close errors; fine for readers, wrong for writers, transactions, and flushed streams. Capture with a named return:

```go
defer func() {
    if closeErr := f.Close(); err == nil && closeErr != nil {
        err = fmt.Errorf("close %s: %w", path, closeErr)
    }
}()
```

For rollback after a failed commit path, ignore `sql.ErrTxDone`.

## Context errors

Return or wrap `ctx.Err()` (or `context.Cause(ctx)`) so callers can detect `context.Canceled` / `DeadlineExceeded` with `errors.Is`.

## Panic

Only for impossible states or init failure; internal panics must be recovered and converted to `error` before crossing the package boundary. A recover at a goroutine boundary must log with stack, not swallow silently.

## Public API contract

Document which errors callers may inspect, whether wrapped implementation errors are exposed, and whether partial results accompany an error; test those semantics.
