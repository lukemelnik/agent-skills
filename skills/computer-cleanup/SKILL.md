---
name: computer-cleanup
description: Inspect and safely reclaim macOS storage, including Songkeeper iOS build artifacts in known temporary-build, XcodeBuildMCP, DerivedData, and simulator locations. Use for low disk space, slow development caused by storage pressure, a requested computer cleanup, verified task completion, or worktree retirement. Prune proven retired-worktree simulators while preserving current devices, active work, warm build caches, and release artifacts.
---

# Computer Cleanup

## Lifecycle policy

- Before iOS development, run `df -h /System/Volumes/Data`. If available space is below **20 GiB**, report storage pressure and inspect the known locations below; do not start an expensive machine-wide scan.
- At **verified task completion**, preserve the verification summary and required evidence, then remove only disposable temporary build outputs created by this task and no longer needed. If the task may resume, retain its warm incremental build cache.
- At **verified task completion and worktree retirement**, include the retired-worktree simulator pass below. The user has approved this narrow routine: remove only shutdown, unassigned Songkeeper-managed devices belonging to worktrees that no longer exist. Preserve current, booted, custom, and ambiguous devices.
- At **worktree retirement**, also review that worktree's temporary builds and MCP build/test products. Run any existing project worktree lifecycle command first; do not replace it with raw worktree deletion.
- Do **not** clear caches after every successful build/test. Repeatedly deleting DerivedData, package downloads, or shared caches makes development slower.
- Apart from the narrowly approved retired-worktree simulator pass, treat cleanup of older tasks or shared storage as a separate, previewed cleanup requiring user approval. Do not assume another task is finished because its worktree is clean or its simulator is shut down.
- Implement this policy through the project's task-completion guidance. Merely installing this skill does not install a scheduler or a filesystem hook.
- Keep discovery and cleanup bounded: use the known paths and project commands below, command timeouts, and short status checks. Never block on an unbounded agent lookup, whole-home search, or tool wait. If a command, lock, or resource queue cannot finish within the current budget, report the blocker/pending state rather than silently waiting or bypassing it.

## Known locations

Inspect only the relevant locations; these are a map, not blanket deletion targets. Sizes change, so measure rather than reuse historical totals.

| Location | Contents and cleanup policy |
| --- | --- |
| `/private/tmp/songkeeper-ios-build-<branch-slug>[-up]-<path-checksum>` (`/tmp` is a symlink) | Task/worktree-specific iOS build products. `scripts/ios-simulator.sh` derives the label, optional purpose suffix, and `cksum` of the project-root path. Match the complete path to its owner; a branch slug alone is insufficient. Respect its sibling `.lock` directory. |
| `~/Library/Developer/XcodeBuildMCP/workspaces/<workspace-id>/DerivedData` | Generated MCP builds. Prefer stale, inactive workspace-specific caches over the current workspace's incremental cache. |
| `~/Library/Developer/XcodeBuildMCP/workspaces/<workspace-id>/test-products` | Reusable test products. Remove only after tests and required evidence capture finish; preserve anything needed for an ongoing review/reproduction. |
| `~/Library/Developer/XcodeBuildMCP/workspaces/<workspace-id>/result-bundles` and `logs` | Test/debug evidence. Preserve failures under investigation and streams currently writing logs. Do not treat all evidence as disposable. |
| `~/Library/Developer/Xcode/DerivedData/Songkeeper-*` | Project-specific Xcode builds. Keep the current incremental cache during ongoing work; consider old inactive project directories during approved pressure cleanup. Leave shared `ModuleCache.noindex`, `CompilationCache.noindex`, and `SDKStatCaches.noindex` alone by default. |
| `~/Library/Developer/XCTestDevices` | Test simulator state, not just compiler output. Require explicit approval and no active tests. |
| `~/Library/Developer/CoreSimulator/Devices` | Simulator apps, databases, logins, and unsynced test data. Apply the approved retired-worktree pass below using exact device UUIDs; require explicit approval for any other deletion. |
| `/Library/Developer/CoreSimulator/Caches/dyld` | System-managed simulator cache. Inspect if necessary; do not manually purge as routine task cleanup. |
| `/System/Library/AssetsV2/com_apple_MobileAsset_iOSSimulatorRuntime` | Runtime backing assets. Remove an explicitly approved unused runtime through the `simctl runtime` workflow below or Xcode runtime management, never filesystem deletion. |
| `/private/var/tmp/SpeechModelCache` | Apple-managed speech models. Not Songkeeper build output; leave untouched during routine cleanup. |
| `~/Library/Caches/com.openai.codex`, `~/Library/Caches/Codex`, `~/Library/Caches/ms-playwright` | Optional cross-project headroom to report separately. Require explicit approval and app/tool-aware cleanup; do not purge active agent caches or browser installations needed by current verification. |

Never routinely remove Xcode archives, dSYMs required for symbolication, exported `.ipa` files, signing assets, source checkouts, worktrees, global application caches, or distribution artifacts. Do not read `.env` or `.env.*` files.

## Worktree-owned temporary builds

Prefer the existing lock-aware command for a verified, finished worktree, after preserving evidence and confirming the caches are no longer needed:

```bash
IOS_SIMULATOR_LOCK_TIMEOUT=5 pnpm ios:derived-data:clean
```

Run it **from the owning Songkeeper worktree**, never from an unrelated checkout. The command removes only that worktree's default and manual (`-up`) temporary DerivedData caches. A lock timeout means defer cleanup; never remove a lock to force progress. Do not invoke this after each build or during ongoing work. It does not clean MCP artifacts, simulator devices, or runtime images.

## Targeted read-only inspection

Start with available space and the project-specific paths:

```bash
df -h /System/Volumes/Data
du -sh /private/tmp/songkeeper-ios-build-* 2>/dev/null
du -x -h -d 2 "$HOME/Library/Developer/XcodeBuildMCP/workspaces" 2>/dev/null
du -sh "$HOME"/Library/Developer/Xcode/DerivedData/Songkeeper-* 2>/dev/null
```

A glob with no matches may produce no result or a shell error; that does not establish inactivity. Do not scan all of `/tmp`, the home directory, or the disk unless these locations fail to explain the pressure.

If simulator storage remains relevant, inspect it separately:

```bash
xcrun simctl list devices
xcrun simctl list runtimes
du -x -h -d 1 "$HOME/Library/Developer/CoreSimulator/Devices" 2>/dev/null
```

Never use `simctl delete all`, `erase all`, or `shutdown all` for routine cleanup. Do not add mounted runtime filesystem sizes to their backing-asset sizes; use filesystem-bounded `du -x` and actual Data-volume free space. APFS clones/compression can make directory totals differ from reclaimable bytes.

## Retired-worktree simulator pass

1. Read `git worktree list --porcelain` from the Songkeeper repository. Protect every registered worktree, even a missing/prunable path; collect its branch and directory basename (detached worktrees use the basename).
2. For every existing worktree, resolve and read the **non-secret Git metadata** files `songkeeper-ios-simulator-id` and `songkeeper-ios-up-simulator-id` using `git -C <worktree> rev-parse --path-format=absolute --git-path <filename>`. Protect those cached UUIDs regardless of the device's current name. Do not read environment files.
3. Inventory `xcrun simctl list devices --json`. Match only the project-generated naming scheme in `scripts/ios-simulator.sh`: `Songkeeper <branch-or-worktree-label>` and optional trailing ` up`. Preserve `main`, all current labels/cached UUIDs, other projects' devices, custom names, and any ambiguous ownership. Validate the extracted label as a Git branch/worktree label; a name containing spaces other than the known suffix is not proof of ownership.
4. Select only devices whose owning worktree is absent from the registered inventory, which are **Shutdown**, have no live process/open files referring to their UUID/device directory, and have no `/private/tmp/songkeeper-ios-sim-<UUID>.lock`. Do not treat merely being shutdown as retirement. An active build on a different, explicitly identified protected UUID need not prevent pruning unrelated retired devices; defer if its destination or candidate activity is unclear.
5. Preview exact UUIDs, names, count, and candidate directory sizes. Recheck current assignments, activity, and device state immediately before deletion. The standing approval covers only the eligible retired-worktree devices; do not erase or stop a current/booted device to make it eligible.
6. Run `xcrun simctl delete <exact-UUID>` for each selected device with a bounded timeout. Never use `delete all`, `erase all`, raw device-directory deletion, or blanket shutdown. On a timeout, stop and inspect actual inventory before retrying.
7. Verify the selected UUIDs and their device directories are gone and every protected UUID remains. Report both removed directory usage and measured Data-volume free space; do not present the former as reclaimed bytes. Simulator files can share APFS clone blocks, CoreSimulator deletion may complete asynchronously, and concurrent builds can consume newly freed space. Leave runtimes, current-worktree devices, custom devices, and unknown test-device clones alone. At retirement, capture known device assignments before removing a worktree so ownership need not be inferred later.

## Explicitly approved unused runtime removal

Runtime removal is **not** part of the standing retired-device approval. Obtain approval for the exact version to remove; old-iOS compatibility testing may still need a runtime even with no saved devices.

1. Read `xcrun simctl runtime help`, `xcrun simctl runtime list --json`, and `xcrun simctl list devices --json`. Match the approved version and build to its runtime disk-image **`identifier` UUID**, `runtimeIdentifier`, and `deletable` state. Runtime image UUIDs are distinct from device UUIDs and the `com.apple.CoreSimulator.SimRuntime.*` identifier.
2. Confirm that **zero devices**, including shutdown devices, reference that runtime and that no requested compatibility check needs it. Also require an **idle simulator environment across all runtimes**: no native builds/tests and no booted devices. Apple's runtime deletion can shut down booted devices on other runtimes, even when the selected runtime has no devices. If anything is active, defer and coordinate an explicitly approved maintenance window; never silently interrupt another task or kill a build. Do not infer disuse just from `lastUsedAt`, age, or a missing booted device.
3. Preview only the exact image with `xcrun simctl runtime delete <image-UUID> --dry-run`. Confirm that the preview matches the approved version/build and does not include the runtime serving current devices.
4. Run `xcrun simctl runtime delete <image-UUID>` with a bounded timeout. Never use `all`, age-based bulk deletion, `sudo`, direct deletion of runtime assets/mounts, or a shared-service restart. On a permission/tooling refusal, report it and use Xcode runtime management with user assistance rather than forcing filesystem removal.
5. Distinguish **accepted** from **finished**: a successful command may leave an image in `Deleting` while CoreSimulator unmounts/reclaims it asynchronously. Do other independent work, then make a bounded follow-up inventory check. Do not immediately assert failure, repeat the destructive command blindly, or spin/wait indefinitely. If still pending, report that honestly.
6. Verify the selected image disappears from `simctl runtime list --json`, the current runtime remains `Ready`, and all protected device UUIDs remain. If the user explicitly approved coordinated shutdowns, record the agreed pre-maintenance device states and restore those states afterward; report any unexpected state changes rather than claiming the operation was side-effect-free. Recheck Data-volume free space; backing assets, APFS sharing, and deferred cleanup can delay or reduce the apparent gain. Do not manually purge a parent disk image or associated shared caches to force the estimated bytes to appear.

## Approve and execute exact build-artifact targets

1. Identify each artifact's source worktree/task using `scripts/ios-simulator.sh`, nested DerivedData `info.plist` → `WorkspacePath`, MCP workspace metadata, or the recorded build path. Exclude other projects. Preserve MCP workspace `state`, `locks`, and session configuration; remove approved artifact **leaf directories**, not the entire workspace.
2. Establish inactivity from multiple signals: no matching compiler/build/test process, no open files beneath the target, no booted simulator or active session still depending on it, and no recent descendant writes. Inspect descendant mtimes, not only the directory's own mtime. Age alone, no open handles alone, or a shutdown simulator alone is insufficient. Treat permission failures or an incomplete inspection as unknown, not safe.
3. Preview exact absolute paths, measured sizes, ownership/inactivity evidence, and preservation risks. For older/shared build artifacts, obtain user approval for that scope. If ownership or artifact value is uncertain, skip and explain.
4. Immediately before deletion, recheck activity, path ownership, and the approved scope. Resolve parent paths; refuse symlinked targets, unexpected roots, and directories containing release artifacts. Do not follow links to other trees. If another build/test starts, defer cleanup rather than killing it.
5. Delete only the reviewed, literal artifact paths. Never expand a wildcard in a destructive command; never blanket-remove `/tmp`, MCP `workspaces`, DerivedData, all simulators, or all caches. Do not use `sudo`, stop shared services, or remove worktrees as part of build-artifact cleanup.
6. Re-run `df -h /System/Volumes/Data` and check the exact targets are gone. Report measured free-space change, removed categories, and preserved active work. If a check or deletion fails, report partial completion rather than claiming success. Stop when adequate space is recovered; simulator or system-cache deletion is not required to exhaust every cleanup possibility.
