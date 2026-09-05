const CACHE_NAME = 'multiplication-master-v20260905-230412';
const APP_SHELL = [
    '/',
    '/index.html',
    '/quiz.html',
    '/app.js?v=20260905-230412',
    '/design-tokens.css?v=20260905-230412',
    '/theme-init.js?v=20260905-230412',
    '/pwa.css?v=20260905-230412',
    '/manifest.webmanifest',
    '/icons/icon.svg',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
    );
    self.clients.claim();
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    const requestUrl = new URL(event.request.url);
    const latestFirst = event.request.mode === 'navigate'
        || requestUrl.pathname.endsWith('.html')
        || requestUrl.pathname.endsWith('/app.js');
    if (latestFirst) {
        event.respondWith(
            fetch(event.request).then((response) => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                return response;
            }).catch(() => caches.match(event.request, { ignoreSearch: true }).then((cached) => cached || caches.match('/index.html')))
        );
        return;
    }
    event.respondWith(
        caches.match(event.request, { ignoreSearch: true }).then((cached) => cached || fetch(event.request).then((response) => {
            if (requestUrl.origin === self.location.origin) {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            }
            return response;
        }).catch(() => caches.match('/index.html')))
    );
});
