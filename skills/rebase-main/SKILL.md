---
name: rebase-main
description: Rebase current branch onto origin/main and resolve any conflicts
disable-model-invocation: true
---

# Rebase onto Main

Update the current branch by rebasing onto the latest origin/main.

## Step 1: Fetch Latest Main

```bash
git fetch origin main
```

## Step 2: Check Current State

```bash
git status
git log --oneline origin/main..HEAD
```

Review commits that will be replayed on top of main.

## Step 3: Stash Uncommitted Changes (if any)

If you have uncommitted work:
```bash
git stash push -m "WIP before rebase"
```

## Step 4: Start Rebase

```bash
git rebase origin/main
```

## Step 5: Resolve Conflicts

If conflicts occur, Git will pause. For each conflicted file:

### 5a. View Conflicts
```bash
git status
git diff
```

### 5b. Understand the Conflict

Look for conflict markers:
```
<<<<<<< HEAD
// Their changes (from main)
=======
// Your changes (from this branch)
>>>>>>> your-commit
```

### 5c. Resolve Each File

- Keep the correct code (often need to merge both)
- Remove all conflict markers
- Ensure the code still makes sense together

### 5d. Stage and Continue

```bash
git add <resolved-files>
git rebase --continue
```

### 5e. Repeat

Continue resolving until rebase completes.

## Step 6: Verify

After rebase completes:
```bash
pnpm check
pnpm test  # if applicable
```

Ensure nothing broke during conflict resolution.

## Step 7: Restore Stashed Changes (if any)

```bash
git stash pop
```

## Step 8: Force Push (if already pushed)

If the branch was already pushed:
```bash
git push --force-with-lease
```

`--force-with-lease` is safer than `--force` - it fails if someone else pushed.

## Conflict Resolution Guidelines

### When Both Changes Are Needed
Merge the logic from both sides. Don't just pick one.

### When Changes Conflict Logically
- Understand what main changed and why
- Understand what your branch changed and why
- Determine the correct combined behavior

### Common Patterns

**Import conflicts** - Usually keep both imports

**Schema changes** - Main's migrations take precedence, adjust your code

**Renamed/moved files** - Follow main's structure, apply your logic

**Deleted code** - If main deleted it, probably don't add it back

## If Rebase Gets Messy

To abort and start over:
```bash
git rebase --abort
```

This restores the branch to its state before rebasing.

## Important Rules

1. **Never force push to main/master**
2. **Run checks after rebase** - Conflict resolution can introduce bugs
3. **Use `--force-with-lease`** - Not `--force`
4. **Abort if unsure** - Better to start over than mess up history
