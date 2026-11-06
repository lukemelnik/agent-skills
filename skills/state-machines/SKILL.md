---
name: state-machines
description: Model lifecycle and workflow logic in application code as explicit state machines. Use when writing, changing, or reviewing code with status fields, multi-step flows, async request lifecycles, retries, cancellation, or interacting boolean flags, or when fixing bugs caused by impossible or out-of-order states.
---

# State Machines

## Decide

Model the logic explicitly when any of these apply:

- Several booleans or nullable fields describe one lifecycle and some combinations should be impossible.
- The same status checks are scattered across callers.
- Events can arrive late, twice, out of order, or after cancellation.
- Status is persisted or crosses a process boundary.
- The flow has retries, timeouts, cancellation, or compensation.

Leave linear code, simple toggles, and derived values alone. Follow an existing state pattern in the repository. If unrelated implicit state needs restructuring, report it rather than expanding the change.

## Design

1. Write the states, events, and transitions as a table before coding. Include failure and terminal states.
2. Decide what every event does in every state: transition, ignore, or reject. Reject events that indicate a bug; ignore expected stragglers.
3. Keep data on the state that owns it, so illegal combinations cannot be represented.
4. Route every change through one pure transition function, and make it exhaustive where the language allows.
5. Run side effects outside the transition, after the new state is committed.
6. Derive values such as `isLoading` from the state instead of storing them.

## Choose an encoding

- Default to the language's sum type and a transition function: a TypeScript discriminated union, a Swift or Rust enum with associated values, or a Go sealed interface.
- Use a flat status enum and a transition table when states carry no distinct data or the status is stored as a single column.
- Use a library only when the project already has one, or when hierarchical or parallel states justify it. A new dependency needs user approval.

```ts
type Upload =
  | { status: "idle" }
  | { status: "uploading"; attemptId: string }
  | { status: "done"; url: string }
  | { status: "failed"; error: string };

type UploadEvent =
  | { type: "start"; attemptId: string }
  | { type: "succeeded"; attemptId: string; url: string }
  | { type: "failed"; attemptId: string; error: string }
  | { type: "cancel" };

function transition(state: Upload, event: UploadEvent): Upload {
  switch (state.status) {
    case "idle":
    case "failed":
      return event.type === "start"
        ? { status: "uploading", attemptId: event.attemptId }
        : state;
    case "uploading":
      if (event.type === "cancel") return { status: "idle" };
      // A late result from a cancelled or replaced attempt must not apply.
      if (event.type === "start" || event.attemptId !== state.attemptId) return state;
      return event.type === "succeeded"
        ? { status: "done", url: event.url }
        : { status: "failed", error: event.error };
    case "done":
      return state;
  }
}
```

## Persisted and concurrent state

- Store one status column, with database constraints on allowed values and state-specific fields where supported.
- Apply transitions with compare-and-set: `UPDATE ... SET status = :next WHERE id = :id AND status = :expected`. Zero affected rows means the transition lost a race, so do not run its effects.
- Make event handling idempotent, and tag async work with an attempt ID so stale results are ignored.
- Give every non-terminal state an exit, such as a timeout, retry, or recovery job, so a crash cannot strand a record.
- Use the project's outbox or equivalent when an effect must not be lost after a commit.
- When changing states, account for existing rows and for older code still reading them during rollout.

## Prove it

- Test every allowed transition, and cover rejected or ignored state and event pairs with a table-driven test.
- Test late, duplicate, and post-cancellation events.
- Test compare-and-set races and stuck-state recovery against the real database, not a mock.

Include the transition table in the spec or PR body when the machine has more than a few states.
