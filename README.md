# agent-skills — coding-agent skill library

Public skill content used by my private dotfiles configuration.

Each skill lives under `skills/<name>/` with a `SKILL.md` entry point and any
supporting references, assets, helper scripts, and attribution files. Edit those
sources directly; preserve their supporting files and individual licenses.

Personal installation and migration instructions live in the private dotfiles
repository. Its `dotfiles sync` command updates this checkout and installs skill
links; `dotfiles apply` uses existing local content, including edits. This
repository contains no standalone installer or machine configuration.

The private installer links skills into `~/.agents/skills/`, `~/.claude/skills/`,
and `~/.pi/agent/skills/`. Changes to linked source files take effect immediately.
Commit and push intended skill changes separately with Git.
