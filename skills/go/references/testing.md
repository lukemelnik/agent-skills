# Go Testing

Use this when writing or reviewing Go unit tests, integration tests, fuzz tests, benchmarks, or test helpers.

## Commands

Use the repo's existing commands when available. Otherwise default to:

```bash
go test ./...
go test -race ./...   # for concurrent code
```

Useful focused runs:

```bash
go test ./pkg/foo -run TestName
go test ./... -shuffle=on
go test ./... -short
go test ./... -coverprofile=coverage.out
go test ./pkg/foo -bench=. -benchmem
```

## Test shape

- Test behavior, not implementation details.
- Prefer table-driven tests when cases share the same logic.
- Prefer separate test functions when cases need different setup or assertions.
- Use human-readable subtest names; do not rely on table indexes.
- Include input, got, and want in failure messages.
- Prefer `t.Error` to keep checking independent assertions; use `t.Fatal` when the current test cannot continue.
- Call `t.Helper()` in helpers that accept `*testing.T`.

Failure message pattern:

```go
if got != want {
    t.Errorf("Parse(%q) = %v, want %v", input, got, want)
}
```

## Comparisons

- Compare complete structs/maps/slices when possible instead of field-by-field noise.
- Use `cmp.Diff`/`cmp.Equal` if the project already depends on `github.com/google/go-cmp` or adding it is approved.
- Avoid `reflect.DeepEqual` in new tests when `cmp` is available; it is often brittle around unexported fields and nil/empty distinctions.
- Compare semantic results, not unstable serialization bytes, map iteration order, timestamps, or generated text unless exact text is the contract.

## Error assertions

- Test error semantics with `errors.Is`, `errors.As`, or Go 1.26+ `errors.AsType`.
- Do not compare full error strings unless the exact human-facing text is part of the contract.
- It is fine to test that an error string contains relevant context such as a field name or operation.

Example:

```go
if !errors.Is(err, ErrNotFound) {
    t.Fatalf("Lookup(%q) error = %v, want ErrNotFound", id, err)
}
```

## Contexts and time

- Go 1.24+: use `t.Context()` when tests need a context.
- Older Go: create a context with cancel and `defer cancel()`.
- Avoid `time.Sleep` in tests. Prefer synchronization, fake clocks, channels, polling with deadlines, or `context` timeouts.
- Use `t.TempDir()` for filesystem tests and `testdata/` for stable fixtures.
- Use injectable clocks or `time.Now` wrappers when logic depends on current time.

## Parallel and shuffled tests

- Use `t.Parallel()` only when the test has isolated state.
- Be careful with package globals, environment variables, working directory, ports, databases, and shared temp paths.
- Use `t.Setenv` for environment changes; it automatically restores values and should not be used in parallel tests that affect shared process state.
- `-shuffle=on` helps catch hidden order dependencies.

## Race testing

Run `go test -race ./...` when touching:

- Goroutines/channels/mutexes/atomics.
- Caches, maps, slices, or background workers.
- HTTP servers/clients or database code with shared state.

The race detector only catches executed paths; add tests that exercise concurrent access.

## Integration tests

Choose one of these patterns and follow the repo convention:

- Build tags such as `//go:build integration`.
- Environment opt-in such as `INTEGRATION=1`.
- `testing.Short()` to skip slow tests under `-short`.

Do not make ordinary `go test ./...` depend on a live external service unless that is already the project contract.

## HTTP and I/O test tools

- Use `httptest.NewServer` or `httptest.NewRecorder` for HTTP clients/handlers.
- Use `iotest` helpers for reader/writer error behavior.
- Prefer `bytes.Buffer`, `strings.Reader`, and `io.Reader`/`io.Writer` inputs over real files when filesystem behavior is not under test.

## Fuzzing

Use fuzzing for parsers, decoders, encoders, URL/path handling, string/byte transformations, and security-sensitive input logic.

- Name fuzz tests `FuzzXxx(f *testing.F)`.
- Add seed corpus values with `f.Add`.
- Check properties/invariants, not one exact expected output for unknown input.
- Re-run saved failing corpus entries with `go test -run=FuzzName/<hash>`.
- Bound fuzz duration in automation, e.g. `go test -fuzz=Fuzz -fuzztime=30s`.

## Benchmarks

- Go 1.24+: use `for b.Loop() { ... }` for the measured loop.
- Older Go: use `for i := 0; i < b.N; i++ { ... }`.
- Use `b.ReportAllocs()` or `-benchmem` when allocations matter.
- Use `b.ResetTimer`, `b.StopTimer`, and `b.StartTimer` around setup that should not be measured.
- Prevent compiler elimination by consuming results when needed.
- Do not generalize from microbenchmarks without representative data and environment.
- Use `benchstat` if available for comparing benchmark runs.

## External test package

Use `package foo_test` when testing the public API as a consumer would. Use `package foo` when tests need unexported internals or setup seams. Prefer public-behavior tests unless internals are complex enough to deserve direct coverage.
