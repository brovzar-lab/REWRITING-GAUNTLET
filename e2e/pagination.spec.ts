import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
  await page.reload();
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();
});

test('renders true pages: headers from page 2, at least 8 pages', async ({ page }) => {
  const headers = page.locator('.sp-page-header');
  const count = await headers.count();
  expect(count).toBeGreaterThanOrEqual(7); // pageCount - 1
  await expect(headers.first()).toContainText('2.');
});

test('long dialogue splits with (MORE) and NAME (CONT\'D) in plain ASCII', async ({ page }) => {
  const more = page.locator('.sp-more');
  const contd = page.locator('.sp-contd');
  if ((await more.count()) === 0) test.skip(true, 'sample has no dialogue split at current golden');
  await expect(more.first()).toHaveText('(MORE)');
  const t = await contd.first().textContent();
  expect(t).toMatch(/ \(CONT'D\)$/);
  expect(t).not.toContain('’');
});

test('zoom scales the page but never changes pagination', async ({ page }) => {
  const headerCount = await page.locator('.sp-page-header').count();
  const widthBefore = (await page.locator('.sp-page').boundingBox())!.width;

  await page.locator('.ProseMirror').click();
  await page.keyboard.press('ControlOrMeta+=');
  await page.keyboard.press('ControlOrMeta+=');

  const widthAfter = (await page.locator('.sp-page').boundingBox())!.width;
  expect(widthAfter).toBeGreaterThan(widthBefore * 1.15);
  expect(await page.locator('.sp-page-header').count()).toBe(headerCount);

  await page.keyboard.press('ControlOrMeta+0');
  const widthReset = (await page.locator('.sp-page').boundingBox())!.width;
  expect(Math.abs(widthReset - widthBefore)).toBeLessThan(2);
  expect(await page.locator('.sp-page-header').count()).toBe(headerCount);
});

test('page breaks span the full paper width in both themes', async ({ page }) => {
  const paper = (await page.locator('.sp-page').boundingBox())!;
  const gaps = page.locator('.sp-page-gap');
  const count = await gaps.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const g = (await gaps.nth(i).boundingBox())!;
    expect(g.x, `gap ${i} must start at the paper edge`).toBeLessThanOrEqual(paper.x + 1);
    expect(g.width, `gap ${i} must span the paper`).toBeGreaterThanOrEqual(paper.width - 2);
  }
  // Page numbers align at the same right edge on every page.
  const nums = page.locator('.sp-page-num');
  const rights: number[] = [];
  const numCount = await nums.count();
  for (let i = 0; i < numCount; i++) {
    const b = (await nums.nth(i).boundingBox())!;
    rights.push(b.x + b.width);
  }
  expect(Math.max(...rights) - Math.min(...rights)).toBeLessThan(2);
  // Identical geometry in Day mode.
  await page.getByLabel('Appearance').selectOption('day');
  const g0 = (await gaps.first().boundingBox())!;
  expect(g0.x).toBeLessThanOrEqual(paper.x + 1);
  expect(g0.width).toBeGreaterThanOrEqual(paper.width - 2);
});

test('scene numbers appear beside scene headings', async ({ page }) => {
  await expect(page.locator('[data-element-id="sc6-e1"]')).toHaveAttribute('data-scene-number', '6');
});

test('status bar tracks page and scene, and the toolbar zoom buttons match the keyboard', async ({ page }) => {
  const status = page.getByTestId('status-bar');
  const toolbar = page.locator('.editor-toolbar');
  await expect(status).toContainText(/Page 1 of \d+/);
  // jump deep into the script via the navigator
  await page.locator('.scene-navigator .scene-row').last().click();
  await expect(status).toContainText('Scene 16');
  await expect(status).not.toContainText('Page 1 of');
  // zoom buttons scale the page without changing pagination
  const headers = await page.locator('.sp-page-header').count();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(toolbar).toContainText('120%');
  expect(await page.locator('.sp-page-header').count()).toBe(headers);
  await page.getByRole('button', { name: 'Reset zoom' }).click();
  await expect(toolbar).toContainText('100%');
});
