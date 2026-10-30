---
name: performance
description: Measure and improve a specific latency, throughput, CPU, memory, startup, or query-time problem. Use for profiling, performance regressions, and benchmark-driven optimization, not general code cleanup.
---

# Performance

- Name the metric, representative workload, environment, and correctness constraints. Load `verification` when runtime setup matters.
- Capture a baseline on the real workload with enough samples to expose noise; record units and conditions.
- Profile (trace, query plan, metrics) before editing, and change what the profile supports.
- One coherent change per iteration, rerun the same workload, keep only meaningful wins, and revert neutral or negative attempts.
- Check correctness and regressions in memory, responsiveness, and maintainability.
- Never claim a win from a different workload or a benchmark-only shortcut.

Report before/after values, variance, profile evidence, retained and rejected changes, and remaining bottlenecks.
