import { expect, type Page } from '@playwright/test';

/** Shared navigation for the WriterDuet-informed workstation IA. */

export async function freshApp(page: Page) {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
  await page.reload();
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();
}

export function rail(page: Page, name: string) {
  return page.getByRole('navigation', { name: 'Workspaces' }).getByRole('button', { name, exact: true });
}

export const openScenes = (p: Page) => rail(p, 'Scenes').click();
export const openBoardMode = (p: Page) => rail(p, 'Board').click();
export const openEvidence = (p: Page) => rail(p, 'Evidence').click();
export const openGamePlan = (p: Page) => rail(p, 'Game plan').click();
export const openPasses = (p: Page) => rail(p, 'Rewrite passes').click();
export const openProject = (p: Page) => rail(p, 'Project').click();

/** Open the import dialog via the File menu (works regardless of panel state). */
export async function openImport(page: Page) {
  await page.getByRole('toolbar', { name: 'Menu' }).getByRole('button', { name: 'File' }).click();
  await page.getByRole('menuitem', { name: 'Import…' }).click();
}

export async function openHistory(page: Page) {
  await rail(page, 'History').click();
}

/** Select a rewrite pass by name; opens the pass strip first. */
export async function openPass(page: Page, name: string | RegExp) {
  await openPasses(page);
  await page.locator('.pass-strip').getByRole('button', { name }).click();
}

/** Do the private annotated read to completion (unlocks AI). */
export async function completeRead(page: Page) {
  await page.getByRole('button', { name: 'Start read' }).click();
  const bar = page.getByRole('region', { name: 'Private annotated read' });
  for (let i = 0; i < 30; i++) {
    const next = bar.getByRole('button', { name: 'Next scene' });
    if (!(await next.isEnabled())) break;
    await next.click();
  }
  await bar.getByRole('button', { name: 'Mark read complete' }).click();
}
