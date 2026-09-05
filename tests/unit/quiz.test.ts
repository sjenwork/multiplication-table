import { describe, expect, it } from 'vitest';
import { answerQuestion, backspace, createQuiz, inputDigit, submitAnswer } from '../../src/domain/quiz';
import { questionBank } from '../../src/domain/question';

describe('quiz domain', () => {
  it('limits a quiz to ten unique questions and accepts injectable RNG', () => {
    const quiz = createQuiz(questionBank(), () => 0);
    expect(quiz.questions).toHaveLength(10);
    expect(new Set(quiz.questions.map((q) => q.key)).size).toBe(10);
  });
  it('handles input and backspace without browser dependencies', () => {
    const quiz = createQuiz([questionBank()[11]], () => 0);
    const key = quiz.questions[0].key;
    const typed = inputDigit(inputDigit(quiz, key, '1'), key, '2');
    expect(typed.questions[0].input).toBe('12');
    expect(backspace(typed, key).questions[0].input).toBe('1');
  });
  it('does not submit incomplete answers, clears wrong input, and reveals on third error', () => {
    const key = '1x2';
    let quiz = createQuiz([{ row: 1, col: 2, answer: 2, key }], () => 0);
    expect(submitAnswer(quiz, key).status).toBe('incomplete');
    let result = submitAnswer(inputDigit(quiz, key, '1'), key);
    expect(result.status).toBe('wrong');
    quiz = result.quiz;
    result = submitAnswer(inputDigit(quiz, key, '1'), key);
    expect(result.status).toBe('wrong');
    result = submitAnswer(inputDigit(result.quiz, key, '1'), key);
    expect(result.status).toBe('revealed');
    expect(result.quiz.questions[0]).toMatchObject({ input: '', wrongAttempts: 3, resolved: true, answerShown: true });
  });
});
