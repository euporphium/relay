/*
  Minimal service worker for installability and future push support.
  This intentionally avoids precaching or offline persistence to keep
  behavior server-first and explicit.

  Updates apply on the next navigation after the new worker activates.
  We do not force activation or reloads here; add that only if desired.
  Add future caching logic inside the fetch handler below.
*/

self.addEventListener('install', () => {
  // No precache. The SW installs when the browser decides it's safe.
});

self.addEventListener('activate', () => {
  // No claim/skipWaiting here. Activation should be user-driven (next load).
});

self.addEventListener('fetch', () => {
  // Intentionally empty: no caching by default.
});

self.addEventListener('push', (event) => {
  // Placeholder for future push integration. Keep payload handling minimal.
  const payload = (() => {
    try {
      return event.data?.json() ?? {};
    } catch {
      return { body: event.data?.text() };
    }
  })();

  const title = payload.title ?? 'Relay';
  const options = {
    body: payload.body ?? 'You have a new notification.',
    data: payload.data ?? {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Future: route to a specific page once deep-linking is defined.
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
        return;
      }

      return self.clients.openWindow('/');
    }),
  );
});
