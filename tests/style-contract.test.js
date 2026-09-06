import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const tokens = fs.readFileSync('design-tokens.css', 'utf8');
const styleSources = [
    'index.html',
    'quiz.html',
    'app/quiz-view.js',
    'app/components/app-modal.js',
    'app/components/completion-overlay.js',
    'app/components/multiplication-selector.js',
];

test('semantic theme contracts exist for migrated controls', () => {
    for (const className of ['ds-input', 'ds-question-index', 'ds-question-active', 'ds-layer-modal', 'ds-brand-text']) {
        assert.match(tokens, new RegExp(`\\.${className}\\b`));
    }
    for (const token of ['--ds-scrim', '--ds-keypad-shadow', '--ds-confetti-1', '--ds-blur-surface']) {
        assert.match(tokens, new RegExp(token));
    }
});

test('migrated style sources do not reintroduce raw palette utilities', () => {
    const rawPalette = /\b(?:bg|text|border|ring)-(?:white|black|slate|gray|blue|red|green|emerald|amber|yellow|orange|pink|purple|indigo)-\d+\b|\b(?:bg|text|border|ring)-(?:white|black)\b/;
    for (const file of styleSources) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), rawPalette, file);
});
