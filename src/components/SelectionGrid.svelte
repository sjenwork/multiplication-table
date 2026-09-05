<script lang="ts">
  import { questionBank, type Factor, type Question } from '../domain/question';
  import { recordLabel, type Records } from '../domain/records';

  export let selected: string[] = [];
  export let records: Records = {};
  export let onToggle: (key: string) => void = () => undefined;
  export let onRow: (row: Factor) => void = () => undefined;
  export let onColumn: (column: Factor) => void = () => undefined;
  export let onAll: (selected: boolean) => void = () => undefined;

  const questions = questionBank();
  const factors = [1, 2, 3, 4, 5, 6, 7, 8, 9] as Factor[];
  let dragging = false;
  let dragSelecting = true;
  let suppressClick = false;
  let longPress: ReturnType<typeof setTimeout> | undefined;

  $: selectedSet = new Set(selected);
  $: allSelected = questions.every((question) => selectedSet.has(question.key));

  function beginPointer(event: PointerEvent, question: Question) {
    if (event.button !== 0) return;
    if (event.pointerType === 'mouse') {
      dragging = true;
      dragSelecting = !selectedSet.has(question.key);
      onToggle(question.key);
      return;
    }
    longPress = setTimeout(() => {
      dragging = true;
      dragSelecting = !selectedSet.has(question.key);
      onToggle(question.key);
    }, 350);
  }

  function enterPointer(question: Question) {
    if (dragging && selectedSet.has(question.key) !== dragSelecting) onToggle(question.key);
  }

  function endPointer() {
    if (longPress) clearTimeout(longPress);
    longPress = undefined;
    if (dragging) suppressClick = true;
    dragging = false;
  }

  function clickCell(event: MouseEvent, question: Question) {
    if (suppressClick) {
      suppressClick = false;
      event.preventDefault();
      return;
    }
    if (dragging) {
      event.preventDefault();
      return;
    }
    onToggle(question.key);
  }
</script>

<div class="selection-grid-wrap" data-selection-scroll>
  <table class="selection-grid" role="grid" aria-label="九九乘法選題表" onpointerup={endPointer} onpointercancel={endPointer}>
    <thead>
      <tr>
        <th scope="col" class:active={allSelected} class="corner"><span aria-label="被＼乘">被＼乘</span><button type="button" aria-label="全選所有題目" aria-pressed={allSelected} onclick={() => onAll(!allSelected)}>{allSelected ? '取消全選' : '全選'}</button></th>
        {#each factors as column}
          <th scope="col" class:active={factors.every((row) => selectedSet.has(`${row}x${column}`))} class="column-heading"><button type="button" aria-label={`選擇第 ${column} 欄`} aria-pressed={factors.every((row) => selectedSet.has(`${row}x${column}`))} onclick={() => onColumn(column)}>{column}</button></th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each factors as row}
        <tr>
          <th scope="row" class:active={factors.every((column) => selectedSet.has(`${row}x${column}`))} class="row-heading"><button type="button" aria-label={`選擇第 ${row} 列`} aria-pressed={factors.every((column) => selectedSet.has(`${row}x${column}`))} onclick={() => onRow(row)}>{row}</button></th>
          {#each factors as column}
            {@const question = questions.find((item) => item.row === row && item.col === column)!}
            <td class:selected={selectedSet.has(question.key)}>
              <button
                type="button"
                aria-label={`選擇 ${row} 乘 ${column}`}
                aria-pressed={selectedSet.has(question.key)}
                onpointerdown={(event) => beginPointer(event, question)}
                onpointerenter={() => enterPointer(question)}
                onclick={(event) => clickCell(event, question)}><small>{recordLabel(records[question.key])}</small></button>
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .selection-grid-wrap { overflow: auto; max-height: min(62vh, 38rem); border: 1px solid var(--ds-border); border-radius: var(--ds-radius-md); background: var(--ds-table-surface); padding-bottom: env(safe-area-inset-bottom); }
  .selection-grid { border-collapse: separate; border-spacing: 0.25rem; width: 100%; min-width: 34rem; text-align: center; }
  th, td { min-width: 3rem; height: 3rem; }
  th { font-weight: 700; }
  .corner, .row-heading { position: sticky; left: 0; z-index: 2; color: var(--ds-factor-one); background: var(--ds-table-surface); }
  thead th { position: sticky; top: 0; z-index: 3; background: var(--ds-table-surface); color: var(--ds-factor-two); }
  .corner { color: var(--ds-text-strong); } th.active { background: var(--ds-brand-soft); } th.active button { border-color: var(--ds-brand-strong); }
  button { border: 1px solid var(--ds-border); border-radius: var(--ds-radius-sm); background: var(--ds-surface); color: var(--ds-text); min-width: 100%; min-height: 2.75rem; cursor: pointer; font: inherit; user-select: none; touch-action: manipulation; }
  td button { background: var(--ds-surface); }
  button[aria-pressed="true"], td.selected button { background: var(--ds-table-selected); border-color: var(--ds-success); color: var(--ds-text-strong); }
  button:focus-visible { outline: 3px solid var(--ds-focus); outline-offset: 2px; }
  td small { display: block; color: var(--ds-text-muted); font-size: 0.7rem; }
</style>
