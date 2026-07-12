import { expect, test } from '@playwright/test';

test('edits autosave locally and survive a full reload', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
  await page.reload();
  const line = page.locator('[data-element-id="sc2-e5"]');
  await expect(line).toBeVisible();
  await line.click();
  await page.keyboard.press('End');
  await page.keyboard.type(' AND THE BOOKS NEVER LIE.');
  await expect(line).toContainText('AND THE BOOKS NEVER LIE.');
  await page.waitForTimeout(1200); // > 500ms debounce
  await page.reload();
  await expect(page.locator('[data-element-id="sc2-e5"]')).toContainText(
    'You never stopped keeping score, Papá. AND THE BOOKS NEVER LIE.',
  );
});

test('theme choice also survives reload', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Appearance').selectOption('day');
  await page.waitForTimeout(1200);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'day');
});
