import { describe, expect, it } from 'vitest';
import { invertSelection, selectAll, toggleColumn, toggleKey, toggleRow } from '../../src/domain/selection';

describe('selection domain', () => {
  it('toggles one key and removes duplicates', () => {
    expect(toggleKey(['1x1', '1x1'], '1x1')).toEqual([]);
    expect(toggleKey(['1x1', '1x1'], '1x2')).toEqual(['1x1', '1x2']);
    expect(toggleKey(['1x1'], 'not-a-question')).toEqual(['1x1']);
  });
  it('selects rows, columns, all, and inverts against the 81-question bank', () => {
    expect(toggleRow([], 2)).toHaveLength(9);
    expect(toggleColumn([], 3)).toContain('9x3');
    expect(selectAll([])).toHaveLength(81);
    expect(invertSelection(['1x1'])).toHaveLength(80);
    expect(invertSelection(selectAll([]))).toEqual([]);
  });
});
