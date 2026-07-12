import { expect, test, type Page } from '@playwright/test';

/** Visual + UX realignment acceptance (2026-07-12 plan). */

async function freshApp(page: Page) {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
  await page.reload();
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();
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
  });
});
