import { describe, expect, it } from 'vitest';

describe('toolchain smoke test', () => {
  it('runs TypeScript tests through Vitest', () => {
    expect(2 * 9).toBe(18);
  });
});
