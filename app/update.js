async function forceUpdate() {
    const button = document.getElementById('force-update');
    if (button) { button.disabled = true; button.textContent = '更新中…'; }
    const registrations = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistrations() : [];
    await Promise.all(registrations.map((registration) => {
        if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        return registration.unregister();
    }));
    if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    }
    const url = new URL(window.location.href);
    url.searchParams.set('_update', Date.now());
    window.location.replace(url.toString());
}

export function initVersionUpdate() {
    const button = document.getElementById('force-update');
    if (!button) return;
    const showUpdate = () => {
        button.classList.remove('hidden');
        button.textContent = '有新版本，立即更新';
    };
    button.addEventListener('click', forceUpdate);
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            if (registration.waiting) showUpdate();
            registration.update().catch(() => {});
            registration.addEventListener('updatefound', () => {
                const worker = registration.installing;
                if (!worker) return;
                worker.addEventListener('statechange', () => {
                    if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate();
                });
            });
        }).catch(() => {});
    }
}
