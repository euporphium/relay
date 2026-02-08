# Database

Implementation: drizzle-orm ^0.45.1 + pg ^8.18.0 (PostgreSQL)

## Summary

- The database layer is centralized in `src/db/index.ts` with a single Drizzle `db` instance backed by `pg.Pool`.
- Schemas live in `src/db/schema/` and are split into `auth` (Better Auth tables) and `public` (app tables).
- Migrations are generated and tracked by drizzle-kit using `drizzle.config.ts` and the `drizzle/` folder.
- All app queries are server-side and scoped by `userId` from `authMiddleware`.
- Treat `resolved_at` as the canonical “inactive” marker for tasks; `NULL` means active.
- Commitments live in `commitments` and `commitment_groups` with a dedicated `commitment_state` enum.

## Purpose

- Explain how this project models and accesses PostgreSQL via Drizzle.
- Document local conventions for schemas, queries, transactions, and migrations.
- Exclude Drizzle API tutorials or general PostgreSQL guidance.

## Key Files

| Path                             | Purpose                                                  |
|----------------------------------|----------------------------------------------------------|
| `drizzle.config.ts`              | drizzle-kit configuration (schema path, output dir, env) |
| `drizzle/`                       | SQL migrations and drizzle metadata                      |
| `src/db/index.ts`                | `pg.Pool` + Drizzle `db` instance                        |
| `src/db/schema/index.ts`         | Schema export barrel                                     |
| `src/db/schema/auth.schema.ts`   | `auth` schema (Better Auth tables)                       |
| `src/db/schema/public.schema.ts` | `public` schema (app tables)                             |
| `src/env/server.ts`              | Runtime env validation for `DATABASE_URL`                |
| `src/server/tasks/*.ts`          | Task persistence and lifecycle operations                |
| `src/server/commitments/*.ts`    | Commitment persistence and lifecycle operations          |
| `src/app/auth/index.ts`          | Better Auth Drizzle adapter wiring                       |

## Conventions

- Schemas:
  - Use `pgSchema('auth')` for auth tables; app tables are in `public`.
  - Export all tables/enums via `src/db/schema/index.ts`.
- Naming:
  - SQL identifiers are `snake_case`; Drizzle fields are `camelCase`.
  - Tables are plural (`tasks`, `task_resolutions`), except Better Auth tables (`user`, `session`, `account`, `verification`).
  - Enums are lowercase with underscores (`interval_unit`, `task_resolution_type`).
- Columns:
  - `created_at`/`updated_at` are `timestamp` with defaults where appropriate.
  - Nullable indicates “optional”; `NULL` for `resolved_at` means task is active.
- Access:
  - Always import `db` from `@/db`; do not create new pools or Drizzle instances.
  - All app queries must be server-side and guarded by `authMiddleware`, then scoped by `userId`.
- Migrations:
  - Use drizzle-kit with `drizzle.config.ts` (reads `.env` for `DATABASE_URL`).
  - Keep schema changes in TypeScript (`src/db/schema/*`), then generate migrations.

## Common Patterns

- Query by `userId` + primary key:
  - Example: `src/server/tasks/getTask.ts` uses `db.query.tasks.findFirst` with `and(eq(tasks.id, id), eq(tasks.userId, userId))`.
- Computed fields via `sql`:
  - Example: `src/server/tasks/getTasksForDate.ts` derives `previewStartDate` and `status` with `sql` extras.
- Transactions for multi-step updates:
  - Example: `src/server/tasks/resolveTask.ts` inserts a resolution, updates the task, and optionally creates the next task.
  - Example: `src/server/tasks/undoTaskResolution.ts` deletes the resolution and reactivates the task.

## Error Handling and Edge Cases

- Missing ownership or missing record returns explicit `Error` (e.g., "Task not found").
- Task resolution guards:
  - Reject resolving an already-resolved task.
  - `resolved_at` is used to determine active vs. inactive tasks and index filters.
- Date handling:
  - `scheduled_date` and `resolved_date` are `date` (no timezone).
  - `resolved_at` is a `timestamp` (actual moment in time).

## Gotchas

- Migrations reflect schema history; do not hand-edit past migrations unless you’re fixing a deployment break and know the consequences.
- `drizzle.config.ts` uses `.env` for migrations; runtime env validation uses `process.env` in `src/env/server.ts`. Keep both in sync.
- The `auth` schema is managed by Better Auth’s expectations; changing those table shapes can break authentication.
- `tasks_active_scheduled_date_idx` depends on `resolved_at IS NULL`. If you change the active/inactive semantics, update the index.

## When to Update This Doc

- You add or rename tables, enums, or schemas.
- You change how migrations are generated/applied or where they live.
- You introduce new database access layers or bypass existing `db` usage.
- You change task lifecycle semantics (`resolved_at`, `task_resolutions`, or scheduling logic).
