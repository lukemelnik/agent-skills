---
title: Character Sets and Collations
description: Charset config guide
tags: mysql, character-sets, utf8mb4, collation, encoding
---

# Character Sets and Collations

MySQL's `utf8` is `utf8mb3` (3-byte, no emoji). Always `utf8mb4`; `utf8mb4_0900_ai_ci` is the default collation (use `_as_cs` for exact matching, `_bin` for tokens/hashes).

## Migrating from utf8/utf8mb3

```sql
SELECT table_name, column_name FROM information_schema.columns
WHERE table_schema = 'mydb' AND character_set_name = 'utf8';
ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

`VARCHAR(255)` in utf8mb4 is up to 1020 bytes: fine for DYNAMIC/COMPRESSED (3072-byte key limit) but exceeds the 767-byte limit of REDUNDANT/COMPACT.

Override collation per query when needed: `WHERE name COLLATE utf8mb4_0900_as_cs = 'José'`. Ensure the client connection uses `utf8mb4` (`SET NAMES utf8mb4`; most drivers default to it).
