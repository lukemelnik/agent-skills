---
title: Composite Index Design
description: Multi-column indexes
tags: mysql, indexes, composite, query-optimization, leftmost-prefix
---

# Composite Indexes

- Leftmost prefix: `(a, b, c)` serves `a`, `a,b`, `a,b,c`; `WHERE a AND c` uses only `a`; `b` alone cannot use it.
- Equality columns first, then range/sort. Range predicates (`>`, `<`, `BETWEEN`, `LIKE 'prefix%'`, sometimes large `IN`) stop filtering use of later columns, though they can still cover reads.
- Mixed `ORDER BY` directions (`a ASC, b DESC`) may filesort unless the index declares them (8.0+: `(a ASC, b DESC)`). A full reverse is fine.
- A composite index is usually faster than `index_merge` of single-column indexes.
- One index can serve several queries: `(user_id, status, created_at DESC)` covers `user_id`, `user_id+status`, and `user_id+status ORDER BY created_at DESC`.
