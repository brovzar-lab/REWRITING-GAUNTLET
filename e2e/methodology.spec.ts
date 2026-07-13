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

test('M2: Scene Points state the point, clear the board chip, and survive a reload', async ({ page }) => {
  await freshApp(page);

  // Every card starts honest: no point stated yet.
  const board = page.getByRole('region', { name: 'Story Board' }).first();
  const frame2 = page.locator('[data-card-frame="sc2"]');
  await expect(frame2).toContainText('No point yet');

  // Select scene 2 and state its point in the Evidence tab.
  await board.getByRole('button', { name: /Scene 2/ }).click();
  await page.getByRole('tab', { name: 'Evidence & Notes' }).click();
  await page.locator('#sp-point').fill('The wake reopens the ledger.');
  await page.getByRole('button', { name: 'Unsure' }).click();
  await expect(frame2).not.toContainText('No point yet');

  // Mark another scene as a writer cut candidate (in the inspector).
  await board.getByRole('button', { name: /Scene 3/ }).click();
  await page.locator('#sp-point').fill('A drive-by of the cemetery.');
  await page.locator('.scene-point-card').getByRole('button', { name: 'Cut candidate' }).click();

  // The Scene pass surfaces the writer-marked cut candidate, visibly writer-sourced.
  await page.getByRole('button', { name: /8.*SCENE/ }).click();
  const cutlist = page.getByRole('region', { name: 'Writer-marked cut candidates' });
  await expect(cutlist).toContainText('Writer');
  await expect(cutlist).toContainText('A drive-by of the cemetery.');

  // Reload: points, verdicts, and chips persist.
  await page.waitForTimeout(1200);
  await page.reload();
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();
  await expect(frame2).not.toContainText('No point yet');
  await expect(page.locator('[data-card-frame="sc4"]')).toContainText('No point yet');
  await board.getByRole('button', { name: /Scene 2/ }).click();
  await page.getByRole('tab', { name: 'Evidence & Notes' }).click();
  await expect(page.locator('#sp-point')).toHaveValue('The wake reopens the ledger.');
  await expect(page.locator('.scene-point-card').getByRole('button', { name: 'Unsure' })).toHaveAttribute('aria-pressed', 'true');
});

test('M2R: the writer acts on the card itself — inline point, verdict, reload', async ({ page }) => {
  await freshApp(page);

  // Click the chip on the card, write the point in place, Enter saves.
  const frame4 = page.locator('[data-card-frame="sc4"]');
  await frame4.getByRole('button', { name: 'No point yet' }).click();
  const pop = page.getByRole('dialog', { name: 'Scene point' });
  await expect(pop.locator('textarea')).toBeFocused();
  await pop.locator('textarea').fill('Raúl shows what the water cost him.');
  // The verdict lives in the same popover.
  await pop.getByRole('button', { name: 'Unsure' }).click();
  await pop.locator('textarea').press('Enter');
  await expect(pop).not.toBeVisible();

  // The chip became a preview; the verdict marker is words, on the card.
  await expect(frame4).toContainText('Raúl shows what the water cost him.');
  await expect(frame4).toContainText('Unsure');

  // The inspector shows the same data immediately.
  await frame4.getByRole('button', { name: /Scene 4/ }).click();
  await page.getByRole('tab', { name: 'Evidence & Notes' }).click();
  await expect(page.locator('#sp-point')).toHaveValue('Raúl shows what the water cost him.');
  await expect(page.locator('.scene-point-card').getByRole('button', { name: 'Unsure' })).toHaveAttribute('aria-pressed', 'true');

  // Escape cancels a second edit without losing the saved point.
  await frame4.getByRole('button', { name: /Raúl shows/ }).click();
  await page.getByRole('dialog', { name: 'Scene point' }).locator('textarea').press('Escape');
  await expect(frame4).toContainText('Raúl shows what the water cost him.');

  // Reload: inline-authored point and verdict persist.
  await page.waitForTimeout(1200);
  await page.reload();
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();
  await expect(frame4).toContainText('Raúl shows what the water cost him.');
  await expect(frame4).toContainText('Unsure');
});
