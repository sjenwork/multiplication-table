import { describe, expect, it } from 'vitest';
import { questionBank } from '../../src/domain/question';
import { selectWrongFirstQuestions } from '../../src/application/wrong-first';

describe('wrong-first selection', () => {
  it('sorts by errors, excludes zero-error records, and limits to ten', () => {
    const records = Object.fromEntries(questionBank().slice(0, 12).map((question, index) => [question.key, { errors: index + 1, attempts: 1 }]));
    const selected = selectWrongFirstQuestions(questionBank(), records);
    expect(selected).toHaveLength(10);
    expect(selected.map((question) => question.key)).toEqual(['2x3', '2x2', '2x1', '1x9', '1x8', '1x7', '1x6', '1x5', '1x4', '1x3']);
    expect(selectWrongFirstQuestions(questionBank(), {})).toEqual([]);
  });
});
