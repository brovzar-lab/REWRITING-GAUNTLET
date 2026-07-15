import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { freshApp, rail, openScenes, openBoardMode, openPasses } from './helpers';

/** Acceptance for the WriterDuet-informed Journey / IA realignment. */

test('once a script is open, Project collapses to a chip and the page gets the width', async ({ page }) => {
  await freshApp(page);
  // No permanent Project panel: development real estate belongs to the page.
  await expect(page.locator('.project-panel')).toHaveCount(0);
  // Script title + draft + save state stay visible in the top bar.
  await expect(page.locator('.project-chip')).toContainText('LAS GARZAS');
  await expect(page.locator('.app-menubar .save-indicator')).toBeVisible();
  // Project management is one click away: the chip opens the drawer.
  await page.locator('.project-chip').click();
  const drawer = page.locator('.project-panel');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('button', { name: 'Open Project' })).toBeVisible();
  await expect(drawer.getByRole('button', { name: 'Import…' })).toBeVisible();
  await expect(drawer.getByRole('button', { name: 'New Project' })).toBeVisible();
  // Clicking the chip again collapses it.
  await page.locator('.project-chip').click();
  await expect(page.locator('.project-panel')).toHaveCount(0);
  // The journey strip begins with the Private read (no Script stage).
  await expect(page.locator('.journey-strip .js-stage').first()).toContainText('Private read');
  await expect(page.locator('.journey-strip .js-stage.is-current')).toContainText('Private read');
  // The scene list is NOT the default left column, and the pass tray is gone.
  await expect(page.locator('.scene-navigator')).toHaveCount(0);
  await expect(page.locator('.pass-tray')).toHaveCount(0);
});

test('the script stays visually central and scenes open on demand', async ({ page }) => {
  await freshApp(page);
  // Editor occupies the center region.
  const center = page.locator('.center-region .sp-page');
  await expect(center).toBeVisible();
  // Scenes are a workspace you open, with search.
  await openScenes(page);
  await expect(page.locator('.scene-navigator .scene-search')).toBeVisible();
  await page.locator('.scene-navigator .scene-search').fill('CANAL');
  await expect(page.locator('.scene-navigator .scene-row')).toHaveCount(1);
});

test('rewrite passes are one action away and the active pass says what to do', async ({ page }) => {
  await freshApp(page);
  await openPasses(page);
  // The 11 passes are promoted to a strip at the top.
  await expect(page.locator('.pass-strip .ds-pass-chip')).toHaveCount(11);
  await page.locator('.pass-strip').getByRole('button', { name: /STRUCTURE/ }).click();
  const workspace = page.locator('[data-pass-workspace="structure"]');
  await expect(workspace).toBeVisible();
  await expect(workspace).toContainText('Objective');
  await expect(workspace).toContainText('What this pass examines');
});

test('the board is a mode, reachable and dismissible, never wedged by default', async ({ page }) => {
  await freshApp(page);
  await expect(page.locator('.center-region > .board')).toHaveCount(0);
  await openBoardMode(page);
  await expect(page.locator('.center-region > .board')).toBeVisible();
  await expect(page.locator('.sp-page')).toHaveCount(0);
  await rail(page, 'Board').click(); // toggle back
  await expect(page.locator('.sp-page')).toBeVisible();
});

test('layout modes reconfigure the workspace', async ({ page }) => {
  await freshApp(page);
  await page.getByLabel('Layout').selectOption('focus');
  await expect(page.locator('.workspace-rail')).toHaveCount(0);
  await expect(page.locator('.sp-page')).toBeVisible();
  await page.getByLabel('Layout').selectOption('workbench');
  await expect(page.locator('.workspace-rail')).toBeVisible();
});

test('the journey strip advances as the writer works', async ({ page }) => {
  await freshApp(page);
  // Current stage is the private read; the continue pill starts it.
  await expect(page.locator('.journey-strip .js-stage.is-current')).toContainText('Private read');
  await page.locator('.journey-strip').getByRole('button', { name: 'Start your private read' }).click();
  await expect(page.getByRole('region', { name: 'Private annotated read' })).toBeVisible();
});

test('scene rows keep number, slug, and page as separate aligned regions', async ({ page }) => {
  await freshApp(page);
  await openScenes(page);
  const row = page.locator('.scene-row').first();
  // Three distinct visible regions, never one concatenated string.
  await expect(row.locator('.scene-number')).toHaveText('1');
  await expect(row.locator('.scene-slug')).toContainText('EXT.');
  await expect(row.locator('.scene-page')).toHaveText(/^p\.\s*1$/);
  // The page ref sits to the right of the slug on the same line (no collision,
  // no wrap into a stacked block).
  const slug = await row.locator('.scene-slug').boundingBox();
  const pageRef = await row.locator('.scene-page').boundingBox();
  const rowBox = await row.boundingBox();
  expect(pageRef!.x).toBeGreaterThanOrEqual(slug!.x + slug!.width - 1);
  expect(rowBox!.height).toBeLessThan(36);
});

test('only the selected workspace carries the strong rail active state', async ({ page }) => {
  await freshApp(page);
  // First open: no left panel, nothing explicitly selected — at most a quiet
  // dot on region-active items, never a strong bar.
  await expect(page.locator('.rail-item.is-active')).toHaveCount(0);
  await expect(rail(page, 'Read')).not.toHaveClass(/is-active/);
  // Selecting Scenes gives it the single strong state.
  await openScenes(page);
  await expect(page.locator('.rail-item.is-active')).toHaveCount(1);
  await expect(rail(page, 'Scenes')).toHaveClass(/is-active/);
});

test('the Scenes workspace is axe-clean in Day and Night', async ({ page }) => {
  await freshApp(page);
  await openScenes(page);
  for (const theme of ['day', 'night']) {
    await page.getByLabel('Appearance').selectOption(theme);
    await expect(page.locator('.scene-row').first()).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      results.violations.map((v) => ({ theme, id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  }
});

test('Day and Night both work in the new shell', async ({ page }) => {
  await freshApp(page);
  await page.getByLabel('Appearance').selectOption('day');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'day');
  await expect(page.locator('.app-menubar')).toBeVisible();
  await expect(page.locator('.project-chip')).toBeVisible();
  await page.getByLabel('Appearance').selectOption('night');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
});
