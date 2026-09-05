export type Factor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface Question {
  row: Factor;
  col: Factor;
  answer: number;
  key: string;
}

export const questionKey = (row: Factor, col: Factor): string => `${row}x${col}`;

export function questionBank(): Question[] {
  return Array.from({ length: 9 }, (_, rowIndex) =>
    Array.from({ length: 9 }, (_, colIndex) => {
      const row = (rowIndex + 1) as Factor;
      const col = (colIndex + 1) as Factor;
      return { row, col, answer: row * col, key: questionKey(row, col) };
    }),
  ).flat();
}
