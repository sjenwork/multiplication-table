<script lang="ts">
  import type { KeypadPosition } from '../domain/state';

  export let mode: 'fixed' | 'floating' = 'fixed';
  export let position: KeypadPosition = { detached: false, left: null, top: null };
  export let input = '';
  export let onDigit: (digit: string) => void = () => undefined;
  export let onBackspace: () => void = () => undefined;
  export let onEnter: () => void = () => undefined;
  export let onClose: () => void = () => undefined;
  export let onPositionChange: (position: KeypadPosition) => void = () => undefined;

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  let dragging = false;
  let dragOffset = { x: 0, y: 0 };
  let previewDock = false;
  let keypadElement: HTMLElement;

  $: left = Number.isFinite(position.left) ? position.left : 16;
  $: top = Number.isFinite(position.top) ? position.top : 120;

  function beginDrag(event: PointerEvent) {
    if (mode !== 'floating' || event.button !== 0) return;
    const element = event.currentTarget as HTMLElement;
    const rect = keypadElement?.getBoundingClientRect();
    if (!rect) return;
    dragging = true;
    dragOffset = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    element.setPointerCapture?.(event.pointerId);
  }

  function moveDrag(event: PointerEvent) {
    if (!dragging) return;
    const width = keypadElement?.getBoundingClientRect().width ?? 280;
    const height = keypadElement?.getBoundingClientRect().height ?? 280;
    const nextLeft = Math.max(8, Math.min(window.innerWidth - width - 8, event.clientX - dragOffset.x));
    const nextTop = Math.max(8, Math.min(window.innerHeight - height - 8, event.clientY - dragOffset.y));
    previewDock = nextTop > window.innerHeight - height - 80;
    onPositionChange({ detached: true, left: nextLeft, top: nextTop });
  }

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    if (previewDock) onPositionChange({ detached: false, left: null, top: null });
    previewDock = false;
  }
</script>

{#if mode === 'fixed' || position.detached}
  <section bind:this={keypadElement} class:fixed={mode === 'fixed'} class:floating={mode === 'floating'} class:dock-preview={previewDock} class="number-keypad" style={mode === 'floating' ? `left:${left}px;top:${top}px` : ''} aria-label={mode === 'fixed' ? '固定數字鍵盤' : '浮動數字鍵盤'}>
    <button class="keypad-close" type="button" aria-label="關閉鍵盤" onclick={onClose}>×</button>
    <button class="drag-handle" type="button" aria-label="拖曳鍵盤" onpointerdown={beginDrag} onpointermove={moveDrag} onpointerup={endDrag} onpointercancel={endDrag}>⠿<span>拖曳鍵盤</span></button>
    <output class="keypad-input" aria-label="目前輸入">{input || '輸入答案'}</output>
    <div class="key-grid" aria-label="數字鍵盤">
      {#each digits as digit}<button type="button" aria-label={`數字 ${digit}`} onclick={() => onDigit(digit)}>{digit}</button>{/each}
    </div>
    <div class="key-actions"><button type="button" aria-label="退格" onclick={onBackspace}>⌫</button><button type="button" aria-label="送出答案" disabled={!input} onclick={onEnter}>送出</button></div>
  </section>
{/if}

<style>
  .number-keypad { z-index: 8; border: 1px solid var(--ds-modal-border); background: var(--ds-surface-strong); color: var(--ds-text); box-shadow: var(--ds-shadow-md); backdrop-filter: blur(20px) saturate(145%); -webkit-backdrop-filter: blur(20px) saturate(145%); touch-action: none; }
  .fixed { position: fixed; right: 0; bottom: calc(5rem + env(safe-area-inset-bottom)); left: 0; border-radius: var(--ds-radius-lg) var(--ds-radius-lg) 0 0; padding: 0.5rem max(1rem, env(safe-area-inset-left)) calc(0.75rem + env(safe-area-inset-bottom)); overscroll-behavior: contain; }
  .floating { position: fixed; width: min(18rem, calc(100vw - 1rem)); border-radius: var(--ds-radius-md); padding: 0.5rem; } .dock-preview { opacity: 0.8; }
  .drag-handle { display: flex; min-height: 1.75rem; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; border: 0; background: transparent; color: var(--ds-text-muted); font: inherit; font-size: 1.1rem; cursor: grab; touch-action: none; }
  .drag-handle span { font-size: 0.75rem; font-weight: 700; }
  .keypad-input { display: block; margin-bottom: 0.5rem; color: var(--ds-text-strong); font-weight: 800; text-align: center; }
  .keypad-close { position: absolute; top: -0.65rem; right: 0.5rem; z-index: 2; display: inline-flex; width: 2rem; height: 2rem; align-items: center; justify-content: center; border: 1px solid var(--ds-border); border-radius: 999px; background: var(--ds-surface-strong); color: var(--ds-text-muted); font: inherit; font-size: 1.25rem; cursor: pointer; box-shadow: var(--ds-shadow-sm); }
  .floating .keypad-close { right: -0.65rem; }
  .key-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem; } .key-grid button, .key-actions button { min-height: 2.75rem; border: 1px solid var(--ds-border); border-radius: var(--ds-radius-sm); background: var(--ds-surface); color: var(--ds-text); font: inherit; font-weight: 700; cursor: pointer; } .key-grid button:last-child { grid-column: 2; }
  .key-actions { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 0.4rem; margin-top: 0.4rem; } .key-actions button:first-child { grid-column: 1; } .key-actions button:last-child { grid-column: 3; background: var(--ds-brand); color: var(--ds-on-brand); } button:disabled { opacity: 0.5; cursor: not-allowed; } button:focus-visible { outline: 3px solid var(--ds-focus); outline-offset: 2px; }
</style>
