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

**Otherwise, auto-detect from branch** using the slug-only convention (`feat/<slug>` ↔ `specs/YYYY-MM-DD-<slug>.md`):

```bash
# Get the slug from the current branch (strip feat/ fix/ etc.)
BRANCH=$(git branch --show-current)
SLUG=$(echo "$BRANCH" | sed 's|^[^/]*/||')

# Find matching spec
SPECS=$(ls specs/*-"$SLUG".md 2>/dev/null)
```

- **Exactly one match:** use it.
- **Multiple matches:** ask the user to pick.
- **No match:** check git log for any spec files modified on this branch:
  ```bash
  git log main..HEAD --name-only --pretty=format: | grep '^specs/' | sort -u
  ```
- **Still no match:** check git log for issue references in commits:
  ```bash
  git log main..HEAD --pretty=format:"%B" | grep -oE '#[0-9]+' | sort -u
  ```
  If a single issue number appears, fetch it as the spec.
- **Still nothing:** fall back to **no-spec mode** (Step 2b).

## Step 2a: Spec-driven mode

Read the spec end to end. The PR body will pull most content directly from it. Do not paraphrase — lift the relevant sections so the PR body and spec stay aligned.

Note: specs from `/spec` (issue mode) may use slightly different section names (e.g., `Scope: In/Out` instead of `Non-Goals`). Adapt to whatever structure the spec uses — the principles are the same.

Skip to Step 3.

## Step 2b: No-spec mode

If there's no spec (hotfix, small change, etc.), ask the user 3-5 focused questions:

- **Goal:** What's the outcome of this change in 1 sentence?
- **Non-goals:** Anything explicitly out of scope?
- **Risks:** What could break? What should reviewers pay extra attention to?
- **Verification:** How was this tested?
- **Rollback:** How would we undo this if it goes wrong?

Use the answers to populate the corresponding sections in Step 4.

## Step 3: Read git history

Get the commits and changed files on this branch:

```bash
git log main..HEAD --pretty=format:"%h %s"
git diff main...HEAD --stat
git diff main...HEAD --name-only
```

This gives you the material for the "What Changed" walkthrough.

## Step 4: Generate the PR body

Use this three-layer format. The structure mirrors the blog post insight: executive intent (30s), reviewer guidance (3-7 min), provenance (collapsed, only if needed).

```markdown
## Goal
[1-2 sentences. From the spec's Goal section, or from user input.]

## Non-Goals
- [What's explicitly not in this PR — from spec or asked]

## Approach
[The *why*, not just the *what*. Lift from the spec's Decisions & Trade-offs section. This is the most important section — it prevents reviewers from re-litigating settled decisions.]

## What Changed
[Walkthrough organized by **task** if a spec exists (use the Tasks section as headings), or by **area** otherwise. Reference files inline. No code blocks.]

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
- [What was tested and how. Lift from spec's Verification section, augmented with anything you actually ran.]

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

## Step 5: Review and create

1. **Show the PR body to the user** for confirmation. Don't auto-create — give them a chance to tweak.
2. **After approval**, write to a temp file and create the PR:
   ```bash
   cat > /tmp/pr-body.md << 'PRBODY'
   [body content]
   PRBODY

   gh pr create --title "[concise title]" --body-file /tmp/pr-body.md
   ```
3. **Verify creation** and report the PR URL.

### Title format

The PR title should be concise and conventional. If a spec exists, use the spec's feature name. Otherwise, derive from the goal.

- Good: `Add webhook idempotency guard`
- Good: `Fix duplicate enqueue on partner retries`
- Bad: `WIP: stuff`
- Bad: `Implement spec specs/2026-04-07-foo.md`

## Rules

1. **Always pull from the spec when one exists** — don't paraphrase, lift the relevant text.
2. **Preserve the "why".** Decisions & Trade-offs are the most valuable content for reviewers.
3. **No code blocks in walkthrough** — file references and short prose only.
4. **Right-size.** Small PRs don't need every section. Drop empty ones.
5. **Auto-detect, don't ask** — only fall back to questions when detection genuinely fails.
6. **Show before creating** — let the user review the body before `gh pr create`.
7. **Never push to main.** This skill creates PRs against main, never merges.
