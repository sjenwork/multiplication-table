import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const indexHtml = fs.readFileSync('index.html', 'utf8');
const quizHtml = fs.readFileSync('quiz.html', 'utf8');

test('pages load the bootstrap as an ES module', () => {
    assert.match(indexHtml, /<script src="app\.js\?v=\d{8}-\d{6}" type="module"><\/script>/);
    assert.match(quizHtml, /<script src="app\.js\?v=\d{8}-\d{6}" type="module"><\/script>/);
    assert.match(indexHtml, /<script src="app\/theme-colors\.js\?v=\d{8}-\d{6}"><\/script>/);
    assert.match(quizHtml, /<script src="app\/theme-colors\.js\?v=\d{8}-\d{6}"><\/script>/);
});

test('optional Tailwind CDN loads after the application markup', () => {
    for (const file of ['index.html', 'quiz.html']) {
        const source = fs.readFileSync(file, 'utf8');
        assert.match(source, /script\.src = 'https:\/\/cdn\.tailwindcss\.com'/, file);
        assert.match(source, /script\.async = true/, file);
        assert.match(source, /<script src="app\.js\?v=\d{8}-\d{6}" type="module"><\/script>/, file);
    }
});

test('home page keeps the interaction contract', () => {
    for (const id of ['multiplication-grid', 'selection-status', 'start-random-quiz', 'start-wrong-quiz', 'start-quiz', 'open-settings']) {
        assert.match(indexHtml, new RegExp(`id="${id}"`));
    }
    assert.match(indexHtml, /<multiplication-selector id="multiplication-grid"><\/multiplication-selector>/);
});

test('quiz page keeps the interaction contract', () => {
    for (const id of ['question-list', 'number-pad', 'submit-answer', 'completion-overlay', 'leave-modal', 'back-home']) {
        assert.match(quizHtml, new RegExp(`id="${id}"`));
    }
    assert.match(quizHtml, /<app-modal id="leave-modal"/);
});
