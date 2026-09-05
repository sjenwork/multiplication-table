import { createQuiz, inputDigit, backspace, submitAnswer, nextQuestion, type AnswerStatus, type Rng, type QuizState } from '../domain/quiz';
import { finalizeQuiz } from '../domain/records';
import { questionBank } from '../domain/question';
import { selectWrongFirstQuestions } from './wrong-first';
import { migrateState, parseState, serializeState, STORAGE_KEY, type AppState, type KeypadPosition } from '../domain/state';
import type { StoragePort } from '../ports';

export interface QuizSessionResult { quiz: QuizState; status: AnswerStatus; state: AppState; }
export interface QuizCheckResult { quiz: QuizState; state: AppState; firstErrorKey: string | null; completed: boolean; }

export function loadOrCreateQuiz(storage: StoragePort, rng: Rng = Math.random, random = false): { state: AppState; quiz: QuizState } {
  const state = parseState(storage.get(STORAGE_KEY));
  if (state.quiz) return { state, quiz: state.quiz };
  const questions = questionBank().filter((question) => random || state.selected.includes(question.key));
  const quiz = createQuiz(questions, rng);
  const nextState = { ...state, quiz };
  storage.set(STORAGE_KEY, serializeState(nextState));
  return { state: nextState, quiz };
}

export function saveQuiz(storage: StoragePort, state: AppState, quiz: QuizState): AppState {
  const nextState = { ...state, quiz };
  storage.set(STORAGE_KEY, serializeState(nextState));
  return nextState;
}

export function saveKeypadPosition(storage: StoragePort, state: AppState, keypadPosition: KeypadPosition): AppState {
  const nextState = { ...state, keypadPosition: { ...keypadPosition } };
  storage.set(STORAGE_KEY, serializeState(nextState));
  return nextState;
}

export function enterDigit(storage: StoragePort, state: AppState, digit: string): AppState {
  if (!state.quiz || !state.quiz.activeKey) return state;
  return saveQuiz(storage, state, inputDigit(state.quiz, state.quiz.activeKey, digit));
}

export function deleteDigit(storage: StoragePort, state: AppState): AppState {
  if (!state.quiz || !state.quiz.activeKey) return state;
  return saveQuiz(storage, state, backspace(state.quiz, state.quiz.activeKey));
}

export function answerActive(storage: StoragePort, state: AppState): QuizSessionResult | null {
  if (!state.quiz || !state.quiz.activeKey) return null;
  const result = submitAnswer(state.quiz, state.quiz.activeKey);
  return persistAnswer(storage, state, result.quiz, result.status);
}

export function answerQuestion(storage: StoragePort, state: AppState, key: string): QuizSessionResult | null {
  if (!state.quiz) return null;
  const result = submitAnswer(state.quiz, key);
  return persistAnswer(storage, state, result.quiz, result.status);
}

export function checkAllAnswers(storage: StoragePort, state: AppState): QuizCheckResult | null {
  if (!state.quiz || state.quiz.completed) return null;
  let quiz = state.quiz;
  let firstErrorKey: string | null = null;
  for (const question of quiz.questions) {
    if (question.resolved) continue;
    const result = submitAnswer(quiz, question.key);
    if (result.status === 'wrong' || result.status === 'revealed') firstErrorKey ??= question.key;
    quiz = result.quiz;
  }
  const nextQuiz = nextQuestion(quiz);
  if (nextQuiz.completed) {
    const finalized = finalizeQuiz(nextQuiz, state.records);
    const nextState = saveQuiz(storage, { ...state, records: finalized.records }, finalized.quiz);
    return { quiz: finalized.quiz, state: nextState, firstErrorKey, completed: true };
  }
  const focusedQuiz = firstErrorKey ? { ...nextQuiz, activeKey: firstErrorKey } : nextQuiz;
  return { quiz: focusedQuiz, state: saveQuiz(storage, state, focusedQuiz), firstErrorKey, completed: false };
}

function persistAnswer(storage: StoragePort, state: AppState, answeredQuiz: QuizState, status: AnswerStatus): QuizSessionResult {
  if (answeredQuiz.questions.every((question) => question.resolved)) {
    const finalized = finalizeQuiz(answeredQuiz, state.records);
    const nextState = saveQuiz(storage, { ...state, records: finalized.records }, finalized.quiz);
    return { quiz: finalized.quiz, status, state: nextState };
  }
  const quiz = nextQuestion(answeredQuiz);
  return { quiz, status, state: saveQuiz(storage, state, quiz) };
}

export function restartQuiz(storage: StoragePort, state: AppState, rng: Rng = Math.random): { state: AppState; quiz: QuizState } {
  const quiz = createQuiz(questionBank().filter((question) => state.selected.includes(question.key)), rng);
  const nextState = saveQuiz(storage, state, quiz);
  return { state: nextState, quiz };
}

export function startRandomQuiz(storage: StoragePort, state: AppState, rng: Rng = Math.random): { state: AppState; quiz: QuizState } {
  const quiz = createQuiz(questionBank(), rng);
  const nextState = saveQuiz(storage, state, quiz);
  return { state: nextState, quiz };
}

export function startWrongQuiz(storage: StoragePort, state: AppState, rng: Rng = Math.random): { state: AppState; quiz: QuizState } | null {
  const questions = selectWrongFirstQuestions(questionBank(), state.records);
  if (questions.length === 0) return null;
  const quiz = createQuiz(questions, rng);
  quiz.questions.sort((left, right) => (state.records[right.key]?.errors ?? 0) - (state.records[left.key]?.errors ?? 0));
  const nextState = saveQuiz(storage, state, { ...quiz, activeKey: quiz.questions[0]?.key ?? null });
  return { state: nextState, quiz: nextState.quiz! };
}
