---
title: Index Optimization Queries
description: Index audit queries
tags: postgres, indexes, unused-indexes, duplicate-indexes, optimization
---

# Index Optimization

## Identify Unused Indexes

Query to find unused indexes:

```sql
-- indexes with 0 scans (check pg_stat_reset / pg_postmaster_start_time first)
SELECT
   s.schemaname,
   s.relname AS table_name,
   s.indexrelname AS index_name,
   pg_size_pretty(pg_relation_size(s.indexrelid)) AS index_size
 FROM pg_catalog.pg_stat_user_indexes s
 JOIN pg_catalog.pg_index i ON s.indexrelid = i.indexrelid
 WHERE s.idx_scan = 0
   AND 0 <> ALL (i.indkey)       -- exclude expression indexes
   AND NOT i.indisunique          -- exclude UNIQUE indexes
   AND NOT EXISTS (               -- exclude constraint-backing indexes
     SELECT 1 FROM pg_catalog.pg_constraint c
     WHERE c.conindid = s.indexrelid
   )
 ORDER BY pg_relation_size(s.indexrelid) DESC;
```

## Identify Duplicate Indexes

Indexes with identical definitions (after normalizing names) on the same table are duplicates:

```sql
SELECT
  schemaname || '.' || tablename AS table,
  array_agg(indexname) AS duplicate_indexes,
  pg_size_pretty(sum(pg_relation_size((schemaname || '.' || indexname)::regclass))) AS total_size
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
GROUP BY schemaname, tablename,
  regexp_replace(indexdef, 'INDEX \S+ ON ', 'INDEX ON ')
HAVING count(*) > 1;
```

**Always confirm with a human before dropping or removing any indexes identified by the queries above.** Even indexes with 0 scans may be needed for infrequent but critical queries, and stats may have been reset recently.

More than ~10 indexes on a table warrants an audit (write overhead).
