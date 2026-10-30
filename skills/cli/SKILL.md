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
4. **Self-documenting by contract** — the CLI itself must be enough for a capable agent to discover every workflow without reading an external skill, AGENTS.md, README, or source code

---

## Output

### TTY Detection

Auto-detect whether a human or a program is consuming output. When stdout is not a TTY, default to JSON.

- `--json` flag should still work explicitly for humans who want JSON in their terminal
- `--pretty` flag for indented JSON (useful for debugging)

### Stdout vs Stderr

- **stdout**: Only data output (JSON objects, human-formatted results)
- **stderr**: Status messages, progress indicators, prompts, errors in JSON mode
- **`--quiet`**: Suppress non-essential stderr messages (for agents that don't want noise)

### Structured Errors

When in JSON mode, errors go to stderr as structured JSON. Always include an error code for programmatic handling.

```json
{"error": {"code": "NOT_FOUND", "message": "no project named \"billing\"", "suggestedFix": "run `mytool projects list` to see available names"}}
```

Fields:
- `code` — machine-readable error type (e.g., `INVALID_ARGUMENT`, `NOT_FOUND`, `NOT_AUTHENTICATED`, `CONFLICT`)
- `message` — human-readable description
- `suggestedFix` — optional remediation hint (agents and humans both benefit)
- `candidates` — optional list of similar matches when input is ambiguous


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

Assume adversarial inputs: agents hallucinate paths like `../../.ssh`, pre-URL-encoded values, and control characters. Reject control characters (below 0x20), path traversal (`../`), and embedded query params in resource names, with contextual error messages.

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

### Force and Confirmation

Destructive operations fail by default when there is data-loss risk (e.g. uncommitted changes) and need `--force`. Irreversible shared-state operations (push, publish, deploy) may prompt, with `--yes` to skip for scripts/agents.

---

## Discoverability

### Command Introspection

Provide a machine-readable command that dumps the full command tree with metadata. Treat this as the canonical interface contract for agents, not an optional convenience:

```bash
mycli commands                    # Full tree as JSON
mycli commands --path songs.list  # Single command details
mycli commands --flat             # Flat list
```

Each command entry should include:
- `name`, `description`, `arguments`, `options`
- `examples` — real invocations
- `agentNotes` — instructions specific to agent usage (e.g., "always GET before UPDATE to avoid overwriting array fields")
- safety metadata in descriptions/notes for destructive, full-replacement, upload, publish, deploy, or other high-risk workflows

This replaces parsing `--help` text — agents get structured metadata directly.

Self-documentation bar:
- A fresh agent should be able to run the CLI, discover commands, identify required flags, understand enum values, preview writes, and avoid destructive mistakes using only CLI help/introspection output.
- External skills, AGENTS.md, README files, or source code may reinforce behavior, but must not be required to use the CLI correctly.
- If a command has hidden semantics (full replacement, soft vs hard delete, generated credentials, storage upload steps, resolver fallbacks), encode them in command help, examples, agent notes, and structured errors.

### Agent Notes

Embed agent-specific guidance in command metadata:

```json
{
  "name": "update",
  "agentNotes": "Array fields do FULL REPLACEMENT. Always GET first, merge changes, then send the complete array."
}
```

These notes encode domain knowledge that prevents common agent mistakes.

### Supplemental Agent Guides

An AGENTS.md or skill may summarize usage patterns, but is supplemental only; never the sole place for a workflow, destructive behavior, enum list, or replacement semantic.

---

## Authentication

- Support env vars for credentials (`TOKEN`, `API_KEY`) — no interactive prompts in headless mode
- Store credentials securely (file permissions 0600, OS keychain)
- Prefer service accounts / API keys over browser OAuth for agent use
- Fail clearly with structured error + `suggestedFix` when not authenticated

---

## Implementation Checklist

1. [ ] JSON output (`--json`, auto-JSON when stdout is not a TTY), structured errors on stderr
2. [ ] `--dry-run` on mutations, `--force` on destructive operations
3. [ ] `commands` introspection with examples and agent notes
4. [ ] `--fields` and `--ids-only` for output limiting
5. [ ] `--quiet` for suppressing stderr
