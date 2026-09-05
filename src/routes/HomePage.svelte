<script lang="ts">
  import { onMount } from 'svelte';
  import ActionBar from '../components/ActionBar.svelte';
  import SettingsModal from '../components/SettingsModal.svelte';
  import SelectionGrid from '../components/SelectionGrid.svelte';
  import { selectAll, toggleColumn, toggleKey, toggleRow } from '../domain/selection';
  import { questionBank, type Factor } from '../domain/question';
  import { DEFAULT_STATE, migrateState, parseState, serializeState, STORAGE_KEY, type AppState } from '../domain/state';
  import { startSelectedQuiz, startWrongQuiz, startRandomQuiz } from '../application/quiz-session';
  import { exportPracticeRecords } from '../application/export-records';
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
  function startChallenge() {
    startSelectedQuiz(storage, state);
    navigation.go('quiz.html');
  }
  function randomQuiz() {
    statusNotice = '';
    startRandomQuiz(storage, state);
    navigation.go('quiz.html?random=1');
  }
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
    exportPracticeRecords(download, state.records);
    settingsOpen = false;
  }
  function clearState() {
    if (typeof window !== 'undefined' && !window.confirm('確定要清除所有練習紀錄與目前進度嗎？此操作無法復原。')) return;
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

<SettingsModal open={settingsOpen} theme={state.theme} onClose={() => settingsOpen = false} onTheme={changeTheme} onExport={exportRecords} onClear={clearState} />

<style>
  .home-page { box-sizing: border-box; display: flex; flex-direction: column; width: min(100%, 72rem); height: 100svh; min-height: 0; margin: 0 auto; padding: max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) calc(5rem + env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left)); overflow: hidden; }
  .page-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .page-header { position: relative; flex: 0 0 auto; justify-content: center; margin-bottom: 1.5rem; text-align: center; }
  .brand-lockup { min-width: 0; }
  .eyebrow { margin: 0 0 0.5rem; color: var(--ds-brand-strong); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.2em; }
  h1, p { margin-top: 0; } h1 { margin-bottom: 0.5rem; color: var(--ds-text-strong); font-size: clamp(1.5rem, 4vw, 1.875rem); font-weight: 800; }
  .icon-button { display: inline-flex; width: 2.25rem; height: 2.25rem; align-items: center; justify-content: center; padding: 0; border-radius: 999px; }
  .icon-button svg { width: 1.125rem; height: 1.125rem; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
  .page-header > .icon-button { position: absolute; top: 50%; right: 0; transform: translateY(-50%); }
  .instruction { flex: 0 0 auto; margin-bottom: 1rem; padding: 0.75rem 1rem; border-radius: var(--ds-radius-md); color: var(--ds-text); font-size: 0.875rem; line-height: 1.5; text-align: center; }
  .selection-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; isolation: isolate; border-radius: var(--ds-radius-md); padding-bottom: 0.5rem; overscroll-behavior: contain; }
</style>
