---
name: performance
description: Investigate and improve measured latency, throughput, CPU, memory, rendering, startup, query, or resource-usage problems. Use for profiling, performance regressions, optimization, benchmarking, and iterative metric improvement.
---

# Performance

Optimize against measurements, not intuition.

## Workflow

1. **Define the target.** Name the metric, representative workload, environment, desired outcome, and correctness constraints.
2. **Establish a valid run.** Load the `verification` skill when runtime setup matters. Confirm the measured artifact and data are representative.
3. **Capture a baseline.** Use repeatable commands and enough samples to expose noise. Record units and relevant conditions.
4. **Profile before editing.** Use the platform's trace, profiler, query plan, metrics, or instrumentation to locate where time or resources go.
5. **Rank hypotheses.** Prefer the change most strongly supported by the profile.
6. **Run controlled iterations.** Make one coherent performance change, repeat the same workload, and compare with the baseline. Keep only meaningful wins; revert neutral or negative attempts.
7. **Check tradeoffs.** Verify correctness and watch for regressions in memory, responsiveness, throughput, resource use, and maintainability.
8. **Confirm the result.** Re-run the final benchmark and matching user-facing path where applicable.

Report before and after values, sample conditions, variance, profile evidence, retained changes, rejected attempts, and remaining bottlenecks. Do not claim a win from a different workload or benchmark-only shortcut.
