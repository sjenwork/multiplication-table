import { expect, test } from '@playwright/test';

const storageKey = 'multiplication-practice-state';
const emptyState = {
  schemaVersion: 1,
  selected: [] as string[],
  records: {},
  quiz: null,
  theme: 'light',
  keypadPosition: { detached: false, left: null, top: null },
};

async function seedState(page: import('@playwright/test').Page, state = emptyState) {
  await page.addInitScript(({ key, value }) => {
    if (!window.localStorage.getItem(key)) window.localStorage.setItem(key, JSON.stringify(value));
  }, { key: storageKey, value: state });
}

test('loads home, selects a cell, and starts a challenge', async ({ page }) => {
  await seedState(page);
  await page.goto('/index.html');
  await expect(page.getByRole('grid', { name: '九九乘法選題表' })).toBeVisible();
  await page.getByRole('button', { name: '選擇 1 乘 2' }).click();
  await expect(page.getByRole('button', { name: '選擇 1 乘 2' })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), storageKey)).toContain('1x2');
  await expect(page.getByRole('button', { name: '開始挑戰' })).toBeEnabled();
  await page.getByRole('button', { name: '開始挑戰' }).click();
  await expect(page).toHaveURL(/\/quiz\.html$/);
  await expect(page.getByRole('heading', { name: '答題挑戰' })).toBeVisible();
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), storageKey)).toContain('1x2');
  await expect(page.getByRole('article')).toHaveCount(1);
});

test('opens quiz directly and restores the selected question set', async ({ page }) => {
  await seedState(page, { ...emptyState, selected: ['1x2'] });
  await page.goto('/quiz.html');
  await expect(page.getByRole('heading', { name: '答題挑戰' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('button', { name: '選擇第 1 題 1 乘 2' })).toBeVisible();
});

test('enters a fixed-keypad answer and keeps the completion banner until closed', async ({ page }) => {
  await seedState(page, { ...emptyState, selected: ['1x2'] });
  await page.goto('/quiz.html');
  await expect(page.getByRole('region', { name: '固定數字鍵盤' })).toBeVisible();
  await page.getByRole('button', { name: '數字 2' }).click();
  await page.getByRole('button', { name: '送出答案' }).click();
  const banner = page.getByRole('complementary', { name: '完成提示' });
  await expect(banner).toBeVisible();
  await expect(page.getByRole('region', { name: '固定數字鍵盤' })).toHaveCount(0);
  await page.waitForTimeout(300);
  await expect(banner).toBeVisible();
  await banner.getByRole('button', { name: '關閉完成提示' }).click();
  await expect(banner).toHaveCount(0);
});
