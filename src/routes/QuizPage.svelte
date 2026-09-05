<script lang="ts">
  import { onMount } from 'svelte';
  import NumberKeypad from '../components/NumberKeypad.svelte';
  import QuizList from '../components/QuizList.svelte';
  import { answerActive, answerQuestion, checkAllAnswers, deleteDigit, enterDigit, loadOrCreateQuiz, restartQuiz, saveKeypadPosition, saveQuiz, startRandomQuiz, type QuizSessionResult } from '../application/quiz-session';
  import type { Rng, QuizState } from '../domain/quiz';
  import { STORAGE_KEY, type AppState } from '../domain/state';
  import type { NavigationPort, StoragePort } from '../ports';

  export let storage: StoragePort;
  export let navigation: NavigationPort;
  export let rng: Rng = Math.random;
  export let random = false;
  let state: AppState | null = null;
  let quiz: QuizState | null = null;
  let returnOpen = false;
  let settingsOpen = false;
  let keyboardVisible = true;
  let keypadMode: 'fixed' | 'floating' = 'fixed';
  let status = '';
  let completionOpen = false;
  let reviewMode = false;
  let bannerStart: { x: number; y: number } | null = null;

  onMount(() => {
    const loaded = loadOrCreateQuiz(storage, rng, random);
    state = loaded.state;
    quiz = loaded.quiz;
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
  function changeKeypadPosition(position: Parameters<typeof saveKeypadPosition>[2]) { if (state) state = saveKeypadPosition(storage, state, position); }
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
  }
  function applyResult(result: QuizSessionResult | null) {
    if (!result) return;
    state = result.state;
    quiz = result.quiz;
    const answered = quiz.questions.find((question) => question.answerShown);
    status = result.status === 'correct' ? '答對了' : result.status === 'revealed' ? `正確答案是 ${answered?.answer ?? ''}` : result.status === 'wrong' ? '再試一次' : '請先輸入答案';
    if (result.status === 'wrong' || result.status === 'revealed') reviewMode = true;
    if (quiz.completed) { status += '；本輪挑戰完成'; completionOpen = true; keyboardVisible = false; }
  }
  function confirmReturn() { returnOpen = false; navigation.go('index.html'); }
  function replay() {
    if (!state) return;
    const result = restartQuiz(storage, state, rng);
    state = result.state; quiz = result.quiz; status = ''; reviewMode = false; completionOpen = false; keyboardVisible = true;
  }
  function randomChallenge() {
    if (!state) return;
    const result = startRandomQuiz(storage, state, rng);
    state = result.state; quiz = result.quiz; status = ''; reviewMode = false; completionOpen = false; keyboardVisible = true;
  }
  function beginBannerSwipe(event: PointerEvent) { bannerStart = { x: event.clientX, y: event.clientY }; }
  function endBannerSwipe(event: PointerEvent) {
    if (!bannerStart) return;
    const dx = event.clientX - bannerStart.x;
    const dy = event.clientY - bannerStart.y;
    if (Math.abs(dx) >= 56 && Math.abs(dx) > Math.abs(dy)) completionOpen = false;
    bannerStart = null;
  }
</script>

<main class="quiz-page" aria-labelledby="quiz-title">
  <header class="quiz-header"><button class="icon-button" type="button" aria-label="返回" onclick={() => returnOpen = true}>←</button><h1 id="quiz-title">答題挑戰</h1><button class="icon-button" type="button" aria-label="設定" onclick={() => settingsOpen = true}>⚙</button></header>
  {#if quiz}
    {#if quiz.questions.length === 0}<p role="status">目前沒有可練習的題目，請回首頁選題。</p>{:else}<p role="status" aria-live="polite">{status || `共 ${quiz.questions.length} 題，逐題完成這次挑戰。`}</p><div class="question-scroll"><QuizList quiz={quiz} onSelect={selectQuestion} /></div><button class="submit-all" type="button" aria-label={reviewMode ? '對答案' : '檢查全部答案'} disabled={!quiz.questions.every((question) => question.resolved || question.input)} onclick={checkAll}>{reviewMode ? '對答案' : '檢查全部答案'}</button>{#if !quiz.completed}<button class="keyboard-reopen" type="button" aria-label="開啟數字鍵盤" onclick={() => keyboardVisible = true}>開啟數字鍵盤</button>{#if keyboardVisible}<NumberKeypad mode={keypadMode} position={state?.keypadPosition} input={quiz.questions.find((question) => question.key === quiz?.activeKey)?.input ?? ''} onDigit={digit} onBackspace={erase} onEnter={submitActive} onClose={() => keyboardVisible = false} onPositionChange={changeKeypadPosition} />{/if}{/if}{/if}
  {:else}<p role="status">載入題目中…</p>{/if}
</main>

{#if quiz?.completed && quiz.questions.length > 0 && completionOpen}
  <aside class="completion-banner" aria-label="完成提示" onpointerdown={beginBannerSwipe} onpointerup={endBannerSwipe} onpointercancel={() => bannerStart = null}>
    <button class="banner-close" type="button" aria-label="關閉完成提示" onclick={() => completionOpen = false}>×</button>
    <strong>{quiz.questions.every((question) => !question.hadError) ? '你好棒！全部答對！' : '本輪挑戰完成！'}</strong>
    <span>{quiz.questions.filter((question) => !question.hadError).length} / {quiz.questions.length} 題正確</span>
    <div class="banner-actions"><button type="button" onclick={() => navigation.go('index.html')}>返回上一頁</button><button type="button" onclick={randomChallenge}>隨機出題</button><button type="button" onclick={replay}>重新測驗</button></div>
  </aside>
{/if}

{#if settingsOpen}
  <div class="modal-backdrop ds-modal-backdrop" role="presentation"><dialog open class="ds-modal-surface" aria-labelledby="keypad-settings-title"><h2 id="keypad-settings-title">設定</h2><p>選擇鍵盤顯示方式</p><div class="mode-actions"><button class="mode-choice" type="button" aria-label="固定鍵盤" aria-pressed={keypadMode === 'fixed'} onclick={() => changeKeypadMode('fixed')}>固定鍵盤</button><button class="mode-choice" type="button" aria-label="浮動鍵盤" aria-pressed={keypadMode === 'floating'} onclick={() => changeKeypadMode('floating')}>浮動鍵盤</button></div><button class="secondary" type="button" aria-label="關閉設定" onclick={() => settingsOpen = false}>關閉</button></dialog></div>
{/if}

{#if returnOpen}
  <div class="modal-backdrop ds-modal-backdrop" role="presentation"><dialog open class="ds-modal-surface" aria-labelledby="return-title"><h2 id="return-title">確認返回</h2><p>目前進度會保留，確定要回首頁嗎？</p><div><button class="secondary" type="button" aria-label="取消返回" onclick={() => returnOpen = false}>取消</button><button type="button" aria-label="確認返回" onclick={confirmReturn}>確認返回</button></div></dialog></div>
{/if}

<style>
  .quiz-page { max-width: 48rem; height: 100dvh; box-sizing: border-box; margin: 0 auto; padding: 0 1rem calc(24rem + env(safe-area-inset-bottom)); overflow: hidden; overscroll-behavior: contain; } .quiz-header { position: sticky; top: 0; z-index: 6; display: grid; grid-template-columns: 3rem 1fr 3rem; align-items: center; min-height: 4rem; background: var(--ds-canvas); border-bottom: 1px solid var(--ds-border); } h1 { margin: 0; text-align: center; font-size: 1.4rem; color: var(--ds-text-strong); } .icon-button, .submit-all, dialog button, .keyboard-reopen { border: 1px solid var(--ds-border-strong); border-radius: var(--ds-radius-sm); padding: 0.6rem 0.8rem; background: var(--ds-brand); color: var(--ds-on-brand); font: inherit; cursor: pointer; } .icon-button { width: 2.5rem; height: 2.5rem; padding: 0; font-size: 1.4rem; } [role="status"] { min-height: 1.5rem; color: var(--ds-text-muted); font-weight: 700; } .question-scroll { min-height: 0; max-height: calc(100dvh - 13rem); overflow-y: auto; overscroll-behavior: contain; padding-bottom: 1rem; } .submit-all { width: 100%; margin-top: 1rem; } .submit-all:disabled { background: var(--ds-disabled); cursor: not-allowed; } .keyboard-reopen { margin-top: 0.75rem; } .modal-backdrop { position: fixed; inset: 0; z-index: 10; display: grid; place-items: center; padding: max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left)); background: var(--ds-shadow-color); } dialog { max-width: 24rem; color: var(--ds-text); } dialog div, .banner-actions { display: flex; justify-content: flex-end; gap: 0.5rem; } dialog button:first-child, .secondary { background: var(--ds-surface); color: var(--ds-text); } .mode-actions { display: flex; gap: 0.5rem; margin: 1rem 0; } .mode-choice[aria-pressed="true"] { background: var(--ds-brand-soft); color: var(--ds-brand-strong); } .completion-banner { position: fixed; top: max(4.5rem, calc(4.5rem + env(safe-area-inset-top))); left: 50%; z-index: 7; display: grid; gap: 0.5rem; width: min(36rem, calc(100vw - 2rem)); transform: translateX(-50%); padding: 1rem; border: 1px solid var(--ds-success); border-radius: var(--ds-radius-md); background: var(--ds-surface-strong); color: var(--ds-text-strong); box-shadow: var(--ds-shadow-md); animation: completion-pop 240ms ease-out; touch-action: pan-y; } .banner-close { position: absolute; top: 0.35rem; right: 0.45rem; border: 0; background: transparent; color: inherit; font-size: 1.4rem; cursor: pointer; } .banner-actions { flex-wrap: wrap; } .banner-actions button { border: 1px solid var(--ds-border-strong); border-radius: var(--ds-radius-sm); padding: 0.5rem 0.65rem; background: var(--ds-brand); color: var(--ds-on-brand); font: inherit; cursor: pointer; } @keyframes completion-pop { from { opacity: 0; transform: translateX(-50%) translateY(-0.5rem); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
</style>
