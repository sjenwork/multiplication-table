import { questionList, saveState } from './state.js?v=20260906-124347';
import { applyKeypadPosition, hideKeypad, setupKeypadClose, setupKeypadDrag, showKeypad, updateQuizScrollReserve } from './keypad.js?v=20260906-124347';
import { ensureSettingsModal, initSettings } from './settings.js?v=20260906-124347';
import { hideCompletionOverlay, setupCompletionOverlay, showCompletionOverlay } from './completion.js?v=20260906-124347';
import { startQuizWithQuestions } from './home.js?v=20260906-124347';
import { message, renderQuiz, updateSubmitButton } from './quiz-view.js?v=20260906-124347';
import './components/app-modal.js?v=20260906-124347';


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
        answerInput.classList.toggle('ds-question-active', active);
    });
    saveState(state);
    if (openKeypad) showKeypad();
    else hideKeypad();
    scrollActiveQuestionIntoView(questionKey);
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
    document.querySelectorAll('input[data-question]').forEach((answerInput) => answerInput.classList.toggle('ds-question-active', answerInput === input));
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

export function initQuiz(state) {
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
    document.getElementById('back-home').addEventListener('click', () => {
        modal.show();
    });
    document.getElementById('cancel-leave').addEventListener('click', () => modal.hide());
    document.getElementById('confirm-leave').addEventListener('click', () => returnToHomeAfterQuiz(state));
    document.getElementById('return-home-after-quiz').addEventListener('click', () => returnToHomeAfterQuiz(state));
    document.getElementById('another-quiz').addEventListener('click', () => startAnotherQuiz(state));
    document.getElementById('retry-quiz').addEventListener('click', () => restartQuiz(state));
    document.addEventListener('keydown', (event) => { if (event.key === 'Enter') submitAnswer(state); });
}
