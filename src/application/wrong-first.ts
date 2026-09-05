import type { Question } from '../domain/question';
import type { Records } from '../domain/records';

export function selectWrongFirstQuestions(questions: readonly Question[], records: Records, limit = 10): Question[] {
  return questions
    .filter((question) => (records[question.key]?.errors ?? 0) > 0)
    .sort((left, right) => (records[right.key]?.errors ?? 0) - (records[left.key]?.errors ?? 0))
    .slice(0, limit);
}
