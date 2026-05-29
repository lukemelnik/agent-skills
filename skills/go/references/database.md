# Go Database Patterns

Use this for `database/sql`, repositories/stores, transactions, queries, connection pools, nullable columns, and database tests.

## `database/sql` model

- `*sql.DB` is a concurrency-safe connection pool, not a single connection.
- Reuse one `*sql.DB` per database role/lifetime; do not open per request.
- `sql.Open` may not establish a connection. Use `PingContext` at startup if the service must verify connectivity.
- Use context-aware methods: `PingContext`, `QueryContext`, `QueryRowContext`, `ExecContext`, `BeginTx`, `PrepareContext`.

## Pool tuning

Defaults are fine for many programs. Tune deliberately and observe `DB.Stats()`.

- `SetMaxOpenConns` bounds concurrent DB work; too low can create app-level deadlocks.
- `SetMaxIdleConns` avoids reconnect churn during bursts.
- `SetConnMaxIdleTime` releases idle connections after quiet periods.
- `SetConnMaxLifetime` helps with load-balanced DBs, server-side connection limits, or stale connections.

Do not cargo-cult pool values. Coordinate with database capacity and deployment concurrency.

## Query safety

- Never build SQL with `fmt.Sprintf` or string concatenation for values.
- Use placeholders/prepared statements supported by the driver.
- Be aware placeholder syntax differs by driver (`?`, `$1`, named args, etc.).
- Whitelist identifiers when table/column/order names must be dynamic; placeholders do not parameterize identifiers.

## Rows lifecycle

For `QueryContext`:

```go
rows, err := db.QueryContext(ctx, query, args...)
if err != nil {
    return nil, fmt.Errorf("query users: %w", err)
}
defer rows.Close()

for rows.Next() {
    var u User
    if err := rows.Scan(&u.ID, &u.Email); err != nil {
        return nil, fmt.Errorf("scan user: %w", err)
    }
    users = append(users, u)
}
if err := rows.Err(); err != nil {
    return nil, fmt.Errorf("iterate users: %w", err)
}
```

Rules:

- Always close `Rows`.
- Always check `Rows.Err()` after iteration.
- `QueryRowContext` defers errors until `Scan`.
- Handle `sql.ErrNoRows` with `errors.Is` when wrapping.

## Nullable columns

Choose based on API semantics:

- Use `sql.NullString`, `sql.NullInt64`, `sql.NullTime`, etc. when you need explicit valid/null state.
- Use pointers when pointer semantics are already idiomatic in your domain/API.
- Avoid collapsing NULL to zero values unless zero and missing are truly equivalent.

## Transactions

Use `BeginTx` with context and options:

```go
tx, err := db.BeginTx(ctx, nil)
if err != nil {
    return fmt.Errorf("begin transaction: %w", err)
}
defer tx.Rollback()

if _, err := tx.ExecContext(ctx, query, args...); err != nil {
    return fmt.Errorf("insert user: %w", err)
}

if err := tx.Commit(); err != nil {
    return fmt.Errorf("commit transaction: %w", err)
}
return nil
```

Guidelines:

- Use the `tx` for every query in the transaction; do not accidentally call `db` mid-transaction.
- `defer tx.Rollback()` is safe after successful commit for `database/sql`; ignore or handle `sql.ErrTxDone` only if you explicitly check rollback errors.
- Keep transactions short and free of slow network calls when possible.
- Pass a store interface or transaction-aware executor when multiple repositories must share a transaction.

## Prepared statements

Use prepared statements when:

- A query is executed repeatedly.
- The driver/database benefits from statement reuse.
- You want explicit preparation failures up front.

Close statements you create. Statements prepared on `*DB` are safe for concurrent use; statements prepared on `*Tx` or `*Conn` are bound to that scope.

## Store/repository design

- Keep SQL details close to the data-access package.
- Return domain types or narrow DTOs, not raw `sql.Rows` across package boundaries.
- Accept `context.Context` on every method doing I/O.
- Prefer concrete stores in producer packages; define small interfaces in consuming services when needed.
- Avoid a giant `Repository` interface that mirrors every table.
- Group queries by cohesive capability, not mechanically by CRUD if domain operations are richer.

Example:

```go
type Store struct {
    db *sql.DB
}

func (s *Store) User(ctx context.Context, id string) (User, error) {
    var u User
    err := s.db.QueryRowContext(ctx, `select id, email from users where id = $1`, id).
        Scan(&u.ID, &u.Email)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return User{}, ErrUserNotFound
        }
        return User{}, fmt.Errorf("select user %s: %w", id, err)
    }
    return u, nil
}
```

## Migrations and schema changes

Follow the repository's existing migration tool and workflow. Do not invent a second migration system. Keep schema changes, query changes, and tests aligned.

## Testing database code

- Use the project's established test database strategy.
- Keep unit tests around query-building and mapping when possible.
- Use integration tests for actual driver/database behavior, transactions, constraints, isolation, and migrations.
- Ensure tests clean up data and can run repeatedly.
- Do not require a live external database for ordinary unit tests unless the repo already does.
