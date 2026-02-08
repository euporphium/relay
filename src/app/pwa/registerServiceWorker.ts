export function registerServiceWorker() {
  // Keep this explicit and minimal. Updates apply on next navigation.
  // Do not force activation or page reloads unless explicitly desired.
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
    console.warn('Service worker registration failed', error);
  });
}
