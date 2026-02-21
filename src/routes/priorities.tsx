import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AppHeader } from '@/components/layout/AppHeader';

export const Route = createFileRoute('/priorities')({
  beforeLoad: async ({ context }) => {
    if (!context.session) {
      throw redirect({ to: '/login' });
    }
    return { user: context.session.user };
  },
  component: PrioritiesLayout,
});

function PrioritiesLayout() {
  const { user } = Route.useRouteContext();

  return (
    <>
      <AppHeader userName={user.name} />
      <Outlet />
    </>
  );
}
