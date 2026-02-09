import {
  CaretDownIcon,
  DevicesIcon,
  MoonIcon,
  SignOutIcon,
  SunIcon,
  UserCircleIcon,
} from '@phosphor-icons/react';
import { Link, useRouter } from '@tanstack/react-router';
import { authClient } from '@/app/auth/auth-client';
import { type UserTheme, useTheme } from '@/app/theme/ThemeProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const navLinkBase =
  'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground';

type AppHeaderProps = {
  userName: string;
};

export function AppHeader({ userName }: AppHeaderProps) {
  const router = useRouter();
  const { userTheme, setTheme } = useTheme();

  async function handleSignOut() {
    await authClient.signOut();
    await router.invalidate();
    router.navigate({ to: '/login' });
  }

  const themeOptions: Array<{
    value: UserTheme;
    label: string;
    Icon: typeof SunIcon;
  }> = [
    { value: 'light', label: 'Light', Icon: SunIcon },
    { value: 'dark', label: 'Dark', Icon: MoonIcon },
    { value: 'system', label: 'System', Icon: DevicesIcon },
  ];
  const activeThemeOption =
    themeOptions.find((option) => option.value === userTheme) ??
    themeOptions[2];

  return (
    <header className="border-b">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-3">
        <nav className="flex items-center gap-3 min-w-0">
          <Link
            to="/tasks"
            className={cn(navLinkBase, 'whitespace-nowrap')}
            activeProps={{
              className: cn(navLinkBase, 'text-foreground whitespace-nowrap'),
            }}
          >
            Tasks
          </Link>
          <Link
            to="/commitments"
            className={cn(navLinkBase, 'whitespace-nowrap')}
            activeProps={{
              className: cn(navLinkBase, 'text-foreground whitespace-nowrap'),
            }}
          >
            Commitments
          </Link>
        </nav>

        <div className="shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="max-w-[12.5rem]">
                <UserCircleIcon className="size-4" />
                <span className="truncate">{userName}</span>
                <CaretDownIcon className="size-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-fit min-w-0 max-w-[min(90vw,16rem)] sm:max-w-[18rem]"
            >
              <DropdownMenuLabel className="px-3 py-2">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="text-sm font-medium truncate">{userName}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <activeThemeOption.Icon className="size-4" />
                  {activeThemeOption.label}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent align="start" side="left">
                  <DropdownMenuRadioGroup
                    value={userTheme}
                    onValueChange={(value) => setTheme(value as UserTheme)}
                  >
                    {themeOptions.map(({ value, label, Icon }) => (
                      <DropdownMenuRadioItem key={value} value={value}>
                        <Icon className="size-4" />
                        {label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <SignOutIcon className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
