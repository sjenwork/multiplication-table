<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { PwaUpdatePort } from '../ports';

  export let updatePort: PwaUpdatePort | null = null;
  let visible = false;
  let updating = false;
  let unsubscribe: () => void = () => undefined;
  let boundPort: PwaUpdatePort | null = null;

  $: if (updatePort && updatePort !== boundPort) bind(updatePort);

  function bind(port: PwaUpdatePort) {
    unsubscribe();
    boundPort = port;
    visible = port.hasWaitingUpdate();
    unsubscribe = port.onUpdateAvailable(() => { visible = true; });
  }

  onDestroy(unsubscribe);

  async function applyUpdate() {
    if (!updatePort) return;
    updating = true;
    visible = false;
    await updatePort.update();
    updating = false;
  }
</script>

{#if visible}
  <aside class="update-pill" role="status" aria-live="polite"><span>有新版本可用</span><button type="button" aria-label="更新版本" disabled={updating} onclick={applyUpdate}>{updating ? '更新中…' : '更新'}</button></aside>
{/if}

<style>
  .update-pill { position: fixed; right: 1rem; bottom: 1rem; z-index: 20; display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0.8rem 0.65rem 1rem; border: 1px solid var(--ds-update-border); border-radius: 999px; background: var(--ds-update-surface); color: var(--ds-update-text); box-shadow: var(--ds-shadow-sm); font-weight: 700; } button { border: 0; border-radius: 999px; padding: 0.4rem 0.7rem; background: var(--ds-update-text); color: var(--ds-update-surface); font: inherit; font-weight: 800; cursor: pointer; } button:disabled { opacity: 0.7; }
</style>
