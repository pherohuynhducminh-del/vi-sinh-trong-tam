const prefix = 'microbiology-rebuild:';
const version = prefix + '__VERSION__';
const assets = __ASSETS__;
const shell = new URL('index.html', self.registration.scope);
const urls = new Set(assets.map(asset => new URL(asset, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(version).then(cache =>
    cache.addAll([...urls].map(url => new Request(url, { cache: 'reload' })))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(prefix) && key !== version)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET') return;
  const entry = url.href.startsWith(self.registration.scope) && request.mode === 'navigate' &&
    (url.pathname === new URL(self.registration.scope).pathname || url.pathname === shell.pathname);
  if (!entry && !urls.has(url.href)) return;
  event.respondWith(caches.open(version).then(cache =>
    cache.match(entry ? shell.href : request).then(response => response ?? fetch(request))));
});
