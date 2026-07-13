import { expect, test, type Page } from '@playwright/test';

/** Epps methodology phase acceptance (2026-07-12 plan). One test per slice. */

async function freshApp(page: Page) {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
  await page.reload();
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();
}

test('M1: the Game Plan survives a reload and its links point at exact lines', async ({ page }) => {
  await freshApp(page);

  // Select an exact script line first: the motif and clock anchor cite it.
  await page.locator('.sp-page .sp-action').first().click();

  await page.getByRole('tab', { name: 'Game plan' }).click();
  await page.getByLabel('Statement of intent').fill('Make every scene earn its place.');
  await page.getByLabel('Touchstone').fill('The empty heron nest at dawn.');
  await page.getByLabel('Ticking clock', { exact: true }).fill('The bank forecloses in ten days.');
  await page.getByRole('button', { name: 'Link current line' }).click();
  await expect(page.getByRole('button', { name: /Established at/ })).toBeVisible();

  // A motif with one exact occurrence.
  await page.getByLabel('Motif name').fill('Herons');
  await page.getByRole('button', { name: 'Add motif' }).click();
  await page.getByRole('button', { name: /Mark current line/ }).click();
  await expect(page.locator('.gp-occurrence')).toHaveCount(1);

  // The two Studio-extension fields are visibly labeled, never book-attributed.
  await expect(page.locator('.ext-chip')).toHaveCount(2);
  await expect(page.locator('.ext-chip').first()).toHaveAttribute(
    'title',
    "Studio extension — not from Epps's book",
  );

  // Autosave debounce is 500ms; wait before reloading.
  await page.waitForTimeout(1200);
  await page.reload();
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();

  await page.getByRole('tab', { name: 'Game plan' }).click();
  await expect(page.getByLabel('Statement of intent')).toHaveValue(
    'Make every scene earn its place.',
  );
  await expect(page.getByLabel('Touchstone')).toHaveValue('The empty heron nest at dawn.');
  await expect(page.getByRole('button', { name: /Established at/ })).toBeVisible();
  await expect(page.locator('.gp-occurrence')).toHaveCount(1);

  // The occurrence chip jumps back to the exact cited line.
  await page.locator('.gp-occurrence .gp-anchor').click();
  await expect(page.locator('.sp-page .has-evidence').first()).toBeVisible();
});
