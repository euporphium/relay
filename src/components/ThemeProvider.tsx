import { ScriptOnce } from '@tanstack/react-router';
import { createClientOnlyFn, createIsomorphicFn } from '@tanstack/react-start';
import { createContext, type ReactNode, use, useEffect, useState } from 'react';
import * as z from 'zod';

const themeEnum = z.enum(['light', 'dark', 'system']);

const userThemeSchema = themeEnum.catch('system');

export type UserTheme = z.infer<typeof userThemeSchema>;
type AppTheme = Exclude<UserTheme, 'system'>;

const themeStorageKey = 'ui-theme';

const getStoredUserTheme = createIsomorphicFn()
  .server((): UserTheme => 'system')
  .client((): UserTheme => {
    const stored = localStorage.getItem(themeStorageKey);
    return userThemeSchema.parse(stored);
  });

const setStoredTheme = createClientOnlyFn((theme: UserTheme) => {
  localStorage.setItem(themeStorageKey, theme);
});

const getSystemTheme = createIsomorphicFn()
  .server((): AppTheme => 'dark')
  .client((): AppTheme => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

const handleThemeChange = createClientOnlyFn((theme: UserTheme) => {
  const root = document.documentElement;
  root.classList.remove('light', 'dark', 'system');

  if (theme === 'system') {
    root.classList.add(getSystemTheme(), 'system');
  } else {
    root.classList.add(theme);
  }
});

const setupPreferredListener = createClientOnlyFn(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => handleThemeChange('system');
  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
});

// Script for SSR Prevention of FOUC
const themeScript = (() => {
  function themeFn() {
    try {
      const storedTheme = localStorage.getItem('ui-theme') || 'system';
      const validTheme = ['light', 'dark', 'system'].includes(storedTheme)
        ? storedTheme
        : 'system';

      if (validTheme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
          .matches
          ? 'dark'
          : 'light';
        document.documentElement.classList.add(systemTheme, 'system');
      } else {
        document.documentElement.classList.add(validTheme);
      }
    } catch (_) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';
      document.documentElement.classList.add(systemTheme, 'system');
    }
  }
  return `(${themeFn.toString()})();`;
})();

type ThemeContextState = {
  userTheme: UserTheme;
  appTheme: AppTheme;
  setTheme: (theme: UserTheme) => void;
};

const ThemeContext = createContext<ThemeContextState | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [userTheme, setUserTheme] = useState<UserTheme>(getStoredUserTheme);

  useEffect(() => {
    if (userTheme !== 'system') return;
    return setupPreferredListener();
  }, [userTheme]);

  const appTheme = userTheme === 'system' ? getSystemTheme() : userTheme;

  const setTheme = (newUserTheme: UserTheme) => {
    const validatedTheme = userThemeSchema.parse(newUserTheme);
    setUserTheme(validatedTheme);
    setStoredTheme(validatedTheme);
    handleThemeChange(validatedTheme);
  };

  return (
    <ThemeContext value={{ userTheme, appTheme, setTheme }}>
      <ScriptOnce>{themeScript}</ScriptOnce>
      {children}
    </ThemeContext>
  );
}

export const useTheme = () => {
  const context = use(ThemeContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
