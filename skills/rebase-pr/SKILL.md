---
name: rebase-pr
description: Create logical commits, open PR if needed, and merge with rebase
disable-model-invocation: true
---

# Rebase PR

Create organized commits for your work, open a PR if needed, and merge with rebase.

## Step 1: Review Changes

```bash
git status
git diff --stat
```

Understand all changes before committing.

## Step 2: Create Logical Commits

Group changes into atomic, focused commits:

### Commit Organization
- **One concern per commit** - Don't mix refactoring with features
- **Each commit should build** - Don't break the build between commits
- **Order matters** - Dependencies first, then dependents

### Good Commit Examples
- `feat: add song duration calculation`
- `fix: handle null artist in song display`
- `refactor: extract validation to shared utility`
- `chore: update dependencies`

### Commit Message Rules
- No co-authoring information
- No attribution links
- Clear, concise description of "what" and "why"

## Step 3: Run Checks

Before creating/updating PR:
```bash
pnpm check
```

Fix any errors before proceeding.

## Step 4: Push and Create PR

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

## Step 5: Merge with Rebase

Once PR is ready:
```bash
gh pr merge --rebase
```

This keeps a linear history without merge commits.

## Step 6: Cleanup

After merge:
```bash
git checkout main
git pull
git branch -d <branch-name>
```

## If Conflicts Occur

During rebase:
1. Resolve conflicts in each file
2. `git add <resolved-files>`
3. `git rebase --continue`
4. Re-run `pnpm check` after resolution

**Never force push to main/master.**
