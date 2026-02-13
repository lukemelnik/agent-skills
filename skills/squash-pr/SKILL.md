---
name: squash-pr
description: Create a single squashed commit, open PR if needed, and squash merge
disable-model-invocation: true
---

# Squash PR

Combine all work into a single commit, open a PR if needed, and squash merge.

## Step 1: Review Changes

```bash
git status
git diff --stat
git log --oneline origin/main..HEAD
```

Understand all changes and commits that will be squashed.

## Step 2: Run Checks

Before proceeding:
```bash
pnpm check
```

Fix any errors first.

## Step 3: Push and Create PR

```bash
git push -u origin HEAD
```

If PR doesn't exist, create it:
```bash
gh pr create --title "feat: description" --body "$(cat <<'EOF'
## Summary
- Bullet points of changes

## Test Plan
- [ ] How to verify the changes work
EOF
)"
```

## Step 4: Squash Merge

Once PR is ready:
```bash
gh pr merge --squash
```

This combines all commits into a single commit on main.

### Squash Commit Message

The squash commit should:
- Summarize the overall change (not list every commit)
- Follow conventional commit format (`feat:`, `fix:`, etc.)
- No co-authoring information
- No attribution links

## Step 5: Cleanup

After merge:
```bash
git checkout main
git pull
git branch -d <branch-name>
```

## When to Use Squash vs Rebase

**Use Squash (`/squash-pr`) when:**
- Many small/messy commits during development
- WIP commits that don't add value to history
- Single logical change spread across commits

**Use Rebase (`/rebase-pr`) when:**
- Commits are already clean and logical
- Each commit represents a distinct change worth preserving
- You want granular git blame history
