---
name: mysql
description: Plan and review MySQL/InnoDB schema, indexing, query tuning, transactions, and operations. Use when creating or modifying MySQL tables, indexes, or queries; diagnosing slow/locking behavior; planning migrations; or troubleshooting replication and connection issues. Load when using a MySQL database.
license: MIT
source: https://github.com/planetscale/database-skills
metadata:
  author: planetscale
---

# MySQL

Use this skill to make safe, measurable MySQL/InnoDB changes.

## Workflow
1. Define workload and constraints (read/write mix, latency target, data volume, MySQL version, hosting platform).
2. Read only the relevant reference files linked in each section below.
3. Propose the smallest change that can solve the problem, including trade-offs.
4. Validate with evidence (`EXPLAIN`, `EXPLAIN ANALYZE`, lock/connection metrics, and production-safe rollout steps).
5. For production changes, include rollback and post-deploy verification.

## Schema Design
- Prefer narrow, monotonic PKs (`BIGINT UNSIGNED AUTO_INCREMENT`) for write-heavy OLTP tables.
- Avoid random UUID values as clustered PKs; if external IDs are required, keep UUID in a secondary unique column.
- Always `utf8mb4` / `utf8mb4_0900_ai_ci`. Prefer `NOT NULL`, `DATETIME` over `TIMESTAMP`.
- Lookup tables over `ENUM`. Normalize to 3NF; denormalize only for measured hot paths.
- `TIMESTAMP` has a 2038 limit. Money: `DECIMAL`, never `FLOAT`. Store UUIDs as `BINARY(16)`; MySQL `UUID()` is v1-style, so use app-generated UUIDv7 for ordering.
- Index prefix limits: 3072 bytes (DYNAMIC/COMPRESSED), 767 bytes (REDUNDANT/COMPACT).

References:
- [character-sets](references/character-sets.md)
- [json-column-patterns](references/json-column-patterns.md)

## Indexing
- Composite order: equality first, then range/sort (leftmost prefix rule).
- Range predicates stop index usage for subsequent columns.
- Secondary indexes include PK implicitly. Prefix indexes for long strings.
- Audit via `performance_schema` — drop indexes with `count_read = 0`.

References:
- [composite-indexes](references/composite-indexes.md)
- [covering-indexes](references/covering-indexes.md)
- [index-maintenance](references/index-maintenance.md)

## Partitioning
- Partition time-series (>50M rows) or large tables (>100M rows). Plan early — retrofit = full rebuild.
- Include partition column in every unique/PK. Always add a `MAXVALUE` catch-all.
- Partitioned InnoDB tables cannot have foreign keys (in either direction).
- `EXCHANGE PARTITION` needs an exactly matching, non-partitioned target table.

## Query Optimization
- Check `EXPLAIN` — red flags: `type: ALL`, `Using filesort`, `Using temporary`.
- Cursor pagination, not `OFFSET`. Avoid functions on indexed columns in `WHERE`.
- Batch inserts (500–5000 rows). `UNION ALL` over `UNION` when dedup unnecessary.
- `EXPLAIN ANALYZE` (8.0.18+) actually executes the query.
- FULLTEXT: `innodb_ft_min_token_size` (default 3) and stopword changes need an index rebuild; `MATCH()` columns must match an index exactly.

References:
- [query-optimization-pitfalls](references/query-optimization-pitfalls.md)

## Transactions & Locking
- Default: `REPEATABLE READ` (gap locks). Use `READ COMMITTED` for high contention.
- Consistent row access order prevents deadlocks. Retry error 1213 with backoff.
- Don't mix locking statements and plain `SELECT` in one REPEATABLE READ transaction (current vs snapshot reads differ). Never use SERIALIZABLE (with autocommit off it turns SELECTs into `FOR SHARE`). Do I/O outside transactions. Use `SELECT ... FOR UPDATE` sparingly.

References:
- [deadlocks](references/deadlocks.md)
- [row-locking-gotchas](references/row-locking-gotchas.md)

## Operations
- Use online DDL (`ALGORITHM=INPLACE`) when possible; test on replicas first.
- Tune connection pooling — avoid `max_connections` exhaustion under load.
- Monitor replication lag; avoid stale reads from replicas during writes.

References:
- [online-ddl](references/online-ddl.md)
- [connection-management](references/connection-management.md)
- [replication-lag](references/replication-lag.md)

## Guardrails
- Prefer measured evidence over blanket rules of thumb.
- Note MySQL-version-specific behavior when giving advice.
- Ask for explicit human approval before destructive data operations (drops/deletes/truncates).
