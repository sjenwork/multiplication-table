import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const indexHtml = fs.readFileSync('index.html', 'utf8');
const quizHtml = fs.readFileSync('quiz.html', 'utf8');
const studyHtml = fs.readFileSync('study.html', 'utf8');
const quizSource = fs.readFileSync('app/quiz.js', 'utf8');
assert.ok(fs.existsSync('tailwind.css'), 'local Tailwind stylesheet must exist');

test('pages load the bootstrap as an ES module', () => {
    assert.match(indexHtml, /<script src="app\.js\?v=\d{8}-\d{6}" type="module"><\/script>/);
    assert.match(quizHtml, /<script src="app\.js\?v=\d{8}-\d{6}" type="module"><\/script>/);
    assert.match(indexHtml, /<script src="app\/theme-colors\.js\?v=\d{8}-\d{6}" async><\/script>/);
    assert.match(quizHtml, /<script src="app\/theme-colors\.js\?v=\d{8}-\d{6}" async><\/script>/);
    assert.match(studyHtml, /<script src="app\.js\?v=\d{8}-\d{6}" type="module"><\/script>/);
});

test('Tailwind utilities are served locally and cannot block startup', () => {
    for (const file of ['index.html', 'quiz.html']) {
        const source = fs.readFileSync(file, 'utf8');
        assert.match(source, /<link rel="stylesheet" href="tailwind\.css\?v=\d{8}-\d{6}">/, file);
        assert.doesNotMatch(source, /cdn\.tailwindcss\.com/, file);
        assert.match(source, /<script src="app\.js\?v=\d{8}-\d{6}" type="module"><\/script>/, file);
    }
});

test('home page keeps the interaction contract', () => {
    for (const id of ['multiplication-grid', 'selection-status', 'start-study', 'start-random-quiz', 'start-wrong-quiz', 'start-quiz', 'open-settings']) {
        assert.match(indexHtml, new RegExp(`id="${id}"`));
    }
    assert.match(indexHtml, /<multiplication-selector id="multiplication-grid"><\/multiplication-selector>/);
    assert.match(indexHtml, /<app-button id="start-quiz"/);
    assert.match(indexHtml, /<div id="selection-status"[^>]*role="status"/);
    assert.doesNotMatch(indexHtml, /<p id="selection-status"/);
});

test('study page keeps the learning table contract', () => {
    for (const id of ['study-table', 'study-factor-buttons', 'back-home', 'open-settings']) {
        assert.match(studyHtml, new RegExp(`id="${id}"`));
    }
    assert.match(studyHtml, /<multiplication-table id="study-table"><\/multiplication-table>/);
    assert.match(studyHtml, /data-factor="2"/);
    assert.match(studyHtml, /data-factor="9"/);
    assert.doesNotMatch(studyHtml, /number-pad|submit-answer/);
});

test('quiz page keeps the interaction contract', () => {
    for (const id of ['question-list', 'number-pad', 'submit-answer', 'completion-overlay', 'leave-modal', 'back-home']) {
        assert.match(quizHtml, new RegExp(`id="${id}"`));
    }
    assert.match(quizHtml, /<app-modal id="leave-modal"/);
    assert.match(quizHtml, /<app-button id="submit-answer"/);
    assert.match(quizHtml, /id="back-home"[^>]*rounded-full/);
    assert.match(quizHtml, /id="open-settings"[^>]*rounded-full/);
});

test('completion feedback is only triggered after all answers resolve', () => {
    assert.equal((quizSource.match(/showCompletionOverlay\(/g) || []).length, 1);
    const unfinishedBranch = quizSource.slice(quizSource.indexOf('if (remaining === 0)'));
    assert.doesNotMatch(unfinishedBranch.slice(unfinishedBranch.indexOf('renderQuiz(state);')), /showCompletionOverlay\(/);
});
