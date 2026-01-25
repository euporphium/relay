import { TanStackDevtools } from '@tanstack/react-devtools';
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import stylesUrl from '../styles.css?url';

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
  errorComponent: (props) => (
    <RootDocument>
      <div className="p-6">
        <h1>Something went wrong!</h1>
        <pre>{props.error.message}</pre>
        <button type="button" onClick={() => props.reset()}>
          Try again
        </button>
      </div>
    </RootDocument>
  ),
});

function RootComponent() {
  return (
    <RootDocument>
      <ThemeProvider>
        <Toaster position="bottom-center" closeButton />
        <Outlet />
      </ThemeProvider>
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
