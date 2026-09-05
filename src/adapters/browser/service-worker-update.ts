import type { PwaUpdatePort } from '../../ports';

export function serviceWorkerUpdate(registration: ServiceWorkerRegistration, reload: () => void = () => window.location.reload()): PwaUpdatePort {
  const hasController = () => typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
  return {
    hasWaitingUpdate: () => registration.waiting !== null && hasController(),
    onUpdateAvailable(listener) {
      if (registration.waiting && hasController()) listener();
      const checkWaiting = () => {
        if (registration.waiting && hasController()) listener();
      };
      const onFound = () => {
        registration.installing?.addEventListener('statechange', checkWaiting);
      };
      registration.addEventListener('updatefound', onFound);
      queueMicrotask(checkWaiting);
      return () => {
        registration.removeEventListener('updatefound', onFound);
        registration.installing?.removeEventListener('statechange', checkWaiting);
      };
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
