import { CLIP_GAP_MAX_MS, CLIP_GAP_MIN_MS, playAudioClip } from './audio.js?v=20260910-122601';
import { ensureSettingsModal, initSettings } from './settings.js?v=20260910-122601';
import './components/multiplication-table.js?v=20260910-122601';

function updateFactor(table, selectedFactor, isPlaying = false) {
    table.factor = selectedFactor;
    document.querySelectorAll('[data-factor]').forEach((button) => {
        const selected = Number(button.dataset.factor) === selectedFactor;
        button.setAttribute('aria-pressed', String(selected));
        button.setAttribute('variant', selected ? 'primary' : 'secondary');
        button.toggleAttribute('data-playing', isPlaying && selected);
    });
}

export function initStudy(state) {
    ensureSettingsModal();
    initSettings(state);
    const table = document.getElementById('study-table');
    const buttons = document.querySelectorAll('[data-factor]');
    const settingsModal = document.querySelector('app-settings-modal');
    let selectedFactor = 2;
    let voiceGender = state.voiceGender;
    let audio = new Audio();
    let playbackToken = 0;
    let playbackMode = 'idle';
    let isPaused = false;
    let pendingGap = null;

    const syncPlaybackState = () => {
        table.playbackMode = playbackMode;
        table.isPlaying = playbackMode !== 'idle';
        table.isPaused = isPaused;
    };

    const clearGap = (resolve = false) => {
        if (!pendingGap) return;
        clearTimeout(pendingGap.timer);
        if (resolve) pendingGap.resolve();
        pendingGap = null;
    };

    const scheduleGap = () => {
        if (!pendingGap) return;
        pendingGap.startedAt = Date.now();
        pendingGap.timer = setTimeout(() => {
            const resolve = pendingGap.resolve;
            pendingGap = null;
            resolve();
        }, pendingGap.remaining);
    };

    const waitBetweenClips = () => new Promise((resolve) => {
        const duration = CLIP_GAP_MIN_MS + Math.floor(Math.random() * (CLIP_GAP_MAX_MS - CLIP_GAP_MIN_MS + 1));
        pendingGap = { remaining: duration, resolve, startedAt: 0, timer: null };
        if (!isPaused) scheduleGap();
    });

    const stopPlayback = () => {
        playbackToken += 1;
        clearGap(true);
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        playbackMode = 'idle';
        isPaused = false;
        table.activeRow = null;
        syncPlaybackState();
        updateFactor(table, selectedFactor);
    };

    const pausePlayback = () => {
        if (playbackMode === 'idle' || isPaused) return;
        if (pendingGap) {
            const elapsed = Date.now() - pendingGap.startedAt;
            pendingGap.remaining = Math.max(0, pendingGap.remaining - elapsed);
            clearTimeout(pendingGap.timer);
        } else {
            audio.pause();
        }
        isPaused = true;
        syncPlaybackState();
    };

    const resumePlayback = () => {
        if (playbackMode === 'idle' || !isPaused) return;
        isPaused = false;
        if (pendingGap) scheduleGap();
        else audio.play().catch(() => {});
        syncPlaybackState();
    };

    const togglePlayback = () => {
        if (isPaused) resumePlayback();
        else pausePlayback();
    };

    const isCurrentPlayback = (token) => token === playbackToken && playbackMode !== 'idle';

    const playClip = async (factor, multiplier, token) => {
        table.activeRow = multiplier;
        await playAudioClip(audio, voiceGender, factor, multiplier);
        return isCurrentPlayback(token);
    };

    const playFactorSequence = async (factor, token) => {
        for (let multiplier = 1; multiplier <= 9; multiplier += 1) {
            if (!await playClip(factor, multiplier, token)) return false;
            const needsGap = multiplier < 9 || playbackMode === 'all' && factor < 9;
            if (needsGap) {
                await waitBetweenClips();
                if (!isCurrentPlayback(token)) return false;
            }
        }
        return true;
    };

    const finishPlayback = (token, factor) => {
        if (!isCurrentPlayback(token)) return;
        playbackMode = 'idle';
        isPaused = false;
        table.activeRow = null;
        syncPlaybackState();
        updateFactor(table, factor);
    };

    const playFactor = async (factor, mode) => {
        stopPlayback();
        playbackMode = mode;
        selectedFactor = factor;
        isPaused = false;
        const token = playbackToken;
        syncPlaybackState();

        if (mode === 'all') {
            for (let currentFactor = 2; currentFactor <= 9; currentFactor += 1) {
                selectedFactor = currentFactor;
                updateFactor(table, currentFactor, true);
                if (!await playFactorSequence(currentFactor, token)) return;
            }
        } else {
            updateFactor(table, factor, true);
            if (!await playFactorSequence(factor, token)) return;
        }
        finishPlayback(token, selectedFactor);
    };

    const playSingleQuestion = async (factor, multiplier) => {
        stopPlayback();
        playbackMode = 'question';
        selectedFactor = factor;
        const token = playbackToken;
        syncPlaybackState();
        updateFactor(table, factor, true);
        if (await playClip(factor, multiplier, token)) finishPlayback(token, factor);
    };

    updateFactor(table, selectedFactor);
    table.gender = voiceGender;
    syncPlaybackState();
    settingsModal.addEventListener('voice-change', (event) => {
        voiceGender = event.detail.voiceGender;
        table.gender = voiceGender;
        stopPlayback();
    });
    table.addEventListener('play-question', (event) => playSingleQuestion(event.detail.factor, event.detail.multiplier).then(() => {}));
    table.addEventListener('play-factor', (event) => playFactor(event.detail.factor, 'factor').then(() => {}));
    table.addEventListener('play-all', () => playFactor(2, 'all').then(() => {}));
    table.addEventListener('toggle-playback', togglePlayback);
    table.addEventListener('stop-playback', stopPlayback);
    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            stopPlayback();
            selectedFactor = Number(button.dataset.factor);
            updateFactor(table, selectedFactor);
        });
    });
    document.getElementById('back-home').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}
