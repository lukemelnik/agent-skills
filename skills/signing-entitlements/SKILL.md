---
name: signing-entitlements
description: Inspect signing, entitlements, hardened runtime, and Gatekeeper issues for macOS apps. Use when asked to diagnose code signing failures, missing entitlements, sandbox problems, notarization prerequisites, or trust-policy launch errors.
---

# Signing & Entitlements

## Quick start

Use this skill when the failure smells like codesigning rather than compilation:
launch refusal, missing entitlement, invalid signature, sandbox mismatch,
Hardened Runtime confusion, or trust-policy rejection.

## Workflow

1. Inspect the bundle or binary.
   - Locate the `.app` or executable.
   - Identify the main binary inside `Contents/MacOS/`.
2. Read signing details.
   - `codesign -dvvv --entitlements :- <app-or-binary>`
   - `spctl -a -vv <app-or-binary>` when Gatekeeper behavior matters
   - `plutil -p` for entitlements or `Info.plist` inspection
3. Classify the failure.
   - Unsigned or ad hoc signed
   - Wrong identity
   - Entitlement mismatch
   - Hardened Runtime issue
   - App Sandbox issue
   - Nested code signing issue
   - Distribution prerequisite issue
4. Explain the minimum fix path.
   - Say exactly what is wrong.
   - Show the shortest validation or repair sequence.
   - Distinguish local development problems from distribution problems.

## Guardrails

- Never invent missing entitlements.
- Do not conflate notarization with local debug signing.
- If the real issue is a build setting or provisioning profile, say so directly.

## When to use other skills

- Use `packaging-notarization` when the work is about archive structure or notarization readiness.
- Use `apple-release` when the task becomes broader release automation.
