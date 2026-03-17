---
name: bash
description: Bash scripting style, safety, and best practices. Use when writing, reviewing, or debugging bash/shell scripts.
---

# Bash Scripting Guide

Style, safety, and best practices for bash scripts. Based on [Dave Eddy's Bash Style Guide](https://style.ysap.sh) with additional production hardening.

---

## Shebang

```bash
#!/usr/bin/env bash
```

Use `/usr/bin/env bash` for portability unless targeting a specific environment.

---

## Formatting

- **Indentation:** Tabs
- **Line width:** 80 columns max
- **Blank lines:** Never more than 1 consecutive blank line
- **Semicolons:** Only in control statements (`if ...; then`, `while ...; do`), never at end of regular statements

---

## Variables

- **Lowercase** for local/script variables
- **UPPERCASE** only for constants or `export`ed env vars
- **`local`** for all variables inside functions
- Don't use `let`, `readonly`, or `declare` (exception: `declare -A` for associative arrays)

```bash
# wrong
declare -i FOO=5
let FOO++
readonly BAR='something'

# right
foo=5
((foo++))
bar='something'
export BAR='something'
```

---

## Quoting

- **Single quotes** for static strings
- **Double quotes** for strings needing expansion
- **Quote all variables** that undergo word-splitting (command arguments, `echo`, etc.)
- No quotes needed inside `[[ ]]`, in variable assignment, or for programmer-controlled variables (`$?`, `$$`, etc.)

```bash
name='world'
echo "hello $name"    # double quotes — expansion needed
path='/tmp/foo'       # single quotes — no expansion

file=$path            # no quotes needed — assignment
[[ -f $file ]]        # no quotes needed — [[ ]] doesn't word-split

echo "$file"          # quotes needed — argument to command
```

When in doubt, quote.

---

## Functions

No `function` keyword. All variables must be `local`.

```bash
greet() {
	local name=$1
	echo "hello $name"
}
```

---

## Control Flow

`then`/`do` on the same line as `if`/`while`/`for`.

```bash
if [[ -d /etc ]]; then
	...
fi

while read -r line; do
	...
done < file

for f in *.txt; do
	...
done
```

---

## Prefer Bash Builtins

### Conditionals — `[[ ]]` not `[ ]` or `test`

```bash
[[ -f "$file" ]]       # right
[ -f "$file" ]          # wrong
test -f "$file"         # wrong
```

### Math — `(( ))` and `$(( ))` not `-gt`/`-lt`

```bash
if ((a > b)); then ...  # right
if [[ $a -gt $b ]]; then ...  # wrong
```

### Command substitution — `$()` not backticks

```bash
now=$(date)    # right
now=`date`     # wrong
```

### Parameter expansion over external commands

```bash
prog=${0##*/}              # not $(basename "$0")
lower=${name,,}            # not $(echo "$name" | tr '[:upper:]' '[:lower:]')
trimmed=${str//[0-9]/}     # not $(echo "$str" | sed 's/[0-9]//g')
```

### Sequences — brace expansion or C-style for

```bash
for i in {1..5}; do ...              # fixed range
for ((i = 0; i < n; i++)); do ...   # variable range
# not: for i in $(seq 1 5)
```

### Arrays over space-delimited strings

```bash
modules=(json httpserver jshint)
for mod in "${modules[@]}"; do
	npm install -g "$mod"
done
```

### `read` for string parsing

```bash
IFS=. read -r host domain tld <<< "$fqdn"
```

---

## File Iteration

Never parse `ls`. Use globs.

```bash
# wrong — breaks on spaces, special chars
for f in $(ls); do ...

# right
for f in *; do
	[[ -e $f ]] || continue   # handle empty glob
	...
done
```

---

## Error Handling

### Check fallible commands

```bash
cd /some/path || exit 1
```

Or with a message:

```bash
cd /some/path || { echo "failed to cd" >&2; exit 1; }
```

### Don't use `set -e`

`errexit` has subtle, surprising behavior in pipelines, subshells, and conditionals. Handle errors explicitly instead.

Reference: [BashFAQ105](http://mywiki.wooledge.org/BashFAQ/105)

### Do use `set -o pipefail`

Without it, a pipeline's exit code is the *last* command's code, hiding earlier failures:

```bash
set -o pipefail
false | true
echo $?  # 1, not 0
```

### `set -u` (nounset) — use with caution

Catches typos in variable names but can break scripts using `${var:-default}` patterns or positional parameters. If you use it, be deliberate about defaults.

---

## Traps and Cleanup

Use `trap` for cleanup on exit. Handle temp files, lock files, and child processes.

```bash
tmpfile=$(mktemp)
trap 'rm -f "$tmpfile"' EXIT

# tmpfile is cleaned up on normal exit, error, or signal
```

For more complex cleanup:

```bash
cleanup() {
	rm -f "$tmpfile"
	[[ -n ${pid:-} ]] && kill "$pid" 2>/dev/null
}
trap cleanup EXIT
```

---

## Input Validation

Validate arguments early. Provide usage messages.

```bash
usage() {
	cat <<-EOF
	Usage: ${0##*/} <host> <port>

	Connect to the given host and port.
	EOF
}

(($# == 2)) || { usage >&2; exit 2; }

host=$1
port=$2

[[ $port =~ ^[0-9]+$ ]] || { echo "port must be numeric" >&2; exit 2; }
```

---

## Stderr for Diagnostics

Data goes to stdout. Messages, progress, and errors go to stderr.

```bash
echo "processing $file..." >&2    # status to stderr
jq . "$file"                       # data to stdout
```

---

## Never Use `eval`

It opens code injection and defeats static analysis. Use arrays, indirect expansion, or proper quoting instead.

---

## Here Documents

Use heredocs for multi-line strings. Quote the delimiter to prevent expansion when not needed.

```bash
cat <<'EOF'
This $variable is literal, not expanded.
EOF

cat <<EOF
This $variable IS expanded.
EOF
```

Use `<<-` with tab indentation to allow indented heredocs:

```bash
if true; then
	cat <<-EOF
	indented content here
	EOF
fi
```

---

## Temp Files

Use `mktemp`, never hardcoded paths in `/tmp`. Always clean up with a trap.

```bash
tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT
```

---

## Portability Notes

- Avoid GNU-specific options to `sed`, `awk`, `grep`, etc. when possible
- Don't parse `ls` output
- Don't rely on `__dirname` patterns — see [BashFAQ028](http://mywiki.wooledge.org/BashFAQ/028)
- Avoid `cat file | cmd` — use `cmd < file` or `cmd file`

---

## Process Substitution and Subshells

Use process substitution to avoid subshell variable scoping issues:

```bash
# wrong — count stays 0 because pipe creates a subshell
count=0
cat file | while read -r line; do
	((count++))
done
echo "$count"  # 0

# right — no subshell
count=0
while read -r line; do
	((count++))
done < file
echo "$count"  # correct count
```

---

## Script Structure

Recommended order for non-trivial scripts:

```bash
#!/usr/bin/env bash

# brief description of what this script does

set -o pipefail

# constants and defaults
readonly PROG=${0##*/}
readonly VERSION='1.0.0'

# functions (alphabetical or dependency order)
usage() { ... }
log() { printf '%s: %s\n' "$PROG" "$*" >&2; }
die() { log "error: $*"; exit 1; }

# argument parsing
while getopts 'hv' opt; do
	case $opt in
		h) usage; exit 0 ;;
		v) echo "$VERSION"; exit 0 ;;
		*) usage >&2; exit 2 ;;
	esac
done
shift $((OPTIND - 1))

# main logic
main() {
	...
}

main "$@"
```

---

## Common Pitfalls

| Mistake | Fix |
|---|---|
| `${f}` without quotes | `"$f"` — braces don't prevent word-splitting |
| `for x in $(cmd)` for line iteration | `while read -r x; do ... done < <(cmd)` |
| Unquoted glob in variable | Quote or use arrays |
| `cd` without error check | `cd /path \|\| exit 1` |
| Hardcoded `/tmp/myfile` | `mktemp` + trap cleanup |
| `set -e` for safety | Explicit error handling per command |

---

## References

- [YSAP](https://ysap.sh) — You Suck at Programming, bash video series
- [BashGuide](https://mywiki.wooledge.org/BashGuide)
- [BashPitfalls](http://mywiki.wooledge.org/BashPitfalls)
- [ShellCheck](https://www.shellcheck.net/) — static analysis for shell scripts
