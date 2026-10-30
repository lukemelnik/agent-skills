---
title: Index Maintenance and Cleanup
description: Index maintenance
tags: mysql, indexes, maintenance, unused-indexes, performance
---

# Index Maintenance

## Find Unused Indexes

```sql
-- Requires performance_schema enabled (default in MySQL 5.7+)
-- Counters cover the time since last restart.
SELECT object_schema, object_name, index_name, COUNT_READ, COUNT_WRITE
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE object_schema = 'mydb'
  AND index_name IS NOT NULL AND index_name != 'PRIMARY'
  AND COUNT_READ = 0
ORDER BY COUNT_WRITE DESC;
```

Indexes with writes but `COUNT_READ = 0` are pure overhead, but some back UNIQUE constraints even if unused by plans.

Counters reset on restart — ensure 1+ full business cycle of uptime before dropping.

## Find Redundant Indexes

Index on `(a)` is redundant if `(a, b)` exists (leftmost prefix covers it). Pairs sharing only the first column (e.g. `(a,b)` vs `(a,c)`) need manual review — neither is redundant.

```sql
-- Prefer sys schema view (MySQL 5.7.7+)
SELECT table_schema, table_name,
  redundant_index_name, redundant_index_columns,
  dominant_index_name, dominant_index_columns
FROM sys.schema_redundant_indexes
WHERE table_schema = 'mydb';
```

## Statistics and Rebuilds
`ANALYZE TABLE` refreshes cardinality stats without rebuilding. `OPTIMIZE TABLE` rebuilds the whole table (slow on large tables).

## Invisible Indexes (MySQL 8.0+)
Test removing an index without dropping it:

```sql
ALTER TABLE orders ALTER INDEX idx_status INVISIBLE;
ALTER TABLE orders ALTER INDEX idx_status VISIBLE;
```

Invisible indexes are still maintained on writes (overhead remains), but the optimizer won't consider them.

## Adding Indexes Online
`ALTER TABLE ... ADD INDEX ..., ALGORITHM=INPLACE, LOCK=NONE` still takes brief metadata locks. For very large or high-write tables use pt-online-schema-change or gh-ost (needs privileges, triggers/binlog requirements).

## Guidelines
- Combine `performance_schema` data with `EXPLAIN` of frequent queries monthly.
