const CACHE = 'workout-player-v3';
// Hashed Vite assets are cached on the fly by the fetch handler.
const SHELL = ['./', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network first for the app shell (always fresh when online), cache as offline fallback.
// GitHub Pages sends max-age=600: unhashed files (index.html...) are revalidated, or a deploy would
// stay invisible for up to 10 minutes. Hashed assets never change, the HTTP cache is fine for them.
const hashed = url => url.pathname.includes('/assets/');

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // A navigate-mode Request cannot be re-created with options: fetch the URL instead.
  const net = hashed(url) ? fetch(e.request) : fetch(url.href, { cache: 'no-cache' });
  e.respondWith(
    net
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
