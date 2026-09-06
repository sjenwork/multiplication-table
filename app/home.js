import { questionList, saveState, shuffled } from './state.js?v=20260906-124347';
import { ensureSettingsModal, initSettings } from './settings.js?v=20260906-124347';
import './components/multiplication-selector.js?v=20260906-124347';

function updateSelectionStatus(state) {
    const status = document.getElementById('selection-status');
    const start = document.getElementById('start-quiz');
    const startWrong = document.getElementById('start-wrong-quiz');
    if (!status || !start) return;
    status.textContent = state.selected.length ? `已選擇 ${state.selected.length} 題，準備好就開始挑戰！` : '尚未選擇題目，請先點擊表格中的格子。';
    start.disabled = state.selected.length === 0;
    if (startWrong) startWrong.disabled = !questionList().some((question) => (state.records[question.key]?.errors || 0) > 0);
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
    grid.questions = questionList();
    grid.selected = [...state.selected];
    grid.records = state.records;
    if (grid.dataset.selectionReady !== 'true') {
        grid.dataset.selectionReady = 'true';
        grid.addEventListener('selection-change', (event) => {
            changeSelection(state, event.detail.keys, event.detail.checked);
            renderHome(state);
        });
    }
    updateSelectionStatus(state);
    grid.updateComplete.then(() => setupSelectionGesture(state, grid));
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
