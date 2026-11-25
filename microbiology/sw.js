const prefix = 'microbiology-rebuild:';
const version = prefix + '930464bc9e5933ccedbc';
const assets = ["index.html","style.css","app.mjs","domain.mjs","session.mjs","state.mjs","persistence.mjs","manifest.webmanifest","icon-192.png","icon-512.png","questions.json","images/1.jpg","images/2.jpg","images/3.jpg","images/4.jpg","images/5.jpg","images/6.jpg","images/7.jpg","images/8.jpg","images/9.jpg","images/10.jpg","images/11.jpg","images/12.jpg"];
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
