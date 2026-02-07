# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## AI Onboarding

- Start with `docs/index.md` to select the minimum relevant doc set for the task.
- Do not load all docs by default; expand only when blocked or cross-domain impact is likely.
- Use domain docs for rules and `docs/architecture.md` for system-level context.
- Any intentional deviation from framework defaults or common best practices should be documented.

## Commands

```bash
pnpm dev          # Start dev server on port 3000
pnpm build        # Build for production (vite build && tsc)
pnpm test         # Run all tests (vitest run)
pnpm lint         # Run Biome linter
pnpm format       # Run Biome formatter
pnpm check        # Run Biome check (lint + format)
```

### Database (Drizzle)

```bash
pnpm drizzle-kit generate   # Generate migrations from schema changes
pnpm drizzle-kit migrate    # Apply migrations
pnpm drizzle-kit push       # Push schema directly (dev)
pnpm drizzle-kit studio     # Open Drizzle Studio GUI
```

## Project Pointers

- `src/routes/` - File-based routing and UI entry points.
- `src/server/` - Server functions and middleware.
- `src/db/` - Database access and schema definitions.
- `src/components/` - UI primitives and form wrappers.
- `src/env/` - Environment variable validation.

## Code Style

- Biome for linting/formatting (single quotes, 2-space indent)
- Path alias: `@/` maps to `./src/`
- Generated file `src/routeTree.gen.ts` is excluded from linting
