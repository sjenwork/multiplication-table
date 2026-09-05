(function () {
    'use strict';

    const STORAGE_KEY = 'multiplication-practice-state';

    function newState() {
        return { selected: [], records: {}, quiz: null, keypadPosition: { detached: false, left: null, top: null } };
    }

    function loadState() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!saved || typeof saved !== 'object') return newState();
            const state = { ...newState(), ...saved };
            if (!state.keypadPosition || typeof state.keypadPosition !== 'object') state.keypadPosition = newState().keypadPosition;
            state.keypadPosition = { ...newState().keypadPosition, ...state.keypadPosition };
            return state;
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
                cell.classList.toggle('bg-emerald-100', selected);
                cell.classList.toggle('border-emerald-400', selected);
                cell.classList.toggle('bg-white', !selected);
                cell.classList.toggle('border-slate-200', !selected);
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
                    gesture.moved = true;
                    window.clearTimeout(gesture.timer);
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
            }
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
                cell.dataset.question = key;
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
        box.className = `mt-6 p-4 rounded-xl text-center font-medium ${error ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`;
        box.textContent = text;
    }

    function updateSubmitButton(state) {
        const button = document.getElementById('submit-answer');
        if (!button || !state.quiz) return;
        button.disabled = state.quiz.completed || state.quiz.questions.some((question) => !question.resolved && !question.input);
    }

    function applyKeypadPosition(state) {
        const keypad = document.getElementById('number-pad');
        if (!keypad) return;
        const position = state.keypadPosition;
        const isDetached = position.detached === true;
        keypad.classList.toggle('floating-keypad', isDetached);
        if (isDetached) {
            keypad.style.right = 'auto';
            keypad.style.bottom = 'auto';
            keypad.style.width = 'min(18rem, calc(100vw - 1rem))';
            if (Number.isFinite(position.left) && Number.isFinite(position.top)) {
                keypad.style.left = `${position.left}px`;
                keypad.style.top = `${position.top}px`;
            }
        } else {
            keypad.style.right = '';
            keypad.style.bottom = '';
            keypad.style.width = 'auto';
            keypad.style.left = '';
            keypad.style.top = '';
            keypad.style.transform = 'none';
            keypad.style.opacity = '1';
        }
        updateQuizScrollReserve();
    }

    function updateQuizScrollReserve() {
        const list = document.getElementById('question-list');
        if (!list) return;
        const actionBar = document.querySelector('.safe-action-bar');
        const keypad = document.getElementById('number-pad');
        const bottomCandidates = [window.innerHeight];
        if (actionBar) bottomCandidates.push(actionBar.getBoundingClientRect().top);
        if (keypad && !keypad.classList.contains('hidden') && !keypad.classList.contains('floating-keypad')) {
            const keypadRect = keypad.getBoundingClientRect();
            if (keypadRect.bottom > 0 && keypadRect.top < window.innerHeight) bottomCandidates.push(keypadRect.top);
        }
        const reserve = Math.max(96, window.innerHeight - Math.min(...bottomCandidates) + 24);
        list.style.setProperty('--quiz-scroll-reserve', `${reserve}px`);
    }

    function showKeypad() {
        document.getElementById('number-pad')?.classList.remove('hidden');
    }

    function setupKeypadDrag(state) {
        const keypad = document.getElementById('number-pad');
        const handle = document.getElementById('keypad-handle');
        const dock = document.getElementById('keypad-dock');
        if (!keypad || !handle || !dock) return;
        const DETACH_DISTANCE = 48;
        const SNAP_RADIUS = 24;
        let drag = null;
        const clampPosition = (left, top) => {
            const rect = keypad.getBoundingClientRect();
            return {
                left: Math.min(Math.max(8, left), Math.max(8, window.innerWidth - rect.width - 8)),
                top: Math.min(Math.max(8, top), Math.max(8, window.innerHeight - rect.height - 8)),
            };
        };
        const updateDock = () => {
            const keypadRect = keypad.getBoundingClientRect();
            const actionBar = document.querySelector('.safe-action-bar');
            const dockHeight = Math.max(44, keypadRect.height * 0.5);
            const top = actionBar ? actionBar.getBoundingClientRect().top - dockHeight : window.innerHeight - dockHeight - 8;
            dock.style.width = `${keypadRect.width}px`;
            dock.style.height = `${dockHeight}px`;
            dock.style.left = `${Math.max(8, (window.innerWidth - keypadRect.width) / 2)}px`;
            dock.style.top = `${Math.max(8, top)}px`;
        };
        const setDockState = (visible, hovered = false) => {
            dock.classList.toggle('is-visible', visible);
            dock.classList.toggle('is-hovered', hovered);
            dock.setAttribute('aria-hidden', visible ? 'false' : 'true');
        };
        const rectDistance = (first, second) => {
            const horizontal = Math.max(first.left - second.right, second.left - first.right, 0);
            const vertical = Math.max(first.top - second.bottom, second.top - first.bottom, 0);
            return Math.hypot(horizontal, vertical);
        };
        const pointDistance = (x, y, rect) => Math.hypot(
            Math.max(rect.left - x, 0, x - rect.right),
            Math.max(rect.top - y, 0, y - rect.bottom),
        );
        const setFloatingPosition = (left, top) => {
            const position = clampPosition(left, top);
            keypad.style.left = `${position.left}px`;
            keypad.style.top = `${position.top}px`;
        };
        const beginDrag = (clientX, clientY, pointerId = null) => {
            const rect = keypad.getBoundingClientRect();
            drag = {
                pointerId,
                offsetX: clientX - rect.left,
                offsetY: clientY - rect.top,
                detached: state.keypadPosition.detached,
                overDock: false,
                initialPosition: { ...state.keypadPosition },
                lastX: clientX,
                lastY: clientY,
            };
            if (pointerId !== null) {
                try { handle.setPointerCapture(pointerId); } catch (error) { /* Safari may release the pointer before capture. */ }
            }
            keypad.classList.add('is-dragging');
            if (drag.detached) {
                setDockState(true);
                updateDock();
            }
        };
        const moveDrag = (clientX, clientY) => {
            if (!drag) return;
            drag.lastX = clientX;
            drag.lastY = clientY;
            if (!drag.detached && clientY < window.innerHeight - keypad.getBoundingClientRect().height - DETACH_DISTANCE) {
                drag.detached = true;
                state.keypadPosition.detached = true;
                keypad.classList.add('floating-keypad');
                keypad.style.right = 'auto';
                keypad.style.bottom = 'auto';
                keypad.style.width = 'min(18rem, calc(100vw - 1rem))';
                const detachedRect = keypad.getBoundingClientRect();
                drag.offsetX = detachedRect.width / 2;
                drag.offsetY = detachedRect.height / 2;
                setDockState(true);
                updateDock();
            }
            if (!drag.detached) return;
            keypad.classList.remove('keypad-snap-preview');
            keypad.classList.add('is-dragging');
            setFloatingPosition(clientX - drag.offsetX, clientY - drag.offsetY);
            const dockRect = dock.getBoundingClientRect();
            const keypadRect = keypad.getBoundingClientRect();
            const distance = rectDistance(keypadRect, dockRect);
            const nearDock = distance <= SNAP_RADIUS;
            drag.overDock = nearDock;
            setDockState(true, nearDock);
            if (nearDock) {
                keypad.classList.remove('is-dragging');
                keypad.classList.add('keypad-snap-preview');
            }
        };
        const stopDrag = (clientX, clientY, pointerId = null, canceled = false) => {
            if (!drag) return;
            const releaseX = Number.isFinite(clientX) ? clientX : drag.lastX;
            const releaseY = Number.isFinite(clientY) ? clientY : drag.lastY;
            const dockRect = dock.getBoundingClientRect();
            const releasedNearDock = pointDistance(releaseX, releaseY, dockRect) <= SNAP_RADIUS;
            const shouldSnap = !canceled && drag.detached && drag.overDock && releasedNearDock;
            keypad.classList.remove('is-dragging', 'keypad-snap-preview');
            setDockState(false);
            if (canceled) {
                state.keypadPosition = drag.initialPosition;
                applyKeypadPosition(state);
            } else if (shouldSnap) {
                state.keypadPosition = { detached: false, left: null, top: null };
                applyKeypadPosition(state);
            } else if (drag.detached) {
                const rect = keypad.getBoundingClientRect();
                state.keypadPosition = { detached: true, left: rect.left, top: rect.top };
                applyKeypadPosition(state);
            }
            saveState(state);
            if (pointerId !== null && handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
            drag = null;
        };
        handle.addEventListener('pointerdown', (event) => {
            beginDrag(event.clientX, event.clientY, event.pointerId);
            event.preventDefault();
        });
        window.addEventListener('pointermove', (event) => moveDrag(event.clientX, event.clientY));
        window.addEventListener('pointerup', (event) => stopDrag(event.clientX, event.clientY, event.pointerId));
        window.addEventListener('pointercancel', (event) => stopDrag(event.clientX, event.clientY, event.pointerId, true));
        if (!window.PointerEvent) {
            const getTouch = (event) => event.touches[0] || event.changedTouches[0];
            handle.addEventListener('touchstart', (event) => {
                const touch = getTouch(event);
                if (!touch) return;
                beginDrag(touch.clientX, touch.clientY);
                event.preventDefault();
            }, { passive: false });
            handle.addEventListener('touchmove', (event) => {
                const touch = getTouch(event);
                if (!touch) return;
                moveDrag(touch.clientX, touch.clientY);
                event.preventDefault();
            }, { passive: false });
            handle.addEventListener('touchend', (event) => {
                const touch = getTouch(event);
                if (touch) stopDrag(touch.clientX, touch.clientY);
            }, { passive: false });
            handle.addEventListener('touchcancel', () => stopDrag(0, null, true), { passive: false });
        }
    }

    function setupKeypadClose() {
        const keypad = document.getElementById('number-pad');
        const closeButton = document.getElementById('close-keypad');
        if (!keypad || !closeButton) return;
        closeButton.addEventListener('click', () => {
            keypad.classList.add('hidden');
            updateQuizScrollReserve();
        });
    }

    function renderQuiz(state) {
        const list = document.getElementById('question-list');
        const progress = document.getElementById('progress');
        if (!list || !progress || !state.quiz) return;
        progress.textContent = state.quiz.completed
            ? `本次挑戰 ${state.quiz.questions.length} 題 · 已完成，成績已保存`
            : `本次挑戰 ${state.quiz.questions.length} 題 · 完成後即可檢查答案`;
        list.innerHTML = state.quiz.questions.map((item, index) => {
            const status = item.resolved ? (item.hadError ? `✕ ${item.answer}` : '✓') : (item.wrongAttempts ? `✕ ${item.wrongAttempts}/3` : '');
            return `<article class="border rounded-lg p-2 shadow-sm ${item.resolved ? (item.hadError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200') : 'bg-white border-slate-200'}"><div class="relative flex items-center justify-center gap-2 whitespace-nowrap leading-tight"><span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">${index + 1}</span><label class="flex items-center justify-center gap-1 text-base md:text-lg font-bold text-slate-800 whitespace-nowrap" for="answer-${item.key}">${item.row} × ${item.col} =<input id="answer-${item.key}" data-question="${item.key}" type="number" inputmode="none" readonly value="${item.input || ''}" ${item.resolved ? 'disabled' : ''} aria-label="第 ${index + 1} 題答案" class="w-12 md:w-14 shrink-0 text-center text-base md:text-lg py-1 bg-white border border-slate-300 rounded-md font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${item.key === state.quiz.activeKey ? 'ring-2 ring-blue-300' : ''} disabled:bg-slate-100" autocomplete="off"></label><span class="absolute right-0 shrink-0 text-xs font-semibold ${item.resolved && item.hadError ? 'text-red-600' : 'text-slate-500'}">${status}</span></div></article>`;
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
        }
    }

    function scrollActiveQuestionIntoView(questionKey) {
        const input = document.querySelector(`input[data-question="${questionKey}"]`);
        const question = input?.closest('article');
        const list = document.getElementById('question-list');
        if (!question || !list) return;
        window.requestAnimationFrame(() => {
            const questionRect = question.getBoundingClientRect();
            const listRect = list.getBoundingClientRect();
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
            const visibleTop = listRect.top + 12;
            const visibleBottom = Math.min(...bottomCandidates) - 12;
            let scrollDistance = 0;
            if (questionRect.bottom > visibleBottom) scrollDistance = questionRect.bottom - visibleBottom;
            else if (questionRect.top < visibleTop) scrollDistance = questionRect.top - visibleTop;
            if (scrollDistance) list.scrollBy({ top: scrollDistance, behavior: 'smooth' });
        });
    }

    function focusQuizQuestion(state, questionKey) {
        if (!state.quiz) return;
        state.quiz.activeKey = questionKey;
        document.querySelectorAll('input[data-question]').forEach((answerInput) => {
            const active = answerInput.dataset.question === questionKey;
            answerInput.classList.toggle('ring-2', active);
            answerInput.classList.toggle('ring-blue-300', active);
        });
        saveState(state);
        showKeypad();
        scrollActiveQuestionIntoView(questionKey);
    }

    function showCompletionOverlay(allCorrect) {
        const overlay = document.getElementById('completion-overlay');
        if (!overlay) return;
        const title = overlay.querySelector('[data-completion-title]');
        const detail = overlay.querySelector('[data-completion-detail]');
        if (title) title.textContent = allCorrect ? '你好棒！' : '挑戰完成！';
        if (detail) detail.textContent = allCorrect ? '全部答對，你做到了！' : '成績已保存，繼續保持！';
        overlay.classList.remove('hidden');
        window.setTimeout(() => overlay.classList.add('hidden'), 1800);
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

    function finishQuiz(state) {
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
        showCompletionOverlay(allCorrect);
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
        renderQuiz(state);
        showKeypad();
        scrollActiveQuestionIntoView(state.quiz.activeKey);
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
        if (remaining === 0) { finishQuiz(state); return; }
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
        document.getElementById('start-wrong-quiz').addEventListener('click', () => startWrongQuiz(state));
        document.getElementById('clear-selection').addEventListener('click', () => { state.selected = []; saveState(state); renderHome(state); });
    }

    function initQuiz(state) {
        if (!state.quiz || !state.quiz.questions.length) { window.location.href = 'index.html'; return; }
        renderQuiz(state);
        applyKeypadPosition(state);
        setupKeypadDrag(state);
        setupKeypadClose();
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
        if (document.getElementById('multiplication-grid')) initHome(state);
        if (document.getElementById('question-list')) initQuiz(state);
        initVersionUpdate();
        if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
    });
}());
