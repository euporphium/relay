import { SignOutIcon } from '@phosphor-icons/react';
import {
  createFileRoute,
  Outlet,
  redirect,
  useRouter,
} from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

export const Route = createFileRoute('/tasks')({
  beforeLoad: async ({ context }) => {
    if (!context.session) {
      throw redirect({ to: '/login' });
    }
    return { user: context.session.user };
  },
  component: TasksLayout,
});

function TasksLayout() {
  const { user } = Route.useRouteContext();
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    await router.invalidate();
    router.navigate({ to: '/login' });
  }

  return (
    <>
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <SignOutIcon className="size-4" />
            Sign out
          </Button>
        </div>
      </header>
      <Outlet />
    </>
  );
}
