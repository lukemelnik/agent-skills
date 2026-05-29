# Modern Go by Version

Use this when writing new Go code or modernizing existing code. Always respect the module's `go` directive.

## Version workflow

1. Read the target from `go.mod` (`go` directive) or the repo's documented toolchain.
2. Do not use syntax or stdlib APIs newer than the target.
3. Do not silently raise the `go` directive just to use a newer helper.
4. Prefer modern APIs only when they make code clearer or safer for the target version.
5. Treat “always use X” advice as suspicious; context and semantics still matter.

## Go 1.13+

- Use error wrapping and inspection: `%w`, `errors.Is`, `errors.As`.
- Use `errors.Is(err, target)` for wrapped sentinel errors, not `err == target` except for `nil`.

## Go 1.18+

- Use `any` instead of `interface{}` in new code.
- Use generics when they remove real duplication with type safety; avoid premature type-parameter APIs.
- Use `strings.Cut` / `bytes.Cut` instead of manual `Index` plus slicing when splitting once.

## Go 1.19+

- Use typed atomics (`atomic.Bool`, `atomic.Int64`, `atomic.Pointer[T]`) instead of raw `atomic.StoreInt32` style where they fit.
- Use `fmt.Append`, `fmt.Appendf`, `fmt.Appendln` when appending formatted output to an existing byte slice.

## Go 1.20+

- Use `strings.Clone` / `bytes.Clone` to avoid retaining large backing memory.
- Use `strings.CutPrefix` / `CutSuffix` instead of `HasPrefix` plus slicing.
- Use `errors.Join` when multiple independent errors should be returned and inspectable.
- Use `context.WithCancelCause` / `context.Cause` when cancellation reason matters.

## Go 1.21+

- Use `min`, `max`, and `clear` when they improve clarity.
- Use `slices` and `maps` helpers: `slices.Clone`, `slices.Contains`, `slices.SortFunc`, `maps.Clone`, `maps.Copy`, `maps.DeleteFunc`.
- Use `cmp.Compare` for sort comparisons and `cmp.Or` only when zero value truly means “unset.”
- Use `sync.OnceFunc` / `sync.OnceValue` for one-time lazy work.
- Use `context.WithoutCancel` only for intentionally detached work; add an explicit timeout/deadline.

## Go 1.22+

- Loop variables are per-iteration, so the classic goroutine/subtest capture bug is fixed for modules targeting Go 1.22+.
- `for i := range n` is available for integer ranges; use it when clearer than a classic counted loop.
- Use enhanced `http.ServeMux` patterns when staying stdlib-first: `"GET /items/{id}"` and `r.PathValue("id")`.
- Use `reflect.TypeFor[T]()` instead of older nil-pointer reflection tricks.

Caveat: explicit loop variable copies may still be clearer when supporting mixed toolchains or when generated code is involved.

## Go 1.23+

- `maps.Keys` / `maps.Values` return iterators; collect with `slices.Collect` or sort with `slices.Sorted` when needed.
- Timer/ticker GC behavior improved. `time.Tick` no longer leaks solely because it cannot be stopped, but `time.NewTicker` is still right when lifecycle control, stop, or reset is part of the design.

## Go 1.24+

- Use `t.Context()` in tests that need a context.
- Use `b.Loop()` for the measured loop in benchmarks.
- Use `strings.SplitSeq`, `strings.FieldsSeq`, `bytes.SplitSeq`, and `bytes.FieldsSeq` when iterating parts without needing a slice.
- Consider JSON `omitzero` for `time.Time`, `time.Duration`, structs, and other values where zero-ness is the desired omission rule.

Caveat: `omitempty` and `omitzero` have different semantics. Do not blindly replace tags, especially for slices/maps and public JSON contracts.

## Go 1.25+

- Use `sync.WaitGroup.Go` when launching goroutines that do not need error return/cancellation semantics.
- Prefer `errgroup` or explicit goroutine management when you need errors, cancellation, panic handling, limits, or result aggregation.
- Container-aware `GOMAXPROCS` reduces the need for custom container CPU limit handling; still benchmark and observe real deployments.

## Go 1.26+

- Use `new(expr)` for optional pointer fields when it is clearer than a temporary local.
- Use `errors.AsType[T](err)` instead of `errors.As(err, &target)` for new code when targeting Go 1.26+.

Caveat: `new(expr)` is concise but can be less readable for complex expressions; do not use it to hide expensive or side-effecting work.

## Modernization judgment

Prefer newer APIs when they remove bugs or obvious boilerplate:

- `slices.Clone` over hand-written copy.
- `maps.Clone` over copying map headers by mistake.
- `errors.Is/As` over direct comparisons of wrapped errors.
- `http.ServeMux` patterns over adding a router dependency for simple services.

Keep older/simple code when it is clearer:

- A classic counted loop may be more readable than `range len(xs)` for index-heavy logic.
- `if x == "" { x = def }` may be clearer than `cmp.Or` when zero has business meaning.
- A mutex may be clearer than channels for shared state.
- A tiny duplicated function may be clearer than a generic abstraction.
