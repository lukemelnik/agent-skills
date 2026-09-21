---
name: verification
description: Prove software behavior through the appropriate real boundary. Use when verifying a change, reproducing behavior, smoke-testing a UI or CLI, running an app, or collecting runtime evidence before declaring work complete.
---

# Verification

Treat environment readiness as part of verification. A build or unit test is not proof of user-visible behavior.

## Workflow

1. **Define the claim.** State what must work and choose the narrowest boundary that can prove it.
2. **Preflight the environment.**
   - Read project run, testing, and verification instructions.
   - Identify the exact branch, worktree, build, server, simulator, binary, and data target involved.
   - Reuse or start the documented instance only when runtime proof is needed.
   - Confirm readiness, required services, authentication, fixtures, and seed data.
   - Perform documented non-destructive setup when allowed. Ask before resets, deletion, production access, or other destructive preparation.
   - An unavailable app is normally a setup problem to resolve, not a reason to skip verification when a documented launch path exists.
3. **Drive the real surface.** Enter through the public UI, CLI, API, or library interface and perform the relevant user action. Do not substitute internal state mutation for the journey being proved.
4. **Observe the result.** Capture the action and resulting state. Check persisted or external side effects through a second read when they matter.
5. **Add durable proof.** Run or add the narrowest automated test that covers the regression risk. Do not duplicate behavior across test levels without a distinct reason.
6. **Clean up safely.** Stop only processes started by the run and remove only disposable state the project permits removing. Preserve useful evidence.
7. **Report honestly.** Name the surface, preflight state, evidence, commands or tests, and any unverified behavior.

Re-run affected proof after the final code change. Never claim runtime verification from compilation, static inspection, or an agent report alone.
