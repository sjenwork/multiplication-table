import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('app.js', 'utf8');

test('bootstrap starts safely whether the module loads before or after DOMContentLoaded', () => {
    assert.match(source, /document\.readyState === ['"]loading['"]/);
    assert.match(source, /document\.addEventListener\(['"]DOMContentLoaded['"]/);
    assert.match(source, /else start\(\);/);
    assert.match(source, /initHome\(state\)/);
    assert.match(source, /initQuiz\(state\)/);
    assert.match(source, /initStudy\(state\)/);
});
