// Offline support for the organizer. Pages: network first, cached copy when
// offline. Hashed assets: cached on first use. No data passes through here;
// the organizer's data lives in IndexedDB on the device.
const CACHE = 'organizer-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const response = await fetch('/organizer/', { cache: 'no-cache' });
      const html = await response.clone().text();
      await cache.put('/organizer/', response);
      const urls = [...html.matchAll(/(?:src|href)="(\/(?:assets|organizer)\/[^"]+)"/g)].map((m) => m[1]);
      await cache.addAll([...new Set(urls)]);
    })(),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key !== CACHE) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate' && url.pathname.startsWith('/organizer')) {
    event.respondWith(
      // no-cache: always ask the server for the newest page (GitHub Pages
      // otherwise lets the browser reuse it for 10 minutes), offline: cached copy.
      fetch(event.request.url, { cache: 'no-cache' })
        .then((response) => {
          const copy = response.clone();
          if (response.ok) caches.open(CACHE).then((cache) => cache.put('/organizer/', copy));
          return response;
        })
        .catch(() => caches.match('/organizer/')),
    );
    return;
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/organizer/')) {
    event.respondWith(
      caches.match(event.request).then(
        (hit) =>
          hit ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(event.request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
