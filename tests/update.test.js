import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('app/update.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

test('update flow checks waiting workers and uses local Tailwind assets', () => {
    assert.match(source, /registration\.waiting/);
    assert.match(source, /registration\.update\(\)\.then\(checkWaiting\)/);
    assert.match(source, /registration\.unregister/);
    assert.match(source, /caches\.delete/);
    assert.doesNotMatch(index, /cdn\.tailwindcss\.com/);
    assert.match(index, /tailwind\.css\?v=/);
});
