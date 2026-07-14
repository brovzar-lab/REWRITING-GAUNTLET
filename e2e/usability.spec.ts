import { expect, test } from '@playwright/test';

/** The Alpha UX Repair acceptance checks, exactly as Billy listed them. */

const SCRIPT = `Title: THE LEDGER
Draft date: First draft

INT. KITCHEN - NIGHT

Marta cooks.  The radio hums.

MARTA
Nobody comes home this late for good news.

EXT. STREET - NIGHT

A taxi waits  outside.
`;

async function freshApp(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
  await page.reload();
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();
}

async function pasteImport(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Open a screenplay' });
  await dialog.getByRole('button', { name: 'Paste screenplay' }).click();
  await dialog.getByLabel(/Paste your script/).fill(SCRIPT);
  await dialog.getByRole('button', { name: 'Import and replace draft' }).click();
  await expect(page.locator('.top-bar')).toContainText('THE LEDGER');
}

test('clicking a pass visibly changes the workspace', async ({ page }) => {
  await freshApp(page);
  // Before: the inspector shows evidence, no pass workspace.
  await expect(page.locator('[data-pass-workspace]')).toHaveCount(0);
  await page.getByRole('button', { name: /^2 CHARACTER/ }).click();
  // After: the guided workspace is open on the Character pass.
  const workspace = page.locator('[data-pass-workspace="character"]');
  await expect(workspace).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Rewrite pass' })).toHaveAttribute('aria-selected', 'true');
  await expect(workspace.getByText('Pass 2 of 11')).toBeVisible();
  await expect(workspace.getByText('Objective')).toBeVisible();
  await expect(workspace.getByText('What this pass examines')).toBeVisible();
  await expect(workspace.getByRole('button', { name: /Next: 3 Story and Theme/ })).toBeVisible();
});

test('note count updates after annotating a line', async ({ page }) => {
  await freshApp(page);
  await pasteImport(page);
  await expect(page.locator('.scene-notes')).toHaveCount(0);
  await page.locator('.sp-action', { hasText: 'Marta cooks.' }).click();
  await page.locator('.status-bar').getByRole('button', { name: 'Add note' }).click();
  await page.getByLabel('Note text').fill('The radio should already be broken.');
  await page.getByRole('button', { name: 'Save note' }).click();
  const badge = page.locator('.scene-notes');
  await expect(badge).toHaveCount(1);
  await expect(badge).toHaveText('1');
  await expect(badge).toHaveAccessibleName('Notes: 1');
});

test('completing a pass shows a clear summary', async ({ page }) => {
  await freshApp(page);
  await pasteImport(page);
  await page.getByRole('banner').getByRole('button', { name: 'Annotated read', exact: true }).click();
  const readBar = page.getByRole('region', { name: 'Private annotated read' });
  await readBar.getByRole('button', { name: 'Next scene' }).click();
  await readBar.getByRole('button', { name: 'Mark read complete' }).click();
  await page.getByRole('button', { name: /11.*POLISH/ }).click();
  await page.getByRole('button', { name: 'Diagnose', exact: true }).click();
  await expect(page.locator('.ai-finding')).toHaveCount(2);
  await page.locator('.ai-finding').first().getByRole('button', { name: 'Approve' }).click();
  await page.getByRole('button', { name: 'Complete pass' }).click();

  const summary = page.getByRole('dialog', { name: /Polish pass complete/ });
  await expect(summary).toBeVisible();
  await expect(summary.getByText('Approved changes: 1')).toBeVisible();
  await expect(summary.getByText('Rejected proposals: 0')).toBeVisible();
  await expect(summary.getByText('Unresolved concerns: 1')).toBeVisible();
  await expect(summary.getByText(/Snapshot created: After Polish pass/)).toBeVisible();
  await expect(summary.getByText(/Draft label updated: Rewrite 1/)).toBeVisible();
  await expect(summary.getByRole('button', { name: 'Export now' })).toBeVisible();
  await expect(summary.getByRole('button', { name: 'Close' })).toBeVisible();
});

test('the import menu exposes every import choice', async ({ page }) => {
  await freshApp(page);
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Open a screenplay' });
  await expect(dialog.getByRole('button', { name: 'Paste screenplay' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Open Fountain file' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Open Final Draft file' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Open PDF (best effort)' })).toBeVisible();
});

test('the snapshot history is reachable and lists restorable versions', async ({ page }) => {
  await freshApp(page);
  await pasteImport(page); // creates the "Before import" snapshot
  await page.getByRole('button', { name: 'History', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'History' });
  await expect(dialog).toBeVisible();
  // The draft that was just replaced is right there, restorable.
  await expect(dialog.getByText('Before import: LAS GARZAS')).toBeVisible();
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();

  // Complete-pass snapshots join the list.
  await page.getByRole('banner').getByRole('button', { name: 'Annotated read', exact: true }).click();
  const readBar = page.getByRole('region', { name: 'Private annotated read' });
  await readBar.getByRole('button', { name: 'Next scene' }).click();
  await readBar.getByRole('button', { name: 'Mark read complete' }).click();
  await page.getByRole('button', { name: /11.*POLISH/ }).click();
  await page.getByRole('button', { name: 'Diagnose', exact: true }).click();
  await expect(page.locator('.ai-finding')).toHaveCount(2);
  await page.getByRole('button', { name: 'Complete pass' }).click();
  await page.getByRole('dialog', { name: /Polish pass complete/ }).getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: 'History', exact: true }).click();
  const passRow = dialog.locator('.history-row', { hasText: 'After Polish pass' });
  await expect(passRow).toBeVisible();
  await passRow.getByRole('button', { name: 'Restore', exact: true }).click();
  await expect(dialog.getByText(/saved as a safety snapshot/)).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Yes, restore' })).toBeVisible();
});

test('the screenplay page stays visually centered and substantial', async ({ page }) => {
  // Wide enough that the paper truly fits its column. Centering used to be
  // asserted at 1280, but that only passed because flex centering clipped
  // both paper edges (scene numbers unreachable). When the paper does not
  // fit, it now left-aligns and scrolls — covered by the realignment
  // narrow-window test.
  await page.setViewportSize({ width: 1900, height: 900 });
  await freshApp(page);
  const pageBox = (await page.locator('.sp-page').boundingBox())!;
  const editorBox = (await page.locator('.sp-page-scroller').boundingBox())!;
  const leftGap = pageBox.x - editorBox.x;
  const rightGap = editorBox.x + editorBox.width - (pageBox.x + pageBox.width);
  expect(Math.abs(leftGap - rightGap)).toBeLessThan(40); // horizontally centered
  expect(pageBox.width).toBeGreaterThan(700); // a real page, not a preview card
  // The page fills most of the editor column's visible height.
  expect(pageBox.height).toBeGreaterThan(editorBox.height * 0.8);
  // The selected line is visibly marked on the paper.
  await page.locator('[data-element-id="sc2-e5"]').click();
  await expect(page.locator('[data-element-id="sc2-e5"]')).toHaveClass(/sp-selected/);
});
