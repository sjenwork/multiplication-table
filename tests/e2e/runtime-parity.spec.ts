import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

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
  await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, JSON.stringify(value)), { key: storageKey, value: state });
}

test('desktop dark settings modal has a distinct boundary and all actions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await seedState(page);
  await page.goto('/index.html');
  await page.getByRole('button', { name: '開啟設定' }).click();
  await page.getByRole('button', { name: '深色主題' }).click();
  const values = await page.getByRole('dialog', { name: '設定' }).evaluate((node) => {
    const style = getComputedStyle(node);
    const root = getComputedStyle(document.documentElement);
    return { background: style.backgroundColor, border: style.borderColor, canvas: root.getPropertyValue('--ds-canvas').trim() };
  });
  expect(values.background).not.toBe(values.canvas);
  expect(values.border).not.toBe('rgba(0, 0, 0, 0)');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '匯出紀錄' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^multiplication-practice-.*\.csv$/);
  expect(readFileSync((await download.path())!, 'utf8')).toContain('"題目","錯誤次數","作答次數","正確次數"');
  await page.getByRole('button', { name: '開啟設定' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '清除資料' }).click();
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();
});

test('mobile fixed keypad stays above the bottom action bar and exposes safe controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedState(page, { ...emptyState, selected: ['1x2'] });
  await page.goto('/quiz.html');
  const keypad = page.getByRole('region', { name: '固定數字鍵盤' });
  const actionBar = page.getByRole('toolbar', { name: '答題操作' });
  const keypadBox = await keypad.boundingBox();
  const actionBox = await actionBar.boundingBox();
  expect(keypadBox).not.toBeNull();
  expect(actionBox).not.toBeNull();
  expect(keypadBox!.y + keypadBox!.height).toBeLessThanOrEqual(actionBox!.y + 1);
  await expect(keypad.getByRole('button', { name: '關閉鍵盤' })).toBeVisible();
  await expect(keypad.getByRole('button', { name: '拖曳鍵盤' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '第 1 題答案' })).toHaveAttribute('inputmode', 'none');
});

test('PWA runtime assets are emitted with install metadata and versioned worker', async ({ request }) => {
  const manifest = await request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBe(true);
  expect((await manifest.json()).start_url).toBe('/');
  const worker = await request.get('/sw.js');
  expect(worker.ok()).toBe(true);
  expect(worker.headers()['content-type']).toContain('javascript');
  expect(await worker.text()).toContain('CACHE_NAME');
});

test('desktop home runtime keeps sticky geometry, glass modal, theme contrast, and clean console', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await seedState(page);
  await page.goto('/index.html');
  const geometry = await page.locator('[data-selection-scroll] thead th').first().evaluate((node) => {
    const style = getComputedStyle(node);
    const cell = node.getBoundingClientRect();
    return { position: style.position, height: cell.height, overflow: getComputedStyle(node.closest('[data-selection-scroll]')!).overflow };
  });
  expect(geometry.position).toBe('sticky');
  expect(geometry.height).toBeGreaterThanOrEqual(48);
  expect(geometry.overflow).toBe('auto');
  expect(await page.locator('td[data-question="1x1"]').evaluate((node) => getComputedStyle(node).userSelect)).toBe('none');
  await page.screenshot({ path: 'test-results/round-c-home-desktop-light.png', fullPage: true });

  await page.getByRole('button', { name: '開啟設定' }).click();
  const light = await page.getByRole('dialog', { name: '設定' }).evaluate((node) => {
    const style = getComputedStyle(node);
    return { background: style.backgroundColor, blur: style.backdropFilter };
  });
  expect(light.background).not.toBe('rgba(0, 0, 0, 0)');
  await page.getByRole('button', { name: '深色主題' }).click();
  const dark = await page.getByRole('dialog', { name: '設定' }).evaluate((node) => {
    const style = getComputedStyle(node);
    return { background: style.backgroundColor, border: style.borderColor, theme: document.documentElement.dataset.theme };
  });
  expect(dark.theme).toBe('dark');
  expect(dark.background).not.toBe(light.background);
  expect(dark.border).not.toBe('rgba(0, 0, 0, 0)');
  await page.screenshot({ path: 'test-results/round-c-home-dark-settings.png' });
  await page.getByRole('button', { name: '關閉設定' }).click();
  expect(errors).toEqual([]);
});

test('mobile home real touch long-press drag selects a range without release click reversal', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await seedState(page);
  await page.goto('/index.html');
  const first = page.locator('td[data-question="1x1"]');
  const second = page.locator('td[data-question="1x2"]');
  const firstBox = await first.boundingBox();
  const secondBox = await second.boundingBox();
  expect(firstBox).not.toBeNull();
  expect(secondBox).not.toBeNull();
  const firstPoint = { x: firstBox!.x + firstBox!.width / 2, y: firstBox!.y + firstBox!.height / 2 };
  const secondPoint = { x: secondBox!.x + secondBox!.width / 2, y: secondBox!.y + secondBox!.height / 2 };
  await first.dispatchEvent('pointerdown', { bubbles: true, pointerId: 77, pointerType: 'touch', button: 0, clientX: firstPoint.x, clientY: firstPoint.y });
  await page.waitForTimeout(400);
  await second.dispatchEvent('pointerenter', { bubbles: true, pointerId: 77, pointerType: 'touch', clientX: secondPoint.x, clientY: secondPoint.y });
  await page.getByRole('grid').dispatchEvent('pointerup', { bubbles: true, pointerId: 77, pointerType: 'touch', button: 0, clientX: secondPoint.x, clientY: secondPoint.y });
  await expect(page.getByRole('checkbox', { name: '選擇 1 乘 1' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: '選擇 1 乘 2' })).toBeChecked();
  expect(errors).toEqual([]);
});

test('quiz return confirmation, mobile scroll clearance, and fixed keypad full layout are runtime-safe', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await seedState(page, { ...emptyState, selected: ['1x1', '1x2', '1x3', '1x4', '1x5', '1x6', '1x7', '1x8', '1x9', '2x1'] });
  await page.goto('/quiz.html');
  const scroll = page.locator('.question-scroll');
  await expect(scroll).toBeVisible();
  expect(await scroll.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
  const keypad = page.getByRole('region', { name: '固定數字鍵盤' });
  expect(await page.getByRole('article').first().locator('.question-number').textContent()).toContain('1');
  await expect(keypad.getByRole('button', { name: '數字 0' })).toBeVisible();
  await expect(keypad.getByRole('button', { name: '數字 9' })).toBeVisible();
  await expect(keypad.locator('.key-grid button')).toHaveCount(10);
  await expect(keypad.getByRole('button', { name: '退格' })).toBeVisible();
  await keypad.getByRole('button', { name: '數字 1' }).click();
  await keypad.getByRole('button', { name: '退格' }).click();
  await expect(page.getByRole('textbox', { name: '第 1 題答案' })).toHaveValue('');
  const last = page.getByRole('article').last();
  await scroll.evaluate((node) => { node.scrollTop = node.scrollHeight; });
  await page.waitForTimeout(50);
  const scrollMetrics = await scroll.evaluate((node) => ({ top: node.scrollTop, height: node.clientHeight, scrollHeight: node.scrollHeight, innerHeight: window.innerHeight, cssMax: getComputedStyle(node).maxHeight }));
  const lastBox = await last.boundingBox();
  const keypadBox = await keypad.boundingBox();
  expect(lastBox).not.toBeNull();
  expect(keypadBox).not.toBeNull();
  expect(lastBox!.y + lastBox!.height).toBeLessThanOrEqual(keypadBox!.y + 1);

  await page.getByRole('button', { name: '返回選題' }).click();
  await expect(page.getByRole('dialog', { name: '確認返回' })).toBeVisible();
  await page.getByRole('button', { name: '取消返回' }).click();
  await expect(page.getByRole('dialog', { name: '確認返回' })).toHaveCount(0);
  await page.getByRole('button', { name: '返回選題' }).click();
  await page.getByRole('button', { name: '確認返回' }).click();
  await expect(page).toHaveURL(/\/index\.html$/);
  expect(errors).toEqual([]);
});

test('floating keypad can drag, dock back to fixed, and close without layout overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await seedState(page, { ...emptyState, selected: ['1x2'] });
  await page.goto('/quiz.html');
  await page.getByRole('button', { name: '設定' }).click();
  await page.getByRole('button', { name: '浮動鍵盤' }).click();
  let keypad = page.getByRole('region', { name: '浮動數字鍵盤' });
  const handle = keypad.getByRole('button', { name: '拖曳鍵盤' });
  const start = await handle.boundingBox();
  expect(start).not.toBeNull();
  await page.mouse.move(start!.x + 10, start!.y + 10);
  await page.mouse.down();
  await page.mouse.move(start!.x + 100, start!.y + 100, { steps: 6 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}').keypadPosition.detached, storageKey)).toBe(true);
  const floatingBox = await keypad.boundingBox();
  expect(floatingBox).not.toBeNull();
  expect(floatingBox!.x).toBeGreaterThanOrEqual(0);
  expect(floatingBox!.y).toBeGreaterThanOrEqual(0);
  const dockHandle = keypad.getByRole('button', { name: '拖曳鍵盤' });
  const dockStart = await dockHandle.boundingBox();
  expect(dockStart).not.toBeNull();
  await page.mouse.move(dockStart!.x + 30, dockStart!.y + 10);
  await page.mouse.down();
  await page.mouse.move(dockStart!.x + 30, 895, { steps: 6 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}').keypadPosition.detached, storageKey)).toBe(false);
  await expect(page.getByRole('region', { name: '固定數字鍵盤' })).toBeVisible();
  await page.getByRole('button', { name: '關閉鍵盤' }).click();
  await expect(page.getByRole('region', { name: '固定數字鍵盤' })).toHaveCount(0);
});

test('wrong feedback and completion banners are persistent, closable, and actionable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await seedState(page, { ...emptyState, selected: ['1x2'] });
  await page.goto('/quiz.html');
  await page.getByRole('button', { name: '數字 3' }).click();
  await page.getByRole('button', { name: '送出答案' }).click();
  await expect(page.getByRole('complementary', { name: '答題回饋' })).toBeVisible();
  await page.getByRole('button', { name: '關閉答題回饋' }).click();
  await expect(page.getByRole('complementary', { name: '答題回饋' })).toHaveCount(0);
  await page.getByRole('textbox', { name: '第 1 題答案' }).click();
  await page.getByRole('button', { name: '數字 2' }).click();
  await page.getByRole('button', { name: '送出答案' }).click();
  await expect(page.getByRole('complementary', { name: '完成提示' })).toBeVisible();
  await expect(page.getByRole('button', { name: '返回上一頁' })).toBeVisible();
  await expect(page.getByRole('button', { name: '依目前題庫再次出題' })).toBeVisible();
  await expect(page.getByRole('button', { name: '重新測驗目前題目' })).toBeVisible();
  await page.getByRole('button', { name: '依目前題庫再次出題' }).click();
  await expect(page.getByRole('article')).toHaveCount(10);
});

test('home and quiz settings share tokenized control geometry and light/dark computed styles', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await seedState(page, { ...emptyState, selected: ['1x2'] });
  await page.goto('/index.html');
  await page.getByRole('button', { name: '開啟設定' }).click();
  const homeStyles = await page.getByRole('dialog', { name: '設定' }).evaluate((dialog) => {
    const read = (selector: string) => { const style = getComputedStyle(dialog.querySelector(selector)!); return { background: style.backgroundColor, border: style.borderColor, color: style.color, radius: style.borderRadius }; };
    return { choice: read('button[aria-label="淺色主題"]'), exportAction: read('.export-action'), clearAction: read('.clear-action') };
  });
  await page.getByRole('button', { name: '深色主題' }).click();
  const homeDark = await page.getByRole('dialog', { name: '設定' }).evaluate((dialog) => {
    const read = (selector: string) => { const style = getComputedStyle(dialog.querySelector(selector)!); return { background: style.backgroundColor, border: style.borderColor, color: style.color, radius: style.borderRadius }; };
    return { choice: read('button[aria-label="淺色主題"]'), exportAction: read('.export-action'), clearAction: read('.clear-action') };
  });
  await page.getByRole('button', { name: '淺色主題' }).click();
  await page.getByRole('button', { name: '關閉設定' }).click();
  await page.goto('/quiz.html');
  await page.getByRole('button', { name: '設定' }).click();
  const quizStyles = await page.getByRole('dialog', { name: '設定' }).evaluate((dialog) => {
    const read = (selector: string) => { const style = getComputedStyle(dialog.querySelector(selector)!); return { background: style.backgroundColor, border: style.borderColor, color: style.color, radius: style.borderRadius }; };
    return { choice: read('button[aria-label="淺色主題"]'), exportAction: read('.export-action'), clearAction: read('.clear-action') };
  });
  expect(quizStyles).toEqual(homeStyles);
  await page.getByRole('button', { name: '深色主題' }).click();
  const quizDark = await page.getByRole('dialog', { name: '設定' }).evaluate((dialog) => {
    const read = (selector: string) => { const style = getComputedStyle(dialog.querySelector(selector)!); return { background: style.backgroundColor, border: style.borderColor, color: style.color, radius: style.borderRadius }; };
    return { choice: read('button[aria-label="淺色主題"]'), exportAction: read('.export-action'), clearAction: read('.clear-action') };
  });
  expect(quizDark).toEqual(homeDark);
  expect(homeDark.choice.background).not.toBe(homeStyles.choice.background);
});

test('PWA update pill stays hidden, appears for a waiting worker, and reloads after update', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
  await seedState(page);
  await page.goto('/index.html');
  await page.evaluate(async () => {
    for (const registration of await navigator.serviceWorker.getRegistrations()) await registration.unregister();
    sessionStorage.clear();
  });
  await page.goto('/index.html?e2e-sw=1');
  await expect(page.getByRole('button', { name: '更新網站版本' })).toHaveCount(0);
  await page.reload();
  await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())?.update(); });
  await expect.poll(() => page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration?.waiting ? 'waiting' : registration?.active ? 'active' : 'missing';
  })).toBe('waiting');
  await expect(page.getByRole('button', { name: '更新網站版本' })).toBeVisible({ timeout: 5000 });
  const reloadPromise = page.waitForEvent('load');
  await page.getByRole('button', { name: '更新網站版本' }).click();
  await reloadPromise;
  await expect(page.getByRole('button', { name: '更新網站版本' })).toHaveCount(0);
  } finally {
    await context.close();
  }
});
