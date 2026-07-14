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
  await expect(dialog.getByRole('button', { name: 'Open PDF (best effort)' })).toBeVisible();

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

test('PDF import is best effort: extracts text, warns, and imports', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
  await page.reload();

  const content =
    'BT /F1 12 Tf 72 720 Td (INT. NEWSROOM - NIGHT) Tj 0 -20 Td (Phones ring in the dark.) Tj ET';
  const pdf = `%PDF-1.4\n4 0 obj<</Length ${content.length}>>\nstream\n${content}\nendstream\nendobj\n%%EOF\n`;

  await page.getByRole('button', { name: 'Import', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Open a screenplay' });
  await expect(dialog.getByRole('button', { name: 'Open PDF (best effort)' })).toBeVisible();
  await page.setInputFiles('[data-testid="import-file-pdf"]', {
    name: 'script.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(pdf, 'latin1'),
  });

  await expect(dialog.getByText(/Best effort/i)).toBeVisible();
  await expect(dialog.getByText(/not Final Draft fidelity/i)).toBeVisible();
  await dialog.getByRole('button', { name: /Import and replace draft/ }).click();
  await expect(page.locator('.sp-page').first()).toContainText('INT. NEWSROOM - NIGHT');
});
