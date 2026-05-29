# Go CLI Patterns

Use this when building or reviewing Go command-line tools. Also use the general `cli` skill for cross-language CLI UX.

## Structure

- Keep `main` thin: parse flags, build dependencies, create context, call `run`, map error to stderr/exit code.
- Put testable logic in `run(ctx, args, stdin, stdout, stderr)` or a small command struct.
- For one simple command, the standard `flag` package is enough.
- Use Cobra/urfave/other frameworks only when the project already uses them or the user approves the dependency.
- For multiple installable commands, use separate directories, often under `cmd/<name>/`.

Example:

```go
func main() {
    ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
    defer stop()

    if err := run(ctx, os.Args[1:], os.Stdin, os.Stdout, os.Stderr); err != nil {
        fmt.Fprintln(os.Stderr, err)
        os.Exit(1)
    }
}
```

## I/O and exit behavior

- Write machine-readable command output to stdout.
- Write diagnostics, progress, prompts, and errors to stderr.
- Return errors from `run`; call `os.Exit` only in `main`.
- Avoid `log.Fatal` in testable command logic; it exits the process.
- Use stable exit codes only when callers/scripts need to distinguish cases.
- Make destructive actions explicit and support dry-run/confirmation when appropriate.

## Flags and config

- Keep flag names lowercase and hyphen-separated.
- Prefer explicit flags over hidden environment behavior; environment variables are fine for credentials/config when documented.
- Do not read secrets from flags if shell history/process listing is a concern; prefer env/stdin/keychain/project convention.
- Validate flags before doing work and return actionable errors.
- Keep defaults visible in help output.

## Context and cancellation

- Use `signal.NotifyContext` for cancellation in long-running commands.
- Pass context to file/network/database operations that support it.
- Ensure workers stop and flush/close resources on cancellation.
- Distinguish user cancellation from real failures when that matters for messages or exit codes.

## Testing

- Test `run` directly with fake args and `bytes.Buffer` for stdout/stderr.
- Test exit behavior sparingly at process level; keep most behavior unit-testable.
- Normalize dynamic paths, timestamps, and ordering in golden outputs.
- Use `t.TempDir()` for filesystem tests.
- Avoid relying on the caller's environment; set env explicitly with `t.Setenv`.

## Dependency choice

Standard library first:

- `flag` for simple flags.
- `os`, `io`, `bufio`, `encoding/json`, `text/tabwriter` for common CLI output.
- `signal.NotifyContext` for interrupt handling.

Reach for a framework only when subcommands, completion generation, shell integration, or existing project conventions justify it.
