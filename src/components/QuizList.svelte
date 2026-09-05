<script lang="ts">
  import type { QuizQuestion, QuizState } from '../domain/quiz';

  export let quiz: QuizState;
  export let onSelect: (key: string) => void = () => undefined;
  export let onDigit: (digit: string) => void = () => undefined;
  export let onBackspace: () => void = () => undefined;
  export let onSubmit: (key: string) => void = () => undefined;

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
</script>

<section class="quiz-list" aria-label="題目清單">
  {#each quiz.questions as question, index}
    <article class:active={quiz.activeKey === question.key} data-question={question.key}>
      <div class="question-card">
        <button class="question-select" type="button" aria-label={`選擇第 ${index + 1} 題 ${question.row} 乘 ${question.col}`} aria-pressed={quiz.activeKey === question.key} onclick={() => onSelect(question.key)}>
        <span class="question-number">{index + 1}</span>
        <span class="question-text">{question.row} × {question.col} =</span>
        </button>
        {#if question.answerShown}<span class="answer-reveal">正確答案是 {question.answer}</span>{:else}<input aria-label={`答案 ${question.row} 乘 ${question.col}`} inputmode="none" readonly value={question.input} placeholder="?" />{/if}
        {#if question.resolved}<span class="resolved">{question.hadError ? '已顯示答案' : '答對了'}</span>{/if}
      </div>
      {#if quiz.activeKey === question.key && !question.resolved}
        <div class="keypad-boundary" aria-label="輸入控制">
          {#each digits as digit}<button type="button" aria-label={`數字 ${digit}`} onclick={() => onDigit(digit)}>{digit}</button>{/each}
          <button type="button" aria-label="退格" onclick={onBackspace}>⌫</button>
          <button type="button" aria-label="送出答案" disabled={!question.input} onclick={() => onSubmit(question.key)}>送出</button>
        </div>
      {/if}
    </article>
  {/each}
</section>

<style>
  .quiz-list { display: grid; gap: 0.75rem; }
  article { border: 1px solid var(--ds-border); border-radius: var(--ds-radius-md); background: var(--ds-surface); }
  article.active { border-color: var(--ds-brand); box-shadow: var(--ds-shadow-sm); }
  .question-card { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 0.75rem; padding: 1rem; } .question-select { display: flex; align-items: center; gap: 0.75rem; min-width: 0; border: 0; background: transparent; color: var(--ds-text); text-align: left; font: inherit; cursor: pointer; }
  .question-number { color: var(--ds-factor-two); font-weight: 800; } .question-text { color: var(--ds-text-strong); font-size: 1.15rem; font-weight: 800; }
  input { width: 4rem; border: 1px solid var(--ds-border-strong); border-radius: var(--ds-radius-sm); padding: 0.5rem; background: var(--ds-table-surface); color: var(--ds-text-strong); font: inherit; text-align: center; }
  .answer-reveal, .resolved { color: var(--ds-success); font-weight: 800; } .resolved { font-size: 0.8rem; }
  .keypad-boundary { display: flex; flex-wrap: wrap; gap: 0.4rem; padding: 0 1rem 1rem 4.75rem; } .keypad-boundary button { min-width: 2.5rem; border: 1px solid var(--ds-border-strong); border-radius: var(--ds-radius-sm); padding: 0.5rem; background: var(--ds-surface-strong); color: var(--ds-text); font: inherit; cursor: pointer; } .keypad-boundary button:last-child { background: var(--ds-brand); color: var(--ds-on-brand); } button:disabled { opacity: 0.5; cursor: not-allowed; }
  button:focus-visible, input:focus-visible { outline: 3px solid var(--ds-focus); outline-offset: 2px; }
</style>
