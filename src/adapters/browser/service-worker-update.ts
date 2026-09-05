import type { PwaUpdatePort } from '../../ports';

export function serviceWorkerUpdate(registration: ServiceWorkerRegistration): PwaUpdatePort {
  return { hasWaitingUpdate: () => registration.waiting !== null, update: async () => { registration.waiting?.postMessage({ type: 'SKIP_WAITING' }); } };
}
