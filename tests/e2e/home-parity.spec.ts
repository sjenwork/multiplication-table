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

async function seedState(page: import('@playwright/test').Page) {
  await page.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, { key: storageKey, value: emptyState });
}

test.describe('home legacy parity', () => {
  test('desktop 1440x900 keeps the grid and modal aligned', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await seedState(page);
    await page.goto('/index.html');

    const grid = page.getByRole('grid', { name: '九九乘法選題表' });
    await expect(grid).toBeVisible();
    await expect(page.locator('[data-selection-scroll]')).toHaveCSS('overflow', 'auto');
    await expect(page.getByRole('button', { name: '全選所有題目' })).toBeVisible();
    await expect(page.getByText('全選', { exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: '開啟設定' }).click();
    const modal = page.getByRole('dialog', { name: '設定' });
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('button', { name: '關閉設定' })).toBeVisible();
    await expect(modal.getByText('顯示主題')).toBeVisible();
    await expect(modal.getByRole('button', { name: '匯出紀錄' })).toBeVisible();
    await expect(modal.getByRole('button', { name: '清除資料' })).toBeVisible();
    await modal.getByRole('button', { name: '關閉設定' }).click();
    await expect(modal).toHaveCount(0);
  });

  test('mobile 390x844 keeps the action bar and sticky grid usable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedState(page);
    await page.goto('/index.html');

    const grid = page.getByRole('grid', { name: '九九乘法選題表' });
    await expect(grid).toBeVisible();
    await expect(page.getByRole('toolbar', { name: '題目操作' })).toBeVisible();
    await expect(page.getByRole('button', { name: '選擇 1 乘 1' })).toBeVisible();
    await page.getByRole('button', { name: '選擇 1 乘 1' }).click();
    await expect(page.getByRole('button', { name: '開始挑戰' })).toBeEnabled();
    await expect(page.locator('body')).toHaveCSS('overscroll-behavior-x', 'none');
  });
});
