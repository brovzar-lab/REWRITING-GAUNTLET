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
});
