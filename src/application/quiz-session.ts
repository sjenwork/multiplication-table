import { createQuiz, inputDigit, backspace, submitAnswer, nextQuestion, type AnswerStatus, type Rng, type QuizState } from '../domain/quiz';
import { finalizeQuiz } from '../domain/records';
import { questionBank } from '../domain/question';
import { migrateState, parseState, serializeState, STORAGE_KEY, type AppState } from '../domain/state';
import type { StoragePort } from '../ports';

export interface QuizSessionResult { quiz: QuizState; status: AnswerStatus; state: AppState; }

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
