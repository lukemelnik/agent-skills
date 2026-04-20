---
name: book-companion
description: Reading companion for books opened in a terminal reader (bk/epr). Use when the user is reading a book and asks questions about what they're reading, wants explanations, diagrams, summaries, notes, or discussion about book content. Also use when the user asks to find their book pane, capture what they're reading, or manage reading notes.
---

# Book Companion

Assist the user while they read books in a terminal reader (typically `bk`) in a tmux pane alongside an agent session.

## Locating the Book Pane

The `book` script at `~/Books/book` sets the tmux pane title to `📚 <book name>` when opening a book.

Find the book pane:

```bash
tmux list-panes -a -F '#{pane_title} | #{session_name}:#{window_index}.#{pane_index}' | grep '📚'
```

This gives the book name and pane target.

## Reading What's on Screen

Capture the current visible page:

```bash
tmux capture-pane -t <pane_target> -p
```

To scroll and read more, send keys to the book pane:

```bash
# Scroll down one page
tmux send-keys -t <pane_target> Space
sleep 0.3
tmux capture-pane -t <pane_target> -p
```

```bash
# Scroll up one page
tmux send-keys -t <pane_target> b
sleep 0.3
tmux capture-pane -t <pane_target> -p
```

Use `j`/`k` for line-by-line scrolling. Use `t` to open table of contents in bk.

## Full Text Access

For search and deep questions, the full text is more useful than screen captures.

Always check for an existing text version first:

```bash
ls ~/Books/"<book>.txt" 2>/dev/null
```

If it doesn't exist, convert once:

```bash
pandoc ~/Books/"<book>.epub" -t plain -o ~/Books/"<book>.txt"
```

Then search freely with `grep` or read sections with `read`. Only convert when needed — the user may not want every book converted.

## Answering Questions

When the user asks about what they're reading:

1. Capture the current pane to see their context
2. Answer based on visible content
3. If the question requires broader context (e.g. "where did they mention X earlier"), convert to full text and search

Provide clear, concise explanations. Relate back to what's on their screen.

## Diagrams

Only use diagrams when:
- The concept genuinely needs visual explanation (processes, flows, hierarchies)
- The user explicitly asks for a diagram
- A text explanation has failed to land and a visual would clarify

Most questions can be answered with plain text. Do not default to diagrams for every response.

When a diagram is warranted, prefer ASCII/Unicode box-drawing rendered directly in the terminal:

```
  ┌──────────┐       ┌──────────┐
  │  Client   │──────▶│  Server   │
  └──────────┘       └──────────┘
```

Use box-drawing characters: `─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼ ═ ║ ╔ ╗ ╚ ╝`
Use arrows: `▶ ▼ ◀ ▲ ──▶ ──▷ ╱ ╲`
Use emoji sparingly for labels: `🔑 ✅ ❌ ⚠️`

Only fall back to Mermaid diagrams opened in browser when ASCII art genuinely can't express the concept (e.g. complex flowcharts with many crossing paths).

For Mermaid fallback, write to a temp HTML file and open:

```bash
cat << 'EOF' > /tmp/diagram.html
<!DOCTYPE html>
<html><head>
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<style>body{background:#1a1a2e;display:flex;justify-content:center;padding:40px}</style>
</head><body>
<div class="mermaid">
graph TD
    A-->B
</div>
<script>mermaid.initialize({theme:'dark'})</script>
</body></html>
EOF
open /tmp/diagram.html
```

## Reading Notes

Maintain a markdown notes file alongside the book at `~/Books/<book>.md`.

Structure:

```markdown
# <Book Title> — Reading Notes

## Key Ideas
- 

## Questions
- 

## Return To
- Chapter X, section Y — reason to revisit

## Summaries
### Chapter N: <title>
- 
```

Create the file on first note-worthy interaction. Append to existing sections rather than overwriting. Always ask before creating — the user may not want notes for every book.
