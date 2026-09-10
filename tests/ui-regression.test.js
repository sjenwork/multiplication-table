import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const tailwind = fs.readFileSync(new URL('../tailwind.css', import.meta.url), 'utf8');
const home = fs.readFileSync(new URL('../app/home.js', import.meta.url), 'utf8');

test('local Tailwind build contains utilities used by the selection table', () => {
    for (const selector of ['.bg-slate-50', '.text-slate-800', '.z-30', '.z-20', '.z-10', '.focus\\:ring-2', '.focus-within\\:ring-2']) {
        assert.ok(tailwind.includes(selector), `missing ${selector}`);
    }
});

test('touch selection keeps the long-press timer during small Android movement', () => {
    assert.match(home, /gesture\.pointerType === 'mouse'/);
    assert.doesNotMatch(home, /else \{\s*gesture\.moved = true;\s*\}/);
});
