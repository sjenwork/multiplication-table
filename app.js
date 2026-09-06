import { historyText, loadState, questionKey, questionList, saveState, shuffled } from './app/state.js?v=20260906-091437';
import { applyKeypadPosition, hideKeypad, setupKeypadClose, setupKeypadDrag, showKeypad, updateQuizScrollReserve } from './app/keypad.js?v=20260906-091437';
import { applyTheme, ensureSettingsModal, initSettings } from './app/settings.js?v=20260906-091437';

(function () {
    'use strict';

    function updateSelectionStatus(state) {
        const status = document.getElementById('selection-status');
        const start = document.getElementById('start-quiz');
        const startWrong = document.getElementById('start-wrong-quiz');
        if (!status || !start) return;
        status.textContent = state.selected.length ? `已選擇 ${state.selected.length} 題，準備好就開始挑戰！` : '尚未選擇題目，請先點擊表格中的格子。';
        start.disabled = state.selected.length === 0;
        if (startWrong) startWrong.disabled = !questionList().some((question) => (state.records[question.key]?.errors || 0) > 0);
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

    function selectionFeedback(grid) {
        if (typeof navigator.vibrate === 'function') navigator.vibrate(12);
        else {
            grid.classList.add('selection-haptic-fallback');
            window.setTimeout(() => grid.classList.remove('selection-haptic-fallback'), 180);
        }
    }

    function setupSelectionGesture(state, grid) {
        if (grid.dataset.gestureReady === 'true') return;
        const scrollContainer = grid.closest('[data-selection-scroll]');
        if (!scrollContainer) return;
        grid.dataset.gestureReady = 'true';
        const LONG_PRESS_MS = 400;
        const MOVE_TOLERANCE = 10;
        const EDGE_ZONE = 48;
        const MAX_SCROLL_SPEED = 14;
        let gesture = null;
        let scrollFrame = null;
        let suppressClickUntil = 0;

        const cellAtPoint = (clientX, clientY) => {
            const element = document.elementFromPoint(clientX, clientY);
            return element?.closest('td[data-question]');
        };
        const updateCell = (cell) => {
            if (!gesture || !cell || !grid.contains(cell)) return;
            const key = cell.dataset.question;
            if (!gesture.touched.has(key)) {
                gesture.touched.add(key);
                const selected = gesture.selecting;
                cell.classList.toggle('is-selected', selected);
                const checkbox = cell.querySelector('input[data-question]');
                if (checkbox) checkbox.checked = selected;
                if (selected) gesture.selected.add(key);
                else gesture.selected.delete(key);
            }
        };
        const stopAutoScroll = () => {
            if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
            scrollFrame = null;
        };
        const autoScroll = () => {
            if (!gesture?.active) return;
            const rect = scrollContainer.getBoundingClientRect();
            const distanceFromTop = gesture.clientY - rect.top;
            const distanceFromBottom = rect.bottom - gesture.clientY;
            let delta = 0;
            if (distanceFromTop < EDGE_ZONE && scrollContainer.scrollTop > 0) {
                delta = -Math.ceil((EDGE_ZONE - distanceFromTop) / EDGE_ZONE * MAX_SCROLL_SPEED);
            } else if (distanceFromBottom < EDGE_ZONE && scrollContainer.scrollTop < scrollContainer.scrollHeight - scrollContainer.clientHeight) {
                delta = Math.ceil((EDGE_ZONE - distanceFromBottom) / EDGE_ZONE * MAX_SCROLL_SPEED);
            }
            if (delta) {
                scrollContainer.scrollTop += delta;
                updateCell(cellAtPoint(gesture.clientX, gesture.clientY));
            }
            scrollFrame = requestAnimationFrame(autoScroll);
        };
        const endGesture = (event, canceled = false) => {
            if (!gesture) return;
            window.clearTimeout(gesture.timer);
            stopAutoScroll();
            grid.classList.remove('selection-dragging');
            scrollContainer.style.overflow = gesture.previousOverflow;
            if (gesture.pointerId !== null && grid.hasPointerCapture(gesture.pointerId)) grid.releasePointerCapture(gesture.pointerId);
            if (gesture.active && !canceled) {
                state.selected = [...gesture.selected];
                saveState(state);
                suppressClickUntil = Date.now() + 450;
                renderHome(state);
            }
            gesture = null;
        };
        const activateGesture = () => {
            if (!gesture || gesture.moved || !gesture.startCell) return;
            gesture.active = true;
            gesture.selecting = !gesture.selected.has(gesture.startCell.dataset.question);
            grid.classList.add('selection-dragging');
            scrollContainer.style.overflow = 'hidden';
            selectionFeedback(grid);
            updateCell(gesture.startCell);
            scrollFrame = requestAnimationFrame(autoScroll);
        };
        const moveGesture = (event) => {
            if (!gesture) return;
            gesture.clientX = event.clientX;
            gesture.clientY = event.clientY;
            if (!gesture.active) {
                if (Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) > MOVE_TOLERANCE) {
                    window.clearTimeout(gesture.timer);
                    if (gesture.pointerType === 'mouse') {
                        gesture.moved = false;
                        activateGesture();
                    } else {
                        gesture.moved = true;
                    }
                }
                return;
            }
            event.preventDefault();
            updateCell(cellAtPoint(event.clientX, event.clientY));
        };

        grid.addEventListener('pointerdown', (event) => {
            const cell = event.target.closest('td[data-question]');
            if (!cell || event.button > 0) return;
            gesture = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                clientX: event.clientX,
                clientY: event.clientY,
                startCell: cell,
                pointerType: event.pointerType,
                selected: new Set(state.selected),
                touched: new Set(),
                active: false,
                moved: false,
                selecting: false,
                previousOverflow: scrollContainer.style.overflow,
                timer: window.setTimeout(activateGesture, LONG_PRESS_MS),
            };
            try { grid.setPointerCapture(event.pointerId); } catch (error) { /* Older Safari may not support capture here. */ }
        });
        grid.addEventListener('pointermove', moveGesture, { passive: false });
        grid.addEventListener('pointerup', (event) => endGesture(event));
        grid.addEventListener('pointercancel', (event) => endGesture(event, true));
        grid.addEventListener('click', (event) => {
            if (Date.now() < suppressClickUntil) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            const cell = event.target.closest('td[data-question]');
            if (!cell || event.target.closest('input[data-question]')) return;
            event.preventDefault();
            const key = cell.dataset.question;
            state.selected = state.selected.includes(key)
                ? state.selected.filter((item) => item !== key)
                : [...state.selected, key];
            saveState(state);
            renderHome(state);
        }, true);
    }

    function renderHome(state) {
        const grid = document.getElementById('multiplication-grid');
        if (!grid) return;
        grid.innerHTML = '<thead><tr></tr></thead><tbody></tbody>';
        const headerRow = grid.querySelector('thead tr');
        const selectedKeys = new Set(state.selected);
        const headerTone = (keys) => {
            const count = keys.filter((key) => selectedKeys.has(key)).length;
            return count > 0 ? 'ds-table-header is-selected' : 'ds-table-header';
        };
        const corner = document.createElement('th');
        corner.className = `sticky top-0 left-0 z-30 p-2 font-bold text-slate-600 border ${headerTone(questionList().map((question) => question.key))} rounded-lg`;
        corner.scope = 'col';
        corner.innerHTML = '<label class="flex flex-col items-center justify-center gap-1 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 rounded"><span class="text-[0.65rem] leading-none"><span class="ds-factor-one">被</span><span aria-hidden="true">＼</span><span class="ds-factor-two">乘</span></span><input type="checkbox" class="sr-only" data-select-all="all" aria-label="全選所有題目"></label>';
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
            heading.innerHTML = `<label class="flex flex-col items-center justify-center gap-1 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 rounded"><span class="ds-factor-two">${col}</span><input type="checkbox" class="sr-only" data-select-all="column" data-column="${col}" aria-label="選擇第 ${col} 欄"></label>`;
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
            rowHeading.innerHTML = `<label class="flex flex-col items-center justify-center gap-1 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 rounded"><span class="ds-factor-one">${row}</span><input type="checkbox" class="sr-only" data-select-all="row" data-row="${row}" aria-label="選擇第 ${row} 列"></label>`;
            rowHeading.querySelector('input').addEventListener('change', (event) => {
                changeSelection(state, questionList().filter((question) => question.row === row).map((question) => question.key), event.target.checked);
                renderHome(state);
            });
            rowElement.appendChild(rowHeading);

            for (let col = 1; col <= 9; col += 1) {
                const key = questionKey(row, col);
                const cell = document.createElement('td');
                const selected = selectedKeys.has(key);
                cell.dataset.question = key;
                const cellTone = selected ? 'ds-table-cell is-selected' : 'ds-table-cell';
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
        setupSelectionGesture(state, grid);
    }

    function startQuiz(state) {
        const selected = questionList().filter((question) => state.selected.includes(question.key));
        startQuizWithQuestions(state, selected);
    }

    function startWrongQuiz(state) {
        const wrongQuestions = questionList()
            .filter((question) => (state.records[question.key]?.errors || 0) > 0)
            .sort((a, b) => {
                const errorDifference = (state.records[b.key]?.errors || 0) - (state.records[a.key]?.errors || 0);
                return errorDifference || Math.random() - 0.5;
            });
        startQuizWithQuestions(state, wrongQuestions.slice(0, 10), false);
    }

    function startRandomQuiz(state) {
        startQuizWithQuestions(state, questionList());
    }

    function startQuizWithQuestions(state, selected, alreadyLimited = false) {
        state.quiz = {
            questions: shuffled(alreadyLimited ? selected : selected.slice(0, 10)).map((question) => ({ ...question, input: '', wrongAttempts: 0, resolved: false, hadError: false })),
            activeKey: null,
            completed: false,
        };
        state.quiz.activeKey = state.quiz.questions[0]?.key || null;
        saveState(state);
        window.location.href = 'quiz.html';
    }

    function message(text, error) {
        const box = document.getElementById('quiz-message');
        if (!box) return;
        box.className = `mt-6 p-4 rounded-xl text-center font-medium ${error ? 'ds-danger' : 'ds-success'}`;
        box.textContent = text;
    }

    function updateSubmitButton(state) {
        const button = document.getElementById('submit-answer');
        if (!button || !state.quiz) return;
        button.disabled = state.quiz.completed || state.quiz.questions.some((question) => !question.resolved && !question.input);
    }

    function renderQuiz(state) {
        const list = document.getElementById('question-list');
        if (!list || !state.quiz) return;
        list.innerHTML = state.quiz.questions.map((item, index) => {
            const status = item.resolved ? (item.hadError ? `✕ ${item.answer}` : '✓') : (item.wrongAttempts ? `✕ ${item.wrongAttempts}/3` : '');
            const cardTone = item.resolved
                ? (item.hadError ? 'quiz-card-error' : 'quiz-card-success')
                : 'quiz-card-idle';
            return `<article class="quiz-question-card border rounded-lg p-2 shadow-sm ${cardTone}"><div class="relative flex items-center justify-center gap-2 whitespace-nowrap leading-tight"><span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">${index + 1}</span><label class="flex items-center justify-center gap-1 text-base md:text-lg font-bold text-slate-800 whitespace-nowrap" for="answer-${item.key}"><span class="quiz-factor-one">${item.row}</span><span aria-hidden="true">×</span><span class="quiz-factor-two">${item.col}</span><span aria-hidden="true">=</span><input id="answer-${item.key}" data-question="${item.key}" type="number" inputmode="none" readonly value="${item.input || ''}" ${item.resolved ? 'disabled' : ''} aria-label="第 ${index + 1} 題答案" class="w-12 md:w-14 shrink-0 text-center text-base md:text-lg py-1 bg-white border border-slate-300 rounded-md font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${item.key === state.quiz.activeKey ? 'ring-2 ring-blue-300' : ''} disabled:bg-slate-100" autocomplete="off"></label><span class="absolute right-0 shrink-0 text-xs font-semibold ${item.resolved && item.hadError ? 'ds-danger-text' : 'ds-text-muted'}">${status}</span></div></article>`;
        }).join('');
        list.querySelectorAll('input[data-question]').forEach((input) => {
            input.addEventListener('click', () => {
                focusQuizQuestion(state, input.dataset.question);
            });
        });
        updateSubmitButton(state);
        const allCorrect = state.quiz.questions.length > 0 && state.quiz.questions.every((question) => !question.hadError);
        const completionActions = document.getElementById('completion-actions');
        if (completionActions) {
            const visible = state.quiz.completed && allCorrect;
            completionActions.classList.toggle('hidden', !visible);
            completionActions.classList.toggle('flex', visible);
            completionActions.classList.toggle('flex-1', visible);
        }
        const submitButton = document.getElementById('submit-answer');
        if (submitButton) submitButton.classList.toggle('hidden', state.quiz.completed && allCorrect);
    }

    function scrollActiveQuestionIntoView(questionKey) {
        const input = document.querySelector(`input[data-question="${questionKey}"]`);
        const question = input?.closest('article');
        const list = document.getElementById('question-list');
        if (!question || !list) return;
        window.requestAnimationFrame(() => {
            const questionRect = question.getBoundingClientRect();
            const listRect = list.getBoundingClientRect();
            const header = document.querySelector('.quiz-header');
            const actionBar = document.querySelector('.safe-action-bar');
            const keypad = document.getElementById('number-pad');
            const bottomCandidates = [listRect.bottom];
            if (actionBar) bottomCandidates.push(actionBar.getBoundingClientRect().top);
            if (keypad && !keypad.classList.contains('hidden')) {
                const keypadRect = keypad.getBoundingClientRect();
                const overlapsQuestion = questionRect.bottom > keypadRect.top && questionRect.top < keypadRect.bottom;
                const isFixedKeypad = !keypad.classList.contains('floating-keypad');
                if (isFixedKeypad || overlapsQuestion) bottomCandidates.push(keypadRect.top);
            }
            const visibleTop = Math.max(listRect.top + 12, header ? header.getBoundingClientRect().bottom + 12 : listRect.top + 12);
            const visibleBottom = Math.min(...bottomCandidates) - 12;
            let scrollDistance = 0;
            if (questionRect.bottom > visibleBottom) scrollDistance = questionRect.bottom - visibleBottom;
            else if (questionRect.top < visibleTop) scrollDistance = questionRect.top - visibleTop;
            if (scrollDistance) list.scrollBy({ top: scrollDistance, behavior: 'smooth' });
        });
    }

    function focusQuizQuestion(state, questionKey, openKeypad = true) {
        if (!state.quiz) return;
        state.quiz.activeKey = questionKey;
        document.querySelectorAll('input[data-question]').forEach((answerInput) => {
            const active = answerInput.dataset.question === questionKey;
            answerInput.classList.toggle('ring-2', active);
            answerInput.classList.toggle('ring-blue-300', active);
        });
        saveState(state);
        if (openKeypad) showKeypad();
        else hideKeypad();
        scrollActiveQuestionIntoView(questionKey);
    }

    function showCompletionOverlay(correctCount, total) {
        const overlay = document.getElementById('completion-overlay');
        if (!overlay) return;
        const title = overlay.querySelector('[data-completion-title]');
        const detail = overlay.querySelector('[data-completion-detail]');
        const emoji = overlay.querySelector('[data-completion-emoji]');
        const ratio = total ? correctCount / total : 0;
        const result = ratio === 1
            ? { title: '你好棒！', detail: '全部答對，你做到了！', emoji: '🎉', tone: 'score-high' }
            : ratio >= 0.8
                ? { title: '太棒了！', detail: `答對 ${correctCount} 題，再把錯題練熟就更厲害！`, emoji: '🌟', tone: 'score-good' }
                : ratio >= 0.5
                    ? { title: '做得很好！', detail: `答對 ${correctCount} 題，錯題再挑戰一次！`, emoji: '💪', tone: 'score-steady' }
                    : { title: '繼續加油！', detail: `答對 ${correctCount} 題，一題一題來，你可以的！`, emoji: '🌱', tone: 'score-keep-going' };
        if (title) title.textContent = result.title;
        if (detail) detail.textContent = result.detail;
        if (emoji) emoji.textContent = result.emoji;
        overlay.querySelector('.completion-card')?.classList.remove('score-high', 'score-good', 'score-steady', 'score-keep-going');
        overlay.querySelector('.completion-card')?.classList.add(result.tone);
        overlay.classList.remove('hidden');
    }

    function setupCompletionOverlay() {
        const overlay = document.getElementById('completion-overlay');
        const card = overlay?.querySelector('.completion-card');
        const closeButton = document.getElementById('close-completion');
        if (!overlay || !card || !closeButton || card.dataset.dismissReady === 'true') return;
        card.dataset.dismissReady = 'true';
        const close = () => overlay.classList.add('hidden');
        closeButton.addEventListener('click', close);
        let startX = null;
        let startY = null;
        card.addEventListener('pointerdown', (event) => {
            startX = event.clientX;
            startY = event.clientY;
        });
        card.addEventListener('pointerup', (event) => {
            if (startX === null || startY === null) return;
            const distanceX = event.clientX - startX;
            const distanceY = event.clientY - startY;
            if (Math.abs(distanceX) >= 56 && Math.abs(distanceX) > Math.abs(distanceY)) close();
            startX = null;
            startY = null;
        });
        card.addEventListener('pointercancel', () => {
            startX = null;
            startY = null;
        });
    }

    function hideCompletionOverlay() {
        document.getElementById('completion-overlay')?.classList.add('hidden');
    }

    function updateKeypadAnswer(state, value) {
        if (value === 'next') {
            const unresolved = state.quiz.questions.filter((question) => !question.resolved);
            const activeIndex = unresolved.findIndex((question) => question.key === state.quiz.activeKey);
            const nextQuestion = unresolved[activeIndex + 1] || unresolved[0];
            if (nextQuestion) focusQuizQuestion(state, nextQuestion.key);
            return;
        }
        const active = state.quiz.questions.find((question) => question.key === state.quiz.activeKey && !question.resolved)
            || state.quiz.questions.find((question) => !question.resolved);
        if (!active) return;
        state.quiz.activeKey = active.key;
        if (value === 'backspace') active.input = active.input.slice(0, -1);
        else active.input += value;
        const input = document.getElementById(`answer-${active.key}`);
        if (input) input.value = active.input;
        document.querySelectorAll('input[data-question]').forEach((answerInput) => answerInput.classList.toggle('ring-2', answerInput === input));
        document.querySelectorAll('input[data-question]').forEach((answerInput) => answerInput.classList.toggle('ring-blue-300', answerInput === input));
        saveState(state);
        updateSubmitButton(state);
        showKeypad();
    }

    function finishQuiz(state, correctCount) {
        if (state.quiz.completed) return;
        const allCorrect = state.quiz.questions.every((question) => !question.hadError);
        state.quiz.questions.forEach((question) => {
            const record = state.records[question.key] || { errors: 0, attempts: 0 };
            record.attempts += 1;
            if (question.hadError) record.errors += 1;
            state.records[question.key] = record;
        });
        state.quiz.completed = true;
        saveState(state);
        renderQuiz(state);
        message(allCorrect ? '太棒了！這次全部答對。' : '本輪挑戰完成，紀錄已保存。', false);
        showCompletionOverlay(correctCount, state.quiz.questions.length);
    }

    function returnToHomeAfterQuiz(state) {
        state.quiz = null;
        saveState(state);
        window.location.href = 'index.html';
    }

    function startAnotherQuiz(state) {
        const selected = questionList().filter((question) => state.selected.includes(question.key));
        startQuizWithQuestions(state, selected);
    }

    function restartQuiz(state) {
        if (!state.quiz) return;
        state.quiz.questions = state.quiz.questions.map((question) => ({
            ...question,
            input: '',
            wrongAttempts: 0,
            resolved: false,
            hadError: false,
        }));
        state.quiz.activeKey = state.quiz.questions[0]?.key || null;
        state.quiz.completed = false;
        saveState(state);
        hideCompletionOverlay();
        renderQuiz(state);
        showKeypad();
        scrollActiveQuestionIntoView(state.quiz.activeKey);
    }

    async function forceUpdate() {
        const button = document.getElementById('force-update');
        if (button) { button.disabled = true; button.textContent = '更新中…'; }
        const registrations = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistrations() : [];
        await Promise.all(registrations.map((registration) => {
            if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            return registration.unregister();
        }));
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        }
        const url = new URL(window.location.href);
        url.searchParams.set('_update', Date.now());
        window.location.replace(url.toString());
    }

    function initVersionUpdate() {
        const button = document.getElementById('force-update');
        if (!button) return;
        const showUpdate = () => {
            button.classList.remove('hidden');
            button.textContent = '有新版本，立即更新';
        };
        button.addEventListener('click', forceUpdate);
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                if (registration.waiting) showUpdate();
                registration.update().catch(() => {});
                registration.addEventListener('updatefound', () => {
                    const worker = registration.installing;
                    if (!worker) return;
                    worker.addEventListener('statechange', () => {
                        if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate();
                    });
                });
            }).catch(() => {});
        }
    }

    function submitAnswer(state) {
        if (!state.quiz || state.quiz.completed) return;
        if (state.quiz.questions.some((question) => !question.resolved && !question.input)) {
            message('請先完成所有題目，再檢查答案。', true);
            updateSubmitButton(state);
            return;
        }
        hideKeypad();
        let unanswered = 0;
        let correctCount = state.quiz.questions.filter((question) => question.resolved && !question.hadError).length;
        let firstWrongKey = null;
        state.quiz.questions.forEach((question) => {
            if (question.resolved) return;
            const input = document.getElementById(`answer-${question.key}`);
            const value = Number.parseInt(input.value, 10);
            if (Number.isNaN(value)) { unanswered += 1; return; }
            if (value === question.answer) {
                question.resolved = true;
                correctCount += 1;
                return;
            }
            if (!firstWrongKey) firstWrongKey = question.key;
            question.hadError = true;
            question.wrongAttempts += 1;
            question.input = '';
            input.value = '';
            if (question.wrongAttempts >= 3) question.resolved = true;
        });
        saveState(state);
        const remaining = state.quiz.questions.filter((question) => !question.resolved).length;
        if (remaining === 0) {
            finishQuiz(state, correctCount);
            if (firstWrongKey) focusQuizQuestion(state, firstWrongKey, false);
            return;
        }
        if (unanswered > 0) message(`還有 ${unanswered} 題尚未填寫，完成後再檢查結果。`, true);
        else message(`還有 ${remaining} 題需要再試一次，錯誤答案已清空。`, true);
        renderQuiz(state);
        showCompletionOverlay(correctCount, state.quiz.questions.length);
        if (firstWrongKey) focusQuizQuestion(state, firstWrongKey, false);
    }

    function initHome(state) {
        if (state.quiz && state.quiz.questions && state.quiz.questions.length) {
            window.location.href = 'quiz.html';
            return;
        }
        renderHome(state);
        ensureSettingsModal();
        initSettings(state);
        document.getElementById('start-quiz').addEventListener('click', () => startQuiz(state));
        document.getElementById('start-random-quiz').addEventListener('click', () => startRandomQuiz(state));
        document.getElementById('start-wrong-quiz').addEventListener('click', () => startWrongQuiz(state));
    }

    function initQuiz(state) {
        if (!state.quiz || !state.quiz.questions.length) { window.location.href = 'index.html'; return; }
        ensureSettingsModal();
        initSettings(state);
        renderQuiz(state);
        applyKeypadPosition(state);
        setupKeypadDrag(state);
        setupKeypadClose();
        setupCompletionOverlay();
        updateQuizScrollReserve();
        window.addEventListener('resize', updateQuizScrollReserve);
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
        document.getElementById('confirm-leave').addEventListener('click', () => returnToHomeAfterQuiz(state));
        document.getElementById('return-home-after-quiz').addEventListener('click', () => returnToHomeAfterQuiz(state));
        document.getElementById('another-quiz').addEventListener('click', () => startAnotherQuiz(state));
        document.getElementById('retry-quiz').addEventListener('click', () => restartQuiz(state));
        modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
        document.addEventListener('keydown', (event) => { if (event.key === 'Enter') submitAnswer(state); });
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (new URLSearchParams(window.location.search).has('_update')) window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
        const state = loadState();
        applyTheme(state);
        if (document.getElementById('multiplication-grid')) initHome(state);
        if (document.getElementById('question-list')) initQuiz(state);
        initVersionUpdate();
        if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
    });
}());
