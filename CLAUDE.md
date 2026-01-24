# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Architecture

### Stack
- **Framework**: TanStack Start (React full-stack framework with file-based routing)
- **Database**: PostgreSQL with Drizzle ORM
- **Forms**: TanStack Form with Zod validation
- **Styling**: Tailwind CSS v4 with shadcn/ui components (radix-maia style, Phosphor icons)
- **Build**: Vite with React Compiler (babel-plugin-react-compiler)

### Project Structure

- `src/routes/` - File-based routing (TanStack Router). `__root.tsx` is the app shell.
- `src/server/` - Server functions using `createServerFn` from TanStack Start. These run server-side and are called directly from route loaders or components.
- `src/db/` - Database layer. `schema.ts` defines Drizzle tables, `index.ts` exports the `db` client.
- `src/components/ui/` - shadcn/ui primitives (Button, Input, Card, etc.)
- `src/components/form/` - Form field components integrated with TanStack Form via `hooks.tsx`
- `src/env/` - T3Env type-safe environment variables (`client.ts` for VITE_*, `server.ts` for server-only)

### Key Patterns

**Server Functions**: Define in `src/server/` using `createServerFn`. Use `.inputValidator()` with Zod schemas for type-safe input validation.

**Forms**: Use `useAppForm` from `@/components/form/hooks`. Form schemas live alongside their components (e.g., `taskForm.schema.ts`). Field validation uses `getFieldValidator()` to extract field schemas.

**Routes**: Loaders fetch data server-side. Search params are validated with Zod. Client-side date handling avoids server timezone issues (see tasks/index.tsx pattern).

## Code Style

- Biome for linting/formatting (single quotes, 2-space indent)
- Path alias: `@/` maps to `./src/`
- Generated file `src/routeTree.gen.ts` is excluded from linting