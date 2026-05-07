---
name: pr
description: Generate a structured PR body that encodes engineering judgment, then open the pull request. Use when ready to open a PR for the current branch.
---

# Create Pull Request

Generate a PR body that encodes the *why*, not just the *what*. Reviewers and future readers should understand intent, constraints, and trade-offs without archaeology.

> **Why this exists.** The diff answers "what changed." The PR body should answer "what did we mean, what constraints shaped this, and how do we know it's correct?" In the agent era, where code is cheap and judgment is scarce, the PR body becomes the primary artifact that encodes engineering judgment for review, onboarding, and future-you.

**Input:** $ARGUMENTS — optional. Can be:
- **A spec file path** (e.g., `specs/2026-04-07-webhook-reliability.md`)
- **A GitHub issue number** (e.g., `42` or `#42`)
- **Empty** — auto-detect from branch

## Step 1: Find the spec

**If the user provided a spec path** (contains `/` or ends in `.md`), use it. Read the file directly.

**If the user provided a GitHub issue number** (numeric, optionally `#`-prefixed), fetch the issue body:
```bash
gh issue view <num> --json title,body,url
```
Use the issue body as the spec content. Remember the issue number — the PR body must include `Closes #<num>` to auto-link.

**Otherwise, auto-detect GitHub issue context first.** Local `specs/*.md` files can go stale; only use a local spec when the user passed it explicitly or the branch itself modified exactly one spec file.

```bash
DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name' 2>/dev/null || git remote show origin | sed -n '/HEAD branch/s/.*: //p' || echo main)
BASE=$(git merge-base HEAD "origin/$DEFAULT_BRANCH")

# Prefer issue references from commits on this branch
ISSUES=$(git log "$BASE"..HEAD --pretty=format:"%B" | grep -oE '#[0-9]+' | sort -u)

# Only then consider spec files changed by this branch
SPECS=$(git log "$BASE"..HEAD --name-only --pretty=format: | grep '^specs/.*\.md$' | sort -u)
```

- **Exactly one issue reference:** fetch it as the spec.
- **Multiple issue references:** ask the user which issue to use, unless one clearly matches an explicit caller instruction.
- **No issue reference and exactly one changed spec file:** use that local spec.
- **Multiple changed spec files:** ask the user to pick.
- **Still nothing:** fall back to **no-spec mode** (Step 2b).

## Step 2a: Spec-driven mode

Read the spec end to end. Treat it as intent and provenance, not the source of truth for what shipped. Use it for the goal, non-goals, decisions, constraints, and context only after checking those claims against the actual branch diff.

The PR body must describe the work actually present in the diff. Do not claim unfinished spec tasks are complete. If the implementation intentionally diverged from the spec, make that clear in the relevant section or the context manifest.

Note: specs from `/spec` (issue mode) may use slightly different section names (e.g., `Scope: In/Out` instead of `Non-Goals`). Adapt to whatever structure the spec uses — the principles are the same.

Skip to Step 3.

## Step 2b: No-spec mode

If there's no spec (hotfix, small change, `/cpr`, etc.), infer the PR body from the branch name, commits, and diff. Do not block automated finish-and-PR flows by asking discovery questions.

Ask the user 3-5 focused questions only when essential information cannot be inferred and the user did not ask for an automated PR creation flow:

- **Goal:** What's the outcome of this change in 1 sentence?
- **Non-goals:** Anything explicitly out of scope?
- **Risks:** What could break? What should reviewers pay extra attention to?
- **Verification:** How was this tested?
- **Rollback:** How would we undo this if it goes wrong?

Use answers when provided; otherwise right-size the body from the available evidence and omit sections that would be guesswork.

## Step 3: Read git history

Get the commits and changed files on this branch, then inspect enough of the actual diff to understand behavior:

```bash
DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name' 2>/dev/null || git remote show origin | sed -n '/HEAD branch/s/.*: //p' || echo main)
BASE=$(git merge-base HEAD "origin/$DEFAULT_BRANCH")
git log "$BASE"..HEAD --pretty=format:"%h %s"
git diff "$BASE"...HEAD --stat
git diff "$BASE"...HEAD --name-only
git diff "$BASE"...HEAD
```

This is the source of truth for the "What Changed" walkthrough and for keeping the PR body up to date.

## Step 4: Generate the PR body

Use this three-layer format. The structure mirrors the blog post insight: executive intent (30s), reviewer guidance (3-7 min), provenance (collapsed, only if needed).

```markdown
## Goal
[1-2 sentences. From the spec's Goal section or user input, corrected to match the actual diff.]

## Non-Goals
- [What's explicitly not in this PR — from spec, user input, or clear diff boundaries]

## Approach
[The *why*, not just the *what*. Use the spec's Decisions & Trade-offs when they match the implementation. This is the most important section — it prevents reviewers from re-litigating settled decisions.]

## What Changed
[Walkthrough organized by implemented **task** if a spec exists, or by **area** otherwise. Reference files inline. No code blocks. Do not include unchecked spec tasks that are not in the diff.]

### [Task name or area]
- [What changed and why, with file references]

### [Next task or area]
- [...]

## Constraints Preserved
- [Non-negotiable requirements that the change respects — from spec's Constraints / Invariants]

## Where to Focus Your Review
- [Specific files or behaviors that warrant extra scrutiny]
- [Auto-flag sensitive areas — see heuristics below]

## Verification
- [What was actually tested and how. Include commands you ran. Do not present planned spec verification as completed unless it was run.]

## Risks & Rollback
- **Risk:** [What could go wrong]
- **Rollout:** [How to deploy safely — feature flag? gradual?]
- **Rollback:** [How to undo]

<details>
<summary>Context manifest</summary>

- **Spec:** [link to spec file in repo, OR `Closes #<num>` for issue-mode]
- **Decision points:** [Key choices and why — from spec's Decisions & Trade-offs]
- **Ruled out:** [Approaches considered and rejected — from spec's Ruled Out section]
- **Files touched:** [Abbreviated from `git diff --stat`]

</details>
```

**If issue mode:** the PR body MUST include `Closes #<num>` somewhere prominent (typically at the top, before the Goal section, or in the Context manifest). This auto-links the PR to the issue and closes it on merge.

### Heuristics for "Where to Focus Your Review"

Automatically flag changes to sensitive areas:

- **Authentication / authorization** — login, sessions, permissions, role checks
- **Payment / billing** — Stripe, subscriptions, pricing logic
- **Database migrations** — anything in `migrations/` or `manual-migrations/`
- **Database schemas** — `schema.ts` or schema files
- **Public API endpoints** — tRPC routers, REST handlers, webhook handlers
- **Security-sensitive paths** — webhooks, file uploads, user input validation, signed URLs
- **Notifications / emails** — `services/notifications`, email templates
- **User data deletion or export** — GDPR-adjacent paths

If the diff touches any of these, surface them explicitly so reviewers know to look closely.

### Right-sizing

Drop sections that are genuinely empty. A small fix might not need Constraints Preserved or a Context Manifest. Don't pad — only include what carries information.

## Step 5: Create or update the PR

The user's request to use this skill is approval to create or update the PR. Do not pause after generating the body to ask for confirmation.

1. **Preflight non-interactively.** Resolve the default branch. Stop with a concise explanation only if the current branch is `main`, `master`, or the repo default branch; the branch has no commits relative to the default branch; there are uncommitted changes that would be omitted from the PR; or required information is missing.
2. **Push the PR branch if needed.** If there is no upstream, run `git push -u origin HEAD`; otherwise run `git push`. Never push `main`, `master`, or the repo default branch.
3. **Write the body to a temp file:**
   ```bash
   cat > /tmp/pr-body.md << 'PRBODY'
   [body content]
   PRBODY
   ```
4. **Create or update the PR.** First check whether a PR already exists for the branch; update it instead of creating a duplicate.
   ```bash
   if gh pr view --json url >/tmp/existing-pr.json 2>/dev/null; then
     gh pr edit --title "[concise title]" --body-file /tmp/pr-body.md
   else
     gh pr create --title "[concise title]" --body-file /tmp/pr-body.md
   fi
   ```
5. **Verify creation/update** with `gh pr view --json url --jq .url` and report the PR URL.

### Title format

The PR title should be concise and conventional. If a spec exists, use the spec's feature name. Otherwise, derive from the goal.

- Good: `Add webhook idempotency guard`
- Good: `Fix duplicate enqueue on partner retries`
- Bad: `WIP: stuff`
- Bad: `Implement spec specs/2026-04-07-foo.md`

## Rules

1. **Use the diff as source of truth** — the PR body must match the actual branch contents.
2. **Use the spec as context when one exists** — reference it for intent, decisions, and constraints, but don't claim spec work shipped unless the diff shows it.
3. **Preserve the "why".** Decisions & Trade-offs are the most valuable content for reviewers.
4. **No code blocks in walkthrough** — file references and short prose only.
5. **Right-size.** Small PRs don't need every section. Drop empty ones.
6. **Auto-detect, don't ask** — only fall back to questions when detection genuinely fails and this is not an automated finish-and-PR flow.
7. **Create/update without approval** — don't ask for confirmation after generating the PR body. Only pause for missing required information or unsafe preflight failures.
8. **Avoid duplicate PRs** — update an existing PR for the branch instead of creating another one.
9. **Never push to the default branch.** This skill creates PRs against the repo default branch, never merges.
