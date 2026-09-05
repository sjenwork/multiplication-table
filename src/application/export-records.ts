import { questionBank, type Question } from '../domain/question';
import type { Records } from '../domain/records';
import type { DownloadPort } from '../ports';

export function buildPracticeRecordsCsv(records: Records, questions: readonly Question[] = questionBank()): string {
  const rows = [['題目', '錯誤次數', '作答次數', '正確次數']];
  for (const question of questions) {
    const record = records[question.key] ?? { errors: 0, attempts: 0 };
    rows.push([
      `${question.row}×${question.col}`,
      String(record.errors || 0),
      String(record.attempts || 0),
      String(Math.max((record.attempts || 0) - (record.errors || 0), 0)),
    ]);
  }
  return `\uFEFF${rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')}`;
}

export function exportPracticeRecords(download: DownloadPort, records: Records, now = new Date()): void {
  const timestamp = now.toISOString().slice(0, 19).replaceAll(':', '-');
  download.download(`multiplication-practice-${timestamp}.csv`, buildPracticeRecordsCsv(records), 'text/csv;charset=utf-8');
}
