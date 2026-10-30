---
title: Monitoring
description: Essential PostgreSQL monitoring views, pg_stat_statements, logging, host metrics, and statistics management
tags: postgres, monitoring, pg_stat_statements, logging, pgbadger, metrics, operations
---

# Monitoring

## Notes

- `pg_stat_statements` requires `shared_preload_libraries` (restart) and `CREATE EXTENSION`.
- PG 17+ moved checkpoint stats from `pg_stat_bgwriter` to `pg_stat_checkpointer`.
- Postgres cannot report host metrics (steal time, swap, iostat, inodes, OOM kills in `dmesg`); monitor them separately.

## Key Queries

```sql
-- Slow queries (with cache hit ratio)
SELECT query, calls, mean_exec_time,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS cache_hit_pct
FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;

-- Dead tuples (vacuum candidates)
SELECT relname, n_dead_tup, last_autovacuum FROM pg_stat_user_tables ORDER BY n_dead_tup DESC;
-- last_autovacuum = <null> means autovacuum has not run on this table
```

Blocking: use `pg_blocking_pids(pid)` with `pg_stat_activity` to find blocked and blocking sessions.

## Logging — First Line of Defense

PostgreSQL is extremely vocal about problems. **Always check logs first**: `tail -f /var/log/postgresql/postgresql-*.log`.

Key settings: `log_min_duration_statement` (OLTP: 1–3s, analytics: 30–60s, dev: 100–500ms). Enable `log_checkpoints=on`, `log_connections=on`, `log_disconnections=on`, `log_lock_waits=on`, `log_temp_files=0`. Use CSV log format for pgBadger analysis; pgBadger generates HTML reports with query stats and performance graphs.

## Statistics Management

Stats accumulate since last reset or restart; check `stats_reset` timestamp. `pg_stat_statements_reset()` clears query stats; `pg_stat_reset()` clears database stats. Reset after major maintenance, config changes, or perf testing — not routinely. Prefer snapshotting stats to external monitoring (Prometheus, Datadog) over resetting. **Always confirm with a human before resetting statistics** — resetting destroys historical performance baselines and can make it harder to identify unused indexes or regressions.
