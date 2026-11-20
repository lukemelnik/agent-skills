---
name: personal-mac-app
description: Start or extend a personal macOS tool built for the owner's own Macs (menu-bar utilities that replace commercial apps). Use when creating a new personal Mac app, adding its build/install/update flow, registering it for sync across Macs, or setting up its AGENTS.md and issue backlog.
---

# Personal Mac App

A personal tool is a native app for the owner's own Macs, not a product: no App Store, no onboarding, no settings "for later". It replaces only the parts of a commercial app the owner actually uses.

## Source of truth: copy, don't restate

This skill holds the pattern, not the files. The newest tool listed in `tool-repos.json` in the dotfiles repository is the reference implementation. Copy its `project.yml`, `Makefile`, `.gitignore`, `AGENTS.md` layout and composition-root structure, and change only names. When a better way is found in one tool, update that tool and the others that need it; change this skill only when the pattern itself changes. Never paste file contents or signing values into this skill.

## The pattern

- **Own repository**, private on GitHub, default branch `main`. Registered in `tool-repos.json` so `dotfiles sync` installs and updates it on every Mac.
- **XcodeGen** `project.yml`; the generated `.xcodeproj` is gitignored and never edited.
- **Makefile** with `generate build install run update test`. `install` copies the Debug build to `/Applications/<App>.app` (one copy for macOS to launch, list and start at login) and re-registers it with LaunchServices. `update` is `git pull --ff-only` then `run`.
- **Signing**: manual, Apple Development identity and the owner's team, identical across tools. Permissions (Accessibility, Screen Recording, Full Disk Access) are tied to bundle ID and signing identity; an ad-hoc build loses them on every rebuild. Only the owner can grant them.
- **Shape**: menu-bar only (`LSUIElement`), no sandbox, hardened runtime, Swift 6 language mode, `MainActor` default isolation, deployment target = the oldest macOS among the owner's Macs.
- **Code layout**: `Packages/<App>Core` holds pure logic (no AppKit/SwiftUI) with Swift Testing tests; `App/Sources` is the AppKit/SwiftUI shell with one composition root that builds everything in `applicationWillFinishLaunching`. Panels are `NSPanel`s with SwiftUI content.
- **Agent surface**: a URL scheme (`<app>://...`) for every user-visible command, so agents can drive and verify without a keyboard; `os.Logger` with subsystem = bundle ID.
- **Dependencies**: Apple frameworks first; third-party only when established and widely used, and only with the owner's approval.
- **Native look, owner's taste**: plain dark surfaces; no Liquid Glass unless asked. Prototype any open-ended UI (screenshot or mock) before building it out.

## Repository docs

`AGENTS.md` (with `CLAUDE.md` symlinked to it) records: what the tool replaces and the owner's scope rule; status split into built / verified by running / not verified; commands, including the URL commands and the log query; architecture; things that will bite. `README.md` is the owner's setup guide (permissions, system shortcuts to disable). Keep both current with each change.

## Backlog

GitHub issues in the tool's repository are the backlog. Anything not done right away becomes an issue. Follow the `github-issues` skill: parents with native sub-issues for programs, `now` / `next` / `later` labels plus `discussion` for undecided designs, and `Refs #N` in commits.

## Verifying

`make test`, `make build` with no warnings in project code, then `make run` and drive the change through its URL command; confirm visually with `screencapture` and in the log. Say plainly which keyboard, mouse and permission-gated behaviour could not be exercised.
