---
name: bash
description: Opinionated bash scripting rules and safety pitfalls. Use when writing, reviewing, or debugging bash/shell scripts.
---

# Bash Scripting Guide

Based on [Dave Eddy's Bash Style Guide](https://style.ysap.sh) with production hardening.

## Style choices

- Tabs for indentation; 80 columns; semicolons only in `if ...; then` / `while ...; do`.
- Lowercase for script/local variables, UPPERCASE only for constants and exports; `local` for all function variables.
- Don't use `let`, `readonly`, or `declare` (except `declare -A`): `foo=5; ((foo++))`.
- Prefer builtins over externals: `[[ ]]`, `(( ))`, `$()`, `${0##*/}` over `basename`, `${name,,}` over `tr`, `IFS=. read -r a b c <<< "$s"`, brace/C-style loops over `seq`, arrays over space-delimited strings.
- No quotes needed in `[[ ]]` or assignments (`file=$path`); quote everything else. `${f}` does not prevent word-splitting.

## Error handling

- Check fallible commands: `cd /some/path || exit 1`.
- Do not use `set -e`; its behavior in pipelines, subshells, and conditionals is surprising ([BashFAQ105](http://mywiki.wooledge.org/BashFAQ/105)). Handle errors explicitly.
- Do use `set -o pipefail`; otherwise a pipeline reports only the last command's status.
- `set -u` catches typo'd variables but breaks unguarded positional parameters and unset-by-design vars; if used, use `${var:-}` defaults deliberately.
- Never use `eval`; use arrays, indirect expansion, or proper quoting.

## Cleanup and temp files

Use `mktemp` (never fixed `/tmp` paths) and clean up with a trap, which covers normal exit, errors, and signals:

```bash
tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT
```

For multi-step cleanup, use a `cleanup()` function (e.g. kill background `$pid`) and `trap cleanup EXIT`.

## Pipes and subshells

A piped `while` runs in a subshell, so variable changes are lost. Redirect instead:

```bash
count=0
while read -r line; do ((count++)); done < file   # not: cat file | while ...
```

For command output use process substitution: `while read -r x; do ...; done < <(cmd)`; never `for x in $(cmd)` for line iteration.

## Files and portability

- Never parse `ls`; use globs, and guard empty matches with `[[ -e $f ]] || continue`.
- Avoid GNU-only options to `sed`, `awk`, `grep` when portability matters.
- Data goes to stdout; status, progress, and errors go to stderr.
- Quote the heredoc delimiter (`<<'EOF'`) to prevent expansion; `<<-` strips leading tabs only.
- Validate arguments early with a usage message and exit 2 on misuse.
- Run ShellCheck.
