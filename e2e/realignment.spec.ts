import { expect, test, type Page } from '@playwright/test';
import { freshApp, openImport, openBoardMode, openEvidence, openPass, completeRead } from './helpers';

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
  await openImport(page);
  const dialog = page.getByRole('dialog', { name: 'Open a screenplay' });
  await dialog.getByRole('button', { name: 'Paste screenplay' }).click();
  await dialog.getByLabel(/Paste your script/).fill(SCRIPT);
  await dialog.getByRole('button', { name: 'Import and replace draft' }).click();
  await expect(page.locator('.project-panel')).toContainText('THE LEDGER');
}

async function diagnosePolish(page: Page) {
  await completeRead(page);
  await openPass(page, /POLISH/);
  await page.getByRole('button', { name: 'Diagnose', exact: true }).click();
  await expect(page.locator('.ai-finding')).toHaveCount(2);
}

test.describe('visual realignment', () => {
  test('the board is a mode, not permanent furniture beside the script', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await freshApp(page);
    await expect(page.locator('.center-region > .board')).toHaveCount(0);
    await expect(page.locator('.sp-page')).toBeVisible();
    await openBoardMode(page);
    await expect(page.locator('.center-region > .board')).toBeVisible();
    await expect(page.locator('.sp-page')).toHaveCount(0);
  });

  test('board mode shows act headers and a selected scene highlights its card', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await freshApp(page);
    await openBoardMode(page);
    await expect(page.locator('.board-act-header')).toHaveCount(3);
    await page.locator('[data-scene-card="sc2"]').click();
    await expect(page.locator('.ds-story-card.is-selected')).toHaveCount(1);
    await openEvidence(page);
    await expect(page.locator('.inspector-context')).toContainText(/kitchen/i);
  });

  test('clicking a pass opens the pass control surface', async ({ page }) => {
    await freshApp(page);
    await openPass(page, /CHARACTER/);
    await expect(page.locator('[data-pass-workspace="character"]')).toBeVisible();
    await expect(page.locator('.pass-workspace')).toContainText('Objective');
  });

  test('a line with a note shows a marker and links to evidence', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await freshApp(page);
    await pasteImport(page);
    await page.locator('.sp-action', { hasText: 'Marta cooks.' }).click();
    await page.locator('.status-bar').getByRole('button', { name: 'Add note' }).click();
    await page.getByLabel('Note text').fill('The radio should already be broken.');
    await page.getByRole('button', { name: 'Save note' }).click();

    const marker = page.locator('.sp-note-marker').first();
    await expect(marker).toBeVisible();
    await marker.click();
    await expect(page.locator('.evidence-inspector')).toBeVisible();
    await expect(page.locator('.evidence-card.is-linked')).toBeVisible();
  });

  test('disabled controls are visibly disabled', async ({ page }) => {
    await freshApp(page);
    const prev = page.getByRole('button', { name: 'Previous page' });
    await expect(prev).toBeDisabled();
    expect(await prev.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeLessThan(0.7);
    const revStart = page.getByTestId('rev-start');
    await expect(revStart).toBeDisabled();
    expect(await revStart.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeLessThan(0.7);
  });

  test('narrow windows and high zoom keep the page reachable', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 700 });
    await freshApp(page);
    const scroller = page.locator('.sp-page-scroller');
    await scroller.evaluate((el) => {
      el.scrollLeft = 0;
    });
    let paper = (await page.locator('.sp-page').boundingBox())!;
    let box = (await scroller.boundingBox())!;
    expect(paper.x).toBeGreaterThanOrEqual(box.x - 1);
    expect(await scroller.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeGreaterThan(0);

    for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Zoom in' }).click();
    await scroller.evaluate((el) => {
      el.scrollLeft = 0;
    });
    paper = (await page.locator('.sp-page').boundingBox())!;
    box = (await scroller.boundingBox())!;
    expect(paper.x).toBeGreaterThanOrEqual(box.x - 1);
    await page.getByRole('button', { name: 'Reset zoom' }).click();

    await page.setViewportSize({ width: 640, height: 700 });
    await scroller.evaluate((el) => {
      el.scrollLeft = 0;
    });
    paper = (await page.locator('.sp-page').boundingBox())!;
    box = (await scroller.boundingBox())!;
    expect(paper.x).toBeGreaterThanOrEqual(box.x - 1);
  });

  test('the shipped sample demonstrates the full approve loop', async ({ page }) => {
    test.slow();
    await freshApp(page);
    await completeRead(page);
    await page.locator('#rev-select').selectOption('Blue');
    await page.getByTestId('rev-start').click();
    await openPass(page, /POLISH/);
    await page.getByRole('button', { name: 'Diagnose', exact: true }).click();
    const approvable = page.locator('.ai-finding').filter({ has: page.getByRole('button', { name: 'Approve' }) });
    await expect(approvable.first()).toBeVisible();
    const cited = await approvable.first().getAttribute('data-cited-element');
    await approvable.first().getByRole('button', { name: 'Approve' }).click();
    await expect(page.locator(`[data-element-id="${cited}"]`)).toHaveClass(/sp-revised/);
    await page.locator(`[data-element-id="${cited}"]`).click();
    await openEvidence(page);
    await expect(page.getByText('Writer-confirmed').first()).toBeVisible();
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
