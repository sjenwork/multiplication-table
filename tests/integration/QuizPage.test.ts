import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import QuizPage from '../../src/routes/QuizPage.svelte';
import type { StoragePort, NavigationPort } from '../../src/ports';
import { DEFAULT_STATE, STORAGE_KEY, serializeState } from '../../src/domain/state';
import { createQuiz } from '../../src/domain/quiz';

class MemoryStorage implements StoragePort {
  values = new Map<string, string>();
  get(key: string) { return this.values.get(key) ?? null; }
  set(key: string, value: string) { this.values.set(key, value); }
  remove(key: string) { this.values.delete(key); }
}

const navigation: NavigationPort = { go: () => undefined, back: () => undefined };
afterEach(() => cleanup());

describe('QuizPage integration', () => {
  it('restores a quiz with at most ten unique question cards', () => {
    const storage = new MemoryStorage();
    storage.set(STORAGE_KEY, serializeState({ ...DEFAULT_STATE, quiz: createQuiz([{ row: 1, col: 2, answer: 2, key: '1x2' }, { row: 2, col: 2, answer: 4, key: '2x2' }], () => 0) }));
    render(QuizPage, { props: { storage, navigation } });
    expect(screen.getByRole('heading', { name: '答題挑戰' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(new Set(screen.getAllByRole('article').map((card) => card.getAttribute('data-question'))).size).toBe(2);
  });

  it('accepts a correct answer and saves completion state', async () => {
    const storage = new MemoryStorage();
    storage.set(STORAGE_KEY, serializeState({ ...DEFAULT_STATE, quiz: createQuiz([{ row: 1, col: 2, answer: 2, key: '1x2' }], () => 0) }));
    render(QuizPage, { props: { storage, navigation } });
    await fireEvent.click(screen.getByRole('button', { name: '數字 2' }));
    await fireEvent.click(screen.getByRole('button', { name: '送出答案' }));
    expect(screen.getByRole('status')).toHaveTextContent('答對了');
    const saved = JSON.parse(storage.get(STORAGE_KEY)!);
    expect(saved.quiz.completed).toBe(true);
    expect(saved.records['1x2']).toEqual({ errors: 0, attempts: 1 });
  });

  it('clears wrong input, reveals the answer after three errors, and blocks empty submit', async () => {
    const storage = new MemoryStorage();
    storage.set(STORAGE_KEY, serializeState({ ...DEFAULT_STATE, quiz: createQuiz([{ row: 1, col: 2, answer: 2, key: '1x2' }], () => 0) }));
    render(QuizPage, { props: { storage, navigation } });
    const card = screen.getByRole('article');
    expect(within(screen.getByRole('region', { name: '固定數字鍵盤' })).getByRole('button', { name: '送出答案' })).toBeDisabled();
    for (let count = 0; count < 3; count += 1) {
      await fireEvent.click(screen.getByRole('button', { name: '數字 1' }));
      await fireEvent.click(screen.getByRole('button', { name: '送出答案' }));
    }
    expect(screen.getByRole('status')).toHaveTextContent('正確答案是 2');
    expect(screen.getByText('正確答案是 2')).toBeInTheDocument();
    expect(JSON.parse(storage.get(STORAGE_KEY)!).records['1x2']).toEqual({ errors: 1, attempts: 1 });
  });

  it('opens a return confirmation before navigation', async () => {
    const storage = new MemoryStorage();
    const calls: string[] = [];
    render(QuizPage, { props: { storage, navigation: { go: (path: string) => calls.push(path), back: () => calls.push('back') } } });
    await fireEvent.click(screen.getByRole('button', { name: '返回' }));
    expect(screen.getByRole('dialog', { name: '確認返回' })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: '確認返回' }));
    expect(calls).toEqual(['index.html']);
  });

  it('uses the fixed keypad by default and supports digits, backspace, and enter', async () => {
    const storage = new MemoryStorage();
    storage.set(STORAGE_KEY, serializeState({ ...DEFAULT_STATE, quiz: createQuiz([{ row: 1, col: 2, answer: 2, key: '1x2' }], () => 0) }));
    render(QuizPage, { props: { storage, navigation } });
    expect(screen.getByRole('region', { name: '固定數字鍵盤' })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: '數字 1' }));
    await fireEvent.click(screen.getByRole('button', { name: '退格' }));
    expect(screen.getByRole('textbox', { name: '答案 1 乘 2' })).toHaveValue('');
    await fireEvent.click(screen.getByRole('button', { name: '數字 2' }));
    await fireEvent.click(screen.getByRole('button', { name: '送出答案' }));
    expect(screen.getByRole('status')).toHaveTextContent('答對了');
  });

  it('switches to floating mode, persists its mode/position, and closes with X', async () => {
    const storage = new MemoryStorage();
    storage.set(STORAGE_KEY, serializeState({ ...DEFAULT_STATE, quiz: createQuiz([{ row: 1, col: 2, answer: 2, key: '1x2' }], () => 0) }));
    render(QuizPage, { props: { storage, navigation } });
    await fireEvent.click(screen.getByRole('button', { name: '設定' }));
    await fireEvent.click(screen.getByRole('button', { name: '浮動鍵盤' }));
    expect(screen.getByRole('region', { name: '浮動數字鍵盤' })).toBeInTheDocument();
    expect(JSON.parse(storage.get(STORAGE_KEY)!).keypadPosition.detached).toBe(true);
    await fireEvent.click(screen.getByRole('button', { name: '關閉鍵盤' }));
    expect(screen.queryByRole('region', { name: '浮動數字鍵盤' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '開啟數字鍵盤' })).toBeInTheDocument();
  });

  it('keeps the input in none mode so the system IME is not requested', () => {
    const storage = new MemoryStorage();
    storage.set(STORAGE_KEY, serializeState({ ...DEFAULT_STATE, quiz: createQuiz([{ row: 1, col: 2, answer: 2, key: '1x2' }], () => 0) }));
    render(QuizPage, { props: { storage, navigation } });
    expect(screen.getByRole('textbox', { name: '答案 1 乘 2' })).toHaveAttribute('inputmode', 'none');
    expect(screen.getByRole('textbox', { name: '答案 1 乘 2' })).toHaveAttribute('readonly');
  });

  it('keeps header actions independent and guards the overall check until every answer is entered', async () => {
    const storage = new MemoryStorage();
    storage.set(STORAGE_KEY, serializeState({ ...DEFAULT_STATE, quiz: createQuiz([{ row: 1, col: 2, answer: 2, key: '1x2' }, { row: 2, col: 2, answer: 4, key: '2x2' }], () => 0) }));
    render(QuizPage, { props: { storage, navigation } });
    expect(screen.getByRole('button', { name: '返回' })).toHaveTextContent('←');
    expect(screen.getByRole('button', { name: '設定' })).toHaveTextContent('⚙');
    expect(screen.getByRole('button', { name: '檢查全部答案' })).toBeDisabled();
    await fireEvent.click(screen.getByRole('button', { name: '設定' }));
    expect(screen.getByRole('dialog', { name: '設定' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '固定鍵盤' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('checks all answers, focuses the first error, and changes the action to 對答案', async () => {
    const storage = new MemoryStorage();
    storage.set(STORAGE_KEY, serializeState({ ...DEFAULT_STATE, quiz: createQuiz([{ row: 1, col: 2, answer: 2, key: '1x2' }, { row: 2, col: 2, answer: 4, key: '2x2' }], () => 0) }));
    render(QuizPage, { props: { storage, navigation } });
    await fireEvent.click(screen.getByRole('button', { name: '數字 1' }));
    await fireEvent.click(screen.getByRole('button', { name: /選擇第 \d+ 題 2 乘 2/ }));
    await fireEvent.click(screen.getByRole('button', { name: '數字 4' }));
    await fireEvent.click(screen.getByRole('button', { name: /選擇第 \d+ 題 1 乘 2/ }));
    await fireEvent.click(screen.getByRole('button', { name: '檢查全部答案' }));
    expect(screen.getByRole('button', { name: '對答案' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')[0]).toHaveClass('active');
  });

  it('keeps completion banner until closed, closes the keypad, and supports replay/random actions', async () => {
    const storage = new MemoryStorage();
    storage.set(STORAGE_KEY, serializeState({ ...DEFAULT_STATE, selected: ['1x2'], quiz: createQuiz([{ row: 1, col: 2, answer: 2, key: '1x2' }], () => 0) }));
    const calls: string[] = [];
    render(QuizPage, { props: { storage, navigation: { go: (path: string) => calls.push(path), back: () => undefined } } });
    await fireEvent.click(screen.getByRole('button', { name: '數字 2' }));
    await fireEvent.click(screen.getByRole('button', { name: '送出答案' }));
    expect(screen.getByRole('complementary', { name: '完成提示' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '固定數字鍵盤' })).not.toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: '關閉完成提示' }));
    expect(screen.queryByRole('complementary', { name: '完成提示' })).not.toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: '設定' }));
    await fireEvent.click(screen.getByRole('button', { name: '關閉設定' }));
    expect(calls).toEqual([]);
  });

  it('starts a fresh quiz from replay and random completion actions', async () => {
    const storage = new MemoryStorage();
    storage.set(STORAGE_KEY, serializeState({ ...DEFAULT_STATE, selected: ['1x2'], quiz: createQuiz([{ row: 1, col: 2, answer: 2, key: '1x2' }], () => 0) }));
    render(QuizPage, { props: { storage, navigation } });
    await fireEvent.click(screen.getByRole('button', { name: '數字 2' }));
    await fireEvent.click(screen.getByRole('button', { name: '送出答案' }));
    await fireEvent.click(screen.getByRole('button', { name: '重新測驗' }));
    expect(JSON.parse(storage.get(STORAGE_KEY)!).quiz.completed).toBe(false);
    await fireEvent.click(screen.getByRole('button', { name: '數字 2' }));
    await fireEvent.click(screen.getByRole('button', { name: '送出答案' }));
    await fireEvent.click(screen.getByRole('button', { name: '隨機出題' }));
    const saved = JSON.parse(storage.get(STORAGE_KEY)!);
    expect(saved.quiz.completed).toBe(false);
    expect(saved.quiz.questions).toHaveLength(10);
  });
});
