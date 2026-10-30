---
name: commit
description: "Read this skill before making git commits"
---

Commit the current changes with a concise Conventional Commits-style subject.

## Format

`<type>(<scope>): <summary>`

- `scope` optional; `summary` imperative, <= 72 chars, no trailing period.

## Notes

- Body optional: short paragraphs after a blank line.
- Do NOT include breaking-change markers or footers.
- Do NOT add sign-offs (no `Signed-off-by`).
- Only commit; do NOT push.
- If it is unclear whether a file should be included, ask the user which files to commit.
- Treat any caller-provided arguments as additional commit guidance. Common patterns:
  - Freeform instructions should influence scope, summary, and body.
  - File paths or globs should limit which files to commit. If files are specified, only stage/commit those unless the user explicitly asks otherwise.
  - If arguments combine files and instructions, honor both.

## Steps

1. Review `git status` and `git diff` (limited to argument-specified files if provided).
2. If there are ambiguous extra files, ask the user before committing.
3. Stage only the intended files (all changes if none specified) and commit.
