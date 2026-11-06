---
name: agent-browser
description: Default tool for any web browser work: open pages, click, fill forms, screenshots, console/network checks, responsive and keyboard checks, accessibility audits, Core Web Vitals, and real iOS Safari in the Simulator. Uses the installed `agent-browser` CLI with its own isolated headless browser per task; never the user's Chrome.
---

# agent-browser

The `agent-browser` CLI (Homebrew, Vercel Labs) is the default for browser automation. It runs its own headless Chrome, isolated per named session, so parallel agents never share or hijack a browser and never touch the user's Chrome.

## Before the first command

1. Load the CLI's version-matched guide: `agent-browser skills get core` (add `--full` for the command reference). Specialised guides: `agent-browser skills list` (e.g. `dogfood` for exploratory testing).
2. Use your own session for the whole task:

   ```bash
   export AGENT_BROWSER_SESSION="$(agent-browser session id --scope worktree --prefix task)"
   ```

3. Run `agent-browser close` when you're done.

## Rules

- Never drive the user's own browser: no `--auto-connect`, `--profile`, or `--cdp` to their Chrome unless the user explicitly asks in this conversation.
- Don't ask the user before launching your own session; it's isolated and headless.
- Use synthetic accounts; never print cookies, tokens or signed links. Prefer `--allowed-domains` for sessions touching sensitive data.

## Useful for verification

- `snapshot -i` for interactive refs; `screenshot <path>`; `set viewport <w> <h>`; `set media dark`.
- `console`, `errors`, `network requests --filter <pattern>` for console and request checks (e.g. headers, status codes).
- `a11y`, `vitals` for accessibility and Core Web Vitals.
- Real mobile Safari: `agent-browser -p ios --device "iPhone 16 Pro" open <url>` drives Safari in the iOS Simulator (needs Xcode). Use it when iOS behaviour matters (PDF viewers, video, Safari quirks). For native iOS apps use XcodeBuildMCP instead.
