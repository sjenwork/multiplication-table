<script lang="ts">
  export let hasSelection = false;
  export let onStart: () => void = () => undefined;
  export let onRandom: () => void = () => undefined;
  export let hasWrongAnswers = false;
  export let onWrongFirst: () => void = () => undefined;
  export let onInvert: () => void = () => undefined;
  export let onSettings: () => void = () => undefined;
</script>

<div class="action-bar" role="toolbar" aria-label="題目操作">
  <button type="button" aria-label="開始挑戰" disabled={!hasSelection} onclick={onStart}>開始挑戰</button>
  <button type="button" aria-label="錯題優先" disabled={!hasWrongAnswers} onclick={onWrongFirst}>錯題優先</button>
  <button type="button" aria-label="隨機出題" onclick={onRandom}>隨機出題</button>
  <button type="button" aria-label="反選題目" onclick={onInvert}>反選</button>
  <button type="button" aria-label="設定" onclick={onSettings}>設定</button>
</div>

<style>
  .action-bar { display: flex; flex-wrap: nowrap; gap: 0.5rem; margin-top: 1rem; overflow-x: auto; padding-bottom: 0.25rem; }
  .action-bar button { flex: 0 0 auto; white-space: nowrap; }
  button { border: 0; border-radius: var(--ds-radius-sm); padding: 0.7rem 1rem; background: var(--ds-brand); color: var(--ds-on-brand); font: inherit; font-weight: 700; cursor: pointer; }
  button:disabled { background: var(--ds-disabled); cursor: not-allowed; }
  button:focus-visible { outline: 3px solid var(--ds-focus); outline-offset: 2px; }
</style>
