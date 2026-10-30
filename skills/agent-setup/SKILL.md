---
name: agent-setup
description: "Set up a repository for AI coding agents (AGENTS.md, project skills directory, compatibility links)."
---

# Agent Setup

## What to Create

1. `mkdir -p .agents/skills` — canonical location for project-local skills. Create it empty; ask what skills the user wants rather than creating any.
2. `AGENTS.md` — canonical agent instructions. Ask whether to include project context (tech stack, conventions, key commands).

   ```markdown
   # AGENTS.md

   This file provides guidance to AI coding agents working in this repository.

   Project-specific skills are in the `.agents/skills/` directory.
   ```

3. Compatibility links. Some agent tools read other paths; add compatibility symlinks only for the tools this project's users actually use (ask if unknown), e.g. `CLAUDE.md -> AGENTS.md` and `.claude/skills -> ../.agents/skills`, and gitignore any per-user local settings files those tools create.

   ```bash
   ln -sf AGENTS.md CLAUDE.md
   mkdir -p .claude && ln -sf ../.agents/skills .claude/skills
   ```

Commit `AGENTS.md`, `.agents/skills/`, and the symlinks. Do not create per-user settings files.

## Existing files

Never overwrite an existing `AGENTS.md` or tool-specific instructions file without asking. If one exists as a regular file (e.g. `CLAUDE.md`), offer to move its contents into `AGENTS.md` and replace it with a symlink; confirm nothing was lost.

## Verification

```bash
ls -la AGENTS.md .agents/skills/ <any symlinks created>
```
