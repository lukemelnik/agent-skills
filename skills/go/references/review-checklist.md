# Go Review Checklist

Use this for a fast quality pass before or during Go code review.

## Architecture

- Package names are meaningful, short, lowercase, and not `util`/`common`/`types`/`interfaces` catchalls.
- Exports are minimal and documented.
- `main` wires dependencies; business logic lives in packages that can be tested.
- Dependencies are explicit, not hidden in globals or `init` side effects.
- Interfaces are small and defined where consumed.
- Functions return concrete types unless returning an interface is an intentional public abstraction.
- No import cycles or package boundaries that force awkward names.

## API design

- Context is first parameter for blocking/request-scoped work and is not stored in structs.
- Synchronous API is preferred unless async behavior is the product.
- Zero values are useful where practical.
- Pointer/value receivers are consistent and chosen deliberately.
- Generics are used only where they improve type safety and reduce real duplication.

## Errors

- Errors include useful operation context.
- Wrapped errors intentionally expose sources with `%w`; hidden implementation errors are not accidentally exposed.
- Callers inspect errors with `errors.Is`/`errors.As`/`errors.AsType`, not strings or `==` on wrapped errors.
- Error strings are lowercase and punctuation-free.
- Errors are handled once; no log-and-return duplication.
- `panic` is not used for normal control flow.
- Defer/close/flush errors are handled when they affect correctness.

## Concurrency

- Every goroutine has an owner, exit path, and unblock strategy.
- Shared maps/slices/structs are protected for the full access duration.
- `sync` types are not copied after use.
- `WaitGroup.Add` happens before goroutine start, or `WaitGroup.Go` is used on Go 1.25+.
- Channels have clear ownership and close rules.
- Buffered channel capacities are justified.
- `select` code does not assume source-order priority.
- Detached work does not accidentally inherit a soon-canceled request context.
- `go test -race` has been run for concurrent changes.

## Data and stdlib pitfalls

- Slice copies are real copies when independence is required.
- Large subslices/substrings are cloned when retention would leak memory.
- Empty slices/maps are checked with `len`.
- Map iteration order is not relied on.
- Strings are handled as bytes/runes deliberately.
- `time.Duration` values use units.
- `time.Time` comparison uses `Equal` when comparing instants.
- JSON nil/empty/zero semantics are intentional.
- Resources (`resp.Body`, `Rows`, files, tickers/timers) are closed.
- `rows.Err()` is checked after iteration.

## HTTP

- Server and client timeouts are explicit for production paths.
- Handlers return after writing an error response.
- Request body sizes are bounded for untrusted input.
- Response status/header/body are written in the correct order.
- Internal errors are not leaked to clients.
- Graceful shutdown covers server and background resources.

## Database

- `*sql.DB` is reused as a pool, not opened per request.
- Startup connectivity uses `PingContext` only when needed.
- Queries use placeholders, never formatted values.
- Transactions use `BeginTx`, use `tx` consistently, and commit/rollback correctly.
- Nullable columns preserve semantic null when needed.
- Pool tuning is justified by workload/deployment data.

## Tests

- Tests exercise behavior and edge cases, not only happy paths.
- Table tests are used when logic is shared; separate tests when logic differs.
- Failure messages include function/input/got/want.
- Helpers call `t.Helper()`.
- Error tests assert semantics, not brittle exact strings.
- Time-dependent tests avoid sleeps or use bounded polling/fakes.
- Parallel tests do not share mutable process state.
- Fuzz tests exist for parser/decoder/security-sensitive input when valuable.
- Benchmarks avoid measuring setup and prevent compiler elimination.

## Performance

- Code is profiled or benchmarked before non-obvious optimization.
- Allocations are reduced by API shape/preallocation before `sync.Pool`.
- `sync.Pool` is used only for hot reusable temporary objects, never for ownership/lifetime semantics.
- Concurrency limits match workload type and downstream capacity.
- Reflection is justified and not on a hot path without measurement.

## Red flags

- New package named `utils`, `common`, `models`, or `interfaces`.
- Interface with one implementation and no consumer-defined need.
- Goroutine started in a constructor with no stop method.
- `context.Background()` inside request flow.
- `defer` inside an unbounded loop opening resources.
- `http.DefaultClient` in production client code.
- `fmt.Sprintf` building SQL with values.
- Ignored errors without local justification.
