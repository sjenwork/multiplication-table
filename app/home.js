import { historyText, questionKey, questionList, saveState, shuffled } from './state.js?v=20260906-104504';
import { ensureSettingsModal, initSettings } from './settings.js?v=20260906-104504';

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

export function startQuizWithQuestions(state, selected, alreadyLimited = false) {
    state.quiz = {
        questions: shuffled(alreadyLimited ? selected : selected.slice(0, 10)).map((question) => ({ ...question, input: '', wrongAttempts: 0, resolved: false, hadError: false })),
        activeKey: null,
        completed: false,
    };
    state.quiz.activeKey = state.quiz.questions[0]?.key || null;
    saveState(state);
    window.location.href = 'quiz.html';
}

export function initHome(state) {
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
