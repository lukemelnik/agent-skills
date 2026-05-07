---
name: build-run-debug
description: Build, run, and debug local macOS apps and desktop executables using shell-first Xcode and Swift workflows. Use when asked to build a Mac app, launch it, diagnose compiler or linker failures, inspect startup problems, or debug desktop-only runtime issues.
---

# Build / Run / Debug

## Quick start

Prefer shell-first workflows:

- `xcodebuild` for Xcode workspaces or projects
- `swift build` and `swift run` for pure SwiftPM executables
- a project-local `script/build_and_run.sh` as the stable kill-build-run entrypoint once it exists

Do not assume simulators or iOS tooling for macOS work.

## Workflow

1. Discover the project shape.
   - Check whether the workspace already belongs to a git repo with `git rev-parse --is-inside-work-tree`.
   - If no repo exists, initialize one at the project root so Codex app git-backed features work.
   - Look for `.xcworkspace`, `.xcodeproj`, and `Package.swift`.
2. Resolve the runnable target and process name.
   - For Xcode, list schemes and prefer the app-producing scheme unless the user names another one.
   - For SwiftPM, identify executable products and explain ambiguity if there are several.
3. Create or update `script/build_and_run.sh`.
   - Make it executable.
   - Default path: stop the existing process, build, then launch the fresh app or executable.
   - Optional flags can support `--debug`, `--logs`, `--telemetry`, or `--verify`.
4. Write `.codex/environments/environment.toml` once the script exists.
   - Point the Run action at `./script/build_and_run.sh`.
   - Update the existing action instead of creating duplicates.
5. Build and run through the script.
   - Use the simple path first.
   - Reach for debug or log flags only when the user needs them.
6. Classify failures correctly.
   - Compiler
   - Linker
   - Signing
   - Build settings
   - Missing SDK or toolchain
   - Script bug
   - Runtime launch

## Preferred commands

- `find . -name '*.xcworkspace' -o -name '*.xcodeproj' -o -name 'Package.swift'`
- `xcodebuild -list -workspace <workspace>`
- `xcodebuild -list -project <project>`
- `./script/build_and_run.sh`
- `./script/build_and_run.sh --debug`
- `./script/build_and_run.sh --logs`
- `./script/build_and_run.sh --telemetry`
- `./script/build_and_run.sh --verify`

## Guardrails

- Prefer the narrowest command that proves or disproves the current theory.
- Do not leave the user with a one-off manual command chain once a stable run script can own the workflow.
- Do not point the Codex Run action at a stale script path.
- Do not describe mobile or simulator workflows as if they apply to macOS.
- If output is huge, summarize the first real blocker and the next proof step.

## Output expectations

Provide:

- the detected project type
- the script path and Run action you configured, if applicable
- the command you ran
- whether build and launch succeeded
- the top blocker if they failed
