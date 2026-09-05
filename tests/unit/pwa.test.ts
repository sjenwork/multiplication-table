import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { serviceWorkerUpdate } from '../../src/adapters/browser/service-worker-update';

describe('PWA build and update boundaries', () => {
  it('copies only the new dist PWA contract in deploy.sh', () => {
    const script = readFileSync('deploy.sh', 'utf8');
    expect(script).toContain('npm run build');
    expect(script).toContain('pages deploy dist');
    expect(script).toContain('dev)');
    expect(script).toContain('main)');
    expect(script).not.toContain('pages deploy .');
  });

  it('reports waiting updates and sends skip-waiting without permanent visibility', async () => {
    const waiting = { postMessage: vi.fn() } as unknown as ServiceWorker;
    const registration = { waiting, installing: null, addEventListener: vi.fn() } as unknown as ServiceWorkerRegistration;
    const update = serviceWorkerUpdate(registration);
    const listener = vi.fn();
    update.onUpdateAvailable(listener);
    expect(update.hasWaitingUpdate()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    await update.update();
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });

  it('keeps the generated PWA source versioned and self-contained', () => {
    const worker = readFileSync('src/pwa/sw.js', 'utf8');
    const manifest = JSON.parse(readFileSync('src/pwa/manifest.webmanifest', 'utf8')) as { start_url: string; icons: unknown[] };
    expect(worker).toContain('__VERSION__');
    expect(worker).toContain('/quiz.html');
    expect(manifest.start_url).toBe('/');
    expect(manifest.icons).toHaveLength(2);
  });
});
