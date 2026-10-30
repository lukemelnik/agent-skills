# Cancellation

Cancellation is cooperative: `cancel()` only sets a flag.

- Cancelling a parent or group cancels children; `Task {}` / `Task.detached {}` must be cancelled via a stored handle (cancel the previous one before replacing it, and in `deinit`).
- CPU-bound loops with no `await` never see cancellation; call `try Task.checkCancellation()` periodically.
- `.task {}` cancels on disappear; `.task(id:)` cancels and restarts when the id changes.
- Always handle `catch is CancellationError` before the generic catch; it is a normal lifecycle event, not a user-facing error.
- `withTaskCancellationHandler`'s `onCancel` fires immediately, even while the body is suspended, and may run on any thread. Use it to cancel legacy operations (e.g. `CKQueryOperation.cancel()`).
