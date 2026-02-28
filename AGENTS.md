# AGENTS.md

Use this file as a cache of expensive truths. If guidance is easy to infer from one file read, it does not belong here.

## Decision Rules
- New data access and mutations go in `src/server/**` as `createServerFn`; do not access the DB from routes/components.
- Any user-scoped server function must use `authMiddleware`; derive `userId` from middleware context, never client input.
- New app routes are file-based under `src/routes/**`; do not hand-wire route trees.
- If a loader depends on search params, define both `validateSearch` and `loaderDeps` (cache correctness).
- Task lifecycle uses `resolvedAt` as the active/inactive source of truth (`NULL` = active). Do not reintroduce `archived/completed` semantics.

## Repository Conventions
- Fast local validation for changed files: run targeted Vitest files, then `pnpm lint`.
- Full pre-merge validation: `pnpm check && pnpm test && pnpm build`.
- If you change `src/db/schema/**`, generate a migration (`pnpm drizzle-kit generate`) and commit `drizzle/**` updates.
- Use `@/` imports (alias to `src/`) instead of deep relative paths.

## Canonical References
- Auth-gated layout route: `src/routes/tasks.tsx`
- Search-param loader pattern: `src/routes/tasks/index.tsx`
- Auth middleware boundary: `src/server/middleware/auth.ts`
- User-scoped server mutation: `src/server/tasks/createTask.ts`
- Transactional resolve/undo task flow: `src/server/tasks/resolveTask.ts`, `src/server/tasks/undoTaskResolution.ts`
- Schema source of truth: `src/db/schema/public.schema.ts`

## Keep This File Tight
- Add entries only if they pass at least one test:
  1. Ambiguity: code alone cannot tell which valid pattern is preferred.
  2. Cost: deriving it reliably requires significant cross-file exploration.
