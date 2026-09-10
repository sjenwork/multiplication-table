import { ensureSettingsModal, initSettings } from './settings.js?v=20260910-115724';
import { playAudioClip } from './audio.js?v=20260910-115724';
import './components/multiplication-table.js?v=20260910-115724';

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
    let audio = null;
    let playbackToken = 0;

    const stopPlayback = () => {
        playbackToken += 1;
        if (audio) {
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
        }
        table.activeRow = null;
        table.isPlaying = false;
        updateFactor(table, selectedFactor);
    };

    const playQuestion = async (factor, multiplier, token) => {
        table.activeRow = multiplier;
        await playAudioClip(audio, voiceGender, factor, multiplier);
        return token === playbackToken;
    };

    const playFactor = async (factor, continueAll = false) => {
        stopPlayback();
        const token = playbackToken;
        table.isPlaying = true;
        selectedFactor = factor;
        updateFactor(table, factor, true);
        for (let multiplier = 1; multiplier <= 9; multiplier += 1) {
            if (!await playQuestion(factor, multiplier, token)) return;
        }
        table.activeRow = null;
        if (continueAll && token === playbackToken && factor < 9) {
            await playFactor(factor + 1, true);
            return;
        }
        if (token === playbackToken) {
            table.isPlaying = false;
            updateFactor(table, factor);
        }
    };

    const playSingleQuestion = async (factor, multiplier) => {
        stopPlayback();
        const token = playbackToken;
        table.isPlaying = true;
        selectedFactor = factor;
        updateFactor(table, factor, true);
        await playQuestion(factor, multiplier, token);
        if (token === playbackToken) {
            table.activeRow = null;
            table.isPlaying = false;
            updateFactor(table, factor);
        }
    };

    audio = new Audio();
    updateFactor(table, selectedFactor);
    table.gender = voiceGender;
    settingsModal.addEventListener('voice-change', (event) => {
        voiceGender = event.detail.voiceGender;
        table.gender = voiceGender;
        stopPlayback();
    });
    table.addEventListener('play-question', (event) => playSingleQuestion(event.detail.factor, event.detail.multiplier).then(() => {}));
    table.addEventListener('play-factor', (event) => playFactor(event.detail.factor, false).then(() => {}));
    table.addEventListener('play-all', () => playFactor(2, true).then(() => {}));
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
