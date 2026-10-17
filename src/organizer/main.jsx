import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Root from './Root';
import { requestPersistence } from './lib/storage';
import './organizer.css';

const params = new URLSearchParams(window.location.search);
const demo = params.has('demo');
const fixedDay = Number(params.get('today')) || undefined;

if (!demo) {
  requestPersistence();
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    // When a newer version takes over, reload once into it, so updates show up
    // without the owner having to close and reopen the app.
    const hadController = Boolean(navigator.serviceWorker.controller);
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloading) return;
      reloading = true;
      window.location.reload();
    });
    navigator.serviceWorker
      .register('/organizer/sw.js', { scope: '/organizer/', updateViaCache: 'none' })
      .then((registration) => {
        // Check for a new version whenever the app comes back to the screen.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') registration.update().catch(() => {});
        });
      })
      .catch(() => {});
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root demo={demo} fixedDay={fixedDay} />
  </StrictMode>,
);
