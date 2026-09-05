import type { PwaUpdatePort } from '../../ports';

export function serviceWorkerUpdate(registration: ServiceWorkerRegistration, reload: () => void = () => window.location.reload()): PwaUpdatePort {
  return {
    hasWaitingUpdate: () => registration.waiting !== null,
    onUpdateAvailable(listener) {
      if (registration.waiting) listener();
      const onFound = () => {
        registration.installing?.addEventListener('statechange', () => {
          if (registration.installing?.state === 'installed' && navigator.serviceWorker.controller) listener();
        });
      };
      registration.addEventListener('updatefound', onFound);
      return () => registration.removeEventListener('updatefound', onFound);
    },
    update: async () => {
      const worker = registration.waiting;
      if (!worker) return;
      if (typeof navigator !== 'undefined' && navigator.serviceWorker) navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true });
      worker.postMessage({ type: 'SKIP_WAITING' });
    },
  };
}

export async function registerBrowserServiceWorker(path = '/sw.js'): Promise<PwaUpdatePort | null> {
  if (!('serviceWorker' in navigator)) return null;
  const registration = await navigator.serviceWorker.register(path);
  return serviceWorkerUpdate(registration);
}
