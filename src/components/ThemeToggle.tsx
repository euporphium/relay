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
    <Button onClick={() => setTheme(getNextTheme())} className="w-28">
      <span className="not-system:light:inline-flex hidden items-center gap-1">
        Light
        <SunIcon weight="duotone" />
      </span>
      <span className="not-system:dark:inline-flex hidden items-center gap-1">
        Dark
        <MoonIcon weight="duotone" />
      </span>
      <span className="system:inline-flex hidden items-center gap-1">
        System
        <DevicesIcon weight="duotone" />
      </span>
    </Button>
  );
};
