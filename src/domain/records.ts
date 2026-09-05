import type { QuizState } from './quiz';

export interface RecordEntry { errors: number; attempts: number; }
export type Records = Record<string, RecordEntry>;
export interface RoundResult { key: string; hadError: boolean; }

export const emptyRecord = (): RecordEntry => ({ errors: 0, attempts: 0 });

export function finalizeRound(records: Records, questions: readonly RoundResult[]): Records {
  const next: Records = { ...records };
  const uniqueQuestions = questions.filter((question, index) => questions.findIndex((item) => item.key === question.key) === index);
  for (const question of uniqueQuestions) {
    const previous = next[question.key] ?? emptyRecord();
    next[question.key] = { attempts: previous.attempts + 1, errors: previous.errors + (question.hadError ? 1 : 0) };
  }
  return next;
}

export function finalizeQuiz(quiz: QuizState, records: Records): { quiz: QuizState; records: Records } {
  if (quiz.completed) return { quiz, records: { ...records } };
  return {
    quiz: { ...quiz, completed: true },
    records: finalizeRound(records, quiz.questions.map(({ key, hadError }) => ({ key, hadError }))),
  };
}

export const recordLabel = (record: RecordEntry | undefined): string => `${record?.errors ?? 0}/${record?.attempts ?? 0}`;
