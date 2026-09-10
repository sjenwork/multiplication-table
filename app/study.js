import { CLIP_GAP_MAX_MS, CLIP_GAP_MIN_MS, playAudioClip } from './audio.js?v=20260910-152113';
import { ensureSettingsModal, initSettings } from './settings.js?v=20260910-152113';
import { saveState } from './state.js?v=20260910-152113';
import './components/multiplication-table.js?v=20260910-152113';

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
    let autoPlay = state.autoPlay;
    let audio = new Audio();
    let playbackToken = 0;
    let playbackMode = 'idle';
    let isPaused = false;
    let pendingGap = null;
    let resumePlaybackTask = null;
    let playbackStartFactor = 2;

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
        resumePlaybackTask = null;
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
        if (resumePlaybackTask) {
            const task = resumePlaybackTask;
            resumePlaybackTask = null;
            isPaused = false;
            syncPlaybackState();
            task().catch(() => {});
            return;
        }
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

    const keepActiveRowVisible = async () => {
        await table.updateComplete;
        const activeRow = table.querySelector('.study-equation-active');
        const scrollArea = document.querySelector('.study-content');
        if (!activeRow || !scrollArea) return;

        const rowRect = activeRow.getBoundingClientRect();
        const scrollRect = scrollArea.getBoundingClientRect();
        const header = document.querySelector('.quiz-header');
        const actionBar = document.querySelector('.safe-action-bar');
        const headerBottom = header?.getBoundingClientRect().bottom ?? scrollRect.top;
        const actionBarTop = actionBar?.getBoundingClientRect().top ?? scrollRect.bottom;
        const visibleTop = Math.max(scrollRect.top + 12, headerBottom + 12);
        const visibleBottom = Math.min(scrollRect.bottom - 12, actionBarTop - 12);
        const isOutsideViewport = rowRect.top < visibleTop || rowRect.bottom > visibleBottom;
        if (!isOutsideViewport) return;

        const visibleHeight = visibleBottom - visibleTop;
        const targetRowTop = visibleTop + Math.max(0, (visibleHeight - rowRect.height) / 2);
        const targetScrollTop = scrollArea.scrollTop + rowRect.top - targetRowTop;
        const maxScrollTop = Math.max(0, scrollArea.scrollHeight - scrollArea.clientHeight);
        scrollArea.scrollTop = Math.min(maxScrollTop, Math.max(0, targetScrollTop));
    };

    const playClip = async (factor, multiplier, token) => {
        table.activeRow = multiplier;
        await keepActiveRowVisible();
        await playAudioClip(audio, voiceGender, factor, multiplier);
        return isCurrentPlayback(token);
    };

    const playFactorSequence = async (factor, token, startMultiplier = 1) => {
        for (let multiplier = startMultiplier; multiplier <= 9; multiplier += 1) {
            try {
                if (!await playClip(factor, multiplier, token)) return false;
            } catch (error) {
                if (!isCurrentPlayback(token)) return false;
                isPaused = true;
                resumePlaybackTask = () => runPlayback(
                    playbackMode,
                    playbackStartFactor,
                    token,
                    factor,
                    multiplier,
                );
                syncPlaybackState();
                return false;
            }
            const needsGap = multiplier < 9 || playbackMode === 'all' && factor < 9;
            if (needsGap) {
                await waitBetweenClips();
                if (!isCurrentPlayback(token)) return false;
            }
        }
        return true;
    };

    const runPlayback = async (mode, initialFactor, token, resumeFactor = initialFactor, resumeMultiplier = 1) => {
        if (mode === 'all') {
            for (let factor = resumeFactor; factor <= 9; factor += 1) {
                selectedFactor = factor;
                updateFactor(table, factor, true);
                const startMultiplier = factor === resumeFactor ? resumeMultiplier : 1;
                if (!await playFactorSequence(factor, token, startMultiplier)) return;
            }
        } else {
            updateFactor(table, initialFactor, true);
            if (!await playFactorSequence(initialFactor, token, resumeMultiplier)) return;
        }
        finishPlayback(token, selectedFactor);
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
        playbackStartFactor = factor;
        isPaused = false;
        const token = playbackToken;
        syncPlaybackState();
        await runPlayback(mode, factor, token);
    };

    const runSingleQuestion = async (factor, multiplier, token) => {
        try {
            if (await playClip(factor, multiplier, token)) finishPlayback(token, factor);
        } catch (error) {
            if (!isCurrentPlayback(token)) return;
            isPaused = true;
            resumePlaybackTask = () => runSingleQuestion(factor, multiplier, token);
            syncPlaybackState();
        }
    };

    const playSingleQuestion = async (factor, multiplier) => {
        stopPlayback();
        playbackMode = 'question';
        selectedFactor = factor;
        const token = playbackToken;
        syncPlaybackState();
        updateFactor(table, factor, true);
        await runSingleQuestion(factor, multiplier, token);
    };

    updateFactor(table, selectedFactor);
    table.gender = voiceGender;
    table.autoPlay = autoPlay;
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
    table.addEventListener('toggle-auto-play', () => {
        autoPlay = !autoPlay;
        state.autoPlay = autoPlay;
        table.autoPlay = autoPlay;
        saveState(state);
    });
    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            stopPlayback();
            selectedFactor = Number(button.dataset.factor);
            updateFactor(table, selectedFactor);
            if (autoPlay) playFactor(selectedFactor, 'factor').then(() => {});
        });
    });
    document.getElementById('back-home').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    if (autoPlay) playFactor(selectedFactor, 'factor').then(() => {});
}
