# agent-skills

Custom skills, commands, and config for AI coding agents.

Works with [Claude Code](https://code.claude.com) and any agent that supports the [Agent Skills](https://agentskills.io) open standard. Synced across machines via git + symlinks.

## Setup

```bash
git clone git@github.com:lukemelnik/agent-skills.git ~/agent-skills
cd ~/agent-skills
./setup.sh
```

The setup script symlinks each skill directory into `~/.claude/skills/`. Use `--force` to replace existing symlinks.

Changes are live immediately (symlinks are transparent). Edit skills in the repo, commit and push to sync across machines.

## Skills

### Stack reference

Skills Claude loads automatically when relevant to your conversation.

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

Invoked manually with `/command-name`. These drive multi-step workflows.

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
3. Renames the tmux window with a ✅ prefix so you can see at a glance which agents are done

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

## Security note

Skills can include executable scripts. If you install skills from third-party repos (via [skills.sh](https://skills.sh) or otherwise), review the code before using them. This repo only contains skills I wrote — no third-party code.

## Structure

```
agent-skills/
├── skills/                     # All skills (symlinked into ~/.claude/skills/)
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
