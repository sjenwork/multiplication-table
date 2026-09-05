(function () {
    'use strict';

    const STORAGE_KEY = 'multiplication-practice-state';

    function newState() {
        return { selected: [], records: {}, quiz: null };
    }

    function loadState() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return saved && typeof saved === 'object' ? { ...newState(), ...saved } : newState();
        } catch (error) {
            return newState();
        }
    }

    function saveState(state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function questionKey(row, col) {
        return `${row}x${col}`;
    }

    function questionList() {
        const questions = [];
        for (let row = 1; row <= 9; row += 1) {
            for (let col = 1; col <= 9; col += 1) {
                questions.push({ row, col, answer: row * col, key: questionKey(row, col) });
            }
        }
        return questions;
    }

    function shuffled(items) {
        return [...items].sort(() => Math.random() - 0.5);
    }

    function historyText(record) {
        return `${record?.errors || 0}/${record?.attempts || 0}`;
    }

    function updateSelectionStatus(state) {
        const status = document.getElementById('selection-status');
        const start = document.getElementById('start-quiz');
        if (!status || !start) return;
        status.textContent = state.selected.length ? `已選擇 ${state.selected.length} 題，準備好就開始挑戰！` : '尚未選擇題目，請先點擊表格中的格子。';
        start.disabled = state.selected.length === 0;
    }

    function updateSelectionControls(state, grid) {
        const selected = new Set(state.selected);
        const allKeys = questionList().map((question) => question.key);
        const allSelected = allKeys.every((key) => selected.has(key));
        const allToggle = grid.querySelector('[data-select-all="all"]');
        allToggle.checked = allSelected;
        allToggle.indeterminate = selected.size > 0 && !allSelected;

        grid.querySelectorAll('[data-select-all="row"], [data-select-all="column"]').forEach((toggle) => {
            const keys = toggle.dataset.selectAll === 'row'
                ? allKeys.filter((key) => key.startsWith(`${toggle.dataset.row}x`))
                : allKeys.filter((key) => key.endsWith(`x${toggle.dataset.column}`));
            const count = keys.filter((key) => selected.has(key)).length;
            toggle.checked = count === keys.length;
            toggle.indeterminate = count > 0 && count < keys.length;
        });
    }

    function changeSelection(state, keys, checked) {
        const selected = new Set(state.selected);
        keys.forEach((key) => (checked ? selected.add(key) : selected.delete(key)));
        state.selected = [...selected];
        saveState(state);
    }

    function renderHome(state) {
        const grid = document.getElementById('multiplication-grid');
        if (!grid) return;
        grid.innerHTML = '<thead><tr></tr></thead><tbody></tbody>';
        const headerRow = grid.querySelector('thead tr');
        const selectedKeys = new Set(state.selected);
        const headerTone = (keys) => {
            const count = keys.filter((key) => selectedKeys.has(key)).length;
            return count > 0 ? 'bg-amber-50 border-amber-300' : 'bg-slate-100 border-transparent';
        };
        const corner = document.createElement('th');
        corner.className = `sticky top-0 left-0 z-30 p-2 font-bold text-slate-600 border ${headerTone(questionList().map((question) => question.key))} rounded-lg`;
        corner.scope = 'col';
        corner.innerHTML = '<label class="flex flex-col items-center justify-center gap-1 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 rounded"><span>×</span><input type="checkbox" class="sr-only" data-select-all="all" aria-label="全選所有題目"></label>';
        corner.querySelector('input').addEventListener('change', (event) => {
            changeSelection(state, questionList().map((question) => question.key), event.target.checked);
            renderHome(state);
        });
        headerRow.appendChild(corner);

        for (let col = 1; col <= 9; col += 1) {
            const heading = document.createElement('th');
            const columnKeys = questionList().filter((question) => question.col === col).map((question) => question.key);
            heading.className = `sticky top-0 z-20 p-2 font-bold text-slate-700 border ${headerTone(columnKeys)} rounded-lg text-sm md:text-base`;
            heading.scope = 'col';
            heading.innerHTML = `<label class="flex flex-col items-center justify-center gap-1 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 rounded"><span>${col}</span><input type="checkbox" class="sr-only" data-select-all="column" data-column="${col}" aria-label="選擇第 ${col} 欄"></label>`;
            heading.querySelector('input').addEventListener('change', (event) => {
                changeSelection(state, questionList().filter((question) => question.col === col).map((question) => question.key), event.target.checked);
                renderHome(state);
            });
            headerRow.appendChild(heading);
        }
        const body = grid.querySelector('tbody');

        for (let row = 1; row <= 9; row += 1) {
            const rowElement = document.createElement('tr');
            const rowHeading = document.createElement('th');
            const rowKeys = questionList().filter((question) => question.row === row).map((question) => question.key);
            rowHeading.className = `sticky left-0 z-10 p-2 font-bold text-slate-700 border ${headerTone(rowKeys)} rounded-lg text-sm md:text-base`;
            rowHeading.scope = 'row';
            rowHeading.innerHTML = `<label class="flex flex-col items-center justify-center gap-1 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 rounded"><span>${row}</span><input type="checkbox" class="sr-only" data-select-all="row" data-row="${row}" aria-label="選擇第 ${row} 列"></label>`;
            rowHeading.querySelector('input').addEventListener('change', (event) => {
                changeSelection(state, questionList().filter((question) => question.row === row).map((question) => question.key), event.target.checked);
                renderHome(state);
            });
            rowElement.appendChild(rowHeading);

            for (let col = 1; col <= 9; col += 1) {
                const key = questionKey(row, col);
                const cell = document.createElement('td');
                const selected = selectedKeys.has(key);
                const cellTone = selected ? 'bg-emerald-100 border-emerald-400' : 'bg-white border-slate-200';
                cell.className = `p-2 rounded-lg transition border ${cellTone} relative text-xs md:text-sm`;
                cell.innerHTML = `<label class="flex flex-col items-center justify-center cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 rounded"><input type="checkbox" class="sr-only" data-question="${key}" aria-label="選擇 ${row} 乘 ${col}"><span class="mt-1 min-h-4 text-xs font-semibold text-slate-500">${historyText(state.records[key])}</span></label>`;
                const checkbox = cell.querySelector('input');
                checkbox.checked = state.selected.includes(key);
                checkbox.addEventListener('change', () => {
                    state.selected = checkbox.checked ? [...state.selected, key] : state.selected.filter((item) => item !== key);
                    saveState(state);
                    renderHome(state);
                });
                rowElement.appendChild(cell);
            }
            body.appendChild(rowElement);
        }
        updateSelectionControls(state, grid);
        updateSelectionStatus(state);
    }

    function startQuiz(state) {
        const selected = questionList().filter((question) => state.selected.includes(question.key));
        state.quiz = {
            questions: shuffled(selected).slice(0, 10).map((question) => ({ ...question, input: '', wrongAttempts: 0, resolved: false, hadError: false })),
        };
        saveState(state);
        window.location.href = 'quiz.html';
    }

    function message(text, error) {
        const box = document.getElementById('quiz-message');
        if (!box) return;
        box.className = `mt-6 p-4 rounded-xl text-center font-medium ${error ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`;
        box.textContent = text;
    }

    function renderQuiz(state) {
        const list = document.getElementById('question-list');
        const progress = document.getElementById('progress');
        if (!list || !progress || !state.quiz) return;
        progress.textContent = `本次挑戰 ${state.quiz.questions.length} 題 · 完成後即可檢查答案`;
        list.innerHTML = state.quiz.questions.map((item, index) => {
            const status = item.resolved ? (item.hadError ? `✕ ${item.answer}` : '✓') : (item.wrongAttempts ? `✕ ${item.wrongAttempts}/3` : '');
            return `<article class="border rounded-lg p-2 shadow-sm ${item.resolved ? (item.hadError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200') : 'bg-white border-slate-200'}"><div class="relative flex items-center justify-center gap-2 whitespace-nowrap leading-tight"><span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">${index + 1}</span><label class="flex items-center justify-center gap-1 text-base md:text-lg font-bold text-slate-800 whitespace-nowrap" for="answer-${item.key}">${item.row} × ${item.col} =<input id="answer-${item.key}" data-question="${item.key}" type="number" inputmode="none" readonly value="${item.input || ''}" ${item.resolved ? 'disabled' : ''} aria-label="第 ${index + 1} 題答案" class="w-12 md:w-14 shrink-0 text-center text-base md:text-lg py-1 bg-white border border-slate-300 rounded-md font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100" autocomplete="off"></label><span class="absolute right-0 shrink-0 text-xs font-semibold ${item.resolved && item.hadError ? 'text-red-600' : 'text-slate-500'}">${status}</span></div></article>`;
        }).join('');
        list.querySelectorAll('input[data-question]').forEach((input) => {
            input.addEventListener('click', () => {
                state.quiz.activeKey = input.dataset.question;
                saveState(state);
            });
        });
    }

    function updateKeypadAnswer(state, value) {
        const active = state.quiz.questions.find((question) => question.key === state.quiz.activeKey && !question.resolved)
            || state.quiz.questions.find((question) => !question.resolved);
        if (!active) return;
        state.quiz.activeKey = active.key;
        if (value === 'backspace') active.input = active.input.slice(0, -1);
        else if (value === 'clear') active.input = '';
        else active.input += value;
        const input = document.getElementById(`answer-${active.key}`);
        if (input) input.value = active.input;
        saveState(state);
    }

    function finishQuiz(state) {
        state.quiz.questions.forEach((question) => {
            const record = state.records[question.key] || { errors: 0, attempts: 0 };
            record.attempts += 1;
            if (question.hadError) record.errors += 1;
            state.records[question.key] = record;
        });
        state.quiz = null;
        saveState(state);
        window.location.href = 'index.html';
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

    function initSettings(state) {
        const settingsModal = document.getElementById('settings-modal');
        const closeSettings = () => settingsModal.classList.add('hidden');
        document.getElementById('open-settings').addEventListener('click', () => {
            settingsModal.classList.remove('hidden');
            settingsModal.classList.add('flex');
            document.getElementById('close-settings').focus();
        });
        document.getElementById('close-settings').addEventListener('click', closeSettings);
        document.getElementById('export-records').addEventListener('click', () => { exportRecords(state); closeSettings(); });
        document.getElementById('clear-storage').addEventListener('click', () => {
            if (window.confirm('確定要清除所有練習紀錄與目前進度嗎？此操作無法復原。')) {
                localStorage.removeItem(STORAGE_KEY);
                window.location.href = 'index.html';
            }
        });
        settingsModal.addEventListener('click', (event) => { if (event.target === settingsModal) closeSettings(); });
    }

    function submitAnswer(state) {
        if (!state.quiz) return;
        let unanswered = 0;
        state.quiz.questions.forEach((question) => {
            if (question.resolved) return;
            const input = document.getElementById(`answer-${question.key}`);
            const value = Number.parseInt(input.value, 10);
            if (Number.isNaN(value)) { unanswered += 1; return; }
            if (value === question.answer) {
                question.resolved = true;
                return;
            }
            question.hadError = true;
            question.wrongAttempts += 1;
            question.input = '';
            input.value = '';
            if (question.wrongAttempts >= 3) question.resolved = true;
        });
        saveState(state);
        const remaining = state.quiz.questions.filter((question) => !question.resolved).length;
        if (remaining === 0) { message('本輪測驗完成，正在保存紀錄。', false); window.setTimeout(() => finishQuiz(state), 700); return; }
        if (unanswered > 0) message(`還有 ${unanswered} 題尚未填寫，完成後再檢查結果。`, true);
        else message(`還有 ${remaining} 題需要再試一次，錯誤答案已清空。`, true);
        renderQuiz(state);
    }

    function initHome(state) {
        if (state.quiz && state.quiz.questions && state.quiz.questions.length) {
            window.location.href = 'quiz.html';
            return;
        }
        renderHome(state);
        initSettings(state);
        document.getElementById('start-quiz').addEventListener('click', () => startQuiz(state));
        document.getElementById('clear-selection').addEventListener('click', () => { state.selected = []; saveState(state); renderHome(state); });
    }

    function initQuiz(state) {
        if (!state.quiz || !state.quiz.questions.length) { window.location.href = 'index.html'; return; }
        renderQuiz(state);
        document.getElementById('submit-answer').addEventListener('click', () => submitAnswer(state));
        document.querySelectorAll('[data-pad-value]').forEach((button) => {
            button.addEventListener('click', () => updateKeypadAnswer(state, button.dataset.padValue));
        });
        const modal = document.getElementById('leave-modal');
        const closeModal = () => modal.classList.add('hidden');
        document.getElementById('back-home').addEventListener('click', () => {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.getElementById('cancel-leave').focus();
        });
        document.getElementById('cancel-leave').addEventListener('click', closeModal);
        document.getElementById('confirm-leave').addEventListener('click', () => { state.quiz = null; saveState(state); window.location.href = 'index.html'; });
        modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
        document.addEventListener('keydown', (event) => { if (event.key === 'Enter') submitAnswer(state); });
    }

    document.addEventListener('DOMContentLoaded', () => {
        const state = loadState();
        if (document.getElementById('multiplication-grid')) initHome(state);
        if (document.getElementById('question-list')) initQuiz(state);
    });
}());
