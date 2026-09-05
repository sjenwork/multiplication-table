<script lang="ts">
  import { onMount } from 'svelte';
  import ActionBar from '../components/ActionBar.svelte';
  import SelectionGrid from '../components/SelectionGrid.svelte';
  import { invertSelection, selectAll, toggleColumn, toggleKey, toggleRow } from '../domain/selection';
  import { questionBank, type Factor } from '../domain/question';
  import { DEFAULT_STATE, migrateState, parseState, serializeState, STORAGE_KEY, type AppState } from '../domain/state';
  import { startWrongQuiz } from '../application/quiz-session';
  import type { DownloadPort, HapticsPort, NavigationPort, StoragePort } from '../ports';

  export let storage: StoragePort;
  export let download: DownloadPort = { download: () => undefined };
  export let navigation: NavigationPort = { go: () => undefined, back: () => undefined };
  export let haptics: HapticsPort = { vibrate: () => undefined };

  let state: AppState = migrateState(DEFAULT_STATE);
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
    <div><p class="eyebrow">DAILY PRACTICE / 01</p><h1 id="migration-title">乘法小達人</h1></div>
    <button class="ds-secondary" type="button" aria-label="設定" onclick={() => settingsOpen = true}>設定</button>
  </header>
  <section class="intro" aria-labelledby="selection-title">
    <p class="kicker">挑一組，開始變熟</p>
    <h2 id="selection-title">選擇今天要練的題目</h2>
    <p>點選格子挑題，也可以一次選取整列或整欄。每題的紀錄會留在你的裝置上。</p>
  </section>
  <p role="status" aria-live="polite">{status}</p>
  <SelectionGrid
    selected={state.selected}
    records={state.records}
    onToggle={(key) => updateSelection(toggleKey(state.selected, key))}
    onRow={(row: Factor) => updateSelection(toggleRow(state.selected, row))}
    onColumn={(column: Factor) => updateSelection(toggleColumn(state.selected, column))}
    onAll={(selected: boolean) => updateSelection(selectAll(state.selected, selected))}
  />
  <ActionBar hasSelection={hasSelection} hasWrongAnswers={hasWrongAnswers} onStart={startChallenge} onRandom={randomQuiz} onWrongFirst={wrongFirstQuiz} onInvert={() => updateSelection(invertSelection(state.selected))} onSettings={() => settingsOpen = true} />
</main>

{#if settingsOpen}
  <div class="modal-backdrop ds-modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && (settingsOpen = false)}>
    <dialog open class="settings-modal ds-modal-surface" aria-labelledby="settings-title">
      <div class="modal-heading"><h2 id="settings-title">設定</h2><button class="ds-secondary" type="button" aria-label="關閉設定" onclick={() => settingsOpen = false}>關閉</button></div>
      <fieldset><legend>主題</legend><button class="ds-theme-choice" type="button" aria-label="淺色主題" aria-pressed={state.theme === 'light'} onclick={() => changeTheme('light')}>淺色</button><button class="ds-theme-choice" type="button" aria-label="深色主題" aria-pressed={state.theme === 'dark'} onclick={() => changeTheme('dark')}>深色</button></fieldset>
      <div class="settings-actions"><button class="ds-secondary" type="button" aria-label="匯出紀錄" onclick={exportRecords}>匯出紀錄</button><button class="ds-danger" type="button" aria-label="清除資料" onclick={clearState}>清除資料</button></div>
    </dialog>
  </div>
{/if}

<style>
  .home-page { max-width: 68rem; margin: 0 auto; padding: 2rem 1rem 4rem; }
  .page-header, .modal-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .eyebrow, .kicker { margin: 0; color: var(--ds-factor-two); font-size: 0.75rem; font-weight: 800; letter-spacing: 0.14em; }
  h1, h2, p { margin-top: 0; } h1 { margin-bottom: 0; color: var(--ds-text-strong); font-size: clamp(2rem, 6vw, 4.5rem); letter-spacing: -0.06em; } h2 { margin-bottom: 0.5rem; color: var(--ds-text-strong); }
  .intro { max-width: 40rem; margin: 4rem 0 1.5rem; } .intro p:last-child { color: var(--ds-text-muted); line-height: 1.7; }
  .page-header button, .modal-heading button, fieldset button, .settings-actions button { border: 1px solid var(--ds-border-strong); border-radius: var(--ds-radius-sm); padding: 0.6rem 0.9rem; background: var(--ds-surface); color: var(--ds-text); font: inherit; cursor: pointer; }
  [role="status"] { color: var(--ds-text-muted); font-weight: 700; }
  .modal-backdrop { position: fixed; inset: 0; z-index: 10; display: grid; place-items: center; padding: max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left)); background: var(--ds-shadow-color); }
  .settings-modal { width: min(100%, 28rem); padding: 1.25rem; color: var(--ds-text); }
  fieldset { display: flex; gap: 0.5rem; margin: 1.25rem 0; border: 0; padding: 0; } legend { width: 100%; margin-bottom: 0.5rem; font-weight: 800; } .settings-actions { display: flex; gap: 0.5rem; }
</style>
