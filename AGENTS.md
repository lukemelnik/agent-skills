# Agent skills

- Public skill library; each skill lives in `skills/<name>/SKILL.md` with its
  supporting files. Edit sources here, then run `dotfiles apply` to link them.
- Only reusable skills belong here. Skills specific to one repository live in that
  repository's `.agents/skills/`.
- This repository is public: never add secrets, personal data or private machine
  configuration.
- Git workflow: work directly on `main`, commit verified changes with conventional
  commits, and push to `origin/main` straight away. Do not create branches or pull
  requests unless the user explicitly asks. This overrides general PR requirements
  and restrictions on direct pushes to `main`.
