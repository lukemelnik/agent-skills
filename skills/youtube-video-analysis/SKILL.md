---
name: youtube-video-analysis
description: Analyze YouTube videos from YouTube-generated auto captions using yt-dlp. Use when asked to grab or analyze a YouTube transcript, decide whether a long video is worth watching, extract key claims or action items, identify novel information versus likely-known material, summarize a video, or discuss a video. Prefer auto captions and do not use creator/user-provided subtitle tracks unless the user explicitly asks.
---

# YouTube Video Analysis

Use this skill to fetch a YouTube-generated auto transcript, analyze the substance of the video, and help the user decide whether watching is worth their time.

## Transcript source policy

Use YouTube auto captions by default:
- Use `yt-dlp --write-auto-subs`, not `--write-subs`.
- Prefer `en-orig`; fall back to `en`.
- Do not use creator/user-provided captions unless the user explicitly asks for official captions.
- If no usable auto captions exist, say so and ask whether to generate a transcript from audio instead.

## Workflow

1. Fetch the auto transcript with the helper script, resolving `scripts/` relative to this skill directory:

```bash
python3 scripts/fetch_auto_transcript.py "YOUTUBE_URL"
```

The script writes the raw VTT and cleaned TXT to a new temp directory by default. This is intentional: long transcripts are easier to re-read, chunk, grep, and discuss from a temp file than from fragile in-memory context.

2. Read the cleaned TXT transcript.

3. Build a discovery outline before answering. Sweep the whole transcript, chunking by line ranges for long videos. Do not answer from only the intro, outro, or the first few high-level themes.

4. While outlining, capture topics plus probe-worthy hooks: surprising claims, concrete numbers and examples, caveats and thin evidence, hype weaker than the headline implies, and brief material mentions a generic summary would miss.

5. Produce a usefulness-focused analysis, not just a generic summary. Preserve the transcript's uncertainty language and avoid upgrading tentative claims into firm conclusions.

## Default analysis shape

Adapt to the request. For broad requests ("is this worth watching", "summarize"), give roughly: a topic map of the full video in order (with timestamps or line ranges), a bottom line on whether it is worth watching, the core thesis and highest-signal points, what is novel versus familiar, actionable takeaways, and probe-worthy follow-ups.

## Follow-up questions and criticism

When the user asks a follow-up question about a video, answer from the transcript first:
- Re-open or search the saved transcript before answering if the detail matters.
- State what the transcript says, ideally with a short quote, line range, or timestamp when available.
- If adding interpretation, criticism, or outside knowledge, label it separately as `My read:` or `Critique:`.
- If the transcript does not answer the question, say that plainly before offering external context.
- Do not let criticism replace transcript grounding; criticism should evaluate the transcript-backed claim, not invent a new one.

## Long-video handling

Do not assume the whole transcript fits comfortably in context. Prefer this pattern:

1. Read a first chunk to identify topic and style.
2. Read subsequent chunks with `read` offsets or shell line slicing as needed until the entire transcript has been swept.
3. Keep a compact running outline with topic, line range, main claim, evidence/examples, qualifiers, and probe-worthy hook.
4. Before final synthesis, audit the outline for omitted side topics, caveats, definitions, examples, mechanisms, study/evidence limits, anecdotes, sponsor/product detours, and brief mentions that may be easy to miss.
5. After all chunks, synthesize once from the outline.

If the user asks to chat about details later, re-open the temp transcript file and search/read the relevant area rather than relying on memory. Distinguish transcript-backed statements from broader interpretation when answering follow-ups.

## Cleanup

The helper leaves temp transcript files in place so the conversation can continue using them. Only remove temp transcript directories after the user is done with them or explicitly asks for cleanup.
