import { ensureSettingsModal, initSettings } from './settings.js?v=20260906-202858';
import './components/multiplication-table.js?v=20260906-202858';

function updateFactor(table, selectedFactor) {
    table.factor = selectedFactor;
    document.querySelectorAll('[data-factor]').forEach((button) => {
        const selected = Number(button.dataset.factor) === selectedFactor;
        button.setAttribute('aria-pressed', String(selected));
        button.setAttribute('variant', selected ? 'primary' : 'secondary');
    });
}

export function initStudy(state) {
    ensureSettingsModal();
    initSettings(state);
    const table = document.getElementById('study-table');
    const buttons = document.querySelectorAll('[data-factor]');
    let selectedFactor = 2;
    updateFactor(table, selectedFactor);
    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            selectedFactor = Number(button.dataset.factor);
            updateFactor(table, selectedFactor);
        });
    });
    document.getElementById('back-home').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}
