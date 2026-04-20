---
name: telemetry
description: Add lightweight runtime telemetry and debug instrumentation to macOS apps, then verify those events after building and running. Use when wiring Logger or os.Logger, adding log points for window, sidebar, or menu actions, reading runtime logs from Console or log stream, or confirming that expected events fire after a local run.
---

# Telemetry

## Quick start

Use this skill to add lightweight app instrumentation that helps debug behavior
without turning the codebase into a logging landfill. Prefer Apple's unified
logging APIs and verify events after a build and run loop.

## Core guidelines

- Prefer `Logger` from `OSLog` for structured app logs.
- Give each feature a clear subsystem and category pair.
- Log meaningful user and app lifecycle events: window opening, sidebar selection changes, menu commands, menu bar actions, sync milestones, and unexpected fallback paths.
- Keep info logs concise and stable. Use debug logs for noisy state details.
- Do not log secrets, auth tokens, personal data, or raw document contents.

## Minimal pattern

```swift
import OSLog

private let logger = Logger(
  subsystem: Bundle.main.bundleIdentifier ?? "SampleApp",
  category: "Sidebar"
)
```

## Workflow

1. Identify the behavior that needs observability.
2. Add the smallest useful instrumentation.
   - Create one logger per feature area or type.
   - Prefer one high-signal line per user action over noisy dumps.
3. Build and run the app.
   - Use `build-run-debug` for the build and launch loop.
4. Read runtime logs and verify the event fired.
   - Console.app with a process or subsystem filter
   - `log stream --style compact --predicate 'process == "AppName"'`
   - Tighter subsystem and category predicates when known
5. Remove or demote temporary noisy logs before finishing.

## Guardrails

- Do not use `print` as the primary telemetry mechanism for macOS app code.
- Do not leave dense debug logs around every state mutation.
- Do not claim an event is wired correctly until you have a concrete verification path.

## When to use other skills

- Use `build-run-debug` when the main task is launching or debugging the app.
- Use `test-triage` when the problem is a failing automated test rather than runtime observability.
