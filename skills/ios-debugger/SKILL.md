---
name: ios-debugger
description: Use XcodeBuildMCP to build, run, launch, and debug iOS projects on a simulator. Use when asked to run an iOS app, interact with the simulator UI, inspect on-screen state, capture logs, or run tests via XcodeBuildMCP tools.
---

# iOS Debugger Agent

## Overview

Use XcodeBuildMCP to build and run the current project scheme on a booted iOS simulator, interact with the UI, capture logs, and run tests. Prefer MCP tools for simulator control, logs, and view inspection.

## Core Workflow

Follow this sequence unless the user asks for a narrower action.

### 1) Discover the booted simulator

- Call `mcp__XcodeBuildMCP__list_sims` and select the simulator with state `Booted`.
- If none are booted, ask the user to boot one (do not boot automatically unless asked).

### 2) Set session defaults

- Call `mcp__XcodeBuildMCP__session-set-defaults` with:
  - `projectPath` or `workspacePath` (whichever the repo uses)
  - `scheme` for the current app
  - `simulatorId` from the booted device
  - Optional: `configuration: "Debug"`, `useLatestOS: true`

### 3) Build + run

- Call `mcp__XcodeBuildMCP__build_run_sim`.
- If the app is already built and only launch is requested, use `mcp__XcodeBuildMCP__launch_app_sim`.
- If bundle id is unknown:
  1. `mcp__XcodeBuildMCP__get_sim_app_path`
  2. `mcp__XcodeBuildMCP__get_app_bundle_id`

### 4) Run tests

- Call `mcp__XcodeBuildMCP__test_sim` to run the test suite on the simulator.
- Review test output, fix failures, re-run until tests pass.

## UI Interaction & Debugging

Use these when asked to inspect or interact with the running app.

- **Describe UI**: `mcp__XcodeBuildMCP__describe_ui` before tapping or swiping.
- **Tap**: `mcp__XcodeBuildMCP__tap` (prefer `id` or `label`; use coordinates only if needed).
- **Type**: `mcp__XcodeBuildMCP__type_text` after focusing a field.
- **Gestures**: `mcp__XcodeBuildMCP__gesture` for common scrolls and edge swipes.
- **Screenshot**: `mcp__XcodeBuildMCP__screenshot` for visual confirmation.

## Logs & Console Output

- Start logs: `mcp__XcodeBuildMCP__start_sim_log_cap` with the app bundle id.
- Stop logs: `mcp__XcodeBuildMCP__stop_sim_log_cap` and summarize important lines.
- For console output, set `captureConsole: true` and relaunch if required.

## Agentic Build/Test Loop

For implementing features end-to-end:

1. Implement the feature code.
2. Build the app (`build_run_sim`).
3. If build fails, fix errors and rebuild.
4. Run tests (`test_sim`).
5. If tests fail, fix and re-run.
6. Take a screenshot to verify the UI.
7. Interact with the feature to confirm it works.

## Troubleshooting

- If build fails, ask whether to retry with `preferXcodebuild: true`.
- If the wrong app launches, confirm the scheme and bundle id.
- If UI elements are not hittable, re-run `describe_ui` after layout changes.
