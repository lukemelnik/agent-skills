---
title: Backup and Recovery
description: Logical/physical backups, PITR, WAL archiving, backup tools, and recovery strategies
tags: postgres, backup, recovery, pitr, pg_dump, pg_basebackup, wal-archiving, operations
---

# Backup and Recovery

**FUNDAMENTAL RULE: Backups are useless until you've successfully tested recovery.**

## Logical vs Physical
Logical (`pg_dump`/`pg_restore`) is portable across versions; physical (`pg_basebackup`) needs the same major version and platform. Use `-Fd -j N` for large dumps. Manual `pg_backup_start()`/`pg_backup_stop()` requires writing the returned `backup_label`.

## PITR (Point-in-Time Recovery)
Requires base backup + continuous WAL archiving. Restores to any timestamp, transaction, or named restore point. Without PITR: restore only to backup time (potentially lose hours). With PITR: RPO = minutes. `archive_command` must return 0 ONLY when file is safely stored—premature 0 = data loss risk. `wal_level` must be `replica` or `logical` (not `minimal`).

## WAL Archiving
`archive_mode=on`, `archive_command='test ! -f /archive/%f && cp %p /archive/%f'`. **Test archive command as postgres user** (not root) since permission issues are common. Monitor `pg_stat_archiver` for `failed_count`, `last_archived_time`. Archive failures prevent WAL recycling → disk fills.

## Operational Rules
- Verify integrity with `pg_verifybackup` (PG 13+)
- Test recovery / PITR regularly
- Take backups from standby to avoid impacting primary
- Monitor archive growth and backup age
- **Never assume backups work without testing**
