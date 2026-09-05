import type { Question } from './question';

export interface QuizQuestion extends Question {
  input: string;
  wrongAttempts: number;
  resolved: boolean;
  hadError: boolean;
  answerShown?: boolean;
}

export interface QuizState {
  questions: QuizQuestion[];
  activeKey: string | null;
  completed: boolean;
}

export type AnswerStatus = 'correct' | 'wrong' | 'revealed' | 'incomplete';
export interface AnswerResult { quiz: QuizState; status: AnswerStatus; }
export type Rng = () => number;

export function createQuiz(questions: readonly Question[], rng: Rng = Math.random): QuizState {
  const shuffled = shuffle([...new Map(questions.map((question) => [question.key, question])).values()], rng).slice(0, 10);
  const quizQuestions = shuffled.map((question) => ({ ...question, input: '', wrongAttempts: 0, resolved: false, hadError: false }));
  return { questions: quizQuestions, activeKey: quizQuestions[0]?.key ?? null, completed: quizQuestions.length === 0 };
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.max(0, Math.min(0.999999, rng())) * (index + 1));
    [items[index], items[target]] = [items[target], items[index]];
  }
  return items;
}

function updateQuestion(quiz: QuizState, key: string, update: (question: QuizQuestion) => QuizQuestion): QuizState {
  return { ...quiz, questions: quiz.questions.map((question) => question.key === key ? update(question) : question) };
}

export function inputDigit(quiz: QuizState, key: string, digit: string): QuizState {
  if (!/^[0-9]$/.test(digit)) return quiz;
  return updateQuestion(quiz, key, (question) => question.resolved ? question : { ...question, input: `${question.input}${digit}` });
}

export function backspace(quiz: QuizState, key: string): QuizState {
  return updateQuestion(quiz, key, (question) => ({ ...question, input: question.input.slice(0, -1) }));
}

export function submitAnswer(quiz: QuizState, key: string): AnswerResult {
  const question = quiz.questions.find((item) => item.key === key);
  if (!question || !question.input) return { quiz, status: 'incomplete' };
  if (Number(question.input) === question.answer) {
    return { quiz: updateQuestion(quiz, key, (item) => ({ ...item, resolved: true })), status: 'correct' };
  }
  const wrongAttempts = question.wrongAttempts + 1;
  const revealed = wrongAttempts >= 3;
  return {
    quiz: updateQuestion(quiz, key, (item) => ({ ...item, input: '', wrongAttempts, hadError: true, resolved: revealed, answerShown: revealed })),
    status: revealed ? 'revealed' : 'wrong',
  };
}

export function answerQuestion(quiz: QuizState, key: string): AnswerStatus {
  return submitAnswer(quiz, key).status;
}

export function nextQuestion(quiz: QuizState): QuizState {
  const next = quiz.questions.find((question) => !question.resolved);
  return { ...quiz, activeKey: next?.key ?? null, completed: !next };
}
