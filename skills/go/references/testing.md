# Go Testing Pitfalls

- Failure messages include input, got, want; helpers call `t.Helper()`; `t.Error` for independent checks, `t.Fatal` when the test cannot continue.
- Prefer `cmp.Diff` over `reflect.DeepEqual` if go-cmp is already a dependency (DeepEqual is brittle on unexported fields and nil/empty).
- Assert errors with `errors.Is/As` (1.26+: `AsType`), not full strings.
- Go 1.24+: `t.Context()` and `for b.Loop()`; older: `b.N` loops.
- Avoid `time.Sleep`; use synchronization, fake clocks, or polling with deadlines. Use `t.TempDir()` and `testdata/`.
- `t.Parallel()` only with isolated state (globals, env, cwd, ports, DBs, temp paths). `t.Setenv` cannot be used in parallel tests. Use `-shuffle=on` to find order dependencies.
- The race detector only finds executed paths: write tests that exercise concurrent access.
- Integration tests: follow repo convention (`//go:build integration`, env opt-in, or `testing.Short()`); plain `go test ./...` must not need live external services.
- Fuzz: `FuzzXxx(f *testing.F)`, `f.Add` seeds, check invariants, bound with `-fuzztime`; replay with `-run=FuzzName/<hash>`.
- Benchmarks: consume results to prevent compiler elimination; `-benchmem`/`b.ReportAllocs()`; don't generalize microbenchmarks.
- Use `package foo_test` for consumer-view API tests.
