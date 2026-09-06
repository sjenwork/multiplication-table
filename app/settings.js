import { questionList, saveState, STORAGE_KEY } from './state.js?v=20260906-095355';

const SETTINGS_MODAL_MARKUP = `
    <div id="settings-modal" class="ds-modal-backdrop fixed inset-0 z-[60] hidden items-center justify-center bg-slate-900/40 p-4" role="presentation">
        <div class="ds-surface-strong ds-modal-surface w-full max-w-sm rounded-2xl p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <div class="flex items-center justify-between gap-4">
                <h2 id="settings-title" class="text-lg font-bold text-slate-800">設定</h2>
                <button id="close-settings" type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-full text-xl text-slate-500 hover:bg-slate-100" aria-label="關閉設定">×</button>
            </div>
            <p class="mt-2 text-sm leading-6 text-slate-600">管理你的練習資料與成績統計。</p>
            <div class="mt-5 space-y-3">
                <div>
                    <p class="mb-2 text-sm font-semibold text-slate-700">顯示主題</p>
                    <div class="grid grid-cols-2 gap-2" role="group" aria-label="選擇顯示主題">
                        <button type="button" data-theme-choice="light" aria-pressed="false" class="ds-theme-choice ds-secondary rounded-lg border px-4 py-3 text-sm font-semibold transition">☀️ 明亮</button>
                        <button type="button" data-theme-choice="dark" aria-pressed="false" class="ds-theme-choice ds-secondary rounded-lg border px-4 py-3 text-sm font-semibold transition">🌙 深色</button>
                    </div>
                </div>
                <button id="export-records" type="button" class="ds-secondary w-full rounded-lg border px-4 py-3 text-left text-sm font-semibold transition">匯出成績統計紀錄（CSV）</button>
                <button id="clear-storage" type="button" class="ds-danger w-full rounded-lg border px-4 py-3 text-left text-sm font-semibold transition">清除所有練習紀錄</button>
            </div>
        </div>
    </div>`;

export function ensureSettingsModal() {
    if (document.getElementById('settings-modal')) return;
    document.body.insertAdjacentHTML('beforeend', SETTINGS_MODAL_MARKUP);
}

export function applyTheme(state) {
    document.documentElement.dataset.theme = state.theme === 'dark' ? 'dark' : 'light';
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = state.theme === 'dark' ? '#091a30' : '#f4fbff';
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

function updateThemeChoices(state) {
    document.querySelectorAll('[data-theme-choice]').forEach((button) => {
        button.setAttribute('aria-pressed', button.dataset.themeChoice === state.theme ? 'true' : 'false');
    });
}

export function initSettings(state) {
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = () => settingsModal.classList.add('hidden');
    document.getElementById('open-settings').addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
        settingsModal.classList.add('flex');
        document.getElementById('close-settings').focus();
    });
    document.getElementById('close-settings').addEventListener('click', closeSettings);
    document.querySelectorAll('[data-theme-choice]').forEach((button) => {
        button.addEventListener('click', () => {
            state.theme = button.dataset.themeChoice;
            applyTheme(state);
            saveState(state);
            updateThemeChoices(state);
        });
    });
    updateThemeChoices(state);
    document.getElementById('export-records').addEventListener('click', () => { exportRecords(state); closeSettings(); });
    document.getElementById('clear-storage').addEventListener('click', () => {
        if (window.confirm('確定要清除所有練習紀錄與目前進度嗎？此操作無法復原。')) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.href = 'index.html';
        }
    });
    settingsModal.addEventListener('click', (event) => { if (event.target === settingsModal) closeSettings(); });
}
