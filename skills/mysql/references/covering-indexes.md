---
title: Covering Indexes
description: Index-only scans
tags: mysql, indexes, covering-index, query-optimization, explain
---

# Covering Indexes

- `Using index` in EXPLAIN Extra means the query is satisfied from the index alone. `Using index condition` (ICP) only filters at index level and still does table lookups.
- InnoDB secondary indexes carry the PK, so `INDEX(status)` already covers `SELECT id FROM t WHERE status = ?`.
- Put filter columns first, then covered columns; extend existing indexes rather than adding new ones.
- Not worth it for wide results (TEXT/BLOB), write-heavy tables, or rare queries: it costs write amplification, buffer pool, and slower rebuilds.
- `SELECT *` defeats covering indexes.
