const prefix = 'hoa-sinh-2-rc7:';
const cacheName = prefix + '2';
const assets = [
  './', './index.html', './styles.css', './bank.js', './state.js', './domain.js',
  './ui.js', './install.js', './app.webmanifest', './icon-192.png', './icon-512.png'
];
const appUrls = new Set(assets.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(assets)));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(prefix) && key !== cacheName)
      .map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || !appUrls.has(request.url)) return;
  event.respondWith(caches.open(cacheName).then(async cache => {
    const cached = await cache.match(request);
    return cached || fetch(request);
  }));
});
