---
name: web-browser
description: "Allows to interact with web pages by performing actions such as clicking buttons, filling out forms, and navigating links. It works by remote controlling Google Chrome or Chromium browsers using the Chrome DevTools Protocol (CDP). When Claude needs to browse the web, it can use this skill to do so."
---

# Web Browser Skill

Chrome DevTools Protocol CLI. Connects to your existing Chrome — no separate browser instance. Persistent per-tab daemon, zero dependencies (Node 22+).

## Setup

Enable remote debugging in your Chrome: navigate to `chrome://inspect/#remote-debugging` and toggle the switch. That's it.

Alternatively, use `./scripts/start.js` to launch a dedicated debug Chrome instance (won't touch your running Chrome).

## Core CLI: `scripts/cdp.mjs`

All browsing commands go through the unified CLI. First run `list` to see open tabs, then use a target prefix for commands.

### List open pages

```bash
./scripts/cdp.mjs list
```

### Accessibility tree (best for understanding page structure)

```bash
./scripts/cdp.mjs snap <target>
```

Prefer `snap` over `html` for page structure — it's semantic, compact, and shows what's actually visible/interactive.

### Evaluate JavaScript

```bash
./scripts/cdp.mjs eval <target> 'document.title'
./scripts/cdp.mjs eval <target> 'document.querySelectorAll("a").length'
```

Use single quotes for the expression. Async context.

> **Avoid index-based selection** (`querySelectorAll(...)[i]`) across multiple eval calls when the DOM can change between them. Collect all data in one eval or use stable selectors.

### Screenshot

```bash
./scripts/cdp.mjs shot <target> [file]    # default: /tmp/screenshot.png
```

Prints DPR and coordinate mapping for `clickxy`.

### Navigate

```bash
./scripts/cdp.mjs nav <target> <url>
```

### Get HTML

```bash
./scripts/cdp.mjs html <target> [selector]   # full page or scoped to CSS selector
```

### Click

```bash
./scripts/cdp.mjs click   <target> <selector>    # by CSS selector
./scripts/cdp.mjs clickxy <target> <x> <y>        # at CSS pixel coords (see shot output)
```

### Type text

```bash
./scripts/cdp.mjs type <target> <text>
```

Uses `Input.insertText` — works in cross-origin iframes unlike eval.

### Load more

```bash
./scripts/cdp.mjs loadall <target> <selector> [ms]   # click until gone (default 1500ms)
```

### Network timing

```bash
./scripts/cdp.mjs net <target>
```

### Raw CDP command

```bash
./scripts/cdp.mjs evalraw <target> <method> [json]
```

### Dismiss cookie dialogs

```bash
./scripts/cdp.mjs cookies <target>              # accept
./scripts/cdp.mjs cookies <target> --reject     # reject
```

Detects 20+ CMPs (OneTrust, Cookiebot, Didomi, Quantcast, Google, etc.), handles iframes and shadow DOM, supports 6 languages.

### Stop daemons

```bash
./scripts/cdp.mjs stop [target]     # stop one or all
```

## Coordinates

`shot` saves at native resolution: image px = CSS px × DPR. CDP Input events (`clickxy`) take CSS pixels.

```
CSS px = screenshot px / DPR
```

`shot` prints the DPR. Typical Retina (DPR=2): divide screenshot coords by 2.

## Daemon Architecture

Each tab gets a persistent daemon at `/tmp/cdp-<targetId>.sock`. Chrome's "Allow debugging" modal fires once per tab. Daemons auto-exit after 20 minutes of inactivity.

## Additional Scripts

### Start Chrome (optional)

```bash
./scripts/start.js              # Persistent debug profile (won't touch user's Chrome)
./scripts/start.js --profile    # Copy user's real profile (kills all Chrome first!)
```

Only needed if you want a separate debug Chrome instance. Not required when using `chrome://inspect/#remote-debugging`.

### Interactive element picker

```bash
./scripts/pick.js "Click the submit button"
```

Visual element selection UI. Click to select, Cmd/Ctrl+Click for multi-select, Enter to finish.

### Background logging

Automatically started by `start.js`. Captures console, errors, and network to JSONL logs at `~/.cache/agent-web/logs/`.

```bash
./scripts/watch.js                    # start manually
./scripts/logs-tail.js                # dump current log
./scripts/logs-tail.js --follow       # keep following
./scripts/net-summary.js              # summarize network responses
```
