---
name: recall
description: "Search past Pi agent sessions for relevant context. Use when the user asks to check previous sessions, find prior discussions, recall past conversations, or needs context from earlier work."
---

When the user asks you to search past sessions, find prior conversations, or recall context from earlier work, delegate to the `recall` subagent.

## How to use

Call the `subagent` tool with the `recall` agent:

```
subagent({
  agent: "recall",
  task: "Search for sessions about <what the user described>. Focus on <specific aspects if mentioned>."
})
```

## When to use

- User says "check past sessions for..."
- User says "we discussed this before..."
- User says "find the conversation where..."
- User says "recall the session about..."
- User asks about prior decisions, approaches, or code from other sessions
- You need context from a previous conversation to continue work

## Tips

- Be specific in the task description — include project names, keywords, and what kind of context is needed
- If the first result isn't good enough, call it again with refined search terms
- The recall agent returns concise context — you can use it directly in your response
