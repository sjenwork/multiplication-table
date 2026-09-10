import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('app/study.js', 'utf8');
const html = fs.readFileSync('study.html', 'utf8');

test('vanilla study page owns playback rendering without Lit', () => {
    assert.match(source, /export function renderStudyTable/);
    assert.match(source, /data-play-question/);
    assert.match(source, /data-play-factor/);
    assert.match(source, /data-play-all/);
    assert.match(source, /data-toggle-playback/);
    assert.match(source, /data-stop-playback/);
    assert.match(source, /data-auto-play/);
    assert.doesNotMatch(source, /lit-core|LitElement|updateComplete/);
    assert.match(html, /id="study-table"/);
    assert.doesNotMatch(html, /multiplication-table|app-button|factor-legend/);
});
