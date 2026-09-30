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
 * On install the shell pages are precached, and so is every hashed asset they
 * reference — found by reading the HTML and CSS rather than listed by hand.
 * Without that, a first visit would load its chunks and fonts before this
 * worker took control, they would never be cached, and an offline reload would
 * come back broken. Share links are fine offline too: the calendar is
 * in the URL fragment, which never reaches the network or this cache key.
 *
 * Bump CACHE to drop everything from an older version on activate.
 */
const CACHE = 'yliw-v1';
const SHELL = ['/', '/calendar', '/view', '/manifest.webmanifest', '/icons/icon-192.png'];

const ASSET = /\/_next\/static\/[^"'\s)\\]+/g;

async function precache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);

  const assets = new Set();
  for (const path of SHELL) {
    const response = await cache.match(path);
    if (!response || !(response.headers.get('content-type') || '').includes('html')) continue;
    for (const url of (await response.text()).match(ASSET) || []) assets.add(url);
  }
  // Stylesheets reference the self-hosted fonts.
  for (const url of [...assets].filter(u => u.endsWith('.css'))) {
    const response = await fetch(url);
    if (response.ok) for (const font of (await response.text()).match(ASSET) || []) assets.add(font);
  }
  await cache.addAll([...assets]);
}

self.addEventListener('install', event => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
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
