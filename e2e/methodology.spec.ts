import { expect, test } from '@playwright/test';
import { freshApp, openImport, openScenes, openBoardMode, openEvidence, openGamePlan, openPass, completeRead } from './helpers';

/** Epps methodology acceptance, re-pointed to the workstation IA. */

test('M1: the Game Plan survives a reload and its links point at exact lines', async ({ page }) => {
  await freshApp(page);
  await page.locator('.sp-page .sp-action').first().click();

  await openGamePlan(page);
  await page.getByLabel('Statement of intent').fill('Make every scene earn its place.');
  await page.getByLabel('Touchstone').fill('The empty heron nest at dawn.');
  await page.getByLabel('Ticking clock', { exact: true }).fill('The bank forecloses in ten days.');
  await page.getByRole('button', { name: 'Link current line' }).click();
  await expect(page.getByRole('button', { name: /Established at/ })).toBeVisible();

  await page.getByLabel('Motif name').fill('Herons');
  await page.getByRole('button', { name: 'Add motif' }).click();
  await page.getByRole('button', { name: /Mark current line/ }).click();
  await expect(page.locator('.gp-occurrence')).toHaveCount(1);

  await expect(page.locator('.game-plan .ext-chip')).toHaveCount(2);

  await page.waitForTimeout(1200);
  await page.reload();
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();

  await openGamePlan(page);
  await expect(page.getByLabel('Statement of intent')).toHaveValue('Make every scene earn its place.');
  await expect(page.getByLabel('Touchstone')).toHaveValue('The empty heron nest at dawn.');
  await expect(page.getByRole('button', { name: /Established at/ })).toBeVisible();
  await expect(page.locator('.gp-occurrence')).toHaveCount(1);

  await page.locator('.gp-occurrence .gp-anchor').click();
  await expect(page.locator('.sp-page .has-evidence').first()).toBeVisible();
});

test('M2: Scene Points state the point, clear the board chip, and survive a reload', async ({ page }) => {
  await freshApp(page);
  await openBoardMode(page);
  const board = page.getByRole('region', { name: 'Story Board' }).first();
  const frame2 = page.locator('[data-card-frame="sc2"]');
  await expect(frame2).toContainText('No point yet');

  await board.getByRole('button', { name: /Scene 2/ }).click();
  await openEvidence(page);
  await page.locator('#sp-point').fill('The wake reopens the ledger.');
  await page.getByRole('button', { name: 'Unsure' }).click();
  await expect(frame2).not.toContainText('No point yet');

  await board.getByRole('button', { name: /Scene 3/ }).click();
  await page.locator('#sp-point').fill('A drive-by of the cemetery.');
  await page.locator('.scene-point-card').getByRole('button', { name: 'Cut candidate' }).click();

  await openPass(page, /SCENE/);
  const cutlist = page.getByRole('region', { name: 'Writer-marked cut candidates' });
  await expect(cutlist).toContainText('Writer');
  await expect(cutlist).toContainText('A drive-by of the cemetery.');

  await page.waitForTimeout(1200);
  await page.reload();
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();
  await openBoardMode(page);
  await expect(page.locator('[data-card-frame="sc2"]')).not.toContainText('No point yet');
  await expect(page.locator('[data-card-frame="sc4"]')).toContainText('No point yet');
  await page.getByRole('region', { name: 'Story Board' }).first().getByRole('button', { name: /Scene 2/ }).click();
  await openEvidence(page);
  await expect(page.locator('#sp-point')).toHaveValue('The wake reopens the ledger.');
  await expect(page.locator('.scene-point-card').getByRole('button', { name: 'Unsure' })).toHaveAttribute('aria-pressed', 'true');
});

test('M3: mark a set-up and a pay-off on lines, pair them in the map, survive reload', async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 900 });
  await freshApp(page);
  const markBar = page.locator('.status-beats');

  // Mark set-up / pay-off directly on the selected line via its status bar.
  await page.locator('[data-element-id="sc1-e1"]').click();
  await markBar.getByRole('button', { name: 'Set-up' }).click();
  await expect(markBar.getByRole('button', { name: 'Set-up' })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-element-id="sc3-e1"]').click();
  await markBar.getByRole('button', { name: 'Pay-off' }).click();

  await openBoardMode(page);
  const map = page.getByRole('region', { name: 'Set-Up / Pay-off Map' });
  await expect(map).toContainText('Unpaid set-up');
  await expect(map).toContainText('Orphan pay-off');

  await map.getByLabel(/Pair with a pay-off/).selectOption({ index: 1 });
  await expect(map.locator('.map-row.status-ok')).toContainText('OK');
  await expect(map.locator('.map-row.status-ok')).toContainText('Scene 1');
  await expect(map.locator('.map-row.status-ok')).toContainText('Scene 3');

  await map.locator('.map-row.status-ok').getByRole('button', { name: /Set-up · Scene 1/ }).click();

  await page.waitForTimeout(1200);
  await page.reload();
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();
  await openBoardMode(page);
  await expect(page.getByRole('region', { name: 'Set-Up / Pay-off Map' }).locator('.map-row.status-ok')).toBeVisible();
});

test('M4: place high points on cards, see them in the checklist, navigator, and reload', async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 900 });
  await freshApp(page);
  await openBoardMode(page);
  await page.locator('[data-card-frame="sc4"]').getByLabel('High point').selectOption('midpoint');
  await expect(page.locator('[data-card-frame="sc4"]')).toContainText('Mid-Point');

  await page.locator('[data-card-frame="sc2"]').getByLabel('High point').selectOption('emotional_low');
  const structure = page.getByRole('region', { name: 'Set-Up / Pay-off Map' });
  await expect(structure.getByRole('group', { name: 'Momentum' })).toContainText('Low');

  const checklist = structure.getByRole('list', { name: 'Four High Points' });
  await expect(checklist).toContainText('Mid-Point Plot Turn');
  await checklist.getByRole('button', { name: /Mid-Point Plot Turn/ }).click();

  await page.waitForTimeout(1200);
  await page.reload();
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();
  await openScenes(page);
  await expect(page.locator('.scene-navigator')).toContainText('Mid-Point');
});

test('M6: run the Polish Read cover to cover, then export shows readiness', async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 900 });
  await freshApp(page);

  await openPass(page, /POLISH/);
  await page.getByRole('button', { name: 'Start Polish Read' }).click();
  const bar = page.getByRole('region', { name: 'Polish Read', exact: true });
  await expect(bar).toContainText('Page 1 of');
  await expect(bar).toContainText('Dialogue reads clean');

  await expect(bar.getByRole('button', { name: 'Finish Polish Read' })).toBeDisabled();
  for (let i = 0; i < 20; i++) {
    const finish = bar.getByRole('button', { name: 'Finish Polish Read' });
    if (await finish.isEnabled()) break;
    await bar.getByRole('button', { name: 'Next page' }).click();
  }
  await bar.getByRole('button', { name: 'Finish Polish Read' }).click();
  await expect(page.getByRole('region', { name: 'Polish Read', exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const readiness = page.getByRole('region', { name: 'Export readiness' });
  await expect(readiness).toContainText('All pages read');
  await page.getByRole('dialog', { name: 'Export screenplay' }).getByRole('button', { name: 'Close' }).click();

  await page.waitForTimeout(1200);
  await page.reload();
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();
  await openPass(page, /POLISH/);
  await expect(page.getByRole('button', { name: 'Resume Polish Read' })).toBeVisible();
});

const PILOT = `Title: THE PILOT
Draft date: First draft

INT. WRITERS ROOM - DAY

The team argues about the cold open.

MAYA
Open on the fire, not the meeting.

EXT. STUDIO LOT - DAY

Golf carts weave between sound stages.

INT. STAGE 4 - DAY

The set is half struck.

INT. EDIT BAY - NIGHT

Frames flick past on the monitor.

EXT. PARKING LOT - NIGHT

Maya leaves last, again.

INT. NETWORK OFFICE - DAY

The verdict on the pilot lands.
`;

test('M7: import as a one-hour pilot — badge + pilot vocabulary (Studio extension)', async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 900 });
  await freshApp(page);

  await openImport(page);
  const dialog = page.getByRole('dialog', { name: 'Open a screenplay' });
  await dialog.getByRole('button', { name: /Paste screenplay/ }).click();
  await dialog.getByLabel(/Paste your script/).fill(PILOT);
  await dialog.getByLabel(/Format/).selectOption('one_hour');
  await dialog.getByRole('button', { name: /Import and replace draft/ }).click();

  const badge = page.locator('.format-badge');
  await expect(badge).toContainText('One-hour pilot');
  await expect(badge.locator('.ext-chip')).toBeVisible();

  await completeRead(page);
  await openPass(page, /STRUCTURE/);
  await page.getByRole('button', { name: 'Diagnose', exact: true }).click();
  await expect(page.locator('.pass-workspace')).toContainText(/act-out/i);

  await page.waitForTimeout(1200);
  await page.reload();
  await expect(page.locator('.format-badge')).toContainText('One-hour pilot');
});

test('M2R: the dotted chip is the editor — type the point directly on the card', async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 900 });
  await freshApp(page);
  await openBoardMode(page);

  const frame4 = page.locator('[data-card-frame="sc4"]');
  await frame4.getByRole('button', { name: 'No point yet' }).click();
  const editor = frame4.locator('.card-point-edit');
  await expect(editor).toBeFocused();
  await expect(editor).toHaveAttribute('placeholder', 'The point of this scene is…');
  await expect(page.locator('.sp-card-pop')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await editor.fill('Raúl shows what the water cost him.');
  await editor.press('Enter');
  await expect(frame4.locator('.card-point-edit')).toHaveCount(0);
  await expect(frame4).toContainText('Raúl shows what the water cost him.');

  await frame4.getByRole('button', { name: /Scene 4/ }).click();
  await openEvidence(page);
  await expect(page.locator('#sp-point')).toHaveValue('Raúl shows what the water cost him.');
});
