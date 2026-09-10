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
    let updateShown = false;
    const showUpdate = () => {
        if (updateShown) return;
        updateShown = true;
        button.classList.remove('hidden');
        button.textContent = '有新版本，立即更新';
    };
    button.addEventListener('click', forceUpdate);
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            const checkWaiting = () => {
                if (registration.waiting) showUpdate();
            };
            const watchInstalling = () => {
                const worker = registration.installing;
                if (!worker) return;
                worker.addEventListener('statechange', () => {
                    if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate();
                });
            };

            checkWaiting();
            registration.addEventListener('updatefound', () => {
                watchInstalling();
            });
            watchInstalling();
            registration.update().then(checkWaiting).catch(() => {});

            // Some browsers complete update() after the event listener turn.
            // Keep checking briefly so the update pill cannot be missed.
            let attempts = 0;
            const checkAgain = () => {
                checkWaiting();
                if (!updateShown && attempts++ < 10) window.setTimeout(checkAgain, 500);
            };
            window.setTimeout(checkAgain, 0);
        }).catch(() => {});
    }
}
