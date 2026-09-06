const STORAGE_KEY = 'multiplication-practice-state';

function newState() {
    return { selected: [], records: {}, quiz: null, theme: 'light', keypadPosition: { detached: false, left: null, top: null } };
}

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!saved || typeof saved !== 'object') return newState();
        const state = { ...newState(), ...saved };
        if (state.theme !== 'light' && state.theme !== 'dark') state.theme = 'light';
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

export {
    STORAGE_KEY,
    loadState,
    saveState,
    questionKey,
    questionList,
    shuffled,
    historyText,
};
