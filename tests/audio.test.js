import test from 'node:test';
import assert from 'node:assert/strict';
import { AUDIO_ROOTS, CLIP_GAP_MAX_MS, CLIP_GAP_MIN_MS, audioPath } from '../app/audio.js';

test('audio paths keep the gender and voice folder contract', () => {
    assert.deepEqual(AUDIO_ROOTS, {
        female: 'female/aoede/audio',
        male: 'male/puck/audio',
    });
    assert.equal(audioPath('female', 2, 1), 'female/aoede/audio/2x1.m4a');
    assert.equal(audioPath('male', 9, 8), 'male/puck/audio/9x8.m4a');
    assert.equal(audioPath('unknown', 3, 4), 'female/aoede/audio/3x4.m4a');
});

test('audio playback keeps a short pause between clips', () => {
    assert.equal(CLIP_GAP_MIN_MS, 212);
    assert.equal(CLIP_GAP_MAX_MS, 224);
    assert.ok(CLIP_GAP_MIN_MS < CLIP_GAP_MAX_MS);
});
