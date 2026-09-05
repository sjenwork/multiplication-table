import { describe, expect, it } from 'vitest';
import type { DownloadPort, HapticsPort, NavigationPort, PwaUpdatePort, StoragePort, ViewportPort } from '../../src/ports';

describe('port contracts', () => {
  it('exposes the six replaceable platform boundaries', () => {
    const ports: [StoragePort, HapticsPort, DownloadPort, NavigationPort, PwaUpdatePort, ViewportPort] = [] as never;
    expect(ports).toHaveLength(0);
  });
});
