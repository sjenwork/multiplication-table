import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('app.js', 'utf8');

test('bootstrap registers the application startup handler', () => {
    assert.match(source, /document\.readyState === ['"]loading['"]/);
    assert.match(source, /document\.addEventListener\(['"]DOMContentLoaded['"]/);
    assert.match(source, /else \{\s*start\(\);/s);
    assert.match(source, /initHome\(state\)/);
    assert.match(source, /initQuiz\(state\)/);
});
