import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HomePage from '../../src/routes/HomePage.svelte';
import type { StoragePort } from '../../src/ports';
import { DEFAULT_STATE, STORAGE_KEY, serializeState } from '../../src/domain/state';

class MemoryStorage implements StoragePort {
  values = new Map<string, string>();
  get(key: string) { return this.values.get(key) ?? null; }
  set(key: string, value: string) { this.values.set(key, value); }
  remove(key: string) { this.values.delete(key); }
}

afterEach(() => cleanup());

describe('HomePage integration', () => {
  it('renders the 9x9 grid with factor headers and the 被＼乘 corner', () => {
    render(HomePage, { props: { storage: new MemoryStorage() } });
    expect(screen.getByRole('heading', { name: '乘法小達人' })).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: '九九乘法選題表' })).toBeInTheDocument();
    expect(screen.getByText('被＼乘')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '選擇 1 乘 1' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(10);
    expect(screen.getAllByRole('rowheader')).toHaveLength(9);
  });

  it('selects one cell, a row, a column, all, and restores selected state', async () => {
    const storage = new MemoryStorage();
    storage.set(STORAGE_KEY, serializeState({ ...DEFAULT_STATE, selected: ['1x1'] }));
    render(HomePage, { props: { storage } });
    expect(screen.getByRole('button', { name: '選擇 1 乘 1' })).toHaveAttribute('aria-pressed', 'true');
    await fireEvent.click(screen.getByRole('button', { name: '選擇 2 乘 2' }));
    expect(storage.get(STORAGE_KEY)).toContain('2x2');
    await fireEvent.click(screen.getByRole('button', { name: '選擇第 1 列' }));
    expect(screen.getByRole('button', { name: '選擇 1 乘 9' })).toHaveAttribute('aria-pressed', 'true');
    await fireEvent.click(screen.getByRole('button', { name: '選擇第 3 欄' }));
    expect(screen.getByRole('button', { name: '選擇 9 乘 3' })).toHaveAttribute('aria-pressed', 'true');
    await fireEvent.click(screen.getByRole('button', { name: '全選所有題目' }));
    expect(screen.getByRole('button', { name: '選擇 9 乘 9' })).toHaveAttribute('aria-pressed', 'true');
    expect(JSON.parse(storage.get(STORAGE_KEY)!).selected).toHaveLength(81);
  });

  it('hydrates persisted state before the first grid interaction', async () => {
    const storage = new MemoryStorage();
    storage.set(STORAGE_KEY, serializeState({ ...DEFAULT_STATE, selected: ['1x1'] }));
    render(HomePage, { props: { storage } });
    await fireEvent.click(screen.getByRole('button', { name: '選擇 1 乘 1' }));
    expect(JSON.parse(storage.get(STORAGE_KEY)!).selected).toEqual([]);
  });

  it('keeps challenge disabled until a selection exists and supports select-all', async () => {
    const storage = new MemoryStorage();
    render(HomePage, { props: { storage } });
    expect(screen.getByRole('button', { name: '開始挑戰' })).toBeDisabled();
    await fireEvent.click(screen.getByRole('button', { name: '全選所有題目' }));
    expect(screen.getByRole('button', { name: '開始挑戰' })).not.toBeDisabled();
    expect(JSON.parse(storage.get(STORAGE_KEY)!).selected).toHaveLength(81);
  });

  it('passes record history to cells with a 0/0 default', () => {
    const storage = new MemoryStorage();
    storage.set(STORAGE_KEY, serializeState({ ...DEFAULT_STATE, records: { '1x1': { errors: 2, attempts: 3 } } }));
    render(HomePage, { props: { storage } });
    expect(within(screen.getByRole('button', { name: '選擇 1 乘 1' })).getByText('2/3')).toBeInTheDocument();
    const emptyCell = screen.getByRole('button', { name: '選擇 1 乘 2' });
    expect(within(emptyCell).getByText('0/0')).toBeInTheDocument();
    expect(within(emptyCell).queryByText('2')).not.toBeInTheDocument();
  });

  it('keeps action controls in one horizontally scrollable toolbar', () => {
    render(HomePage, { props: { storage: new MemoryStorage() } });
    const toolbar = screen.getByRole('toolbar', { name: '題目操作' });
    expect(getComputedStyle(toolbar).flexWrap).toBe('nowrap');
    expect(toolbar.querySelectorAll('button')).toHaveLength(3);
  });

  it('suppresses the synthetic click after a long-press drag and guards pointer boundaries', async () => {
    vi.useFakeTimers();
    const storage = new MemoryStorage();
    render(HomePage, { props: { storage } });
    const cell = screen.getByRole('button', { name: '選擇 1 乘 1' });
    await fireEvent.pointerDown(cell, { button: 0, pointerType: 'touch' });
    await fireEvent.pointerEnter(screen.getByRole('button', { name: '選擇 1 乘 2' }));
    expect(cell).toHaveAttribute('aria-pressed', 'false');
    vi.advanceTimersByTime(350);
    await fireEvent.pointerUp(screen.getByRole('grid', { name: '九九乘法選題表' }));
    expect(cell).toHaveAttribute('aria-pressed', 'true');
    await fireEvent.click(cell);
    expect(cell).toHaveAttribute('aria-pressed', 'true');
    const rightClickCell = screen.getByRole('button', { name: '選擇 1 乘 3' });
    await fireEvent.pointerDown(rightClickCell, { button: 2, pointerType: 'mouse' });
    vi.advanceTimersByTime(350);
    expect(rightClickCell).toHaveAttribute('aria-pressed', 'false');
    vi.useRealTimers();
  });

  it('keeps settings behind a testable dialog boundary', async () => {
    const storage = new MemoryStorage();
    render(HomePage, { props: { storage } });
    await fireEvent.click(screen.getByRole('button', { name: '開啟設定' }));
    expect(screen.getByRole('dialog', { name: '設定' })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: '深色主題' }));
    expect(JSON.parse(storage.get(STORAGE_KEY)!).theme).toBe('dark');
  });

  it('exports records and clears persisted selection and theme from settings', async () => {
    const storage = new MemoryStorage();
    storage.set(STORAGE_KEY, serializeState({ ...DEFAULT_STATE, selected: ['1x1'], theme: 'dark' }));
    const download = { download: vi.fn() };
    render(HomePage, { props: { storage, download } });
    await fireEvent.click(screen.getByRole('button', { name: '開啟設定' }));
    await fireEvent.click(screen.getByRole('button', { name: '匯出紀錄' }));
    expect(download.download).toHaveBeenCalledWith('multiplication-records.csv', expect.stringContaining('1x1'), 'text/csv;charset=utf-8');
    await fireEvent.click(screen.getByRole('button', { name: '清除資料' }));
    expect(storage.get(STORAGE_KEY)).toBeNull();
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('supports a desktop pointer drag without toggling the release click back', async () => {
    const storage = new MemoryStorage();
    render(HomePage, { props: { storage } });
    const grid = screen.getByRole('grid', { name: '九九乘法選題表' });
    const first = screen.getByRole('button', { name: '選擇 1 乘 1' });
    const second = screen.getByRole('button', { name: '選擇 1 乘 2' });
    await fireEvent.pointerDown(first, { button: 0, pointerType: 'mouse' });
    await fireEvent.pointerEnter(second);
    await fireEvent.pointerUp(grid);
    await fireEvent.click(second);
    expect(first).toHaveAttribute('aria-pressed', 'true');
    expect(second).toHaveAttribute('aria-pressed', 'true');
  });

  it('disables wrong-first without errors and starts it from persisted records', async () => {
    const emptyStorage = new MemoryStorage();
    render(HomePage, { props: { storage: emptyStorage } });
    expect(screen.getByRole('button', { name: '錯題優先' })).toBeDisabled();
    await fireEvent.click(screen.getByRole('button', { name: '全選所有題目' }));
    expect(screen.getByRole('button', { name: '錯題優先' })).toBeDisabled();
    cleanup();

    const storage = new MemoryStorage();
    storage.set(STORAGE_KEY, serializeState({ ...DEFAULT_STATE, records: { '1x1': { errors: 2, attempts: 2 } } }));
    const go = vi.fn();
    render(HomePage, { props: { storage, navigation: { go, back: () => undefined } } });
    expect(screen.getByRole('button', { name: '錯題優先' })).not.toBeDisabled();
    await fireEvent.click(screen.getByRole('button', { name: '錯題優先' }));
    expect(go).toHaveBeenCalledWith('quiz.html');
    expect(JSON.parse(storage.get(STORAGE_KEY)!).quiz.questions).toHaveLength(1);
    expect(JSON.parse(storage.get(STORAGE_KEY)!).quiz.questions[0].key).toBe('1x1');
  });
});
