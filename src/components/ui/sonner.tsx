import {
  CheckCircleIcon,
  InfoIcon,
  SpinnerIcon,
  WarningIcon,
  XCircleIcon,
} from '@phosphor-icons/react';
import type * as React from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { useTheme } from '@/app/theme/ThemeProvider';

const Toaster = ({ ...props }: ToasterProps) => {
  const { appTheme } = useTheme();

  return (
    <Sonner
      theme={appTheme}
      className="toaster group"
      icons={{
        success: <CheckCircleIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <WarningIcon className="size-4" />,
        error: <XCircleIcon className="size-4" />,
        loading: <SpinnerIcon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            'border border-border bg-popover text-popover-foreground shadow-lg px-4 py-3 text-base',
          description: 'text-sm text-muted-foreground',
          actionButton: 'h-11 px-4 text-sm',
          cancelButton: 'h-11 px-4 text-sm',
          closeButton: 'h-11 w-11',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
