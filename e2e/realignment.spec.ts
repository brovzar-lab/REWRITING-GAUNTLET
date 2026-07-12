import { expect, test, type Page } from '@playwright/test';

/** Visual + UX realignment acceptance (2026-07-12 plan). */

async function freshApp(page: Page) {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
  await page.reload();
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();
}

const SCRIPT = `Title: THE LEDGER
Draft date: First draft

INT. KITCHEN - NIGHT

Marta cooks.  The radio hums.

MARTA
Nobody comes home this late for good news.

EXT. STREET - NIGHT

A taxi waits  outside.
`;

async function pasteImport(page: Page) {
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Open a screenplay' });
  await dialog.getByRole('button', { name: 'Paste screenplay' }).click();
  await dialog.getByLabel(/Paste your script/).fill(SCRIPT);
  await dialog.getByRole('button', { name: 'Import and replace draft' }).click();
  await expect(page.locator('.top-bar')).toContainText('THE LEDGER');
}

async function diagnosePolish(page: Page) {
  await page.getByRole('banner').getByRole('button', { name: 'Annotated read', exact: true }).click();
  const readBar = page.getByRole('region', { name: 'Private annotated read' });
  await readBar.getByRole('button', { name: 'Next scene' }).click();
  await readBar.getByRole('button', { name: 'Mark read complete' }).click();
  await page.getByRole('button', { name: /11.*POLISH/ }).click();
  await page.getByRole('button', { name: 'Diagnose', exact: true }).click();
  await expect(page.locator('.ai-finding')).toHaveCount(2);
}

test.describe('visual realignment', () => {
  test('board sits beside the script on desktop and drops to a bottom drawer when narrow', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await freshApp(page);
    const editorBox = await page.locator('.editor-panel').boundingBox();
    const boardBox = await page.locator('.board-panel').boundingBox();
    expect(boardBox).not.toBeNull();
    expect(boardBox!.x).toBeGreaterThan(editorBox!.x + editorBox!.width - 8);
    await expect(page.locator('.board-shelf')).toHaveCount(0);

    await page.setViewportSize({ width: 1100, height: 900 });
    await expect(page.locator('.board-shelf .board')).toBeVisible();
    await expect(page.locator('.board-panel')).toHaveCount(0);
  });

  test('board shows act headers and a selected scene highlights its card', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await freshApp(page);
    await expect(page.locator('.board-act-header')).toHaveCount(3);
    await page.locator('.scene-row').nth(1).click();
    await expect(page.locator('.ds-story-card.is-selected')).toHaveCount(1);
    await expect(page.locator('.ds-story-card.is-selected')).toContainText('2');
    // Scene selection reaches all three surfaces: script, board, inspector.
    await expect(page.locator('.inspector-context')).toContainText(/kitchen/i);
  });

  test('clicking a pass opens the pass control surface', async ({ page }) => {
    await freshApp(page);
    await page.locator('.ds-pass-chip').nth(1).click();
    const openPass = page.getByRole('button', { name: /open pass/i });
    await expect(openPass).toBeVisible();
    await expect(page.locator('.tray-detail')).toContainText('Focus');
    await openPass.click();
    await expect(page.getByRole('tab', { name: /rewrite pass/i })).toHaveAttribute('aria-selected', 'true');
  });

  test('a line with a note shows a marker and links to board and evidence', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await freshApp(page);
    await pasteImport(page);
    // Add a note through the UI on the first action line.
    await page.locator('.sp-action', { hasText: 'Marta cooks.' }).click();
    await page.locator('.status-bar').getByRole('button', { name: 'Add note' }).click();
    await page.getByLabel('Note text').fill('The radio should already be broken.');
    await page.getByRole('button', { name: 'Save note' }).click();

    const marker = page.locator('.sp-note-marker').first();
    await expect(marker).toBeVisible();
    await marker.click();
    await expect(page.getByRole('tab', { name: /evidence/i })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.ds-story-card.is-selected')).toHaveCount(1);
    await expect(page.locator('.evidence-card.is-linked')).toBeVisible();
  });

  test('evidence Go to script selects the exact cited line', async ({ page }) => {
    await freshApp(page);
    await pasteImport(page);
    await diagnosePolish(page);
    const first = page.locator('.ai-finding').first();
    const cited = await first.getAttribute('data-cited-element');
    expect(cited).toBeTruthy();
    await first.getByRole('button', { name: /Go to script/ }).first().click();
    await expect(page.locator(`.sp-selected[data-element-id="${cited}"]`)).toBeVisible();
  });
});
