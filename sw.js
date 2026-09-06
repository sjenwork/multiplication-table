const CACHE_NAME = 'multiplication-master-v20260906-191232';
const APP_SHELL = [
    '/',
    '/index.html',
    '/quiz.html',
    '/study.html',
    '/app.js?v=20260906-191232',
    '/app/state.js?v=20260906-191232',
    '/app/keypad.js?v=20260906-191232',
    '/app/settings.js?v=20260906-191232',
    '/app/update.js?v=20260906-191232',
    '/app/quiz-view.js?v=20260906-191232',
    '/app/completion.js?v=20260906-191232',
    '/app/home.js?v=20260906-191232',
    '/app/quiz.js?v=20260906-191232',
    '/app/study.js?v=20260906-191232',
    '/app/components/settings-modal.js?v=20260906-191232',
    '/app/components/completion-overlay.js?v=20260906-191232',
    '/app/components/app-modal.js?v=20260906-191232',
    '/app/components/app-button.js?v=20260906-191232',
    '/app/theme-colors.js?v=20260906-191232',
    '/app/components/multiplication-selector.js?v=20260906-191232',
    '/app/components/numeric-keypad.js?v=20260906-191232',
    '/app/components/multiplication-table.js?v=20260906-191232',
    '/vendor/lit-core.min.js?v=20260906-191232',
    '/design-tokens.css?v=20260906-191232',
    '/theme-init.js?v=20260906-191232',
    '/pwa.css?v=20260906-191232',
    '/tailwind.css?v=20260906-191232',
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
        || requestUrl.searchParams.has('v')
        || requestUrl.pathname.endsWith('/app.js')
        || requestUrl.pathname.endsWith('/app/state.js')
        || requestUrl.pathname.endsWith('/app/keypad.js')
        || requestUrl.pathname.endsWith('/app/settings.js')
        || requestUrl.pathname.endsWith('/app/update.js')
        || requestUrl.pathname.endsWith('/app/quiz-view.js')
        || requestUrl.pathname.endsWith('/app/completion.js')
        || requestUrl.pathname.endsWith('/app/home.js')
        || requestUrl.pathname.endsWith('/app/quiz.js')
        || requestUrl.pathname.endsWith('/app/study.js')
        || requestUrl.pathname.endsWith('/app/components/settings-modal.js')
        || requestUrl.pathname.endsWith('/app/components/completion-overlay.js')
        || requestUrl.pathname.endsWith('/app/components/app-modal.js')
        || requestUrl.pathname.endsWith('/app/components/app-button.js')
        || requestUrl.pathname.endsWith('/app/theme-colors.js')
        || requestUrl.pathname.endsWith('/app/components/multiplication-selector.js')
        || requestUrl.pathname.endsWith('/app/components/multiplication-table.js')
        || requestUrl.pathname.endsWith('/vendor/lit-core.min.js');
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
