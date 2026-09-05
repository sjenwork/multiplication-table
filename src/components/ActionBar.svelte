<script lang="ts">
  export let hasSelection = false;
  export let status = '';
  export let onStart: () => void = () => undefined;
  export let onRandom: () => void = () => undefined;
  export let hasWrongAnswers = false;
  export let onWrongFirst: () => void = () => undefined;
</script>

<div class="action-bar" role="toolbar" aria-label="題目操作">
  <p class="selection-status" role="status" aria-live="polite">{status}</p>
  <div class="action-buttons">
    <button class="ds-primary" type="button" aria-label="隨機出題" onclick={onRandom}>隨機出題</button>
    <button class="ds-accent" type="button" aria-label="錯題優先" disabled={!hasWrongAnswers} onclick={onWrongFirst}>錯題優先</button>
    <button class="ds-primary" type="button" aria-label="開始挑戰" disabled={!hasSelection} onclick={onStart}>開始挑戰</button>
  </div>
</div>

<style>
  .action-bar { position: fixed; right: 0; bottom: 0; left: 0; z-index: 5; display: flex; align-items: center; gap: 0.5rem; min-height: 4rem; box-sizing: border-box; padding-top: 0.625rem; padding-right: max(0.5rem, env(safe-area-inset-right)); padding-bottom: calc(0.625rem + env(safe-area-inset-bottom)); padding-left: max(0.5rem, env(safe-area-inset-left)); border-top: 1px solid var(--ds-border); background: var(--ds-surface-strong); box-shadow: 0 -6px 18px var(--ds-shadow-color); backdrop-filter: blur(18px) saturate(135%); -webkit-backdrop-filter: blur(18px) saturate(135%); }
  .selection-status { flex: 1 1 auto; min-width: 0; margin: 0; color: var(--ds-text-muted); font-size: 0.75rem; font-weight: 600; line-height: 1.25; }
  .action-buttons { display: flex; flex: 0 0 auto; gap: 0.5rem; overflow-x: auto; }
  .action-buttons button { flex: 0 0 auto; white-space: nowrap; border: 0; border-radius: var(--ds-radius-md); padding: 0.625rem 0.75rem; font: inherit; font-size: 0.875rem; font-weight: 700; cursor: pointer; }
  button:disabled { background: var(--ds-disabled); cursor: not-allowed; }
  button:focus-visible { outline: 3px solid var(--ds-focus); outline-offset: 2px; }
  @media (min-width: 40rem) { .action-bar { padding-right: max(1rem, env(safe-area-inset-right)); padding-left: max(1rem, env(safe-area-inset-left)); } .action-buttons button { padding-right: 1rem; padding-left: 1rem; } }
</style>
