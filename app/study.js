import { CLIP_GAP_MAX_MS, CLIP_GAP_MIN_MS, playAudioClip } from './audio.js?v=20260912-171534';
import { ensureSettingsModal, initSettings } from './settings.js?v=20260912-171534';
import { saveState } from './state.js?v=20260912-171534';

const FACTORS = [2, 3, 4, 5, 6, 7, 8, 9];

function playIcon() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>';
}

function playAllIcon() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>';
}

function pauseIcon() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
}

function stopIcon() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1"></rect></svg>';
}

export function renderStudyTable(table, factor, playback = {}) {
    const mode = playback.mode || 'idle';
    const activeRow = playback.activeRow ?? null;
    const paused = Boolean(playback.paused);
    const autoPlay = playback.autoPlay !== false;
    const factorButton = mode === 'factor'
        ? `<button type="button" class="study-play-button" data-toggle-playback aria-label="${paused ? '繼續播放' : '暫停播放'}" title="${paused ? '繼續播放' : '暫停播放'}">${paused ? playIcon() : pauseIcon()}</button>`
        : `<button type="button" class="study-play-button" data-play-factor aria-label="播放${factor}的乘法表" title="播放${factor}的乘法表">${playIcon()}</button>`;
    const allButton = mode === 'all'
        ? `<button type="button" class="study-play-button" data-toggle-playback aria-label="${paused ? '繼續播放' : '暫停播放'}" title="${paused ? '繼續播放' : '暫停播放'}">${paused ? playIcon() : pauseIcon()}</button>`
        : `<button type="button" class="study-play-button study-play-all" data-play-all aria-label="全部播放" title="全部播放">${playAllIcon()}</button>`;
    table.innerHTML = `
        <div class="study-equation-sheet ds-surface border rounded-2xl p-4 sm:p-5">
            <div class="study-table-heading">
                <span class="ds-text-muted text-sm font-semibold">${factor} 的乘法表</span>
                <div class="study-table-actions" role="group" aria-label="播放控制">
                    ${factorButton}
                    ${allButton}
                    <button type="button" class="study-play-button study-stop-button" data-stop-playback aria-label="停止播放" title="停止播放"${mode === 'idle' ? ' disabled' : ''}>${stopIcon()}</button>
                    <button type="button" class="study-auto-play-button${autoPlay ? ' study-auto-play-active' : ''}" data-auto-play aria-label="自動播放${autoPlay ? '已開啟' : '已關閉'}" title="自動播放${autoPlay ? '已開啟' : '已關閉'}" aria-pressed="${autoPlay}"><span aria-hidden="true">↻</span><span>自動</span></button>
                </div>
            </div>
            <div class="study-equation-list" role="list" aria-label="${factor} 的乘法表">
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((multiplier) => {
                    const active = activeRow === multiplier;
                    const questionMode = mode === 'question' && active;
                    const label = questionMode ? (paused ? '繼續播放' : '暫停播放') : `播放${factor}乘${multiplier}`;
                    return `<div class="study-equation${active ? ' study-equation-active' : ''}" role="listitem" data-equation-row="${multiplier}">
                        <span class="ds-factor-one">${factor}</span><span aria-hidden="true">×</span><span class="ds-factor-two">${multiplier}</span><span aria-hidden="true">=</span><strong class="study-answer">${factor * multiplier}</strong>
                        <button type="button" class="study-play-button study-question-play" data-play-question="${multiplier}" aria-label="${label}" title="${label}">${questionMode && !paused ? pauseIcon() : playIcon()}</button>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
}

function updateFactorButtons(selectedFactor, isPlaying = false) {
    document.querySelectorAll('[data-factor]').forEach((button) => {
        const selected = Number(button.dataset.factor) === selectedFactor;
        button.classList.toggle('ds-primary', selected);
        button.classList.toggle('ds-secondary', !selected);
        button.setAttribute('aria-pressed', String(selected));
        button.toggleAttribute('data-playing', isPlaying && selected);
    });
}

export function initStudy(state) {
    ensureSettingsModal();
    initSettings(state);
    const table = document.getElementById('study-table');
    const scrollArea = document.querySelector('.study-content');
    const buttons = document.querySelectorAll('[data-factor]');
    let selectedFactor = 2;
    let voiceGender = state.voiceGender;
    let autoPlay = state.autoPlay;
    const audio = new Audio();
    let playbackToken = 0;
    let mode = 'idle';
    let paused = false;
    let activeRow = null;
    let pendingGap = null;
    let resumeTask = null;
    let playbackStartFactor = 2;
    let scrollAnimationFrame = 0;

    const render = () => renderStudyTable(table, selectedFactor, { mode, paused, activeRow, autoPlay });
    const sync = () => {
        render();
        updateFactorButtons(selectedFactor, mode !== 'idle');
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
        if (!paused) scheduleGap();
    });
    const cancelScrollAnimation = () => {
        if (scrollAnimationFrame) cancelAnimationFrame(scrollAnimationFrame);
        scrollAnimationFrame = 0;
    };
    const animateScrollTop = (target) => {
        if (!scrollArea) return;
        cancelScrollAnimation();
        const start = scrollArea.scrollTop;
        const distance = target - start;
        if (Math.abs(distance) < 1) { scrollArea.scrollTop = target; return; }
        const duration = Math.min(220, Math.max(140, Math.abs(distance) * 1.5));
        const startedAt = performance.now();
        const step = (now) => {
            const progress = Math.min(1, (now - startedAt) / duration);
            scrollArea.scrollTop = start + distance * (1 - Math.pow(1 - progress, 3));
            if (progress < 1) scrollAnimationFrame = requestAnimationFrame(step);
            else scrollAnimationFrame = 0;
        };
        scrollAnimationFrame = requestAnimationFrame(step);
    };
    const keepActiveRowVisible = () => {
        if (!activeRow || !scrollArea) return;
        const row = table.querySelector(`[data-equation-row="${activeRow}"]`);
        if (!row) return;
        const rowRect = row.getBoundingClientRect();
        const scrollRect = scrollArea.getBoundingClientRect();
        const header = document.querySelector('.quiz-header');
        const actionBar = document.querySelector('.safe-action-bar');
        const visibleTop = Math.max(scrollRect.top + 12, (header?.getBoundingClientRect().bottom ?? scrollRect.top) + 12);
        const visibleBottom = Math.min(scrollRect.bottom - 12, (actionBar?.getBoundingClientRect().top ?? scrollRect.bottom) - 12);
        if (rowRect.top >= visibleTop && rowRect.bottom <= visibleBottom) return;
        const target = scrollArea.scrollTop + rowRect.top - (visibleTop + Math.max(0, (visibleBottom - visibleTop - rowRect.height) / 2));
        animateScrollTop(Math.min(Math.max(0, scrollArea.scrollHeight - scrollArea.clientHeight), Math.max(0, target)));
    };
    const stopPlayback = () => {
        playbackToken += 1;
        cancelScrollAnimation();
        clearGap(true);
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        mode = 'idle'; paused = false; activeRow = null; resumeTask = null;
        sync();
    };
    const pausePlayback = () => {
        if (mode === 'idle' || paused) return;
        if (pendingGap) {
            pendingGap.remaining = Math.max(0, pendingGap.remaining - (Date.now() - pendingGap.startedAt));
            clearTimeout(pendingGap.timer);
        } else audio.pause();
        paused = true; sync();
    };
    const resumePlayback = () => {
        if (mode === 'idle' || !paused) return;
        const task = resumeTask;
        resumeTask = null;
        paused = false;
        if (task) task().catch(() => {});
        else if (pendingGap) scheduleGap();
        else audio.play().catch(() => {});
        sync();
    };
    const current = (token) => token === playbackToken && mode !== 'idle';
    const playClip = async (factor, multiplier, token) => {
        activeRow = multiplier; sync(); keepActiveRowVisible();
        await playAudioClip(audio, voiceGender, factor, multiplier);
        return current(token);
    };
    const playFactorSequence = async (factor, token, startMultiplier = 1) => {
        for (let multiplier = startMultiplier; multiplier <= 9; multiplier += 1) {
            try {
                if (!await playClip(factor, multiplier, token)) return false;
            } catch (error) {
                if (!current(token)) return false;
                paused = true;
                resumeTask = () => runPlayback(mode, playbackStartFactor, token, factor, multiplier);
                sync();
                return false;
            }
            if (multiplier < 9 || mode === 'all' && factor < 9) {
                await waitBetweenClips();
                if (!current(token)) return false;
            }
        }
        return true;
    };
    const finishPlayback = (token) => {
        if (!current(token)) return;
        cancelScrollAnimation(); mode = 'idle'; paused = false; activeRow = null; resumeTask = null; sync();
    };
    async function runPlayback(playMode, initialFactor, token, resumeFactor = initialFactor, resumeMultiplier = 1) {
        if (playMode === 'all') {
            for (let factor = resumeFactor; factor <= 9; factor += 1) {
                selectedFactor = factor; sync();
                if (!await playFactorSequence(factor, token, factor === resumeFactor ? resumeMultiplier : 1)) return;
            }
        } else {
            selectedFactor = initialFactor; sync();
            if (!await playFactorSequence(initialFactor, token, resumeMultiplier)) return;
        }
        finishPlayback(token);
    }
    const playFactor = async (factor, playMode) => {
        stopPlayback(); mode = playMode; selectedFactor = factor; playbackStartFactor = factor;
        const token = playbackToken; sync(); await runPlayback(playMode, factor, token);
    };
    const playQuestion = async (factor, multiplier) => {
        stopPlayback(); mode = 'question'; selectedFactor = factor;
        const token = playbackToken; sync();
        try { if (await playClip(factor, multiplier, token)) finishPlayback(token); }
        catch (error) { if (current(token)) { paused = true; resumeTask = () => playQuestion(factor, multiplier); sync(); } }
    };

    table.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        if (button.matches('[data-toggle-playback]')) return paused ? resumePlayback() : pausePlayback();
        if (button.matches('[data-stop-playback]')) return stopPlayback();
        if (button.matches('[data-auto-play]')) { autoPlay = !autoPlay; state.autoPlay = autoPlay; saveState(state); sync(); return; }
        if (button.matches('[data-play-all]')) return playFactor(2, 'all');
        if (button.matches('[data-play-factor]')) return playFactor(selectedFactor, 'factor');
        if (button.matches('[data-play-question]')) {
            const multiplier = Number(button.dataset.playQuestion);
            if (mode === 'question' && activeRow === multiplier) return paused ? resumePlayback() : pausePlayback();
            return playQuestion(selectedFactor, multiplier);
        }
    });
    document.querySelectorAll('[data-factor]').forEach((button) => button.addEventListener('click', () => {
        stopPlayback(); selectedFactor = Number(button.dataset.factor); sync();
        if (autoPlay) playFactor(selectedFactor, 'factor');
    }));
    document.getElementById('back-home').addEventListener('click', () => { window.location.href = 'index.html'; });
    document.getElementById('settings-modal')?.addEventListener('voice-change', (event) => { voiceGender = event.detail.voiceGender; state.voiceGender = voiceGender; saveState(state); stopPlayback(); });
    sync();
    if (autoPlay) playFactor(selectedFactor, 'factor');
}
