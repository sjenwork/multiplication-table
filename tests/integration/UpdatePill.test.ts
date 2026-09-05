import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tick } from 'svelte';
import UpdatePill from '../../src/components/UpdatePill.svelte';
import type { PwaUpdatePort } from '../../src/ports';

afterEach(cleanup);

describe('UpdatePill integration', () => {
  it('stays hidden when no waiting service-worker update exists', () => {
    const port: PwaUpdatePort = { hasWaitingUpdate: () => false, onUpdateAvailable: () => () => undefined, update: async () => undefined };
    render(UpdatePill, { props: { updatePort: port } });
    expect(screen.queryByRole('button', { name: '更新網站版本' })).not.toBeInTheDocument();
  });

  it('shows only when waiting and invokes update from the visible pill', async () => {
    let listener: (() => void) | undefined;
    const update = vi.fn(async () => undefined);
    const port: PwaUpdatePort = { hasWaitingUpdate: () => false, onUpdateAvailable: (next) => { listener = next; return () => undefined; }, update };
    render(UpdatePill, { props: { updatePort: port } });
    expect(screen.queryByRole('button', { name: '更新網站版本' })).not.toBeInTheDocument();
    listener?.();
    await tick();
    expect(screen.getByRole('button', { name: '更新網站版本' })).toHaveTextContent('有新版本，立即更新');
    await fireEvent.click(screen.getByRole('button', { name: '更新網站版本' }));
    expect(update).toHaveBeenCalledTimes(1);
  });
});
