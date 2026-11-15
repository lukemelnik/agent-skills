---
name: github-issues
description: Maintain GitHub issue backlogs, parent and sub-issue relationships, and concise agent checkpoints so work can resume without its original conversation. Use for issue capture, triage, orchestration status, handoffs, and completion cleanup.
---

# GitHub Issues

Use issues as the durable work record. A replacement agent should recover the goal, current source, remaining work and proof without the originating chat. Follow repository instructions for labels, shipping and permissions; tracking work does not authorize implementing or shipping it.

## Start with the cheapest useful state

For a status check, fetch issue numbers, titles, state, labels, update times and URLs, plus native parent/sub-issue summaries where relevant. Do not read every body or comment. For example:

```sh
gh issue list --state open --limit 100 --json number,title,labels,updatedAt,url
```

Paginate when the result reaches the limit. Filter the returned metadata locally, or query one status label at a time. Repeated `--label` flags mean AND, so they do not find the union of `now` and `next`.

Cache fetched state for the current session and refresh changed or claimed items at decision boundaries. Read a selected task's full spec and linked contracts before implementation; token savings must not omit its requirements. On resume, read its checkpoint and only the evidence/comments needed to resolve gaps. The latest comment is not necessarily the authoritative checkpoint.

## Capture and relationships

Search open and closed issues by outcome before creating a new one. Reuse an existing issue, or add only the missing scope. A small task needs a problem, desired outcome, relevant context and observable completion condition. Use the spec workflow when the user requests an implementation-ready spec; a capture or discussion issue is not one.

Use a parent for a coherent program whose children have independent outcomes. Use native GitHub sub-issues for those relationships; a Markdown link is only a cross-reference. Check the existing parent before attaching a child, and do not replace it without resolving ownership. A child has one parent; other programs link to it as a dependency or reference. Parentage does not establish execution order: record actual prerequisites explicitly, using native blocking relationships when available.

Do not convert a running checklist tracker, rewrite an active spec, or move claimed work merely to standardize its format. Preserve its coordination contract and add only the narrow authorized correction. Adopt this format as work is created or handed off.

## Labels and readiness

Reuse the repository vocabulary. Where none exists, a compact default is:

- One primary area such as `web`, `ios`, `api`, `infra` or `marketing`.
- One open-work status: `now` for claimed execution, `next` for ready selected work, `later` for backlog/discussion, or `blocked` with a named prerequisite or decision.
- Priority only when it changes ordering. `spec` marks an implementation spec, not readiness.

Parents and executing children may both be `now`; count programs and execution tasks separately. Do not demote active work or enforce a new work-in-progress cap during cleanup. Keep discussion clearly marked as discussion, with open decisions and the evidence needed to settle them.

For an explicitly approved parking-lot cleanup, keep a compact index of links, one-line ideas and revisit triggers. Close the original deferred issues as not planned with a link to that index; preserve their bodies/history. A rejected idea closes without becoming a parked commitment. An explicitly requested standalone discussion remains its own issue.

## Resumable checkpoints

Keep a parent focused on its goal, important constraints, relationships and current coordination. A short `Resume here` block (roughly 10–15 lines) should identify:

- Checkpoint date and owner, with a retrievable thread link and branch/worktree when applicable.
- Latest integrated commit and any unmerged backup commit/branch; distinguish local, pushed, deployed and released states.
- Verified completed work and direct proof links, plus outstanding gates or limitations.
- The next bounded action, blockers, shared-file ownership and material stop conditions.

A child needs its own checkpoint when it has independent in-flight work. Record the claim before overlapping execution and clear or transfer it on handoff. A silent/lost conversation does not prove its work stopped; inspect the recorded branch/commit and coordinate before assigning the same write boundary again. Never overwrite uncommitted work to recover a thread.

Rewrite only the owned checkpoint section rather than appending a running diary to the body. Put significant decisions and evidence in comments, then link the relevant comment from the checkpoint. Preserve binding spec sections. Re-fetch immediately before a body edit; if someone else changed it, reconcile instead of submitting an old whole-body replacement. Do not replace an active owner's checkpoint during unrelated cleanup.

## Completion and cleanup

Close only the outcome that the evidence establishes. A merged commit is implementation evidence, not automatically deployment or release proof. Mark a child complete after its required gates and delivery boundary; leave unrelated parent work open. Use `Closes #N` in PR repositories and verify auto-closure. For direct-to-main repositories, close explicitly after the required delivery proof.

Use completed for verified delivered scope; use not planned for rejected, parked, duplicate or superseded scope and name the successor when one exists. Do not call abandoned acceptance criteria complete. Preserve known verification limitations in the closing note; keep an unresolved defect open or link its follow-up.

Before closing a parent, check its native children and any legacy checklist for remaining scope or required follow-ups. Do not infer completion from closed children alone if the parent has other gates. Remove active-status labels on closure and refresh the small status index. Verify relationships and resulting states after mutations. If an API write has an ambiguous result, read back before retrying to avoid duplicate issues/comments.

When migrating reminders, preserve their detail in the target issue or an approved parking entry and verify that destination first. Remove only the exact authorized source items after successful capture; leave new or unmatched reminders intact. Retire an empty list only when authorized.
