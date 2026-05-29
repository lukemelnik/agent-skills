# Go Data Types and Standard-Library Pitfalls

Use this when reviewing slice/map/string behavior, JSON/time/HTTP/resource handling, or subtle stdlib bugs.

## Slices

- Length is visible elements; capacity is backing-array room.
- Preallocate when final size or a good upper bound is known.
- Check emptiness with `len(s) == 0`, not `s == nil`.
- Prefer `var s []T` for an empty slice unless JSON/API output must be `[]` instead of `null`.
- `copy(dst, src)` copies `min(len(dst), len(src))` elements; allocate destination length first.
- `append` can mutate the original backing array if capacity remains.
- Use full slice expressions (`s[:n:n]`) to limit append side effects when sharing a view.
- Use `slices.Clone` (Go 1.21+) or `append([]T(nil), s...)` when an independent copy is required.
- Slicing a large array/slice keeps the whole backing array alive. Clone small retained pieces.
- When deleting elements from slices of pointers or structs with pointer fields, clear dropped elements so GC can reclaim them.

## Maps

- A nil map can be read but panics on write; initialize before writing.
- Pre-size maps with `make(map[K]V, n)` when size is known.
- Map iteration order is deliberately unspecified and not stable.
- A map can grow but usually does not shrink after deletes; recreate it if memory matters.
- Maps are not safe for concurrent read/write. Protect with a mutex, channel ownership, or `sync.Map` only when its documented access patterns fit.
- Assigning `m2 := m` copies only the map header; both variables share data. Use `maps.Clone` (Go 1.21+) when you need a snapshot.
- Use the comma-ok form when zero value and missing key differ semantically.

## Strings, bytes, and runes

- A Go string is immutable bytes, not guaranteed valid UTF-8.
- `len(s)` returns bytes, not runes or grapheme clusters.
- `for i, r := range s` gives byte index `i` and rune `r`.
- Convert to `[]rune` only when you need rune indexing or mutation; it allocates and still does not solve grapheme-cluster logic.
- Use `strings.TrimPrefix`/`TrimSuffix` for exact affixes. `TrimLeft`/`TrimRight` remove any runes in a cutset.
- Use `strings.Builder` or `strings.Join` for loop concatenation; use direct `+` for a few simple strings.
- Avoid unnecessary `string`/`[]byte` conversions. The `bytes` package mirrors many `strings` operations.
- Use `strings.Clone` / `bytes.Clone` to retain a small substring/subslice without keeping a large backing buffer alive.

## Numbers and time

- Integer overflow at runtime is silent. Check bounds explicitly for untrusted sizes, counters, allocations, and conversions.
- Compare floats with tolerances when exact representation is not guaranteed.
- `time.Duration` is nanoseconds. Write `5 * time.Second`, not `5000`.
- Use `time.Since(start)` and `time.Until(deadline)`.
- `time.Time` may contain a monotonic clock reading; `==` compares it. Prefer `t.Equal(u)` for time instants.

## Defer

- `defer` runs when the surrounding function returns, not when the block/loop iteration ends.
- Avoid `defer` in long-running loops that open resources; extract loop body into a helper function or close explicitly.
- Defer arguments and method receivers are evaluated when the `defer` statement executes. Use a closure when you need the final variable value.

## Resource closing

Close transient resources:

- HTTP response bodies from clients.
- `*sql.Rows`.
- Files and other `io.Closer` values.
- Tickers/timers when target Go version or lifecycle requires it.

For `sql.Rows`, also check `rows.Err()` after iteration.

## JSON

- Embedded fields can unexpectedly change marshaling, especially if the embedded type implements `json.Marshaler`.
- Unmarshaling into `map[string]any` converts numbers to `float64` by default. Use concrete structs or `json.Decoder.UseNumber` when precision matters.
- Nil slices marshal as `null`; empty non-nil slices marshal as `[]`.
- `omitempty` and `omitzero` are different. Go 1.24+ `omitzero` is useful for `time.Time`, `time.Duration`, and structs, but do not blindly replace `omitempty` when `null`/empty output semantics matter.
- Be explicit about unknown fields if API strictness matters (`Decoder.DisallowUnknownFields`).

## HTTP stdlib pitfalls

- `http.Error` writes a response but does not stop handler execution; return immediately afterward.
- `http.DefaultClient` and `http.ListenAndServe` defaults are usually not production-ready because important timeouts are missing.
- For outbound requests, use `http.NewRequestWithContext` and close `resp.Body`.
- Check response status codes before decoding bodies.
- Limit request body size on endpoints that accept input from untrusted clients.

## SQL stdlib pitfalls

- `sql.Open` validates arguments but may not establish a connection. Use `PingContext` when startup must prove connectivity.
- `*sql.DB` is a concurrency-safe pool, not a single connection.
- Use context-aware methods: `QueryContext`, `ExecContext`, `BeginTx`, `PingContext`.
- Always close `Rows` and check `Rows.Err`.
- Handle nullable columns with pointers or `sql.Null*` types.

## Formatting side effects

Formatting can call methods such as `String`, `Error`, or `GoString`. In concurrent code, formatting a value while holding a lock can deadlock if the formatting method locks the same value. Prefer formatting primitive fields directly inside critical sections.
