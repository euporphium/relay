# Auth

Implementation: better-auth (server + react client), Drizzle adapter (PostgreSQL)

## Summary

- Auth is implemented with `better-auth` and stored in the `auth` schema in Postgres via the Drizzle adapter.
- The root route loads the current session with `getSession()` and provides it on the router context.
- Authenticated vs unauthenticated is determined by presence of `session?.user` from `auth.api.getSession`.
- Protected server actions use `authMiddleware`; protected routes use `beforeLoad` and redirect to `/login`.
- Client-side auth uses `authClient` for sign-in, sign-up, and sign-out.

## Purpose

- Describe how authentication and authorization are wired in this project.
- Explain where session data comes from and how it flows between server and client.
- Document project-specific rules for gating routes and server actions.
- Not a general guide to better-auth features or configuration options.

## Key Files

| Path                           | Purpose                                                                      |
|--------------------------------|------------------------------------------------------------------------------|
| src/app/auth/index.ts          | better-auth server configuration (Drizzle adapter, email+password enabled)   |
| src/app/auth/auth-client.ts    | better-auth React client wrapper                                             |
| src/routes/api/auth/$.ts       | `/api/auth/*` handler that delegates to `auth.handler`                       |
| src/server/auth/getSession.ts  | Server function that reads request headers and returns `auth.api.getSession` |
| src/routes/__root.tsx          | Loads session in `beforeLoad` and injects into router context                |
| src/server/middleware/auth.ts  | Server middleware that enforces auth and injects `userId` into context       |
| src/routes/tasks.tsx           | Route-level auth gate via `beforeLoad` and redirect                          |
| src/db/schema/auth.schema.ts   | Auth database schema (user, session, account, verification)                  |
| src/db/schema/public.schema.ts | Domain tables that reference `auth.user` (e.g., `tasks.user_id`)             |

## Conventions

- Use `auth.api.getSession({ headers })` on the server to read auth state.
- Route gating happens in `beforeLoad` using the router context session.
- Server actions that require auth must use `authMiddleware`.
- Treat `session?.user` as the single source of truth for authentication.
- Persisted domain data must reference `auth.user.id` via `userId`.

## Common Patterns

- Server session lookup:

```ts
import { getRequestHeaders } from '@tanstack/react-start/server';
import { auth } from '@/app/auth';

const headers = getRequestHeaders();
const session = await auth.api.getSession({ headers });
```

- Root route session bootstrap:

```ts
import { getSession } from '@/server/auth/getSession';

beforeLoad: async () => {
  const session = await getSession();
  return { session };
}
```

- Protected route redirect:

```ts
beforeLoad: async ({ context }) => {
  if (!context.session) {
    throw redirect({ to: '/login' });
  }
  return { user: context.session.user };
}
```

- Protected server action:

```ts
export const createTask = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context;
    // use userId in writes
  });
```

- Client sign-in/sign-up/sign-out:

```ts
import { authClient } from '@/app/auth/auth-client';

await authClient.signIn.email({ email, password });
await authClient.signUp.email({ name, email, password });
await authClient.signOut();
```

## Error Handling and Edge Cases

- `authMiddleware` throws `Error('Unauthorized')` when `session?.user` is missing.
- Route gating redirects unauthenticated users to `/login`.
- Always call `router.invalidate()` after sign-in or sign-out so the root session is refreshed.

## Gotchas

- `context.session` is populated by `getSession()` in the root route; if you bypass `router.invalidate()` after auth changes, UI can display stale auth state.
- Server actions must derive `userId` from middleware context, not from client input.
- Auth tables live in the `auth` schema; domain tables in `public` reference `auth.user` via foreign keys.

## When to Update This Doc

- Auth provider configuration changes in `src/app/auth/index.ts`.
- You change how sessions are loaded or passed through router context.
- You add or change middleware or route-level auth gating.
- You modify the auth schema or how domain tables reference `auth.user`.
