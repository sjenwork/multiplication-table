import test from 'node:test';
import assert from 'node:assert/strict';
import { AUDIO_ROOTS, CLIP_GAP_MAX_MS, CLIP_GAP_MIN_MS, audioPath } from '../app/audio.js';

test('audio paths use the gender and voice folders without speaker names', () => {
    assert.deepEqual(AUDIO_ROOTS, {
        female: 'female/aoede/audio',
        male: 'male/puck/audio',
    });
    assert.equal(audioPath('female', 2, 12), 'female/aoede/audio/2x12.m4a');
    assert.equal(audioPath('male', 9, 9), 'male/puck/audio/9x9.m4a');
});

test('audio playback leaves a short gap between clips', () => {
    assert.equal(CLIP_GAP_MIN_MS, 212);
    assert.equal(CLIP_GAP_MAX_MS, 224);
});
