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
    await updatePort.update();
    updating = false;
  }
</script>

{#if visible}
  <button class="update-pill ds-update-pill" type="button" aria-label="更新網站版本" disabled={updating} onclick={applyUpdate}>{updating ? '更新中…' : '有新版本，立即更新'}</button>
{/if}

<style>
  .update-pill { position: fixed; left: 50%; top: max(0.75rem, env(safe-area-inset-top)); z-index: 70; transform: translateX(-50%); border: 1px solid var(--ds-update-border); border-radius: 999px; padding: 0.5rem 1rem; color: var(--ds-update-text); font-size: 0.75rem; font-weight: 700; line-height: 1.25; box-shadow: var(--ds-shadow-lg, var(--ds-shadow-md)); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); transition: transform 150ms ease, background-color 150ms ease; cursor: pointer; }
  .update-pill:active { transform: translateX(-50%) scale(0.95); }
  .update-pill:disabled { cursor: wait; opacity: 0.8; }
</style>
