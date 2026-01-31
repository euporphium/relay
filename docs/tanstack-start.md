# TanStack Start Routing

This document covers routing in Relay, which uses TanStack Start with file-based routing. Start uses TanStack Router under the hood, so Router concepts apply.

**References:**
- [Start Routing Guide](https://tanstack.com/start/latest/docs/framework/react/guide/routing)
- [TanStack Router Docs](https://tanstack.com/router/latest)

## Key Files

| File | Purpose |
|------|---------|
| `src/router.tsx` | Router configuration and `getRouter()` export |
| `src/routes/` | File-based routing directory |
| `src/routes/__root.tsx` | Root route (document shell, global providers) |
| `src/routeTree.gen.ts` | Auto-generated route tree (do not edit) |

## Router Setup

The router is configured in `src/router.tsx`:

```tsx
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
  });
}
```

The `getRouter()` function must return a new router instance each time. The `routeTree` is auto-generated from the file-based routes.

## File-Based Routing

Routes live in `src/routes/` and map to URLs based on file/folder structure:

```
src/routes/
  __root.tsx        → Root layout (always rendered)
  index.tsx         → /
  tasks/
    index.tsx       → /tasks/
    create.tsx      → /tasks/create
    $taskId.tsx     → /tasks/:taskId (dynamic segment)
```

### Conventions

- `index.tsx` maps to the parent path
- Nested folders create nested URL segments
- `$param` prefixes indicate dynamic path parameters (e.g., `$taskId` matches any value)

## Root Route

The root route (`src/routes/__root.tsx`) provides the document shell and global context:

```tsx
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Relay' },
    ],
    links: [{ rel: 'stylesheet', href: stylesUrl }],
  }),
  component: RootComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <ThemeProvider>
        <Toaster />
        <Outlet />
      </ThemeProvider>
    </RootDocument>
  );
}

function RootDocument({ children }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
```

Key elements:
- **`head()`** - Defines meta tags, title, and stylesheet links
- **`HeadContent`** - Renders head content defined by routes (must be in `<head>`)
- **`Scripts`** - Loads client-side JS (must be at end of `<body>`)
- **`Outlet`** - Renders matched child routes
- **`errorComponent`** - Handles uncaught errors

## Route Definition

Routes are defined using `createFileRoute()`:

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/tasks/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Tasks page</div>;
}
```

## Loaders

Loaders fetch data server-side before rendering:

```tsx
export const Route = createFileRoute('/tasks/$taskId')({
  loader: async ({ params }) => {
    const task = await getTask({ data: params.taskId });
    if (!task) throw notFound();
    return { task };
  },
  component: RouteComponent,
  notFoundComponent: () => <div>Task not found</div>,
});

function RouteComponent() {
  const { task } = Route.useLoaderData();
  return <div>{task.name}</div>;
}
```

### Loader Dependencies

When a loader depends on search params, use `loaderDeps` to declare the dependency:

```tsx
export const Route = createFileRoute('/tasks/')({
  validateSearch: z.object({
    date: z.iso.date().optional(),
  }),
  loaderDeps: ({ search: { date } }) => ({ date }),
  loader: async ({ deps: { date } }) => {
    if (!date) return { tasks: [] };
    return { tasks: await getTasksForDate({ data: date }) };
  },
  component: RouteComponent,
});
```

## Search Parameters

Use `validateSearch` with Zod for type-safe search params:

```tsx
import { z } from 'zod';

export const Route = createFileRoute('/tasks/create')({
  validateSearch: z.object({
    returnTo: z.string().optional(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { returnTo } = Route.useSearch();
  // returnTo is typed as string | undefined
}
```

## Navigation

### Using `Route.useNavigate()`

```tsx
function RouteComponent() {
  const navigate = Route.useNavigate();

  // Navigate with search params
  navigate({ search: { date: '2024-01-15' } });

  // Navigate to a different route
  navigate({ to: '/tasks' });

  // Replace history entry
  navigate({ search: { date: '2024-01-15' }, replace: true });
}
```

### Cross-Route Navigation

Import the target route to get type-safe navigation:

```tsx
import { Route as TasksEditRoute } from '@/routes/tasks/$taskId';
import { Route as TasksCreateRoute } from '@/routes/tasks/create';

function RouteComponent() {
  const navigate = Route.useNavigate();

  // Navigate with params
  navigate({ to: TasksEditRoute.to, params: { taskId: '123' } });

  // Navigate with search params
  navigate({
    to: TasksCreateRoute.to,
    search: { returnTo: location.pathname },
  });
}
```

## Route Hooks

| Hook | Purpose |
|------|---------|
| `Route.useLoaderData()` | Access data returned by the loader |
| `Route.useSearch()` | Access validated search params |
| `Route.useNavigate()` | Get navigation function |
| `Route.useParams()` | Access path parameters |

## Error Handling

### Not Found

Use `notFound()` in loaders and `notFoundComponent` for the UI:

```tsx
import { notFound } from '@tanstack/react-router';

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

### Error Component

Handle uncaught errors with `errorComponent`:

```tsx
export const Route = createRootRoute({
  errorComponent: ({ error, reset }) => (
    <div>
      <h1>Something went wrong!</h1>
      <pre>{error.message}</pre>
      <button onClick={reset}>Try again</button>
    </div>
  ),
});
```

## Client-Side Date Pattern

When dates depend on the user's timezone, avoid computing them on the server. Instead, canonicalize on the client:

```tsx
export const Route = createFileRoute('/tasks/')({
  validateSearch: z.object({
    date: z.iso.date().optional(),
  }),
  loaderDeps: ({ search: { date } }) => ({ date }),
  loader: async ({ deps: { date } }) => {
    // Return empty state if no date - client will set it
    if (!date) return { tasks: [], targetDate: undefined };
    return { tasks: await getTasksForDate({ data: date }), targetDate: date };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { tasks, targetDate } = Route.useLoaderData();
  const navigate = Route.useNavigate();

  useEffect(() => {
    // Set date on client using user's local timezone
    if (!targetDate) {
      navigate({
        search: { date: format(new Date(), 'yyyy-MM-dd') },
        replace: true,
      });
    }
  }, [targetDate, navigate]);

  if (!targetDate) return null; // Or loading skeleton
  // ... render content
}
```

## Router Invalidation

After mutations, invalidate the router to refetch loader data:

```tsx
import { useRouter } from '@tanstack/react-router';

function RouteComponent() {
  const router = useRouter();

  async function handleUpdate() {
    await updateTask({ data: { id, updates } });
    router.invalidate(); // Refetch all loaders
  }
}
```