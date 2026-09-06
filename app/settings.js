import { questionList, saveState, STORAGE_KEY } from './state.js?v=20260906-142952';
import './components/settings-modal.js?v=20260906-142952';

export function ensureSettingsModal() {
    if (document.querySelector('app-settings-modal')) return;
    document.body.insertAdjacentHTML('beforeend', '<app-settings-modal id="settings-modal"></app-settings-modal>');
}

export function applyTheme(state) {
    document.documentElement.dataset.theme = state.theme === 'dark' ? 'dark' : 'light';
    const themeColor = document.querySelector('meta[name="theme-color"]');
    const color = window.__APP_THEME_COLORS__?.[state.theme === 'dark' ? 'dark' : 'light'];
    if (themeColor && color) themeColor.content = color;
}

function exportRecords(state) {
    const rows = [['題目', '錯誤次數', '作答次數', '正確次數']];
    questionList().forEach((question) => {
        const record = state.records[question.key] || { errors: 0, attempts: 0 };
        rows.push([`${question.row}×${question.col}`, record.errors || 0, record.attempts || 0, Math.max((record.attempts || 0) - (record.errors || 0), 0)]);
    });
    const csv = `\uFEFF${rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')}`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `multiplication-practice-${new Date().toISOString().slice(0, 19).replaceAll(':', '-')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

export function initSettings(state) {
    const settingsModal = document.querySelector('app-settings-modal');
    settingsModal.theme = state.theme;
    document.getElementById('open-settings').addEventListener('click', () => {
        settingsModal.show();
    });
    settingsModal.addEventListener('theme-change', (event) => {
        state.theme = event.detail.theme;
        applyTheme(state);
        saveState(state);
    });
    settingsModal.addEventListener('export-records', () => { exportRecords(state); settingsModal.hide(); });
    settingsModal.addEventListener('clear-records', () => {
        if (window.confirm('確定要清除所有練習紀錄與目前進度嗎？此操作無法復原。')) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.href = 'index.html';
        }
    });
}
