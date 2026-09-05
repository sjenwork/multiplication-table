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
  await page.getByRole('checkbox', { name: '選擇 1 乘 2' }).check();
  await expect(page.getByRole('checkbox', { name: '選擇 1 乘 2' })).toBeChecked();
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), storageKey)).toContain('1x2');
  await expect(page.getByRole('button', { name: '開始挑戰' })).toBeEnabled();
  await page.getByRole('button', { name: '開始挑戰' }).click();
  await expect(page).toHaveURL(/\/quiz\.html$/);
  await expect(page.getByRole('heading', { name: '乘法挑戰' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), storageKey)).toContain('1x2');
  const persisted = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? '{}'), storageKey);
  expect(persisted.quiz?.questions?.length).toBeGreaterThanOrEqual(1);
});

test('opens quiz directly and restores the selected question set', async ({ page }) => {
  await seedState(page, { ...emptyState, selected: ['1x2'] });
  await page.goto('/quiz.html');
  await expect(page.getByRole('heading', { name: '乘法挑戰' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('textbox', { name: '第 1 題答案' })).toBeVisible();
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

test('uses wrong-first records and random challenge navigation from home', async ({ page }) => {
  await seedState(page, { ...emptyState, records: { '1x2': { errors: 3, attempts: 4 } } });
  await page.goto('/index.html');
  await expect(page.getByRole('button', { name: '錯題優先' })).toBeEnabled();
  await page.getByRole('button', { name: '錯題優先' }).click();
  await expect(page).toHaveURL(/\/quiz\.html$/);
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.goto('/index.html');
  await page.getByRole('button', { name: '隨機出題' }).click();
  await expect(page).toHaveURL(/\/quiz\.html\?random=1$/);
  await expect(page.getByRole('article')).toHaveCount(10);
});

test('detaches and persists the floating keypad after a real pointer drag', async ({ page }) => {
  await seedState(page, { ...emptyState, selected: ['1x2'] });
  await page.goto('/quiz.html');
  await page.getByRole('button', { name: '設定' }).click();
  await page.getByRole('button', { name: '浮動鍵盤' }).click();
  const keypad = page.getByRole('region', { name: '浮動數字鍵盤' });
  const handle = keypad.getByRole('button', { name: '拖曳鍵盤' });
  const before = await handle.boundingBox();
  expect(before).not.toBeNull();
  await page.mouse.move(before!.x + 12, before!.y + 12);
  await page.mouse.down();
  await page.mouse.move(before!.x + 84, before!.y + 60, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}').keypadPosition, storageKey)).toMatchObject({ detached: true });
  await expect(keypad).toBeVisible();
});
