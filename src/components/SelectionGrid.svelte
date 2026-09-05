<script lang="ts">
  import { onDestroy } from 'svelte';
  import { questionBank, type Factor, type Question } from '../domain/question';
  import { recordLabel, type Records } from '../domain/records';

  export let selected: string[] = [];
  export let records: Records = {};
  export let onToggle: (key: string) => void = () => undefined;
  export let onSelection: (keys: string[]) => void = () => undefined;
  export let onRow: (row: Factor) => void = () => undefined;
  export let onColumn: (column: Factor) => void = () => undefined;
  export let onAll: (selected: boolean) => void = () => undefined;

  const questions = questionBank();
  const factors = [1, 2, 3, 4, 5, 6, 7, 8, 9] as Factor[];
  const LONG_PRESS_MS = 350;
  const MOVE_TOLERANCE = 10;
  let grid: HTMLTableElement;
  let scrollContainer: HTMLElement;
  let gesture: {
    pointerId: number; pointerType: string; startX: number; startY: number;
    clientX: number; clientY: number; startKey: string; selected: Set<string>;
    touched: Set<string>; selecting: boolean; active: boolean; timer: ReturnType<typeof setTimeout>; previousOverflow: string;
  } | null = null;
  let suppressClickUntil = 0;
  let dragChanges = new Map<string, boolean>();
  let autoScrollFrame: number | null = null;

  $: selectedSet = new Set(selected);
  $: allSelected = questions.every((question) => selectedSet.has(question.key));

  function keyAtPoint(x: number, y: number): string | null {
    const target = document.elementFromPoint(x, y)?.closest('td[data-question]');
    return target instanceof HTMLElement ? target.dataset.question ?? null : null;
  }

  function updateDraggedCell(key: string | null) {
    if (!gesture || !key || gesture.touched.has(key)) return;
    gesture.touched.add(key);
    dragChanges = new Map(dragChanges).set(key, gesture.selecting);
  }

  function stopAutoScroll() {
    if (autoScrollFrame !== null) cancelAnimationFrame(autoScrollFrame);
    autoScrollFrame = null;
  }

  function autoScroll() {
    if (!gesture || !scrollContainer) return;
    const rect = scrollContainer.getBoundingClientRect();
    const edge = 48;
    const topDistance = gesture.clientY - rect.top;
    const bottomDistance = rect.bottom - gesture.clientY;
    if (topDistance < edge) scrollContainer.scrollTop -= Math.ceil((edge - topDistance) / edge * 14);
    if (bottomDistance < edge) scrollContainer.scrollTop += Math.ceil((edge - bottomDistance) / edge * 14);
    updateDraggedCell(keyAtPoint(gesture.clientX, gesture.clientY));
    autoScrollFrame = requestAnimationFrame(autoScroll);
  }

  function activateGesture() {
    if (!gesture || gesture.active) return;
    gesture.active = true;
    gesture.selecting = !gesture.selected.has(gesture.startKey);
    grid.classList.add('selection-dragging');
    if (scrollContainer) scrollContainer.style.overflow = 'hidden';
    updateDraggedCell(gesture.startKey);
    autoScrollFrame = requestAnimationFrame(autoScroll);
    if (typeof navigator.vibrate === 'function') navigator.vibrate(12);
    else grid.classList.add('selection-haptic-fallback');
  }

  function beginPointer(event: PointerEvent) {
    const cell = (event.target as HTMLElement).closest('td[data-question]');
    if (!(cell instanceof HTMLElement) || event.button !== 0) return;
    const key = cell.dataset.question;
    if (!key) return;
    scrollContainer = grid.closest('[data-selection-scroll]') as HTMLElement;
    gesture = {
      pointerId: event.pointerId, pointerType: event.pointerType, startX: event.clientX, startY: event.clientY,
      clientX: event.clientX, clientY: event.clientY, startKey: key, selected: new Set(selected),
      touched: new Set(), selecting: false, active: false, previousOverflow: scrollContainer?.style.overflow ?? '', timer: setTimeout(() => activateGesture(), LONG_PRESS_MS),
    };
    if (event.pointerType === 'mouse') activateGesture();
    grid.setPointerCapture?.(event.pointerId);
  }

  function movePointer(event: PointerEvent) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    gesture.clientX = event.clientX;
    gesture.clientY = event.clientY;
    if (!gesture.active) {
      const moved = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) > MOVE_TOLERANCE;
      if (moved && gesture.pointerType !== 'mouse') clearTimeout(gesture.timer);
      return;
    }
    event.preventDefault();
    updateDraggedCell(keyAtPoint(event.clientX, event.clientY));
  }

  function enterCell(event: PointerEvent) {
    if (!gesture?.active) return;
    const cell = (event.currentTarget as HTMLElement).closest('td[data-question]');
    updateDraggedCell(cell instanceof HTMLElement ? cell.dataset.question ?? null : null);
  }

  function endPointer(event: PointerEvent) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    clearTimeout(gesture.timer);
    stopAutoScroll();
    grid.classList.remove('selection-dragging');
    grid.classList.remove('selection-haptic-fallback');
    if (scrollContainer) scrollContainer.style.overflow = gesture.previousOverflow;
    if (gesture.active) {
      const next = new Set(selected);
      for (const [key, shouldSelect] of dragChanges) {
        if (shouldSelect) next.add(key); else next.delete(key);
      }
      onSelection([...next]);
      suppressClickUntil = Date.now() + 450;
    }
    dragChanges = new Map();
    grid.releasePointerCapture?.(event.pointerId);
    gesture = null;
  }

  function handleClick(event: MouseEvent) {
    if (Date.now() < suppressClickUntil) {
      event.preventDefault(); event.stopPropagation(); return;
    }
    const cell = (event.target as HTMLElement).closest('td[data-question]');
    if (!(cell instanceof HTMLElement)) return;
    const key = cell.dataset.question;
    if (key) onToggle(key);
  }

  onDestroy(() => stopAutoScroll());
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<table bind:this={grid} class="selection-grid" role="grid" aria-label="九九乘法選題表"
  onpointerdown={beginPointer} onpointermove={movePointer} onpointerup={endPointer} onpointercancel={endPointer} onclick={handleClick}>
  <thead>
    <tr>
      <th scope="col" class:active={allSelected} class:is-selected={allSelected} class="corner ds-table-header">
        <button type="button" class="corner-control" aria-label="全選所有題目" aria-pressed={allSelected} onclick={() => onAll(!allSelected)}>
          <span class="corner-divider" aria-hidden="true"><span class="ds-factor-one">被</span><span>＼</span><span class="ds-factor-two">乘</span></span>
        </button>
      </th>
      {#each factors as column}
        {@const columnSelected = factors.every((row) => selectedSet.has(`${row}x${column}`))}
        <th scope="col" class:active={columnSelected} class:is-selected={columnSelected} class="column-heading ds-table-header">
          <button type="button" aria-label={`選擇第 ${column} 欄`} aria-pressed={columnSelected} onclick={() => onColumn(column)}>{column}</button>
        </th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each factors as row}
      {@const rowSelected = factors.every((column) => selectedSet.has(`${row}x${column}`))}
      <tr>
        <th scope="row" class:active={rowSelected} class:is-selected={rowSelected} class="row-heading ds-table-header">
          <button type="button" aria-label={`選擇第 ${row} 列`} aria-pressed={rowSelected} onclick={() => onRow(row)}>{row}</button>
        </th>
        {#each factors as column}
          {@const question = questions.find((item) => item.row === row && item.col === column) as Question}
          <td data-question={question.key} onpointerenter={enterCell} class="ds-table-cell" class:selected={dragChanges.has(question.key) ? dragChanges.get(question.key) : selectedSet.has(question.key)} class:is-selected={dragChanges.has(question.key) ? dragChanges.get(question.key) : selectedSet.has(question.key)}>
            <button type="button" onpointerenter={enterCell} aria-label={`選擇 ${row} 乘 ${column}`} aria-pressed={dragChanges.has(question.key) ? dragChanges.get(question.key) : selectedSet.has(question.key)}>
              <small>{recordLabel(records[question.key])}</small>
            </button>
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .selection-grid { border-collapse: separate; border-spacing: 0.25rem; width: 100%; min-width: 40.625rem; table-layout: fixed; text-align: center; }
  th, td { min-width: 3rem; height: 3rem; border: 1px solid var(--ds-border); border-radius: var(--ds-radius-sm); padding: 0.5rem; }
  th { font-weight: 700; }
  .corner, .row-heading { position: sticky; left: 0; z-index: 2; color: var(--ds-factor-one); background: var(--ds-table-surface); }
  thead th { position: sticky; top: 0; z-index: 3; background: var(--ds-table-surface); color: var(--ds-factor-two); }
  thead .corner { z-index: 4; }
  .corner { color: var(--ds-text-strong); }
  .corner-divider { display: inline-flex; align-items: center; justify-content: center; gap: 0.15rem; min-height: 1.1rem; color: var(--ds-text-muted); font-size: 0.65rem; line-height: 1; }
  .column-heading button { color: var(--ds-factor-two); }
  .row-heading button { color: var(--ds-factor-one); }
  th.active { background: var(--ds-table-selected); border-color: var(--ds-success); }
  th.active button { color: var(--ds-text-strong); }
  button { display: flex; width: 100%; min-width: 100%; min-height: 2.75rem; align-items: center; justify-content: center; border: 0; border-radius: var(--ds-radius-sm); padding: 0; background: transparent; color: var(--ds-text); cursor: pointer; font: inherit; user-select: none; touch-action: manipulation; }
  button[aria-pressed="true"] { color: var(--ds-text-strong); }
  .corner-control { display: grid; place-items: center; }
  button:focus-visible { outline: 3px solid var(--ds-focus); outline-offset: 2px; }
  td small { display: block; color: var(--ds-text-muted); font-size: 0.7rem; }
  :global(.selection-dragging) { outline: 3px solid rgb(59 130 246 / 0.22); outline-offset: 2px; }
  :global(.selection-haptic-fallback) { animation: selection-feedback 180ms ease-out; }
  @keyframes selection-feedback { 0%, 100% { transform: translateX(0); } 35% { transform: translateX(-2px); } 70% { transform: translateX(2px); } }
</style>
