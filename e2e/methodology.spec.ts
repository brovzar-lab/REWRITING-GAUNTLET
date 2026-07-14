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

test('M3: mark a set-up and a pay-off on lines, pair them in the map, survive reload', async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 900 });
  await freshApp(page);

  const board = page.getByRole('region', { name: 'Story Board' }).first();
  const markBar = page.locator('.status-beats');

  // Mark scene 1 as a set-up and scene 3 as a pay-off — directly on the line.
  await page.locator('[data-scene-card="sc1"]').click();
  await markBar.getByRole('button', { name: 'Set-up' }).click();
  await expect(markBar.getByRole('button', { name: 'Set-up' })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-scene-card="sc3"]').click();
  await markBar.getByRole('button', { name: 'Pay-off' }).click();

  // The map (full-board) shows them unpaired until the writer pairs them.
  await board.getByRole('button', { name: 'Full board' }).click();
  const map = page.getByRole('region', { name: 'Set-Up / Pay-off Map' });
  await expect(map).toContainText('Unpaid set-up');
  await expect(map).toContainText('Orphan pay-off');

  // Pair them from the map: the row becomes OK.
  await map.getByLabel(/Pair with a pay-off/).selectOption({ index: 1 });
  await expect(map.locator('.map-row.status-ok')).toContainText('OK');
  await expect(map.locator('.map-row.status-ok')).toContainText('Scene 1');
  await expect(map.locator('.map-row.status-ok')).toContainText('Scene 3');

  // Clicking a row reference jumps to the exact line.
  await map.locator('.map-row.status-ok').getByRole('button', { name: /Set-up · Scene 1/ }).click();
  await board.getByRole('button', { name: 'Exit full board' }).click();
  await expect(markBar.getByRole('button', { name: 'Set-up' })).toHaveAttribute('aria-pressed', 'true');

  // Reload: the pairing and its OK status persist.
  await page.waitForTimeout(1200);
  await page.reload();
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();
  await page.getByRole('region', { name: 'Story Board' }).first().getByRole('button', { name: 'Full board' }).click();
  await expect(page.getByRole('region', { name: 'Set-Up / Pay-off Map' }).locator('.map-row.status-ok')).toBeVisible();
});

test('M4: place high points on cards, see them in the checklist, navigator, and reload', async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 900 });
  await freshApp(page);

  // High points are placed on the card, in full board.
  await page.getByRole('region', { name: 'Story Board' }).first().getByRole('button', { name: 'Full board' }).click();
  await page.locator('[data-card-frame="sc4"]').getByLabel('High point').selectOption('midpoint');
  await expect(page.locator('[data-card-frame="sc4"]')).toContainText('Mid-Point');

  // An emotional low feeds the momentum strip.
  await page.locator('[data-card-frame="sc2"]').getByLabel('High point').selectOption('emotional_low');
  const structure = page.getByRole('region', { name: 'Set-Up / Pay-off Map' });
  await expect(structure.getByRole('group', { name: 'Momentum' })).toContainText('Low');

  // The Four High Points checklist shows the placed one and jumps to it.
  const checklist = structure.getByRole('list', { name: 'Four High Points' });
  await expect(checklist).toContainText('Mid-Point Plot Turn');
  await checklist.getByRole('button', { name: /Mid-Point Plot Turn/ }).click();

  // Reload: the placements persist and the navigator flags the structural point.
  await page.waitForTimeout(1200);
  await page.reload();
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();
  await expect(page.locator('.scene-navigator')).toContainText('Mid-Point');
});

test('M2R: the dotted chip is the editor — type the point directly on the card', async ({ page }) => {
  await freshApp(page);

  // Click the chip: the same dotted area becomes an editable field in the card.
  const frame4 = page.locator('[data-card-frame="sc4"]');
  await frame4.getByRole('button', { name: 'No point yet' }).click();
  const editor = frame4.locator('.card-point-edit');
  await expect(editor).toBeFocused();
  await expect(editor).toHaveAttribute('placeholder', 'The point of this scene is…');
  // No popover, no floating box, no dialog — the editing happens in the card.
  await expect(page.locator('.sp-card-pop')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await editor.fill('Raúl shows what the water cost him.');
  await editor.press('Enter');
  await expect(frame4.locator('.card-point-edit')).toHaveCount(0);
  await expect(frame4).toContainText('Raúl shows what the water cost him.');

  // Verdict stays in the inspector; the card mirrors it as a word marker.
  await frame4.getByRole('button', { name: /Scene 4/ }).click();
  await page.getByRole('tab', { name: 'Evidence & Notes' }).click();
  await expect(page.locator('#sp-point')).toHaveValue('Raúl shows what the water cost him.');
  await page.locator('.scene-point-card').getByRole('button', { name: 'Unsure' }).click();
  await expect(frame4).toContainText('Unsure');

  // Escape cancels a second in-card edit without losing the saved point.
  await frame4.getByRole('button', { name: /Raúl shows/ }).click();
  await frame4.locator('.card-point-edit').press('Escape');
  await expect(frame4).toContainText('Raúl shows what the water cost him.');

  // Reload: card-authored point and verdict persist.
  await page.waitForTimeout(1200);
  await page.reload();
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();
  await expect(frame4).toContainText('Raúl shows what the water cost him.');
  await expect(frame4).toContainText('Unsure');
});
