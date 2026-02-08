# Routing

Implementation: TanStack Start + TanStack Router (file-based routes, auto-generated `routeTree.gen`)

## Summary

- Routes are defined exclusively via files under `src/routes/`.
- The root route (`src/routes/__root.tsx`) loads `session` and provides it via router context.
- Auth gating happens in route `beforeLoad` (see `/tasks`).
- Search params are validated with Zod via `validateSearch`, and `loaderDeps` is used when loaders depend on search params.
- Not-found is signaled by throwing `notFound()` and handled with `notFoundComponent`.
- After mutations that affect loader data, call `router.invalidate()` or navigate to a route that will refetch.
- Timezone-sensitive defaults are handled on the client, not in server loaders.

## Purpose

- Explain how routing is actually implemented in this codebase.
- Document project-specific routing conventions, patterns, and responsibilities.
- Provide copy-pasteable, real examples.

Not covered:
- Full TanStack Start/Router API surface or conceptual tutorials.
- Generic framework docs that are better served by upstream references.

## Key Files

| Path                                       | Purpose                                                           |
|--------------------------------------------|-------------------------------------------------------------------|
| `src/router.tsx`                           | Router setup (`getRouter()`), `routeTree` wiring, default context |
| `src/routes/__root.tsx`                    | Document shell, global providers, session context, root error UI  |
| `src/routes/index.tsx`                     | `/` redirect to `/tasks`                                          |
| `src/routes/tasks.tsx`                     | `/tasks` layout + auth gating                                     |
| `src/routes/tasks/index.tsx`               | `/tasks/` list, search param `date`, loader + loaderDeps          |
| `src/routes/tasks/create.tsx`              | `/tasks/create`, `returnTo` search param                          |
| `src/routes/tasks/$taskId.tsx`             | `/tasks/:taskId`, loader + `notFound`                             |
| `src/routes/commitments.tsx`               | `/commitments` layout + auth gating                               |
| `src/routes/commitments/index.tsx`         | `/commitments/` list, loader                                      |
| `src/routes/commitments/create.tsx`        | `/commitments/create`, `returnTo` search param                    |
| `src/routes/commitments/$commitmentId.tsx` | `/commitments/:commitmentId`, loader + `notFound`                 |
| `src/routes/api/auth/$.ts`                 | `/api/auth/*` server handlers                                     |

## Conventions

- File-based routing only; do not hand-wire routes.
- Use `createRootRouteWithContext` and return `session` in `beforeLoad`.
- Use `beforeLoad` for auth gates and redirects.
- Use `validateSearch` with Zod for all search params.
- Use `loaderDeps` whenever a loader depends on search params.
- Use `Route.useNavigate()` for in-route navigation, and import other routes for type-safe cross-route navigation.
- Throw `notFound()` in loaders for missing resources, and render with `notFoundComponent`.
- After server mutations that affect loader data, call `router.invalidate()` or navigate to a route that will refetch.

## Common Patterns

Root route with session context:

```tsx
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import { getSession } from '@/server/auth/getSession';

export type Session = Awaited<ReturnType<typeof getSession>>;

interface RouterContext {
  session: Session;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const session = await getSession();
    return { session };
  },
  component: RootComponent,
});
```

Redirect from `/`:

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/tasks' });
  },
});
```

Auth gate in a layout route:

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/tasks')({
  beforeLoad: async ({ context }) => {
    if (!context.session) {
      throw redirect({ to: '/login' });
    }
    return { user: context.session.user };
  },
});
```

Search params + loaderDeps:

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

export const Route = createFileRoute('/tasks/')({
  validateSearch: z.object({
    date: z.iso.date().optional(),
  }),
  loaderDeps: ({ search: { date } }) => ({ date }),
  loader: async ({ deps: { date } }) => {
    if (!date) {
      return { tasks: [], targetDate: undefined };
    }
    const tasks = await getTasksForDate({ data: date });
    return { tasks, targetDate: date };
  },
});
```

Cross-route navigation with params:

```tsx
import { Route as TasksEditRoute } from '@/routes/tasks/$taskId';

navigate({ to: TasksEditRoute.to, params: { taskId: id } });
```

Mutation + invalidate:

```tsx
import { useRouter } from '@tanstack/react-router';

const router = useRouter();
await updateTask({ data: { id, updates } });
void router.invalidate();
```

Not found handling:

```tsx
import { createFileRoute, notFound } from '@tanstack/react-router';

export const Route = createFileRoute('/tasks/$taskId')({
  loader: async ({ params }) => {
    const task = await getTask({ data: params.taskId });
    if (!task) throw notFound();
    return { task };
  },
  notFoundComponent: () => (
    <div>
      <h1>Task not found</h1>
      <p>The task you're looking for doesn't exist.</p>
    </div>
  ),
});
```

## Error Handling and Edge Cases

- Root-level uncaught errors are handled by `errorComponent` in `src/routes/__root.tsx`.
- Missing resources in loaders must `throw notFound()`; UI is provided by `notFoundComponent`.
- For timezone-sensitive defaults (e.g. `date` search param), do not compute “today” on the server. The client should set the search param to the user’s local date.

## Gotchas

- `loaderDeps` is required for loader caching correctness when using search params.
- Root `context` must always have a default shape in `src/router.tsx` (`{ session: null }`) even though `beforeLoad` populates it.
- `/tasks` is a layout route; its `beforeLoad` runs for all nested routes.

## When to Update This Doc

- Add, remove, or rename any route file under `src/routes/`.
- Change auth gating, search param validation, loader dependencies, or error handling patterns.
- Introduce new server handlers under routes (e.g. additional API routes).
- Change router context shape or root route behavior.
