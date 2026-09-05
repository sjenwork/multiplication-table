<script lang="ts">
  import type { QuizState } from '../domain/quiz';

  export let quiz: QuizState;
  export let onSelect: (key: string) => void = () => undefined;
</script>

<section class="quiz-list" aria-label="測驗題目">
  {#each quiz.questions as question, index}
    {@const status = question.resolved ? (question.hadError ? `✕ ${question.answer}` : '✓') : (question.wrongAttempts ? `✕ ${question.wrongAttempts}/3` : '')}
    <article class:active={quiz.activeKey === question.key} class:success={question.resolved && !question.hadError} class:error={question.resolved && question.hadError} data-question={question.key}>
      <div class="question-card">
        <span class="question-number" aria-hidden="true">{index + 1}</span>
        <label class="question-line" for={`answer-${question.key}`}>
          <span class="question-text"><span class="factor-one">{question.row}</span><span aria-hidden="true">×</span><span class="factor-two">{question.col}</span><span aria-hidden="true">=</span></span>
          <input id={`answer-${question.key}`} data-question={question.key} inputmode="none" readonly disabled={question.resolved} value={question.input} placeholder="?" aria-label={`第 ${index + 1} 題答案`} onclick={() => onSelect(question.key)} />
        </label>
        {#if question.answerShown}<span class="answer-reveal">正確答案是 {question.answer}</span>{:else}<span class="question-status" aria-live="polite">{status}</span>{/if}
      </div>
    </article>
  {/each}
</section>

<style>
  .quiz-list { display: grid; grid-template-columns: 1fr; gap: 0.5rem; align-content: start; align-items: start; grid-auto-rows: max-content; }
  article { min-width: 0; border: 1px solid var(--ds-border); border-radius: var(--ds-radius-md); background: var(--ds-surface); box-shadow: var(--ds-shadow-sm); backdrop-filter: blur(12px) saturate(125%); -webkit-backdrop-filter: blur(12px) saturate(125%); }
  article.active { border-color: var(--ds-brand); box-shadow: var(--ds-shadow-sm), 0 0 0 2px var(--ds-brand-soft); }
  article.success { background: var(--ds-success-soft); border-color: var(--ds-success); }
  article.error { background: var(--ds-danger-soft); border-color: var(--ds-danger); }
  .question-card { position: relative; display: grid; grid-template-columns: 1.75rem minmax(0, 1fr) auto; min-height: 3rem; align-items: center; gap: 0.5rem; padding: 0.5rem; }
  .question-number { display: grid; width: 1.75rem; height: 1.75rem; place-items: center; border-radius: 999px; background: var(--ds-brand-soft); color: var(--ds-brand-strong); font-size: 0.875rem; font-weight: 800; }
  .question-line { display: inline-flex; min-width: 0; align-items: center; justify-content: center; gap: 0.35rem; color: var(--ds-text-strong); font-weight: 800; line-height: 1.15; white-space: nowrap; cursor: pointer; }
  .question-text { display: inline-flex; align-items: center; gap: 0.25rem; font-size: clamp(1rem, 2vw, 1.125rem); }
  .factor-one { color: var(--ds-factor-one); } .factor-two { color: var(--ds-factor-two); }
  input { box-sizing: border-box; width: 3.5rem; height: 2.25rem; border: 1px solid var(--ds-border-strong); border-radius: var(--ds-radius-sm); padding: 0.25rem; background: var(--ds-table-surface); color: var(--ds-text-strong); font: inherit; text-align: center; }
  input:disabled { background: var(--ds-disabled); color: var(--ds-text-muted); }
  .question-status, .answer-reveal { justify-self: end; min-width: 2.5rem; color: var(--ds-text-muted); font-size: 0.75rem; font-weight: 800; text-align: right; }
  .answer-reveal { color: var(--ds-danger); white-space: nowrap; }
  label:focus-within, input:focus-visible { outline: 3px solid var(--ds-focus); outline-offset: 2px; }
  @media (min-width: 40rem) { .quiz-list { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
