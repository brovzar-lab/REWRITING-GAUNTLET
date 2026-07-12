import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
  await page.reload();
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();
});

test('revision set: marks edited lines, labels the header, survives reload', async ({ page }) => {
  await page.locator('#rev-select').selectOption('Blue');
  await page.getByTestId('rev-start').click();
  await expect(page.getByTestId('rev-end')).toContainText('Blue');

  const line = page.locator('[data-element-id="sc2-e5"]');
  await line.click();
  await page.keyboard.press('End');
  await page.keyboard.type(' AND EVERY LITER.');
  await expect(line).toHaveClass(/sp-revised/);

  // Navigator marks the scene as revised (icon + accessible label, not color)
  const row2 = page.locator('.scene-row').nth(1);
  await expect(row2.locator('.scene-revised')).toBeVisible();

  // Page headers carry the revision label
  await expect(page.locator('.sp-rev-label').first()).toHaveText('REV. BLUE');

  // Survives reload
  await page.waitForTimeout(1200);
  await page.reload();
  await expect(page.locator('[data-element-id="sc2-e5"]')).toHaveClass(/sp-revised/);
  await expect(page.getByTestId('rev-end')).toContainText('Blue');

  // Ending the set clears the marks
  await page.getByTestId('rev-end').click();
  await expect(page.locator('[data-element-id="sc2-e5"]')).not.toHaveClass(/sp-revised/);
});
