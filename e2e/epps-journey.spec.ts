import { expect, test } from '@playwright/test';
import { freshApp, rail } from './helpers';

/** Acceptance for the Epps journey cleanup: journey strip, grouped rail,
    Private Read mode with marks, and the Notes intake screen. */

test('journey strip shows the eight development stages and drives navigation', async ({ page }) => {
  await freshApp(page);
  const strip = page.getByRole('navigation', { name: 'Rewrite journey' });
  // Script intake is project management (chip / File menu), not a dev stage.
  await expect(strip.locator('.js-stage')).toHaveCount(8);
  await expect(strip.locator('.js-stage').first()).toContainText('Private read');
  // Stages are never locked: jump straight to Game plan.
  await strip.getByRole('button', { name: /Game plan/ }).click();
  await expect(page.locator('.right-context .gameplan-panel, .right-context')).toBeVisible();
});

test('grouped rail: Read enters the locked private read', async ({ page }) => {
  await freshApp(page);
  await expect(page.locator('.rail-group-label').first()).toHaveText('Journey');
  await expect(page.locator('.rail-divider')).toHaveCount(1);
  await rail(page, 'Read').click();
  await expect(page.getByText(/Reading — editing is off/i)).toBeVisible();
  // Hard lock: the page is not editable during the sitting.
  await expect(page.locator('.sp-page .ProseMirror[contenteditable="false"]')).toBeVisible();
});

test('marks flow from the read into the Notes You lane', async ({ page }) => {
  await freshApp(page);
  await rail(page, 'Read').click();
  await expect(page.getByRole('complementary', { name: 'Mark' })).toBeVisible();
  // Select a line, press G for Great stuff.
  await page.locator('.sp-page .sp-action').first().click();
  await page.keyboard.press('g');
  await expect(page.locator('.sp-mark-great')).toHaveCount(1);
  await expect(page.locator('.sp-mark-tag-great')).toContainText('GREAT STUFF');
  // Pause and open Notes (stage 3): the You lane counts the mark, separately.
  await page.getByRole('button', { name: 'Pause read' }).click();
  await page.locator('.journey-strip').getByRole('button', { name: /Notes/ }).click();
  await expect(page.locator('.ni-you-title')).toHaveText('Your private read');
  await expect(page.locator('.ni-you-note')).toContainText('1');
});

test('notes intake caps at five readers, quarantines remedies, protects what worked', async ({ page }) => {
  await freshApp(page);
  await page.locator('.journey-strip').getByRole('button', { name: /Notes/ }).click();
  await expect(page.locator('.ni-reader-slot')).toHaveCount(5);
  await expect(page.getByText(/Ask permission before recording/)).toBeVisible();
  await expect(page.getByText(/Tag notes after the session/)).toBeVisible();
  // Add a reader inline and capture a note (defaults to symptom).
  await page.locator('.ni-reader-slot').first().click();
  await page.getByPlaceholder('Reader name…').fill('Rodrigo');
  await page.keyboard.press('Enter');
  await page.getByPlaceholder(/Type a note/).fill('The second act sags');
  await page.keyboard.press('Enter');
  await expect(page.locator('.ni-note')).toHaveCount(1);
  // Retag as their remedy — visually quarantined, kept.
  await page.getByRole('button', { name: /Their remedy/ }).click();
  await expect(page.locator('.ni-note.ni-note-remedy')).toHaveCount(1);
  // Praise lands in the protected pane.
  await page.getByPlaceholder(/Type a note/).fill('The kitchen scene sings');
  await page.keyboard.press('Enter');
  await page.locator('.ni-note').last().getByRole('button', { name: /What worked/ }).click();
  await expect(page.getByRole('complementary', { name: /What worked/ })).toContainText('The kitchen scene sings');
});

test('what worked stays pinned in the passes workspace', async ({ page }) => {
  await freshApp(page);
  await page.locator('.journey-strip').getByRole('button', { name: /Notes/ }).click();
  await page.locator('.ni-reader-slot').first().click();
  await page.getByPlaceholder('Reader name…').fill('Ana');
  await page.keyboard.press('Enter');
  await page.getByPlaceholder(/Type a note/).fill('The opening image lands');
  await page.keyboard.press('Enter');
  await page.locator('.ni-note').getByRole('button', { name: /What worked/ }).click();
  await rail(page, 'Rewrite passes').click();
  const pin = page.locator('.ww-pin');
  await expect(pin).toContainText('1');
  await pin.getByRole('button').click();
  await expect(pin).toContainText('The opening image lands');
});
