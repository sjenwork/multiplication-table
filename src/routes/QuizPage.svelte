<script lang="ts">
  import { onMount } from 'svelte';
  import QuizList from '../components/QuizList.svelte';
  import { answerActive, answerQuestion, deleteDigit, enterDigit, loadOrCreateQuiz, saveQuiz, type QuizSessionResult } from '../application/quiz-session';
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
  let status = '';

  onMount(() => {
    const loaded = loadOrCreateQuiz(storage, rng, random);
    state = loaded.state;
    quiz = loaded.quiz;
  });

  function selectQuestion(key: string) {
    if (!state || !quiz) return;
    quiz = { ...quiz, activeKey: key };
    state = saveQuiz(storage, state, quiz);
  }
  function digit(digit: string) { if (state) { state = enterDigit(storage, state, digit); quiz = state.quiz; } }
  function erase() { if (state) { state = deleteDigit(storage, state); quiz = state.quiz; } }
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
  function applyResult(result: QuizSessionResult | null) {
    if (!result) return;
    state = result.state;
    quiz = result.quiz;
    const answered = quiz.questions.find((question) => question.answerShown);
    status = result.status === 'correct' ? '答對了' : result.status === 'revealed' ? `正確答案是 ${answered?.answer ?? ''}` : result.status === 'wrong' ? '再試一次' : '請先輸入答案';
    if (quiz.completed) status += '；本輪挑戰完成';
  }
  function confirmReturn() { returnOpen = false; navigation.go('index.html'); }
</script>

<main class="quiz-page" aria-labelledby="quiz-title">
  <header class="quiz-header"><button type="button" aria-label="返回" onclick={() => returnOpen = true}>返回</button><h1 id="quiz-title">答題挑戰</h1><span aria-hidden="true"></span></header>
  {#if quiz}
    {#if quiz.questions.length === 0}<p role="status">目前沒有可練習的題目，請回首頁選題。</p>{:else}<p role="status" aria-live="polite">{status || `共 ${quiz.questions.length} 題，逐題完成這次挑戰。`}</p><QuizList quiz={quiz} onSelect={selectQuestion} onDigit={digit} onBackspace={erase} onSubmit={submit} /><button class="submit-all" type="button" aria-label="檢查全部答案" disabled={!quiz.questions.every((question) => question.resolved || question.input)} onclick={submitActive}>檢查全部答案</button>{/if}
  {:else}<p role="status">載入題目中…</p>{/if}
</main>

{#if returnOpen}
  <div class="modal-backdrop" role="presentation"><dialog open aria-labelledby="return-title"><h2 id="return-title">確認返回</h2><p>目前進度會保留，確定要回首頁嗎？</p><div><button type="button" aria-label="取消返回" onclick={() => returnOpen = false}>取消</button><button type="button" aria-label="確認返回" onclick={confirmReturn}>確認返回</button></div></dialog></div>
{/if}

<style>
  .quiz-page { max-width: 48rem; margin: 0 auto; padding: 1rem; } .quiz-header { position: sticky; top: 0; z-index: 2; display: grid; grid-template-columns: 5rem 1fr 5rem; align-items: center; padding: 0.75rem 0; background: var(--ds-canvas); } h1 { margin: 0; text-align: center; font-size: 1.4rem; color: var(--ds-text-strong); } .quiz-header button, .submit-all, dialog button { border: 1px solid var(--ds-border-strong); border-radius: var(--ds-radius-sm); padding: 0.6rem 0.8rem; background: var(--ds-brand); color: var(--ds-on-brand); font: inherit; cursor: pointer; } [role="status"] { min-height: 1.5rem; color: var(--ds-text-muted); font-weight: 700; } .submit-all { width: 100%; margin-top: 1rem; } .submit-all:disabled { background: var(--ds-disabled); cursor: not-allowed; } .modal-backdrop { position: fixed; inset: 0; z-index: 5; display: grid; place-items: center; padding: 1rem; background: rgb(8 35 61 / 0.45); } dialog { max-width: 24rem; border: 1px solid var(--ds-modal-border); border-radius: var(--ds-radius-md); background: var(--ds-modal-surface); color: var(--ds-text); } dialog div { display: flex; justify-content: flex-end; gap: 0.5rem; } dialog button:first-child { background: var(--ds-surface); color: var(--ds-text); }
</style>
