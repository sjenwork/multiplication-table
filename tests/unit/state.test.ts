import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { DEFAULT_STATE, migrateState, parseState, serializeState, STORAGE_KEY } from '../../src/domain/state';

describe('state schema and migration', () => {
  it('keeps the storage key and migrates a legacy state safely', () => {
    expect(STORAGE_KEY).toBe('multiplication-practice-state');
    const legacy = JSON.parse(readFileSync(new URL('../fixtures/legacy-state.json', import.meta.url), 'utf8')) as unknown;
    const state = migrateState(legacy);
    expect(state.schemaVersion).toBe(1);
    expect(state.selected).toEqual(['1x2', '9x9']);
    expect(state.records['1x2']).toEqual({ errors: 2, attempts: 4 });
    expect(state.theme).toBe('dark');
    expect(state.keypadPosition).toEqual({ detached: true, left: 12, top: 24 });
    expect(state.quiz?.activeKey).toBe('1x2');
  });
  it('defaults malformed data and preserves valid data through round-trip', () => {
    const invalid = JSON.parse(readFileSync(new URL('../fixtures/invalid-state.json', import.meta.url), 'utf8')) as unknown;
    const legacy = JSON.parse(readFileSync(new URL('../fixtures/legacy-state.json', import.meta.url), 'utf8')) as unknown;
    expect(parseState('{bad')).toEqual(DEFAULT_STATE);
    const migratedInvalid = migrateState(invalid);
    expect(migratedInvalid).toMatchObject({ selected: ['1x1'], quiz: null, theme: 'light', keypadPosition: { detached: false, left: null, top: null } });
    expect(migratedInvalid.records).toEqual({ '1x1': { errors: 1, attempts: 2 } });
    expect(parseState(serializeState(migrateState(legacy)))).toEqual(migrateState(legacy));
  });
  it('legalizes and deduplicates quiz questions before active/completed correction', () => {
    const state = migrateState({ quiz: { questions: [
      { key: 'bad' },
      { key: '1x1', resolved: true },
      { key: '1x1', resolved: false },
      { key: '1x2', resolved: false },
    ], activeKey: 'bad', completed: true } });
    expect(state.quiz?.questions.map((question) => question.key)).toEqual(['1x1', '1x2']);
    expect(state.quiz?.activeKey).toBe('1x1');
    expect(state.quiz?.completed).toBe(false);
  });
});
