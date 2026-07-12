import { expect, test } from '@playwright/test';

const FOUNTAIN = `Title: THE LONG NIGHT
Draft date: First draft

INT. KITCHEN - NIGHT

MARTA scrubs a pan that is already clean.

MARTA
Nobody comes home this late for good news.

EXT. STREET - NIGHT

A taxi idles under a dead streetlamp.
`;

test('paste-import replaces the draft and paginates it', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
  await page.reload();

  await page.getByRole('button', { name: 'Import', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Open a screenplay' });
  await expect(dialog).toBeVisible();

  // App-style menu: all import choices visible up front.
  await expect(dialog.getByRole('button', { name: 'Paste screenplay' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Open Fountain file' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Open Final Draft file' })).toBeVisible();
  await expect(dialog.getByText(/PDF import is not available yet/)).toBeVisible();

  await dialog.getByRole('button', { name: 'Paste screenplay' }).click();
  await dialog.getByLabel(/Paste your script/).fill(FOUNTAIN);
  await expect(dialog.getByText('Scenes: 2')).toBeVisible();
  await expect(dialog.getByText(/Acts are assigned by thirds/)).toBeVisible();

  await dialog.getByRole('button', { name: 'Import and replace draft' }).click();
  await expect(dialog).toBeHidden();

  // The new draft is on the page, paginated by the real engine.
  await expect(page.locator('.top-bar')).toContainText('THE LONG NIGHT');
  await expect(page.locator('.sp-page').first()).toBeVisible();
  await expect(page.locator('.sp-page').first()).toContainText('INT. KITCHEN - NIGHT');
  await expect(page.locator('.status-bar')).toContainText('Page');

  // The scene navigator lists the imported scenes.
  await expect(page.locator('.scene-row', { hasText: 'EXT. STREET - NIGHT' })).toBeVisible();
});

test('cancelling the import leaves the current draft untouched', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
  await page.reload();

  await page.getByRole('button', { name: 'Import', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Open a screenplay' });
  await dialog.getByRole('button', { name: 'Paste screenplay' }).click();
  await dialog.getByLabel(/Paste your script/).fill(FOUNTAIN);
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.top-bar')).toContainText('LAS GARZAS');
});
