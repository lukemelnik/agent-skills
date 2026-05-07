# agent-skills

Custom skills, commands, and config for AI coding agents.

Works with [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Codex](https://github.com/openai/codex), and [Pi](https://github.com/badlogic/pi). Skills use the shared [SKILL.md](https://agentskills.io) format.

## Setup

```bash
git clone git@github.com:lukemelnik/agent-skills.git ~/agent-skills
cd ~/agent-skills
./setup.sh
```

The setup script symlinks each skill into `~/.claude/skills/` (Claude Code), `~/.agents/skills/` (Codex), and `~/.pi/agent/skills/` (Pi). Use `--force` to replace existing symlinks.

Changes are live immediately — symlinks are transparent. Edit skills in the repo, commit and push to sync across machines.

### Private skills

Keep personal or non-public skills in a separate checkout at `~/agent-skills-private/skills/<skill-name>/`. `setup.sh` links that private root automatically when it exists. To use a different private location, set `AGENT_SKILLS_PRIVATE_DIR=/path/to/private-root` before running setup.

### After setup

If migrating from `~/.claude/commands/`, you can remove the old command files — skills take precedence and work identically.

## What this repo contains

- Reusable agent skills in `skills/`
- Cross-agent setup via `setup.sh`
- Optional Claude Code config examples in `config/`
- A private-skill convention that keeps personal workflows outside the public repo

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

Claude Code, Codex, and Pi use the `SKILL.md` format with YAML frontmatter. The setup script symlinks into each agent directory:

| Agent | Skills directory | Instructions file |
|-------|-----------------|-------------------|
| Claude Code | `~/.claude/skills/` | `CLAUDE.md` |
| Codex | `~/.agents/skills/` | `AGENTS.md` |
| Pi | `~/.pi/agent/skills/` | `AGENTS.md` / project context |

Skills with `disable-model-invocation: true` in their frontmatter are only triggered by explicit slash commands. All other skills are loaded automatically when the agent determines they're relevant.

## Security note

Skills can include executable scripts. If you install skills from third-party repos, review the code before using them. This repo only contains skills I wrote — no third-party code.

## Structure

```
agent-skills/
├── skills/                     # Public skills
├── config/
│   ├── settings.example.json
│   ├── statusline.sh
│   └── clear-checkmark.sh
├── setup.sh
└── README.md
```
