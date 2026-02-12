---
name: implement
description: Execute tasks from a spec continuously until complete or context runs low
disable-model-invocation: true
---

## Important Rules

1. **Self-assess before starting** - Verify you have enough info; ask questions or suggest `/spec` if unclear
2. **Check context before each sprint** - Never start a sprint you can't finish
3. **One sprint at a time** - Complete each sprint fully before moving to the next
4. **Run tidy after each sprint** - Catch issues early
5. **Validate according to the spec** - Run the validation commands specified for each task
6. **Commit after each sprint** - Atomic, logical commits
7. **Final review is required** - Spec-aware tidy + code review at the end
8. **Update the issue body in-place after each sprint** - Mark tasks done, note scope changes inline; the issue is the source of truth
9. **Never auto-compact** - Alert the user instead when context is low
10. **Never use type shortcuts** - No `any`, `as`, `@ts-ignore`, `biome-ignore`
11. **Create a PR that closes the issue** - Use `Closes #<num>` in the PR body so the issue auto-closes on merge
12. **Document scope changes inline** - Note deviations right next to the relevant task in the issue body and in the PR

Now read the spec and begin.
