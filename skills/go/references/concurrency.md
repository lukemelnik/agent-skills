# Go Concurrency

Use this for goroutines, channels, contexts, worker pools, shared state, cancellation, race fixes, or review of concurrent code.

## Defaults

- Prefer synchronous functions. Let callers add concurrency when they need it.
- Start a goroutine only when you can explain when it exits.
- Use context for cancellation/deadlines, not as a general dependency bag.
- Use channels for coordination, signaling, and ownership transfer.
- Use mutexes for protecting shared state.
- Benchmark before assuming concurrency is faster.

## Contexts

- Accept `context.Context` as the first parameter for request-scoped or blocking operations.
- Do not store contexts in structs. Pass them to each method that needs them.
- Always call the cancel function returned by `context.WithCancel`, `WithTimeout`, or `WithDeadline`.
- Use `context.WithTimeout`/`WithDeadline` at I/O boundaries where callers need bounded waits.
- Use `context.WithoutCancel` only when a detached task must outlive the request, and give that task its own timeout/deadline.
- Be careful passing `r.Context()` to goroutines after an HTTP handler returns; request contexts are canceled when the request ends.

## Goroutine lifetimes

Every goroutine needs:

- An owner.
- A stopping condition.
- A way to unblock sends/receives.
- A way for the owner to wait or intentionally detach.
- Error/panic handling appropriate to the boundary.

Bad smell:

```go
go func() { ch <- work() }()
```

If nobody receives because the caller returns early, the goroutine leaks. Use buffering only when the maximum sends are known, otherwise select on cancellation.

## Channels vs mutexes

Use a mutex when multiple goroutines need synchronized access to a shared in-memory value:

```go
type Cache struct {
    mu sync.RWMutex
    m  map[string]User
}
```

Use a channel when goroutines coordinate work, transfer ownership, or broadcast completion:

```go
jobs := make(chan Job)
done := make(chan struct{})
```

Do not force channels for counters, maps, or ordinary critical sections. Do not force mutexes for pipelines or lifecycle signaling.

## Channel rules

- The sender/owner closes the channel, not receivers.
- Closing broadcasts to all receivers; sending signals one receiver.
- Use `chan struct{}` for notifications with no payload.
- A nil channel blocks forever; set a channel to nil to disable a `select` case intentionally.
- If multiple `select` cases are ready, Go chooses pseudo-randomly; source order is not priority.
- Buffered channels weaken synchronization. Use a capacity only when it has a reason: known bounded result count, semaphore/rate limit, worker queue, or backpressure.
- Do not close a channel with multiple concurrent senders unless a single owner can prove all sends are complete.

## WaitGroup and errgroup

For `sync.WaitGroup`:

- Go 1.25+: use `wg.Go(fn)` when it fits and you do not need error return/cancellation semantics.
- Older Go or custom handling: call `wg.Add(1)` before starting the goroutine; `defer wg.Done()` inside.
- Never copy a `WaitGroup`, `Mutex`, `RWMutex`, `Cond`, `Once`, or atomic value after first use.

Use `errgroup` only when the project already depends on `golang.org/x/sync/errgroup` or the dependency is approved. It is often right when goroutines should share cancellation and return the first error.

## Worker pools and bounded parallelism

- Bound CPU-bound work near available parallelism (`runtime.GOMAXPROCS(0)` is a useful starting point).
- Bound I/O-bound work by the external system’s capacity and your resource limits.
- Avoid one goroutine per item for unbounded input.
- Close result channels after all workers finish, not from each worker.
- Preserve input order only if callers need it; otherwise document unordered results.

## Loop variables

Go 1.22+ gives each iteration its own loop variables. For modules targeting older Go, explicitly capture loop variables before launching goroutines or subtests:

```go
for _, item := range items {
    item := item
    go func() { process(item) }()
}
```

Even on Go 1.22+, explicit capture can improve clarity when supporting mixed toolchains or generated code.

## Data races and race conditions

A data race is unsynchronized concurrent access to the same memory where at least one access writes. A race condition is behavior that depends on timing/order even if the program is data-race-free. Fix both.

Common hazards:

- Concurrent map read/write: protect with mutex, channel ownership, or `sync.Map` when its access pattern fits.
- Concurrent `append` to shared slices: unsafe even when each goroutine receives a different result variable if capacity aliases.
- Copying a map/slice header under lock and iterating outside lock: still aliases backing data. Clone under the lock first.
- Calling `fmt` on a value while holding a lock if its `String` method also locks.
- Mutating values after sending pointers/slices/maps to another goroutine.

Run `go test -race ./...` for concurrent changes. The race detector is runtime instrumentation; tests must execute the relevant paths.

## Pipelines

Pipeline stages should:

- Receive until inbound channels close or cancellation fires.
- Close outbound channels when all sends are done.
- Select on cancellation around sends that can block.
- Ensure upstream senders are unblocked if downstream returns early.

Prefer `context.Context` for request-scoped cancellation. A closed `done chan struct{}` is still useful for small internal pipelines when context values/deadlines are unnecessary.

## Atomics

Use `sync/atomic` for simple low-level counters, flags, and pointers when a mutex would be excessive and invariants are simple. Prefer typed atomics (`atomic.Bool`, `atomic.Int64`, `atomic.Pointer[T]`) on Go 1.19+.

If more than one field must change together, use a mutex.

## Review questions

- Who owns each goroutine, channel, timer, ticker, and resource?
- Can every goroutine exit if the caller returns early or the context is canceled?
- Are shared maps/slices/structs protected for the full duration of access?
- Are channel buffer sizes justified?
- Is cancellation propagated without accidentally canceling detached work?
- Would a synchronous API be simpler and safer?
