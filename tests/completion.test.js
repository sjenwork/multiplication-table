import test from 'node:test';
import assert from 'node:assert/strict';

test('completion module loads without removed component dependencies', async () => {
    const completion = await import('../app/completion.js');
    for (const name of ['showCompletionOverlay', 'setupCompletionOverlay', 'hideCompletionOverlay']) {
        assert.equal(typeof completion[name], 'function');
    }
});
