---
name: youtube-video-analysis
description: Analyze YouTube videos from YouTube-generated auto captions using yt-dlp. Use when asked to grab or analyze a YouTube transcript, decide whether a long video is worth watching, extract key claims or action items, identify novel information versus likely-known material, summarize a video, or chat with Claude about a YouTube video. Prefer auto captions and do not use creator/user-provided subtitle tracks unless the user explicitly asks.
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

4. While outlining, capture both topics and probe-worthy hooks:
   - surprising, counterintuitive, or myth-busting claims
   - concrete details such as numbers, named concepts, steps, timelines, examples, comparisons, and measured outcomes
   - claims that depend on context, conditions, assumptions, or definitions
   - limitations, caveats, unresolved questions, and places where evidence or explanation is thin
   - practical tests, decision rules, or behavior changes the user could apply
   - brief but material mentions that a user would not know to ask about from a generic summary
   - places where the language is hype-y, underspecified, exaggerated, or weaker than the headline implies

5. Produce a usefulness-focused analysis, not just a generic summary. Preserve the transcript's uncertainty language and avoid upgrading tentative claims into firm conclusions.

## Default analysis shape

Adapt to the user's request, but for broad requests like "key takeaways," "is this worth watching," or "summarize this," include a compact map before compressing:

- `Topic map:` 8-15 bullets covering the full video in order; include line ranges or timestamps when useful. Include minor but material topics, not only the central thesis.
- `Probe-worthy takeaways:` The claims, caveats, numbers, or side topics most worth digging into, with a short why-it-matters phrase.
- `Bottom line:` Is this worth watching for this user? Why or why not?
- `Core thesis:` The main argument in 1-3 sentences.
- `Important points:` The highest-signal claims, methods, frameworks, or recommendations.
- `Novelty check:` What seems non-obvious versus likely familiar/common knowledge.
- `Actionable takeaways:` Concrete things the user could do.
- `Skip/watch guide:` Sections or topics worth watching, skimming, or skipping when identifiable.
- `Questions to discuss:` Follow-up angles the user might reasonably want to probe, especially ones not obvious from the headline.

## What "interesting" means

Treat a takeaway as interesting when it is likely to change what the user would ask next. Prioritize:
- hidden subtopics that are easy to miss in a compressed summary
- claims with specific practical implications, consequences, or risks
- distinctions that materially change the meaning of a claim, such as context, assumptions, definitions, scope, or timescale
- claims where the support is strong enough to matter or weak enough that the caveat matters
- tensions between the title, speaker claim, provided evidence, examples, and practical recommendation

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
