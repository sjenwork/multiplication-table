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
        return record ? `${record.errors || 0}/${record.attempts || 0}` : '';
    }

    function updateSelectionStatus(state) {
        const status = document.getElementById('selection-status');
        const start = document.getElementById('start-quiz');
        if (!status || !start) return;
        status.textContent = state.selected.length ? `已勾選 ${state.selected.length} 題，可開始測驗。` : '請先勾選想練習的題目。';
        start.disabled = state.selected.length === 0;
    }

    function renderHome(state) {
        const grid = document.getElementById('multiplication-grid');
        if (!grid) return;
        grid.innerHTML = '';
        const corner = document.createElement('div');
        corner.className = 'sticky top-0 left-0 z-30 p-2 font-bold text-slate-400 bg-slate-100 rounded-lg flex items-center justify-center';
        corner.textContent = '×';
        grid.appendChild(corner);

        for (let col = 1; col <= 9; col += 1) {
            const heading = document.createElement('div');
            heading.className = 'sticky top-0 z-20 p-2 font-bold text-slate-700 bg-slate-100 rounded-lg flex items-center justify-center text-sm md:text-base';
            heading.textContent = col;
            grid.appendChild(heading);
        }

        for (let row = 1; row <= 9; row += 1) {
            const rowHeading = document.createElement('div');
            rowHeading.className = 'sticky left-0 z-10 p-2 font-bold text-slate-700 bg-slate-100 rounded-lg flex items-center justify-center text-sm md:text-base';
            rowHeading.textContent = row;
            grid.appendChild(rowHeading);

            for (let col = 1; col <= 9; col += 1) {
                const key = questionKey(row, col);
                const cell = document.createElement('label');
                cell.className = 'p-2 rounded-lg transition flex flex-col items-center justify-center border border-slate-200 bg-white relative text-xs md:text-sm cursor-pointer hover:border-blue-400';
                cell.innerHTML = `<span class="text-slate-400 text-[10px] md:text-xs mb-1">${row}×${col}</span><input type="checkbox" class="h-5 w-5 accent-blue-600 cursor-pointer" data-question="${key}" aria-label="選擇 ${row} 乘 ${col}"><span class="mt-1 min-h-4 text-xs font-semibold text-slate-500">${historyText(state.records[key])}</span>`;
                const checkbox = cell.querySelector('input');
                checkbox.checked = state.selected.includes(key);
                checkbox.addEventListener('change', () => {
                    state.selected = checkbox.checked ? [...state.selected, key] : state.selected.filter((item) => item !== key);
                    saveState(state);
                    updateSelectionStatus(state);
                });
                grid.appendChild(cell);
            }
        }
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
        progress.textContent = `本輪共 ${state.quiz.questions.length} 題，完成後送出`;
        list.innerHTML = state.quiz.questions.map((item, index) => `<article class="border rounded-xl p-4 shadow-sm ${item.resolved ? (item.hadError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200') : 'bg-white border-slate-200'}"><div class="flex items-center justify-between gap-4"><span class="text-xl font-bold text-slate-800">${index + 1}. ${item.row} × ${item.col} = ?</span><span class="text-sm font-semibold ${item.resolved && item.hadError ? 'text-red-600' : 'text-slate-500'}">${item.resolved ? (item.hadError ? `✕ 正確答案：${item.answer}` : '✓ 答對') : `錯誤 ${item.wrongAttempts} / 3`}</span></div><label class="block text-sm font-medium text-slate-600 mt-3" for="answer-${item.key}">請輸入答案</label><input id="answer-${item.key}" data-question="${item.key}" type="number" inputmode="numeric" value="${item.input || ''}" ${item.resolved ? 'disabled' : ''} class="mt-2 w-full text-center text-xl py-3 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100" autocomplete="off"></article>`).join('');
        list.querySelectorAll('input[data-question]').forEach((input) => {
            input.addEventListener('input', () => {
                const item = state.quiz.questions.find((question) => question.key === input.dataset.question);
                item.input = input.value;
                saveState(state);
            });
        });
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
        if (unanswered > 0) message(`還有 ${unanswered} 題尚未填寫，請完成後再送出。`, true);
        else message(`有 ${remaining} 題需要再次輸入，錯誤的答案已清空。`, true);
        renderQuiz(state);
    }

    function initHome(state) {
        if (state.quiz && state.quiz.questions && state.quiz.questions.length) {
            window.location.href = 'quiz.html';
            return;
        }
        renderHome(state);
        document.getElementById('start-quiz').addEventListener('click', () => startQuiz(state));
        document.getElementById('clear-selection').addEventListener('click', () => { state.selected = []; saveState(state); renderHome(state); });
    }

    function initQuiz(state) {
        if (!state.quiz || !state.quiz.questions.length) { window.location.href = 'index.html'; return; }
        renderQuiz(state);
        document.getElementById('submit-answer').addEventListener('click', () => submitAnswer(state));
        document.getElementById('back-home').addEventListener('click', () => { state.quiz = null; saveState(state); window.location.href = 'index.html'; });
        document.addEventListener('keydown', (event) => { if (event.key === 'Enter') submitAnswer(state); });
    }

    document.addEventListener('DOMContentLoaded', () => {
        const state = loadState();
        if (document.getElementById('multiplication-grid')) initHome(state);
        if (document.getElementById('question-list')) initQuiz(state);
    });
}());
