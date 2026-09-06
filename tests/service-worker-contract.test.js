import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const serviceWorker = fs.readFileSync('sw.js', 'utf8');
const appSource = fs.readFileSync('app.js', 'utf8');

test('versioned assets bypass stale service-worker cache entries', () => {
    assert.match(serviceWorker, /requestUrl\.searchParams\.has\(['"]v['"]\)/);
    assert.match(appSource, /updateViaCache:\s*['"]none['"]/);
});
