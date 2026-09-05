import { describe, expect, it } from 'vitest';
import { emptyRecord, finalizeQuiz, finalizeRound, recordLabel } from '../../src/domain/records';
import { createQuiz } from '../../src/domain/quiz';

describe('records domain', () => {
  it('starts at 0/0 and counts each completed round once', () => {
    expect(recordLabel(undefined)).toBe('0/0');
    expect(emptyRecord()).toEqual({ errors: 0, attempts: 0 });
    const first = finalizeRound({}, [{ key: '1x2', hadError: true }]);
    expect(first['1x2']).toEqual({ errors: 1, attempts: 1 });
    expect(finalizeRound(first, [{ key: '1x2', hadError: true }])['1x2']).toEqual({ errors: 2, attempts: 2 });
  });
  it('does not count a completed quiz twice', () => {
    const quiz = createQuiz([{ row: 1, col: 2, answer: 2, key: '1x2' }], () => 0);
    const first = finalizeQuiz(quiz, {});
    const second = finalizeQuiz(first.quiz, first.records);
    expect(first.records).toEqual({ '1x2': { errors: 0, attempts: 1 } });
    expect(second.records).toEqual(first.records);
  });
  it('deduplicates repeated question keys within one round', () => {
    expect(finalizeRound({}, [
      { key: '1x2', hadError: true },
      { key: '1x2', hadError: false },
    ])).toEqual({ '1x2': { errors: 1, attempts: 1 } });
  });
});
