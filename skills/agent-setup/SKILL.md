---
name: agent-setup
description: "Set up a repository for AI coding agents. Use when asked to set up a repo for agents, initialize agent config, or prepare a project for Claude/Pi."
---

# Agent Setup

Initialize a repository with the standard agent skill and config structure.

## What to Create

### 1. `.agents/skills/` directory

This is the canonical location for project-local skills. Create it even if empty — it's the place to add project-specific skills later.

```bash
mkdir -p .agents/skills
```

### 2. `.claude/skills` symlink

Claude Code reads skills from `.claude/skills/`. Symlink it to the canonical location so both Claude and Pi see the same skills.

```bash
mkdir -p .claude
ln -sf ../.agents/skills .claude/skills
```

### 3. `AGENTS.md`

The main agent instructions file. Create it with a header and pointer to skills. Ask the user if they want to include any project-specific context (tech stack, conventions, key commands).

```markdown
# AGENTS.md

This file provides guidance to AI coding agents working in this repository.

Project-specific skills are in the `.agents/skills/` directory.
```

### 4. `CLAUDE.md` symlink

Claude Code reads `CLAUDE.md`. Symlink it so there's one source of truth.

```bash
ln -sf AGENTS.md CLAUDE.md
```

### 5. `.gitignore` entries

Add these if not already present:

```
.claude/settings.local.json
```

The `settings.local.json` file contains user-specific permissions and shouldn't be committed. The skills symlink and `AGENTS.md` **should** be committed.

## What NOT to Do

- Don't create skills automatically — just the empty directory. Ask the user what skills they need.
- Don't create `.claude/settings.local.json` — that's user-specific and gets created by Claude Code itself.
- Don't overwrite an existing `AGENTS.md` or `CLAUDE.md` without asking. If `CLAUDE.md` exists as a regular file, offer to migrate its contents into `AGENTS.md` and replace it with a symlink.

## Verification

After setup, confirm the structure:

```bash
ls -la CLAUDE.md AGENTS.md .claude/skills .agents/skills/
```

Expected output:
```
CLAUDE.md -> AGENTS.md
AGENTS.md (regular file)
.claude/skills -> ../.agents/skills
.agents/skills/ (directory)
```

## Migration

If the repo already has a `CLAUDE.md` with content:

1. Copy its contents into a new `AGENTS.md`
2. Remove the old `CLAUDE.md`
3. Create the symlink: `ln -sf AGENTS.md CLAUDE.md`
4. Confirm with the user that nothing was lost
