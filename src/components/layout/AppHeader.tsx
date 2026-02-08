import { SignOutIcon } from '@phosphor-icons/react';
import { Link, useRouter } from '@tanstack/react-router';
import { authClient } from '@/app/auth/auth-client';
import { ThemeToggle } from '@/app/theme/ThemeToggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navLinkBase =
  'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground';

type AppHeaderProps = {
  userName: string;
};

export function AppHeader({ userName }: AppHeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    await router.invalidate();
    router.navigate({ to: '/login' });
  }

  return (
    <header className="border-b">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{userName}</span>
          <nav className="flex items-center gap-3">
            <Link
              to="/tasks"
              className={navLinkBase}
              activeProps={{ className: cn(navLinkBase, 'text-foreground') }}
            >
              Tasks
            </Link>
            <Link
              to="/commitments"
              className={navLinkBase}
              activeProps={{ className: cn(navLinkBase, 'text-foreground') }}
            >
              Commitments
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <SignOutIcon className="size-4" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
