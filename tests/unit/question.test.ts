import { describe, expect, it } from 'vitest';
import { questionBank, questionKey } from '../../src/domain/question';

describe('question domain', () => {
  it('generates all 81 multiplication questions with independent reverse keys', () => {
    expect(questionBank()).toHaveLength(81);
    expect(questionBank()[0]).toEqual({ row: 1, col: 1, answer: 1, key: '1x1' });
    expect(questionKey(2, 3)).toBe('2x3');
    expect(questionBank().find((q) => q.key === '2x3')?.answer).toBe(6);
    expect(questionBank().find((q) => q.key === '3x2')?.key).toBe('3x2');
  });
});
