import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const tailwind = fs.readFileSync(new URL('../tailwind.css', import.meta.url), 'utf8');
const home = fs.readFileSync(new URL('../app/home.js', import.meta.url), 'utf8');
const pwa = fs.readFileSync(new URL('../pwa.css', import.meta.url), 'utf8');
const quiz = fs.readFileSync(new URL('../app/quiz.js', import.meta.url), 'utf8');

test('local Tailwind build contains utilities used by the selection table', () => {
    for (const selector of ['.bg-slate-50', '.text-slate-800', '.z-30', '.z-20', '.z-10', '.focus\\:ring-2', '.focus-within\\:ring-2']) {
        assert.ok(tailwind.includes(selector), `missing ${selector}`);
    }
});

test('touch selection keeps the long-press timer during small Android movement', () => {
    assert.match(home, /gesture\.pointerType !== 'mouse'/);
    assert.doesNotMatch(home, /else \{\s*gesture\.moved = true;\s*\}/);
});

test('touch table owns panning so long-press selection is not canceled by native scrolling', () => {
    assert.match(pwa, /#multiplication-grid\s*\{[^}]*touch-action:\s*none;/s);
    assert.match(home, /scrollContainer\.scrollLeft\s*[-+]=/);
    assert.match(home, /scrollContainer\.scrollTop\s*[-+]=/);
});

test('quiz rerenders preserve the input focus callback', () => {
    assert.doesNotMatch(quiz, /renderQuiz\(state\);/);
    assert.match(quiz, /renderQuiz\(state, focusQuizQuestion\);/);
});
