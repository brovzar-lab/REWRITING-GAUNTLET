import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
  await page.reload();
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();
});

test('Mod-1..6 retype the current element directly', async ({ page }) => {
  const line = page.locator('[data-element-id="sc1-e2"]'); // action
  await line.click();
  await page.keyboard.press('ControlOrMeta+3');
  await expect(page.locator('[data-element-id="sc1-e2"]')).toHaveAttribute('data-element-type', 'character');
  await page.keyboard.press('ControlOrMeta+2');
  await expect(page.locator('[data-element-id="sc1-e2"]')).toHaveAttribute('data-element-type', 'action');
});

test('smart-type suggests cast names in a character cue', async ({ page }) => {
  // Start a fresh cue: click Marisol's cue in scene 2, Enter twice -> dialogue -> character
  await page.locator('[data-element-id="sc2-e3"]').click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter'); // new dialogue
  await page.keyboard.press('Enter'); // new character cue
  await page.keyboard.type('LU');
  const popup = page.locator('.smart-type-popup');
  await expect(popup).toBeVisible();
  await expect(popup.locator('[role="option"]').first()).toHaveText('LUPITA');
  await page.keyboard.press('Enter');
  await expect(popup).toBeHidden();
  // the accepted cue is LUPITA and Enter moved on to dialogue
  const cues = page.locator('[data-scene-id="sc2"][data-element-type="character"]');
  await expect(cues.nth(1)).toHaveText('LUPITA');
});

test('Mod-ArrowDown/Up jump between scene headings', async ({ page }) => {
  await page.locator('[data-element-id="sc1-e2"]').click();
  await page.keyboard.press('ControlOrMeta+ArrowDown');
  const sel = await page.evaluate(() => {
    const s = window.getSelection();
    return (s?.anchorNode?.parentElement?.closest('[data-element-type]') as HTMLElement)?.dataset.elementId;
  });
  expect(sel).toBe('sc2-e1');
});

test('Mod-G jumps to a page', async ({ page }) => {
  await page.locator('.ProseMirror').click();
  await page.keyboard.press('ControlOrMeta+g');
  const dialog = page.getByRole('dialog', { name: /Go to page/ });
  await expect(dialog).toBeVisible();
  await page.locator('#goto-page-input').fill('3');
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  // the editor scrolled to page 3: its header is now in the viewport
  await expect(page.locator('.sp-page-header').filter({ hasText: /^3\.$/ })).toBeInViewport();
});

test('revision set: marks edited lines, labels the header, survives reload', async ({ page }) => {
  await page.locator('#rev-select').selectOption('Blue');
  await page.getByTestId('rev-start').click();
  await expect(page.getByTestId('rev-end')).toContainText('Blue');

  const line = page.locator('[data-element-id="sc2-e5"]');
  await line.click();
  await page.keyboard.press('End');
  await page.keyboard.type(' AND EVERY LITER.');
  await expect(line).toHaveClass(/sp-revised/);

  // Navigator marks the scene as revised (icon + accessible label, not color)
  const row2 = page.locator('.scene-row').nth(1);
  await expect(row2.locator('.scene-revised')).toBeVisible();

  // Page headers carry the revision label
  await expect(page.locator('.sp-rev-label').first()).toHaveText('REV. BLUE');

  // Survives reload
  await page.waitForTimeout(1200);
  await page.reload();
  await expect(page.locator('[data-element-id="sc2-e5"]')).toHaveClass(/sp-revised/);
  await expect(page.getByTestId('rev-end')).toContainText('Blue');

  // Ending the set clears the marks
  await page.getByTestId('rev-end').click();
  await expect(page.locator('[data-element-id="sc2-e5"]')).not.toHaveClass(/sp-revised/);
});
