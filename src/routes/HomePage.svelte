<script lang="ts">
  import { onMount } from 'svelte';
  import ActionBar from '../components/ActionBar.svelte';
  import SelectionGrid from '../components/SelectionGrid.svelte';
  import { selectAll, toggleColumn, toggleKey, toggleRow } from '../domain/selection';
  import { questionBank, type Factor } from '../domain/question';
  import { DEFAULT_STATE, migrateState, parseState, serializeState, STORAGE_KEY, type AppState } from '../domain/state';
  import { startWrongQuiz } from '../application/quiz-session';
  import type { DownloadPort, HapticsPort, NavigationPort, StoragePort } from '../ports';

  export let storage: StoragePort;
  export let download: DownloadPort = { download: () => undefined };
  export let navigation: NavigationPort = { go: () => undefined, back: () => undefined };
  export let haptics: HapticsPort = { vibrate: () => undefined };

  // Read synchronously so the first interactive render cannot overwrite persisted state.
  let state: AppState = parseState(storage.get(STORAGE_KEY));
  let settingsOpen = false;
  let status = '尚未選擇題目，請先點擊表格中的格子。';
  let statusNotice = '';

  $: hasSelection = state.selected.length > 0;
  $: hasWrongAnswers = questionBank().some((question) => (state.records[question.key]?.errors ?? 0) > 0);
  $: status = statusNotice || (hasSelection ? `已選擇 ${state.selected.length} 題，準備好就開始挑戰！` : '尚未選擇題目，請先點擊表格中的格子。');

  onMount(() => {
    state = parseState(storage.get(STORAGE_KEY));
    document.documentElement.dataset.theme = state.theme;
  });

  function persist(next: AppState) {
    state = next;
    storage.set(STORAGE_KEY, serializeState(state));
    haptics.vibrate(8);
  }

  function updateSelection(selected: string[]) { persist({ ...state, selected }); }
  function startChallenge() { navigation.go('quiz.html'); }
  function randomQuiz() { statusNotice = ''; navigation.go('quiz.html?random=1'); }
  function wrongFirstQuiz() {
    const result = startWrongQuiz(storage, state);
    if (!result) { statusNotice = '目前沒有錯題，先完成幾題再試試錯題優先。'; return; }
    statusNotice = '';
    navigation.go('quiz.html');
  }
  function changeTheme(theme: 'light' | 'dark') {
    document.documentElement.dataset.theme = theme;
    persist({ ...state, theme });
  }
  function exportRecords() {
    const rows = [['題目', '錯誤次數', '作答次數']];
    for (const question of questionBank()) {
      const record = state.records[question.key] ?? { errors: 0, attempts: 0 };
      rows.push([question.key, String(record.errors), String(record.attempts)]);
    }
    download.download('multiplication-records.csv', `\uFEFF${rows.map((row) => row.join(',')).join('\n')}`, 'text/csv;charset=utf-8');
  }
  function clearState() {
    storage.remove(STORAGE_KEY);
    state = migrateState(DEFAULT_STATE);
    document.documentElement.dataset.theme = state.theme;
    settingsOpen = false;
  }
</script>

<svelte:head><meta name="theme-color" content={state.theme === 'dark' ? '#091a30' : '#f4fbff'} /></svelte:head>

<main class="home-page" aria-labelledby="migration-title">
  <header class="page-header">
    <div class="brand-lockup"><p class="eyebrow">MULTIPLICATION MASTER</p><h1 id="migration-title">乘法小達人</h1></div>
    <button class="icon-button ds-secondary" type="button" aria-label="開啟設定" onclick={() => settingsOpen = true}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>
    </button>
  </header>
  <section class="instruction ds-surface" aria-label="選題說明">
    點選或長按滑動選題；每次隨機 10 題，不足則全部出題。
  </section>
  <div class="selection-scroll" data-selection-scroll aria-label="九九乘法表，可上下左右捲動；長按格子後滑動可批次選題">
    <SelectionGrid
      selected={state.selected}
      records={state.records}
      onToggle={(key) => updateSelection(toggleKey(state.selected, key))}
      onSelection={updateSelection}
      onRow={(row: Factor) => updateSelection(toggleRow(state.selected, row))}
      onColumn={(column: Factor) => updateSelection(toggleColumn(state.selected, column))}
      onAll={(selected: boolean) => updateSelection(selectAll(state.selected, selected))}
    />
  </div>
  <ActionBar status={status} hasSelection={hasSelection} hasWrongAnswers={hasWrongAnswers} onStart={startChallenge} onRandom={randomQuiz} onWrongFirst={wrongFirstQuiz} />
</main>

{#if settingsOpen}
  <div class="modal-backdrop ds-modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && (settingsOpen = false)}>
    <div class="settings-modal ds-modal-surface" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div class="modal-heading"><h2 id="settings-title">設定</h2><button class="icon-button modal-close" type="button" aria-label="關閉設定" onclick={() => settingsOpen = false}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
      <p class="settings-description">管理你的練習資料與成績統計。</p>
      <fieldset><legend>顯示主題</legend><div class="theme-choices" role="group" aria-label="選擇顯示主題"><button class="ds-theme-choice" type="button" aria-label="淺色主題" aria-pressed={state.theme === 'light'} onclick={() => changeTheme('light')}>☀️ 明亮</button><button class="ds-theme-choice" type="button" aria-label="深色主題" aria-pressed={state.theme === 'dark'} onclick={() => changeTheme('dark')}>🌙 深色</button></div></fieldset>
      <div class="settings-actions"><button class="ds-secondary" type="button" aria-label="匯出紀錄" onclick={exportRecords}>匯出成績統計紀錄（CSV）</button><button class="ds-danger" type="button" aria-label="清除資料" onclick={clearState}>清除所有練習紀錄</button></div>
    </div>
  </div>
{/if}

<style>
  .home-page { box-sizing: border-box; display: flex; flex-direction: column; width: min(100%, 72rem); height: 100svh; min-height: 0; margin: 0 auto; padding: max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) calc(5rem + env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left)); overflow: hidden; }
  .page-header, .modal-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .page-header { position: relative; flex: 0 0 auto; justify-content: center; margin-bottom: 1.5rem; text-align: center; }
  .brand-lockup { min-width: 0; }
  .eyebrow { margin: 0 0 0.5rem; color: var(--ds-brand-strong); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.2em; }
  h1, h2, p { margin-top: 0; } h1 { margin-bottom: 0.5rem; color: var(--ds-text-strong); font-size: clamp(1.5rem, 4vw, 1.875rem); font-weight: 800; } h2 { margin-bottom: 0.5rem; color: var(--ds-text-strong); }
  .icon-button { display: inline-flex; width: 2.25rem; height: 2.25rem; align-items: center; justify-content: center; padding: 0; border-radius: 999px; }
  .icon-button svg { width: 1.125rem; height: 1.125rem; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
  .page-header > .icon-button { position: absolute; top: 50%; right: 0; transform: translateY(-50%); }
  .instruction { flex: 0 0 auto; margin-bottom: 1rem; padding: 0.75rem 1rem; border-radius: var(--ds-radius-md); color: var(--ds-text); font-size: 0.875rem; line-height: 1.5; text-align: center; }
  .selection-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; isolation: isolate; border-radius: var(--ds-radius-md); padding-bottom: 0.5rem; overscroll-behavior: contain; }
  .modal-backdrop { position: fixed; inset: 0; z-index: 10; display: grid; place-items: center; padding: max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left)); background: var(--ds-modal-backdrop); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
  .settings-modal { box-sizing: border-box; width: min(100%, 24rem); max-height: calc(100svh - 2rem); margin: 0; overflow: auto; padding: 1.5rem; border-radius: var(--ds-radius-lg); color: var(--ds-text); }
  .modal-heading h2 { margin: 0; }
  .settings-modal .modal-close { width: 2rem; height: 2rem; border: 0; background: transparent !important; color: var(--ds-text-muted); box-shadow: none; }
  .settings-modal .modal-close:hover { background: var(--ds-surface-muted) !important; color: var(--ds-text); }
  .settings-description { margin: 0.5rem 0 0; color: var(--ds-text-muted); font-size: 0.875rem; line-height: 1.5; }
  fieldset { margin: 1.25rem 0; border: 0; padding: 0; } legend { width: 100%; margin-bottom: 0.5rem; color: var(--ds-text); font-size: 0.875rem; font-weight: 700; } .theme-choices { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem; } .theme-choices button { min-height: 3rem; border: 1px solid var(--ds-border-strong); border-radius: var(--ds-radius-sm); padding: 0.75rem 1rem; background: var(--ds-surface); color: var(--ds-text); font: inherit; font-size: 0.875rem; font-weight: 700; cursor: pointer; } .settings-actions { display: grid; gap: 0.75rem; } .settings-actions button { width: 100%; text-align: left; } .settings-actions .ds-secondary { border-color: var(--ds-brand-soft) !important; background: var(--ds-brand-soft) !important; color: var(--ds-brand-strong) !important; }
</style>
