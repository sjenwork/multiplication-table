import { saveState } from './state.js?v=20260906-110950';

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
    const header = document.querySelector('.quiz-header');
    const actionBar = document.querySelector('.safe-action-bar');
    const keypad = document.getElementById('number-pad');
    if (header) list.style.setProperty('--quiz-header-reserve', `${header.getBoundingClientRect().height + 16}px`);
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

function hideKeypad() {
    document.getElementById('number-pad')?.classList.add('hidden');
    updateQuizScrollReserve();
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
    closeButton.addEventListener('click', hideKeypad);
}

export { applyKeypadPosition, hideKeypad, setupKeypadClose, setupKeypadDrag, showKeypad, updateQuizScrollReserve };
