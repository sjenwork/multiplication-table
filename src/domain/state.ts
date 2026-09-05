import type { QuizQuestion, QuizState } from './quiz';
import { questionBank } from './question';
import type { Records } from './records';

export const STORAGE_KEY = 'multiplication-practice-state';
export const SCHEMA_VERSION = 1;
export interface KeypadPosition { detached: boolean; left: number | null; top: number | null; }
export interface AppState { schemaVersion: number; selected: string[]; records: Records; quiz: QuizState | null; theme: 'light' | 'dark'; keypadPosition: KeypadPosition; }

export const DEFAULT_STATE: AppState = Object.freeze({ schemaVersion: SCHEMA_VERSION, selected: [], records: {}, quiz: null, theme: 'light', keypadPosition: { detached: false, left: null, top: null } });

export function migrateState(value: unknown): AppState {
  if (!isObject(value)) return cloneDefault();
  const validKeys = new Set(questionBank().map((question) => question.key));
  const selected = Array.isArray(value.selected) ? [...new Set(value.selected.filter((key): key is string => typeof key === 'string' && validKeys.has(key)))] : [];
  const records: Records = {};
  if (isObject(value.records)) {
    for (const [key, entry] of Object.entries(value.records)) {
      if (validKeys.has(key) && isObject(entry) && Number.isFinite(entry.errors) && Number.isFinite(entry.attempts)) records[key] = { errors: Math.max(0, Number(entry.errors)), attempts: Math.max(0, Number(entry.attempts)) };
    }
  }
  const keypad = isObject(value.keypadPosition) ? { detached: value.keypadPosition.detached === true, left: finiteOrNull(value.keypadPosition.left), top: finiteOrNull(value.keypadPosition.top) } : DEFAULT_STATE.keypadPosition;
  const theme = value.theme === 'dark' ? 'dark' : 'light';
  const quiz = parseQuiz(value.quiz);
  return { schemaVersion: SCHEMA_VERSION, selected, records, quiz, theme, keypadPosition: { ...keypad } };
}

export function parseState(json: string | null | undefined): AppState {
  if (!json) return cloneDefault();
  try { return migrateState(JSON.parse(json)); } catch { return cloneDefault(); }
}

export const serializeState = (state: AppState): string => JSON.stringify(migrateState(state));

function parseQuiz(value: unknown): QuizState | null {
  if (!isObject(value) || !Array.isArray(value.questions)) return null;
  const valid = new Map(questionBank().map((question) => [question.key, question]));
  const questions: QuizQuestion[] = [];
  for (const raw of value.questions) {
    if (!isObject(raw) || typeof raw.key !== 'string' || !valid.has(raw.key)) continue;
    const question = valid.get(raw.key)!;
    questions.push({ ...question, input: typeof raw.input === 'string' ? raw.input.replace(/[^0-9]/g, '') : '', wrongAttempts: nonNegativeInt(raw.wrongAttempts), resolved: raw.resolved === true, hadError: raw.hadError === true, ...(raw.answerShown === true ? { answerShown: true } : {}) });
  }
  const legalQuestions = [...new Map(questions.map((q) => [q.key, q])).values()].slice(0, 10);
  const activeKey = typeof value.activeKey === 'string' && legalQuestions.some((q) => q.key === value.activeKey) ? value.activeKey : legalQuestions[0]?.key ?? null;
  const completed = legalQuestions.length === 0 || legalQuestions.every((question) => question.resolved);
  return { questions: legalQuestions, activeKey, completed };
}

function isObject(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function finiteOrNull(value: unknown): number | null { return typeof value === 'number' && Number.isFinite(value) ? value : null; }
function nonNegativeInt(value: unknown): number { return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : 0; }
function cloneDefault(): AppState { return { ...DEFAULT_STATE, records: {}, selected: [], keypadPosition: { ...DEFAULT_STATE.keypadPosition } }; }
