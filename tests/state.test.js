import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
    STORAGE_KEY,
    historyText,
    loadState,
    questionKey,
    questionList,
    saveState,
    shuffled,
} from '../app/state.js';

const originalLocalStorage = globalThis.localStorage;

beforeEach(() => {
    const values = new Map();
    globalThis.localStorage = {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: (key) => values.delete(key),
    };
});

afterEach(() => {
    if (originalLocalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalLocalStorage;
});

test('questionList returns the complete 9 by 9 question contract', () => {
    const questions = questionList();

    assert.equal(questions.length, 81);
    assert.deepEqual(questions[0], { row: 1, col: 1, answer: 1, key: '1x1' });
    assert.deepEqual(questions.at(-1), { row: 9, col: 9, answer: 81, key: '9x9' });
    assert.equal(new Set(questions.map((question) => question.key)).size, 81);
});

test('questionKey and historyText keep display and storage formats stable', () => {
    assert.equal(questionKey(7, 8), '7x8');
    assert.equal(historyText(), '0/0');
    assert.equal(historyText({ errors: 2, attempts: 5 }), '2/5');
});

test('shuffled preserves the input collection without mutating it', () => {
    const input = [1, 2, 3, 4, 5];
    const output = shuffled(input);

    assert.notStrictEqual(output, input);
    assert.deepEqual([...output].sort(), input);
    assert.deepEqual(input, [1, 2, 3, 4, 5]);
});

test('loadState returns safe defaults and normalizes persisted values', () => {
    assert.deepEqual(loadState(), {
        selected: [],
        records: {},
        quiz: null,
        theme: 'light',
        keypadPosition: { detached: false, left: null, top: null },
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        selected: ['2x3'],
        theme: 'invalid',
        keypadPosition: { detached: true, left: 12 },
    }));
    assert.deepEqual(loadState(), {
        selected: ['2x3'],
        records: {},
        quiz: null,
        theme: 'light',
        keypadPosition: { detached: true, left: 12, top: null },
    });
});

test('saveState persists the complete state under the shared storage key', () => {
    const state = { selected: ['4x4'], records: {}, quiz: null, theme: 'dark', keypadPosition: { detached: false, left: null, top: null } };

    saveState(state);

    assert.deepEqual(JSON.parse(localStorage.getItem(STORAGE_KEY)), state);
});
