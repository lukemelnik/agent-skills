---
name: cli
description: Agent-friendly CLI design patterns. Use when building or reviewing CLI tools in any language.
---

# Agent-Friendly CLI Design

Patterns for building CLIs that work well for both humans and AI agents. Language and framework agnostic.

## Core Principles

1. **Structured by default, pretty for humans** — JSON is the canonical output; human formatting is the presentation layer
2. **Stderr for metadata, stdout for data** — keep channels clean and parseable
3. **Explicit safety** — `--dry-run` on all mutations, `--force` for destructive actions
4. **Self-describing** — the CLI itself is the documentation source

---

## Output

### TTY Detection

Auto-detect whether a human or a program is consuming output. When stdout is not a TTY, default to JSON.

**Go (cobra):**
```go
import "golang.org/x/term"

var isTerminal = func(fd int) bool { return term.IsTerminal(fd) }

func shouldOutputJSON(cmd *cobra.Command) bool {
    if flag, _ := cmd.Flags().GetBool("json"); flag {
        return true
    }
    return !isTerminal(int(os.Stdout.Fd()))
}
```

**Node (commander):**
```ts
const shouldOutputJSON = (opts: { json?: boolean }) =>
  opts.json || !process.stdout.isTTY;
```

- `--json` flag should still work explicitly for humans who want JSON in their terminal
- `--pretty` flag for indented JSON (useful for debugging)

### Stdout vs Stderr

- **stdout**: Only data output (JSON objects, human-formatted results)
- **stderr**: Status messages, progress indicators, prompts, errors in JSON mode
- **`--quiet`**: Suppress non-essential stderr messages (for agents that don't want noise)

```go
// Data to stdout
fmt.Fprintln(cmd.OutOrStdout(), string(jsonData))

// Messages to stderr
fmt.Fprintln(cmd.ErrOrStderr(), "Fetching worktrees...")
```

### Structured Errors

When in JSON mode, errors go to stderr as structured JSON. Always include an error code for programmatic handling.

```json
{"error": {"code": "NOT_FOUND", "message": "no worktree for branch \"feat/auth\"", "suggestedFix": "run `grove create feat/auth`"}}
```

Fields:
- `code` — machine-readable error type (e.g., `INVALID_ARGUMENT`, `NOT_FOUND`, `NOT_AUTHENTICATED`, `CONFLICT`)
- `message` — human-readable description
- `suggestedFix` — optional remediation hint (agents and humans both benefit)
- `candidates` — optional list of similar matches when input is ambiguous

Always exit with non-zero code on error regardless of output format.

### Field Selection

For commands returning large objects, support `--fields` to limit output:

```bash
mycli contacts get 42 --fields id,name,email
```

This protects agent context windows from massive payloads. Support dot-path notation for nested fields (`emails.0.value`).

### IDs-Only Mode

For list commands, `--ids-only` returns just the identifiers — useful for piping into other commands:

```bash
mycli songs list --ids-only | xargs -I{} mycli songs get {}
```

---

## Input

### Validation

Validate all inputs at system boundaries with contextual error messages:

```go
func parseID(s string) (int, error) {
    id, err := strconv.Atoi(s)
    if err != nil || id <= 0 {
        return 0, fmt.Errorf("invalid ID %q: must be a positive integer", s)
    }
    return id, nil
}
```

Assume adversarial inputs — agents hallucinate paths like `../../.ssh`, pre-URL-encoded values, and control characters. Validate:
- Reject control characters (below ASCII 0x20)
- Reject path traversal (`../`)
- Reject embedded query params in resource names
- Sanitize or reject special characters in identifiers

### Resolver Flags

Prefer human/agent-friendly lookup flags over raw IDs:

```bash
# Agent-friendly (resolver)
mycli songs update --song "Nobody's Hero" --title "New Title"

# Fallback (raw ID, deterministic)
mycli songs update --recording-version-id 52 --title "New Title"
```

Document which resolver flags map to which ID fields in command metadata.

### JSON Input for Complex Data

Accept full JSON payloads via flag for complex inputs instead of dozens of individual flags:

```bash
mycli create --json '{"name": "test", "config": {"port": 4000}}'
mycli create --json-file ./config.json
```

---

## Safety

### Dry-Run

Every mutating command (create, update, delete) should support `--dry-run`:

```bash
mycli create feat/auth --dry-run
# {"dryRun": true, "wouldCreate": {"branch": "feat/auth", "worktree": "/path/to/wt", "ports": {"api": 4045}}}
```

Output what *would* happen as structured JSON. For complex operations (file uploads, multi-step workflows), include the full plan.

### Force Flag

Destructive operations should require `--force` when there's risk of data loss:

```bash
mycli delete feat/auth          # fails if uncommitted changes
mycli delete feat/auth --force  # proceeds anyway
```

Never silently destroy user work. Default to safe behavior.

### Confirmation

For irreversible operations that affect shared state (push, publish, deploy), consider requiring explicit confirmation or `--yes` to skip it:

```bash
mycli deploy staging           # "Deploy to staging? [y/N]"
mycli deploy staging --yes     # Skip prompt (for scripts/agents)
```

---

## Discoverability

### Command Introspection

Provide a machine-readable command that dumps the full command tree with metadata:

```bash
mycli commands                    # Full tree as JSON
mycli commands --path songs.list  # Single command details
mycli commands --flat             # Flat list
```

Each command entry should include:
- `name`, `description`, `arguments`, `options`
- `examples` — real invocations
- `agentNotes` — instructions specific to agent usage (e.g., "always GET before UPDATE to avoid overwriting array fields")

This replaces parsing `--help` text — agents get structured metadata directly.

### Agent Notes

Embed agent-specific guidance in command metadata:

```json
{
  "name": "update",
  "agentNotes": "Array fields do FULL REPLACEMENT. Always GET first, merge changes, then send the complete array."
}
```

These notes encode domain knowledge that prevents common agent mistakes.

### Skill Files / AGENTS.md

Ship a markdown file with agent usage patterns:

```markdown
# Agent Guide

## Quick Start
Always run `mycli commands` first for structured command discovery.

## Patterns
- Use `--dry-run` for all write operations
- Use `--fields` on GET to limit response size
- Prefer resolver flags over raw IDs
```

---

## Pagination

For list endpoints returning many results:

- `--limit <n>` — maximum items
- `--offset <n>` — skip items
- Consider NDJSON (`--ndjson`) for streaming large result sets (one JSON object per line)

---

## Authentication

- Support env vars for credentials (`TOKEN`, `API_KEY`) — no interactive prompts in headless mode
- Store credentials securely (file permissions 0600, OS keychain)
- Prefer service accounts / API keys over browser OAuth for agent use
- Fail clearly with structured error + `suggestedFix` when not authenticated

---

## Command Structure

### Naming
- Use noun-verb or noun-subcommand patterns: `mycli worktrees list`, `mycli songs update`
- Keep names short and predictable
- Use consistent verbs: `list`, `get`, `create`, `update`, `delete`

### Global Flags
Standard flags every CLI should consider:

| Flag | Purpose |
|------|---------|
| `--json` | Force JSON output (even in TTY) |
| `--pretty` | Pretty-print JSON |
| `--quiet` | Suppress stderr messages |
| `--dry-run` | Preview mutations |
| `--fields` | Limit output fields |
| `--ids-only` | Return only IDs |
| `--yes` | Skip confirmation prompts |
| `--output <format>` | Alternative: explicit format selection |

### Exit Codes

- `0` — success
- `1` — general error
- `2` — usage/argument error (optional but useful)

---

## Testing

- Mock external dependencies (APIs, databases, system commands) for unit tests
- Test JSON output structure explicitly — agents depend on stable schemas
- Test error output structure — verify error codes and message format
- Test TTY vs non-TTY behavior if implemented
- Make the `isTerminal` check overridable in tests (function variable or interface)

---

## Implementation Checklist

When building a new CLI or adding agent-friendliness to an existing one:

1. [ ] `--json` flag on all output commands
2. [ ] TTY detection for auto-JSON
3. [ ] Structured error JSON to stderr
4. [ ] `--dry-run` on all mutations
5. [ ] `--force` on destructive operations
6. [ ] Input validation with contextual error messages
7. [ ] `commands` introspection command
8. [ ] `--fields` for output limiting
9. [ ] `--quiet` for suppressing stderr
10. [ ] Agent notes in command metadata
11. [ ] AGENTS.md or skill file shipped with the tool
