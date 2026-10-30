---
title: Database Optimization Checklist
description: Optimize checklist
tags: postgres, optimization, indexes, partitioning, maintenance
---

# Optimization Checklist

When optimizing performance, check the following:

- Look for unused indexes (0 scans; exclude unique/primary indexes and verify stats age first)
- Look for duplicate indexes
- Archive audit/log tables >10GB
- Review tables >500GB for partitioning (>100GB for time-series/logs)
- Verify all extensions are supported
- Check for circular foreign key dependencies
- Consider alternatives to UUID primary keys for large tables (random v4 fragments indexes; use `uuidv7()` if UUIDs are needed)
- Index foreign key columns; Postgres does not create these automatically
- Configure connection pooling for OLTP workloads; raise pooling before `max_connections` (restart required)
- **Always confirm with a human before removing any indexes, dropping partitions, archiving tables, or performing other destructive actions**

## Operational gotchas

- `work_mem` is per operation, not per query: worst case is `work_mem x ops x (workers+1) x connections` (hash ops use `hash_mem_multiplier` x). Tune per session before globally; raise only after confirming spills (`temp_blks_written > 0`).
- Idle-in-transaction sessions and long transactions block VACUUM database-wide; set `idle_in_transaction_session_timeout`. Never disable autovacuum; lower `autovacuum_vacuum_scale_factor` per table on large tables. Alert when `age(datfrozenxid)` passes ~40-50% of wraparound.
- `VACUUM FULL` takes ACCESS EXCLUSIVE; prefer `pg_repack`/`pg_squeeze`.
- Replication slots and failing `archive_command` retain WAL and can fill `pg_wal/`; cap with `max_slot_wal_keep_size`.
- PG 17 moved checkpoint stats from `pg_stat_bgwriter` to `pg_stat_checkpointer`. If checkpoints are mostly size-triggered (`num_requested`), raise `max_wal_size`.
- Lower `fillfactor` (70-80) on UPDATE-heavy tables enables HOT updates. `SELECT *` detoasts large columns.
- Prefer CHECK constraints over ENUM types; use `TIMESTAMPTZ`, not `TIMESTAMP`.
- Cursor (keyset) pagination instead of deep OFFSET.
