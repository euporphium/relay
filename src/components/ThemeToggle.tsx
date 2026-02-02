import { DevicesIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import { type UserTheme, useTheme } from '@/components/ThemeProvider';
import { Button } from './ui/button';

export const ThemeToggle = () => {
  const { userTheme, setTheme } = useTheme();

  const getNextTheme = (): UserTheme => {
    if (userTheme === 'light') return 'dark';
    if (userTheme === 'dark') return 'system';
    return 'light';
  };

  return (
    <Button onClick={() => setTheme(getNextTheme())} variant="ghost" size="sm">
      <span className="not-system:light:inline-flex hidden items-center gap-1">
        <SunIcon weight="duotone" className="size-4" />
        Light
      </span>
      <span className="not-system:dark:inline-flex hidden items-center gap-1">
        <MoonIcon weight="duotone" className="size-4" />
        Dark
      </span>
      <span className="system:inline-flex hidden items-center gap-1">
        <DevicesIcon weight="duotone" className="size-4" />
        System
      </span>
    </Button>
  );
};
