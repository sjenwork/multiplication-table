export function message(text, error) {
    const box = document.getElementById('quiz-message');
    if (!box) return;
    box.className = `mt-6 p-4 rounded-xl text-center font-medium ${error ? 'ds-danger' : 'ds-success'}`;
    box.textContent = text;
}

export function updateSubmitButton(state) {
    const button = document.getElementById('submit-answer');
    if (!button || !state.quiz) return;
    button.disabled = state.quiz.completed || state.quiz.questions.some((question) => !question.resolved && !question.input);
}

export function renderQuiz(state, focusQuizQuestion) {
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
        input.addEventListener('click', () => focusQuizQuestion(state, input.dataset.question));
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
