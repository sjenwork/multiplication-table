<script lang="ts">
  export let open = false;
  export let theme: 'light' | 'dark' = 'light';
  export let keypadMode: 'fixed' | 'floating' | null = null;
  export let onClose: () => void = () => undefined;
  export let onTheme: (theme: 'light' | 'dark') => void = () => undefined;
  export let onKeypadMode: (mode: 'fixed' | 'floating') => void = () => undefined;
  export let onExport: () => void = () => undefined;
  export let onClear: () => void = () => undefined;
</script>

{#if open}
  <div class="modal-backdrop ds-modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && onClose()}>
    <div class="settings-modal ds-modal-surface" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div class="modal-heading">
        <h2 id="settings-title">設定</h2>
        <button class="modal-close" type="button" aria-label="關閉設定" onclick={onClose}>×</button>
      </div>
      <p class="settings-description">管理你的練習資料與成績統計。</p>
      {#if keypadMode}
        <fieldset>
          <legend>數字鍵盤</legend>
          <div class="theme-choices" role="group" aria-label="選擇鍵盤顯示方式">
          <button class="choice ds-theme-choice" type="button" aria-label="固定鍵盤" aria-pressed={keypadMode === 'fixed'} onclick={() => onKeypadMode('fixed')}>固定鍵盤</button>
            <button class="choice ds-theme-choice" type="button" aria-label="浮動鍵盤" aria-pressed={keypadMode === 'floating'} onclick={() => onKeypadMode('floating')}>浮動鍵盤</button>
          </div>
        </fieldset>
      {/if}
      <fieldset>
        <legend>顯示主題</legend>
        <div class="theme-choices" role="group" aria-label="選擇顯示主題">
          <button class="choice ds-theme-choice" type="button" aria-label="淺色主題" aria-pressed={theme === 'light'} onclick={() => onTheme('light')}>☀️ 明亮</button>
          <button class="choice ds-theme-choice" type="button" aria-label="深色主題" aria-pressed={theme === 'dark'} onclick={() => onTheme('dark')}>🌙 深色</button>
        </div>
      </fieldset>
      <div class="settings-actions">
        <button class="export-action ds-export-action" type="button" aria-label="匯出紀錄" onclick={onExport}>匯出成績統計紀錄（CSV）</button>
        <button class="clear-action ds-clear-action" type="button" aria-label="清除資料" onclick={onClear}>清除所有練習紀錄</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; padding: max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left)); background: var(--ds-modal-backdrop); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
  .settings-modal { box-sizing: border-box; width: min(100%, 24rem); max-height: calc(100svh - 2rem); margin: 0; overflow: auto; padding: 1.5rem; border-radius: var(--ds-radius-lg); color: var(--ds-text); }
  .modal-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  h2 { margin: 0; color: var(--ds-text-strong); font-size: 1.125rem; }
  .modal-close { display: inline-flex; width: 2rem; height: 2rem; align-items: center; justify-content: center; border: 0; border-radius: 999px; background: transparent; color: var(--ds-text-muted); font: inherit; font-size: 1.4rem; cursor: pointer; }
  .modal-close:hover { background: var(--ds-surface-muted); color: var(--ds-text); }
  .settings-description { margin: 0.5rem 0 0; color: var(--ds-text-muted); font-size: 0.875rem; line-height: 1.5; }
  fieldset { margin: 1.25rem 0; border: 0; padding: 0; } legend { width: 100%; margin-bottom: 0.5rem; color: var(--ds-text); font-size: 0.875rem; font-weight: 700; }
  .theme-choices { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem; }
  .choice { min-height: 3rem; border: 1px solid var(--ds-border-strong); border-radius: var(--ds-radius-sm); padding: 0.75rem 1rem; background: var(--ds-surface); color: var(--ds-text); font: inherit; font-size: 0.875rem; font-weight: 700; cursor: pointer; }
  .choice[aria-pressed="true"] { border-color: var(--ds-brand-strong); background: var(--ds-brand-soft); color: var(--ds-brand-strong); box-shadow: 0 0 0 2px rgb(97 183 255 / 0.2); }
  .settings-actions { display: grid; gap: 0.75rem; }
  .settings-actions button { width: 100%; border-radius: var(--ds-radius-sm); padding: 0.75rem 1rem; font: inherit; font-size: 0.875rem; font-weight: 700; text-align: left; cursor: pointer; }
  .export-action { border: 1px solid var(--ds-export-border); background: var(--ds-export-surface); color: var(--ds-export-text); }
  .clear-action { border: 1px solid var(--ds-clear-border); background: var(--ds-clear-surface); color: var(--ds-clear-text); }
</style>
