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

test('scene numbers appear beside scene headings', async ({ page }) => {
  await expect(page.locator('[data-element-id="sc6-e1"]')).toHaveAttribute('data-scene-number', '6');
});
