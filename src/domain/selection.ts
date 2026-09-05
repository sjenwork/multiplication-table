import { questionBank, type Factor } from './question';

const allKeys = (): string[] => questionBank().map((question) => question.key);

function normalize(keys: readonly string[]): string[] {
  const valid = new Set(allKeys());
  return [...new Set(keys)].filter((key) => valid.has(key));
}

export function toggleKey(keys: readonly string[], key: string): string[] {
  const current = normalize(keys);
  if (!allKeys().includes(key)) return current;
  return current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
}

export function toggleRow(keys: readonly string[], row: Factor): string[] {
  return toggleGroup(keys, allKeys().filter((key) => key.startsWith(`${row}x`)));
}

export function toggleColumn(keys: readonly string[], col: Factor): string[] {
  return toggleGroup(keys, allKeys().filter((key) => key.endsWith(`x${col}`)));
}

export function selectAll(keys: readonly string[], selected = true): string[] {
  return selected ? allKeys() : [];
}

export function invertSelection(keys: readonly string[]): string[] {
  const current = new Set(normalize(keys));
  return allKeys().filter((key) => !current.has(key));
}

function toggleGroup(keys: readonly string[], group: readonly string[]): string[] {
  const current = new Set(normalize(keys));
  const shouldSelect = group.some((key) => !current.has(key));
  group.forEach((key) => (shouldSelect ? current.add(key) : current.delete(key)));
  return allKeys().filter((key) => current.has(key));
}
