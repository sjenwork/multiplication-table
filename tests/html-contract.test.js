import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const indexHtml = fs.readFileSync('index.html', 'utf8');
const quizHtml = fs.readFileSync('quiz.html', 'utf8');

test('pages load the bootstrap as an ES module', () => {
    assert.match(indexHtml, /<script src="app\.js\?v=\d{8}-\d{6}" type="module"><\/script>/);
    assert.match(quizHtml, /<script src="app\.js\?v=\d{8}-\d{6}" type="module"><\/script>/);
});

test('home page keeps the interaction contract', () => {
    for (const id of ['multiplication-grid', 'selection-status', 'start-random-quiz', 'start-wrong-quiz', 'start-quiz', 'open-settings']) {
        assert.match(indexHtml, new RegExp(`id="${id}"`));
    }
});

test('quiz page keeps the interaction contract', () => {
    for (const id of ['question-list', 'number-pad', 'submit-answer', 'completion-overlay', 'leave-modal', 'back-home']) {
        assert.match(quizHtml, new RegExp(`id="${id}"`));
    }
});
