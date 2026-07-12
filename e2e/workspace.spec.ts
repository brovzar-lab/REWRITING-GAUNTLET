import { expect, test, type Page } from '@playwright/test';

async function freshApp(page: Page) {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
  await page.reload();
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();
}

test.describe('workspace', () => {
  test('loads the full rewrite room on one screen', async ({ page }) => {
    await freshApp(page);
    await expect(page.getByRole('heading', { name: 'Rewrite Studio' })).toBeVisible();
    // Screenplay page with real content
    await expect(page.locator('.sp-scene_heading').first()).toHaveText('EXT. HIGHWAY 2 - SONORAN DESERT - DAY');
    // Navigator: three acts, 16 scenes
    await expect(page.locator('.act-header')).toHaveCount(3);
    await expect(page.locator('.scene-row')).toHaveCount(16);
    // Pass tray: the 11 Epps passes in order
    const chips = page.locator('.ds-pass-chip');
    await expect(chips).toHaveCount(11);
    await expect(chips.first()).toContainText('FOUNDATION');
    await expect(chips.last()).toContainText('POLISH');
    // Board: one card per scene + 7 connections
    await expect(page.locator('.ds-story-card')).toHaveCount(16);
    await expect(page.locator('[data-connection-id]')).toHaveCount(7);
  });

  test('Day and Night themes switch the workspace but never the paper (Page Rule)', async ({ page }) => {
    await freshApp(page);
    const paper = page.locator('.sp-page');
    const nightPaper = await paper.evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.getByLabel('Appearance').selectOption('day');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'day');
    const dayPaper = await paper.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(dayPaper).toBe(nightPaper); // warm paper in both themes
    // Identical hierarchy: same panels present in both themes
    await expect(page.locator('.scene-navigator')).toBeVisible();
    await expect(page.locator('.evidence-inspector')).toBeVisible();
    await expect(page.locator('.pass-tray')).toBeVisible();
  });

  test('navigator click travels to the scene and selects it everywhere', async ({ page }) => {
    await freshApp(page);
    await page.locator('.scene-navigator').getByRole('button', { name: /^8 INT\. MUNICIPAL ARCHIVE - DAY/ }).click();
    // Board card highlights with non-color marker
    const card = page.locator('[data-scene-card="sc7"]');
    await expect(card).toHaveAttribute('aria-pressed', 'true');
    await expect(card.locator('.card-selected-marker')).toBeVisible();
    // Inspector shows the scene context
    await expect(page.locator('.inspector-context')).toContainText('INT. MUNICIPAL ARCHIVE - DAY');
  });

  test('selecting a screenplay line reveals its evidence with source and claim labels', async ({ page }) => {
    await freshApp(page);
    // Click Raúl's buyout dialogue line (sc4-e4)
    await page.locator('[data-element-id="sc4-e4"]').click();
    const inspector = page.locator('.evidence-inspector');
    await expect(inspector).toContainText('Raúl’s buyout offer lands before');
    await expect(inspector.locator('.source-chip').first()).toHaveText('Reader');
    await expect(inspector).toContainText('Ana P.');
    await expect(inspector).toContainText('Reader reaction');
    await expect(inspector).toContainText('Priority concern');
    // The board card for scene 4 carries the selection
    await expect(page.locator('[data-scene-card="sc4"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('Final Draft keyboard flow: Tab retypes, Enter advances element', async ({ page }) => {
    await freshApp(page);
    const action = page.locator('[data-element-id="sc1-e2"]');
    await action.click();
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-element-id="sc1-e2"]')).toHaveAttribute('data-element-type', 'character');
    await page.keyboard.press('Tab'); // character -> transition
    await page.keyboard.press('Tab'); // transition -> scene_heading
    await page.keyboard.press('Tab'); // scene_heading -> action (back where we began)
    await expect(page.locator('[data-element-id="sc1-e2"]')).toHaveAttribute('data-element-type', 'action');
    // Enter after a character creates a dialogue element
    await page.locator('[data-element-id="sc2-e3"]').click();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    const scene2Types = page.locator('[data-scene-id="sc2"][data-element-type]');
    await expect(scene2Types.nth(2)).toHaveAttribute('data-element-type', 'character'); // sc2-e3
    await expect(scene2Types.nth(3)).toHaveAttribute('data-element-type', 'dialogue'); // newly created
  });

  test('board card is keyboard-draggable (Space, arrows, Space)', async ({ page }) => {
    await freshApp(page);
    const firstCardBefore = await page.locator('.card-row .ds-story-card').first().getAttribute('data-scene-card');
    expect(firstCardBefore).toBe('sc1');
    await page.locator('[data-scene-card="sc1"]').focus();
    await page.keyboard.press('Space');
    for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    const firstCardAfter = await page.locator('.card-row .ds-story-card').first().getAttribute('data-scene-card');
    expect(firstCardAfter).not.toBe('sc1');
    // Navigator reflects the new scene order (renumbered)
    await expect(page.locator('.scene-row').first()).not.toContainText('HIGHWAY 2');
  });

  test('focus mode strips to page and tray; full-board mode expands the board', async ({ page }) => {
    await freshApp(page);
    await page.getByRole('button', { name: 'Focus mode' }).click();
    await expect(page.locator('.scene-navigator')).toBeHidden();
    await expect(page.locator('.board')).toBeHidden();
    await expect(page.locator('.sp-page')).toBeVisible();
    await expect(page.locator('.pass-tray')).toBeVisible();
    await page.getByRole('button', { name: 'Exit focus mode' }).click();
    await page.getByRole('button', { name: 'Full board' }).click();
    await expect(page.locator('.middle.board-only .board')).toBeVisible();
    await expect(page.locator('.sp-page')).toBeHidden();
    await page.getByRole('button', { name: 'Exit full board' }).click();
    await expect(page.locator('.sp-page')).toBeVisible();
  });

  test('Spanish interface localizes chrome without touching screenplay text', async ({ page }) => {
    await freshApp(page);
    await page.getByRole('button', { name: 'ES', exact: true }).click();
    await expect(page.locator('.act-header').first()).toHaveText('PRIMER ACTO');
    await expect(page.locator('.pass-tray')).toContainText('Pasadas de reescritura');
    // Screenplay content untouched
    await expect(page.locator('.sp-scene_heading').first()).toHaveText('EXT. HIGHWAY 2 - SONORAN DESERT - DAY');
  });

  test('active rewrite pass persists as a visible working state', async ({ page }) => {
    await freshApp(page);
    const chip = page.getByRole('button', { name: /CHARACTER/ });
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
  });
});
