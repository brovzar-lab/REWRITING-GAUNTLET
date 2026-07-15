import { expect, test } from '@playwright/test';
import { freshApp, rail, openScenes, openBoardMode, openEvidence, openPass } from './helpers';

test.describe('workspace', () => {
  test('opens on the Project workspace with the script centered, scenes not the default column', async ({ page }) => {
    await freshApp(page);
    await expect(page.locator('.app-menubar')).toBeVisible();
    await expect(page.locator('.sp-scene_heading').first()).toHaveText('EXT. HIGHWAY 2 - SONORAN DESERT - DAY');
    // Project is the default left workspace; Open / Import are right there.
    await expect(page.locator('.project-panel')).toBeVisible();
    await expect(rail(page, 'Project')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.project-panel').getByRole('button', { name: 'Open Project' })).toBeVisible();
    // The journey strip carries "what to do next" under the toolbar.
    await expect(page.locator('.journey-strip')).toBeVisible();
    // The scene list is NOT the permanent left column, and the pass tray is gone.
    await expect(page.locator('.scene-navigator')).toHaveCount(0);
    await expect(page.locator('.pass-tray')).toHaveCount(0);
  });

  test('Day and Night themes switch the chrome but never the paper (Page Rule)', async ({ page }) => {
    await freshApp(page);
    const paper = page.locator('.sp-page');
    const nightPaper = await paper.evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.getByLabel('Appearance').selectOption('day');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'day');
    const dayPaper = await paper.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(dayPaper).toBe(nightPaper);
    await expect(page.locator('.project-panel')).toBeVisible();
    await expect(page.locator('.right-panel')).toBeVisible();
  });

  test('the Scenes workspace navigates, and the board reflects the selection', async ({ page }) => {
    await freshApp(page);
    await openScenes(page);
    await expect(page.locator('.scene-navigator')).toBeVisible();
    await page.locator('.scene-navigator .scene-row', { hasText: 'MUNICIPAL ARCHIVE - DAY' }).first().click();
    await expect(page.locator('.scene-row.is-selected')).toContainText('MUNICIPAL ARCHIVE');
    await openBoardMode(page);
    await expect(page.locator('[data-scene-card="sc7"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-scene-card="sc7"] .card-selected-marker')).toBeVisible();
  });

  test('selecting a line and opening Evidence shows source and claim labels', async ({ page }) => {
    await freshApp(page);
    await page.locator('[data-element-id="sc4-e4"]').click();
    await openEvidence(page);
    const inspector = page.locator('.evidence-inspector');
    await expect(inspector).toContainText('Raúl’s buyout offer lands before');
    await expect(inspector.locator('.source-chip').first()).toHaveText('Reader');
    await expect(inspector).toContainText('Ana P.');
    await expect(inspector).toContainText('Priority concern');
  });

  test('Final Draft keyboard flow: Tab retypes, Enter advances element', async ({ page }) => {
    await freshApp(page);
    const action = page.locator('[data-element-id="sc1-e2"]');
    await action.click();
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-element-id="sc1-e2"]')).toHaveAttribute('data-element-type', 'character');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-element-id="sc1-e2"]')).toHaveAttribute('data-element-type', 'action');
    await page.locator('[data-element-id="sc2-e3"]').click();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    const scene2Types = page.locator('[data-scene-id="sc2"][data-element-type]');
    await expect(scene2Types.nth(2)).toHaveAttribute('data-element-type', 'character');
    await expect(scene2Types.nth(3)).toHaveAttribute('data-element-type', 'dialogue');
  });

  test('board card is keyboard-draggable in board mode (Space, arrows, Space)', async ({ page }) => {
    await freshApp(page);
    await openBoardMode(page);
    const firstBefore = await page.locator('.card-row .ds-story-card').first().getAttribute('data-card-frame');
    expect(firstBefore).toBe('sc1');
    await page.locator('[data-scene-card="sc1"]').focus();
    await page.keyboard.press('Space');
    for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    const firstAfter = await page.locator('.card-row .ds-story-card').first().getAttribute('data-card-frame');
    expect(firstAfter).not.toBe('sc1');
  });

  test('layout modes: Focus strips the chrome, Board expands the board', async ({ page }) => {
    await freshApp(page);
    await page.getByLabel('Layout').selectOption('focus');
    await expect(page.locator('.workspace-rail')).toHaveCount(0);
    await expect(page.locator('.right-panel')).toHaveCount(0);
    await expect(page.locator('.sp-page')).toBeVisible();
    await page.getByLabel('Layout').selectOption('board');
    await expect(page.locator('.center-region > .board')).toBeVisible();
    await expect(page.locator('.sp-page')).toHaveCount(0);
    await page.getByLabel('Layout').selectOption('workbench');
    await expect(page.locator('.sp-page')).toBeVisible();
  });

  test('Spanish interface localizes chrome without touching screenplay text', async ({ page }) => {
    await freshApp(page);
    await page.getByRole('button', { name: 'ES', exact: true }).click();
    await page.getByRole('button', { name: 'Escenas', exact: true }).click();
    await expect(page.locator('.act-header').first()).toHaveText('PRIMER ACTO');
    await expect(page.locator('.sp-scene_heading').first()).toHaveText('EXT. HIGHWAY 2 - SONORAN DESERT - DAY');
  });

  test('active rewrite pass persists as a visible working state', async ({ page }) => {
    await freshApp(page);
    await openPass(page, /CHARACTER/);
    await expect(page.locator('.pass-strip').getByRole('button', { name: /CHARACTER/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.pass-workspace')).toContainText('Character');
  });
});
