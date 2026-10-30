---
name: build-run-debug
description: Build, run, and debug local macOS apps and SwiftPM packages from the shell, triage failing macOS tests, and verify os.Logger events after a run. Use when asked to build or launch a Mac app, diagnose compiler/linker/launch failures, run macOS tests, or confirm logged events fire.
---

# Build / Run / Debug

Shell-first (`xcodebuild`, `swift build`/`run`/`test`). Do not assume simulators or iOS tooling for macOS work.

## Workflow

1. Find `.xcworkspace`, `.xcodeproj`, `Package.swift`. For Xcode, prefer the app-producing scheme unless the user names one; for SwiftPM, state which executable product you chose if several exist.
2. Create or update `script/build_and_run.sh` as the stable kill-build-run entrypoint: stop the existing process, build, launch the fresh app. Optional flags: `--debug`, `--logs`, `--telemetry`, `--verify`. Don't leave the user with a one-off command chain once the script exists.
3. Build and run through the script; use debug/log flags only when needed.
4. Classify failures: compiler, linker, signing, build settings, missing SDK/toolchain, script bug, runtime launch. If output is huge, report the first real blocker and the next proof step.

## SwiftPM notes

- A library-only package is not runnable; a pure package produces no app bundle.
- Filter tests with `swift test --filter <Target>/<Case>`.

## Test triage

- Run the smallest failing scope first; separate compile failures from test execution failures.
- App-hosted tests can fail from a missing host app, entitlements, or sandbox rather than a regression; check these before blaming the code.
- Flag iOS/simulator-only assumptions and mark likely flakes as such.

## Logging

- Use `os.Logger` (subsystem = bundle id, category per feature), not `print`; never log secrets or document contents.
- After a run, verify the event fired: `log stream --style compact --predicate 'subsystem == "<bundle id>"'`. Don't claim an event is wired without this.
