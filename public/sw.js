/*
 * Offline support.
 *
 * Next's static export gives chunks content-hashed names that change on every
 * build, so a precache list kept by hand would go stale. Instead:
 *
 *  - /_next/static/* is immutable by construction, so it is cache-first.
 *  - Pages are network-first with a cache fallback: online visitors always get
 *    the latest HTML (which references the latest chunks), and the app still
 *    opens offline once visited.
 *
 * The app shell is precached on install so the first offline launch works even
 * for pages not yet visited. Share links are fine offline too: the calendar is
 * in the URL fragment, which never reaches the network or this cache key.
 *
 * Bump CACHE to drop everything from an older version on activate.
 */
const CACHE = 'yliw-v1';
const SHELL = ['/', '/calendar', '/view', '/manifest.webmanifest', '/icons/icon-192.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        cached =>
          cached ||
          fetch(request).then(response => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then(cache => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches
          .match(request, { ignoreSearch: true })
          .then(cached => cached || (request.mode === 'navigate' ? caches.match('/') : undefined))
          .then(cached => cached || Response.error())
      )
  );
});
