---
name: postgres
description: PostgreSQL schema, index, migration, performance, and operations guidance (partitioning, replication, backup, monitoring, PlanetScale). Use for Postgres schema/index/migration/performance/ops work, not for routine SQL query writing.
license: MIT
source: https://github.com/planetscale/database-skills
metadata:
  author: planetscale
  version: "1.0.0"
---

# PlanetScale Postgres

## Generic Postgres

| Topic                  | Reference                                                        | Use for                                                   |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| Index Optimization     | [references/index-optimization.md](references/index-optimization.md) | Unused/duplicate index queries, index audit               |
| Partitioning           | [references/partitioning.md](references/partitioning.md)             | Large tables, time-series, data retention                 |
| Optimization Checklist | [references/optimization-checklist.md](references/optimization-checklist.md) | Pre-optimization audit, cleanup, readiness checks  |

## Operations and Architecture

| Topic                  | Reference                                                                    | Use for                                                         |
| ---------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Replication            | [references/replication.md](references/replication.md)                       | Streaming replication, slots, sync commit, failover             |
| Monitoring             | [references/monitoring.md](references/monitoring.md)                         | pg_stat views, logging, pg_stat_statements, host metrics        |
| Backup and Recovery    | [references/backup-recovery.md](references/backup-recovery.md)              | pg_dump, pg_basebackup, PITR, WAL archiving, backup tools      |

## PlanetScale-Specific

| Topic              | Reference                                                                    | Use for                                               |
| ------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------- |
| Connection Pooling | [references/ps-connection-pooling.md](references/ps-connection-pooling.md)   | PgBouncer, pool sizing, pooled vs direct              |
| Extensions         | [references/ps-extensions.md](references/ps-extensions.md)                   | Supported extensions, compatibility                   |
| Connections        | [references/ps-connections.md](references/ps-connections.md)                 | Connection troubleshooting, drivers, SSL              |
| Insights           | [references/ps-insights.md](references/ps-insights.md)                       | Slow queries, MCP server, pscale CLI                  |
| CLI Commands       | [references/ps-cli-commands.md](references/ps-cli-commands.md)               | pscale CLI reference, branches, deploy requests, auth |
| CLI API Insights   | [references/ps-cli-api-insights.md](references/ps-cli-api-insights.md)       | Query insights via `pscale api`, schema analysis      |
