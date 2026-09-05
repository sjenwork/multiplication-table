<script lang="ts">
  import { onMount } from 'svelte';
  import NumberKeypad from '../components/NumberKeypad.svelte';
  import QuizList from '../components/QuizList.svelte';
  import SettingsModal from '../components/SettingsModal.svelte';
  import { answerActive, answerQuestion, checkAllAnswers, deleteDigit, enterDigit, loadOrCreateQuiz, restartQuiz, saveKeypadPosition, saveQuiz, startRandomQuiz, type QuizSessionResult } from '../application/quiz-session';
  import { exportPracticeRecords } from '../application/export-records';
  import type { Rng, QuizState } from '../domain/quiz';
  import { STORAGE_KEY, type AppState } from '../domain/state';
  import type { DownloadPort, NavigationPort, StoragePort } from '../ports';

  export let storage: StoragePort;
  export let navigation: NavigationPort;
  export let rng: Rng = Math.random;
  export let random = false;
  export let download: DownloadPort = { download: () => undefined };
  let state: AppState | null = null;
  let quiz: QuizState | null = null;
  let returnOpen = false;
  let settingsOpen = false;
  let keyboardVisible = true;
  let keypadMode: 'fixed' | 'floating' = 'fixed';
  let status = '';
  let completionOpen = false;
  let feedbackOpen = false;
  let reviewMode = false;
  let bannerStart: { x: number; y: number } | null = null;

  onMount(() => {
    const loaded = loadOrCreateQuiz(storage, rng, random);
    state = loaded.state;
    quiz = loaded.quiz;
    document.documentElement.dataset.theme = loaded.state.theme;
    keypadMode = loaded.state.keypadPosition.detached ? 'floating' : 'fixed';
    completionOpen = loaded.quiz.completed;
  });

  function selectQuestion(key: string) {
    if (!state || !quiz) return;
    quiz = { ...quiz, activeKey: key };
    state = saveQuiz(storage, state, quiz);
  }
  function digit(digit: string) { if (state) { state = enterDigit(storage, state, digit); quiz = state.quiz; } }
  function erase() { if (state) { state = deleteDigit(storage, state); quiz = state.quiz; } }
  function changeKeypadMode(mode: 'fixed' | 'floating') {
    if (!state) return;
    keypadMode = mode;
    keyboardVisible = true;
    state = saveKeypadPosition(storage, state, mode === 'floating' ? { detached: true, left: state.keypadPosition.left ?? 16, top: state.keypadPosition.top ?? 120 } : { detached: false, left: null, top: null });
  }
  function changeKeypadPosition(position: Parameters<typeof saveKeypadPosition>[2]) {
    if (!state) return;
    if (!position.detached) keypadMode = 'fixed';
    state = saveKeypadPosition(storage, state, position);
  }
  function changeTheme(theme: 'light' | 'dark') {
    if (!state) return;
    document.documentElement.dataset.theme = theme;
    state = saveQuiz(storage, { ...state, theme }, state.quiz!);
  }
  function exportRecords() {
    if (!state) return;
    exportPracticeRecords(download, state.records);
    settingsOpen = false;
  }
  function clearState() {
    if (typeof window !== 'undefined' && !window.confirm('確定要清除所有練習紀錄與目前進度嗎？此操作無法復原。')) return;
    storage.remove(STORAGE_KEY);
    settingsOpen = false;
    navigation.go('index.html');
  }
  function submit(key: string) {
    if (!state) return;
    const result = answerQuestion(storage, state, key);
    applyResult(result);
  }
  function submitActive() {
    if (!state) return;
    const result = answerActive(storage, state);
    applyResult(result);
  }
  function checkAll() {
    if (!state) return;
    const result = checkAllAnswers(storage, state);
    if (!result) return;
    state = result.state;
    quiz = result.quiz;
    reviewMode = Boolean(result.firstErrorKey);
    keyboardVisible = !result.completed;
    status = result.completed ? '本輪挑戰完成，紀錄已保存。' : '請修正錯題後再對答案。';
    completionOpen = result.completed;
    feedbackOpen = !result.completed && Boolean(result.firstErrorKey);
    if (result.firstErrorKey) scrollToQuestion(result.firstErrorKey);
  }
  function applyResult(result: QuizSessionResult | null) {
    if (!result) return;
    state = result.state;
    quiz = result.quiz;
    const answered = quiz.questions.find((question) => question.answerShown);
    status = result.status === 'correct' ? '答對了' : result.status === 'revealed' ? `正確答案是 ${answered?.answer ?? ''}` : result.status === 'wrong' ? '再試一次' : '請先輸入答案';
    if (result.status === 'wrong' || result.status === 'revealed') reviewMode = true;
    if (result.status === 'wrong' || result.status === 'revealed') feedbackOpen = true;
    if (quiz.completed) { status += '；本輪挑戰完成'; completionOpen = true; feedbackOpen = false; keyboardVisible = false; }
  }
  function confirmReturn() { returnOpen = false; navigation.go('index.html'); }
  function replay() {
    if (!state) return;
    const result = restartQuiz(storage, state, rng);
    state = result.state; quiz = result.quiz; status = ''; reviewMode = false; completionOpen = false; feedbackOpen = false; keyboardVisible = true;
  }
  function randomChallenge() {
    if (!state) return;
    const result = startRandomQuiz(storage, state, rng);
    state = result.state; quiz = result.quiz; status = ''; reviewMode = false; completionOpen = false; feedbackOpen = false; keyboardVisible = true;
  }
  function beginBannerSwipe(event: PointerEvent) { bannerStart = { x: event.clientX, y: event.clientY }; }
  function endBannerSwipe(event: PointerEvent) {
    if (!bannerStart) return;
    const dx = event.clientX - bannerStart.x;
    const dy = event.clientY - bannerStart.y;
    if (Math.abs(dx) >= 56 && Math.abs(dx) > Math.abs(dy)) completionOpen = false;
    bannerStart = null;
  }
  function scrollToQuestion(key: string) {
    requestAnimationFrame(() => document.querySelector(`article[data-question="${key}"]`)?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }));
  }
</script>

<main class="quiz-page" aria-labelledby="quiz-title">
  <header class="quiz-header">
    <button class="icon-button" type="button" aria-label="返回選題" onclick={() => returnOpen = true}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button>
    <div class="quiz-title-lockup"><p class="eyebrow">DAILY CHALLENGE</p><h1 id="quiz-title">乘法挑戰</h1><div class="quiz-legend" aria-label="題目順序：被乘數乘以乘數"><span class="factor-one">被乘數</span><span aria-hidden="true">×</span><span class="factor-two">乘數</span></div></div>
    <button class="icon-button" type="button" aria-label="設定" onclick={() => settingsOpen = true}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg></button>
  </header>
  {#if quiz}
    {#if quiz.questions.length === 0}<p role="status">目前沒有可練習的題目，請回首頁選題。</p>{:else}<p role="status" aria-live="polite">{status || `共 ${quiz.questions.length} 題，逐題完成這次挑戰。`}</p><div class="question-scroll"><QuizList quiz={quiz} onSelect={selectQuestion} /></div>{#if !quiz.completed && keyboardVisible}<NumberKeypad mode={keypadMode} position={state?.keypadPosition} input={quiz.questions.find((question) => question.key === quiz?.activeKey)?.input ?? ''} onDigit={digit} onBackspace={erase} onEnter={submitActive} onClose={() => keyboardVisible = false} onPositionChange={changeKeypadPosition} />{/if}{/if}
  {:else}<p role="status">載入題目中…</p>{/if}
</main>

{#if quiz && quiz.questions.length > 0}
  <div class="quiz-action-bar" role="toolbar" aria-label="答題操作">
    {#if quiz.completed}
      <div class="completion-actions">
        <button type="button" aria-label="返回上一頁" onclick={() => navigation.go('index.html')}>← 上一頁</button>
        <button type="button" aria-label="依目前題庫再次出題" onclick={randomChallenge}>↻ 再次出題</button>
        <button type="button" aria-label="重新測驗目前題目" onclick={replay}>↺ 重新測驗</button>
      </div>
    {:else}
      <button class="keyboard-reopen" type="button" aria-label="開啟數字鍵盤" onclick={() => keyboardVisible = true}>開啟數字鍵盤</button>
      <button class="submit-all" type="button" aria-label={reviewMode ? '對答案' : '檢查全部答案'} disabled={!quiz.questions.every((question) => question.resolved || question.input)} onclick={checkAll}>{reviewMode ? '對答案' : '檢查全部答案'}</button>
    {/if}
  </div>
{/if}

{#if quiz?.completed && quiz.questions.length > 0 && completionOpen}
  <aside class="completion-banner" aria-label="完成提示" onpointerdown={beginBannerSwipe} onpointerup={endBannerSwipe} onpointercancel={() => bannerStart = null}>
    <button class="banner-close" type="button" aria-label="關閉完成提示" onclick={() => completionOpen = false}>×</button>
    <strong>{quiz.questions.every((question) => !question.hadError) ? '你好棒！全部答對！' : '本輪挑戰完成！'}</strong>
    <span>{quiz.questions.filter((question) => !question.hadError).length} / {quiz.questions.length} 題正確</span>
  </aside>
{/if}

{#if quiz && !quiz.completed && feedbackOpen}
  <aside class="completion-banner wrong-banner" aria-label="答題回饋" onpointerdown={beginBannerSwipe} onpointerup={endBannerSwipe} onpointercancel={() => bannerStart = null}>
    <button class="banner-close" type="button" aria-label="關閉答題回饋" onclick={() => feedbackOpen = false}>×</button>
    <strong>{quiz.questions.filter((question) => question.resolved && !question.hadError).length >= quiz.questions.length / 2 ? '做得很好！' : '繼續加油！'}</strong>
    <span>{quiz.questions.filter((question) => question.resolved && !question.hadError).length} / {quiz.questions.length} 題目前答對，請修正錯題。</span>
  </aside>
{/if}

<SettingsModal open={settingsOpen} theme={state?.theme ?? 'light'} keypadMode={keypadMode} onClose={() => settingsOpen = false} onTheme={changeTheme} onKeypadMode={changeKeypadMode} onExport={exportRecords} onClear={clearState} />

{#if returnOpen}
  <div class="modal-backdrop ds-modal-backdrop" role="presentation"><dialog open class="ds-modal-surface" aria-labelledby="return-title"><h2 id="return-title">確認返回</h2><p>目前進度會保留，確定要回首頁嗎？</p><div><button class="secondary" type="button" aria-label="取消返回" onclick={() => returnOpen = false}>取消</button><button type="button" aria-label="確認返回" onclick={confirmReturn}>確認返回</button></div></dialog></div>
{/if}

<style>
  .quiz-page { max-width: 48rem; height: 100dvh; box-sizing: border-box; margin: 0 auto; padding: 0 1rem calc(24rem + env(safe-area-inset-bottom)); overflow: hidden; overscroll-behavior: contain; }
  .quiz-header { position: sticky; top: 0; z-index: 6; display: grid; grid-template-columns: 3rem 1fr 3rem; align-items: center; min-height: 4.5rem; background: var(--ds-canvas); border-bottom: 1px solid var(--ds-border); }
  .quiz-title-lockup { min-width: 0; text-align: center; }
  .eyebrow { margin: 0 0 0.35rem; color: var(--ds-brand-strong); font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.2em; line-height: 1; }
  h1 { margin: 0 0 0.25rem; text-align: center; font-size: clamp(1.5rem, 4vw, 1.875rem); color: var(--ds-text-strong); }
  .quiz-legend { display: flex; align-items: center; justify-content: center; gap: 0.35rem; color: var(--ds-text-muted); font-size: 0.6875rem; font-weight: 700; line-height: 1; }
  .factor-one { color: var(--ds-factor-one); } .factor-two { color: var(--ds-factor-two); }
  .icon-button, .submit-all, dialog button, .keyboard-reopen { border: 1px solid var(--ds-border-strong); border-radius: var(--ds-radius-sm); padding: 0.6rem 0.8rem; background: var(--ds-brand); color: var(--ds-on-brand); font: inherit; cursor: pointer; }
  .icon-button { display: inline-flex; width: 2.5rem; height: 2.5rem; align-items: center; justify-content: center; padding: 0; }
  .icon-button svg { width: 1.25rem; height: 1.25rem; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; }
  [role="status"] { min-height: 1.5rem; color: var(--ds-text-muted); font-weight: 700; }
  .question-scroll { box-sizing: border-box; min-height: 0; max-height: calc(100dvh - 13rem); overflow-y: auto; overscroll-behavior: contain; padding-bottom: 24rem; }
  .submit-all { width: 100%; margin-top: 1rem; }
  .submit-all:disabled { background: var(--ds-disabled); cursor: not-allowed; }
  .keyboard-reopen { margin-top: 0.75rem; }
  .quiz-action-bar { position: fixed; right: 0; bottom: 0; left: 0; z-index: 7; display: flex; min-height: 3.75rem; box-sizing: border-box; align-items: center; justify-content: flex-end; gap: 0.5rem; padding: 0.625rem max(0.5rem, env(safe-area-inset-right)) calc(0.625rem + env(safe-area-inset-bottom)) max(0.5rem, env(safe-area-inset-left)); border-top: 1px solid var(--ds-border); background: var(--ds-surface-strong); box-shadow: 0 -6px 18px var(--ds-shadow-color); backdrop-filter: blur(18px) saturate(135%); -webkit-backdrop-filter: blur(18px) saturate(135%); }
  .quiz-action-bar .submit-all { width: auto; margin: 0; white-space: nowrap; }
  .completion-actions { display: flex; min-width: 0; flex: 1 1 auto; gap: 0.5rem; overflow-x: auto; }
  .completion-actions button { flex: 0 0 auto; border: 1px solid var(--ds-border-strong); border-radius: var(--ds-radius-sm); padding: 0.5rem 0.65rem; background: var(--ds-surface); color: var(--ds-text); font: inherit; font-size: 0.8rem; font-weight: 700; white-space: nowrap; cursor: pointer; }
  .completion-actions button:nth-child(2) { background: var(--ds-brand-soft); color: var(--ds-brand-strong); }
  .completion-actions button:nth-child(3) { background: var(--ds-success-soft); color: var(--ds-success); }
  .modal-backdrop { position: fixed; inset: 0; z-index: 10; display: grid; place-items: center; padding: max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left)); background: var(--ds-modal-backdrop); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
  dialog { max-width: 24rem; margin: 0; color: var(--ds-text); }
  dialog div { display: flex; justify-content: flex-end; gap: 0.5rem; }
  dialog button:first-child, .secondary { background: var(--ds-surface); color: var(--ds-text); }
  .completion-banner { position: fixed; top: max(0.75rem, calc(0.75rem + env(safe-area-inset-top))); left: 50%; z-index: 70; display: grid; gap: 0.35rem; width: min(32rem, calc(100vw - 2rem)); transform: translateX(-50%); padding: 0.75rem 1.25rem; border: 1px solid var(--ds-border-strong); border-radius: 999px; background: var(--ds-surface-strong); color: var(--ds-text-strong); box-shadow: var(--ds-shadow-md); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); animation: completion-pop 240ms ease-out; touch-action: pan-y; }
  .wrong-banner { border-color: var(--ds-accent); }
  .banner-close { position: absolute; top: -0.65rem; right: -0.65rem; display: inline-flex; width: 2rem; height: 2rem; align-items: center; justify-content: center; border: 1px solid var(--ds-border); border-radius: 999px; background: var(--ds-surface-strong); color: inherit; font-size: 1.4rem; cursor: pointer; }
  @keyframes completion-pop { from { opacity: 0; transform: translateX(-50%) translateY(-0.5rem); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
</style>
