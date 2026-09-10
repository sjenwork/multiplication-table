import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const tailwind = fs.readFileSync(new URL('../tailwind.css', import.meta.url), 'utf8');
const home = fs.readFileSync(new URL('../app/home.js', import.meta.url), 'utf8');
const pwa = fs.readFileSync(new URL('../pwa.css', import.meta.url), 'utf8');
const quiz = fs.readFileSync(new URL('../app/quiz.js', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const quizHtml = fs.readFileSync(new URL('../quiz.html', import.meta.url), 'utf8');
const tokens = fs.readFileSync(new URL('../design-tokens.css', import.meta.url), 'utf8');
const settings = fs.readFileSync(new URL('../app/settings.js', import.meta.url), 'utf8');

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

test('home page keeps the multiplication study entry point', () => {
    assert.match(index, /id="start-study"/);
    assert.match(home, /getElementById\('start-study'\)/);
    assert.match(home, /window\.location\.href = 'study\.html'/);
});

test('all pages use the local Tailwind build and shared layer tokens', () => {
    assert.match(quizHtml, /tailwind\.css\?v=/);
    assert.doesNotMatch(quizHtml, /cdn\.tailwindcss\.com/);
    for (const token of ['--ds-layer-update', '--ds-layer-keypad', '--ds-layer-header', '.ds-icon-button', '.ds-input']) {
        assert.match(tokens, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
});

test('vanilla modals preserve escape dismissal and focus after closing', () => {
    assert.match(settings, /event\.key === 'Escape'/);
    assert.match(settings, /previousFocus\?\.focus\?\.\(\)/);
    assert.match(quiz, /previousModalFocus\?\.focus\?\.\(\)/);
    assert.match(quiz, /modal\.addEventListener\('keydown'/);
});

test('partial quiz submission does not show the completion overlay', () => {
    const submitSection = quiz.slice(quiz.indexOf('function submitAnswer'), quiz.indexOf('export function initQuiz'));
    assert.doesNotMatch(submitSection, /showCompletionOverlay\(/);
});
