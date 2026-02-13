# agent-skills

Custom skills, commands, and config for AI coding agents.

Works with [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and [Codex](https://github.com/openai/codex). Skills use the shared [SKILL.md](https://agentskills.io) format — one repo, both agents.

## Setup

```bash
git clone git@github.com:lukemelnik/agent-skills.git ~/agent-skills
cd ~/agent-skills
./setup.sh
```

The setup script symlinks each skill into both `~/.claude/skills/` (Claude Code) and `~/.agents/skills/` (Codex). Use `--force` to replace existing symlinks.

Changes are live immediately — symlinks are transparent. Edit skills in the repo, commit and push to sync across machines.

### After setup

If migrating from `~/.claude/commands/`, you can remove the old command files — skills take precedence and work identically.

## Skills

### Stack reference

Loaded automatically when relevant to your conversation.

| Skill | Description |
|-------|-------------|
| `component-patterns` | React component patterns for data fetching and state management |
| `drizzle` | Drizzle ORM patterns for PostgreSQL |
| `shadcn` | shadcn/ui component and styling patterns |
| `tanstack-form` | TanStack Form patterns for React forms |
| `tanstack-router` | TanStack Router patterns for type-safe navigation |
| `tanstack-table` | TanStack Table patterns for data grids |
| `trpc` | tRPC v11 patterns for type-safe API development |
| `vitest` | Vitest testing patterns |
| `video-studio` | Video creation patterns with Remotion |

### Workflow commands

Invoked manually with `/command-name` (Claude Code) or `$command-name` (Codex).

| Command | Description |
|---------|-------------|
| `/spec` | Create a structured spec for agent-driven implementation |
| `/review-spec` | Review a spec for completeness and clarity |
| `/implement` | Execute tasks from a spec continuously until complete or context runs low |
| `/implement-task` | Execute exactly one task from a spec |
| `/orchestrate` | Full spec implementation with fresh-context sprints, tidy, and review |
| `/review` | Comprehensive code review with parallel agents and confidence scoring |
| `/tidy` | Review work objectively, identify issues, create commits, and run linting |
| `/check-ci` | Check GitHub Actions for failures, create a fix plan, and resolve |
| `/fix-types` | Fix TypeScript type errors without using `any` or unsafe casts |
| `/task` | Quick task capture with smart assessment |
| `/rebase-main` | Rebase current branch onto origin/main and resolve conflicts |
| `/rebase-pr` | Create logical commits, open PR if needed, and merge with rebase |
| `/squash-pr` | Create a single squashed commit, open PR if needed, and squash merge |

The intended workflow loop: `/spec` → `/implement` → `/tidy` → `/review`

## Config

Files in `config/` that customize the Claude Code experience.

### Hooks — stop notification + tmux checkmark

When Claude finishes a task:
1. Plays a sound (`afplay`)
2. Sends a macOS notification
3. Renames the tmux window with a checkmark prefix so you can see at a glance which agents are done

The `clear-checkmark.sh` script removes the checkmark when you select that window.

### Statusline

A Kanagawa-themed status line showing:
- Current directory and git branch (with dirty indicator)
- Commits ahead/behind remote
- Active model name
- Context window remaining percentage (color-coded: green → yellow → red)

### Settings example

`settings.example.json` shows the full configuration including:
- Permission allow/deny lists (blocks destructive commands, protects .env files)
- Hook configuration
- Statusline setup
- Recommended plugins

## Cross-agent compatibility

Both Claude Code and Codex use the `SKILL.md` format with YAML frontmatter. The setup script symlinks into both agent directories:

| Agent | Skills directory | Instructions file |
|-------|-----------------|-------------------|
| Claude Code | `~/.claude/skills/` | `CLAUDE.md` |
| Codex | `~/.agents/skills/` | `AGENTS.md` |

Skills with `disable-model-invocation: true` in their frontmatter are only triggered by explicit slash commands. All other skills are loaded automatically when the agent determines they're relevant.

## Security note

Skills can include executable scripts. If you install skills from third-party repos, review the code before using them. This repo only contains skills I wrote — no third-party code.

## Structure

```
agent-skills/
├── skills/                     # All skills (symlinked into both agent dirs)
│   ├── component-patterns/     # Stack reference skills
│   ├── drizzle/
│   ├── shadcn/
│   ├── tanstack-form/
│   ├── tanstack-router/
│   ├── tanstack-table/
│   ├── trpc/
│   ├── vitest/
│   ├── video-studio/
│   ├── implement/              # Workflow commands
│   ├── orchestrate/
│   ├── review/
│   ├── tidy/
│   ├── spec/
│   └── ...
├── config/
│   ├── settings.example.json
│   ├── statusline.sh
│   └── clear-checkmark.sh
├── setup.sh
└── README.md
```
