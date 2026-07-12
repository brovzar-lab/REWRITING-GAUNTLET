import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Axe scans of every surface the alpha added, in both themes:
    import dialog, annotated read bar, AI Assist panel (locked), AI settings
    (consent screen), and the export menu. */

async function expectClean(page: Page, surface: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.map((v) => ({ surface, id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
}

for (const theme of ['Night', 'Day'] as const) {
  test(`alpha surfaces axe-clean in ${theme} theme`, async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
    await page.reload();
    await page.getByRole('button', { name: theme, exact: true }).click();
    await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();

    // Import menu, then the paste step with a preview showing.
    await page.getByRole('button', { name: 'Import', exact: true }).click();
    await expectClean(page, 'import-menu');
    await page.getByRole('button', { name: 'Paste screenplay' }).click();
    await page.getByLabel(/Paste your script/).fill('INT. ROOM - DAY\n\nA table.\n');
    await expect(page.getByText('Scenes: 1')).toBeVisible();
    await expectClean(page, 'import-paste-step');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();

    // AI Assist tab in its locked state.
    await page.getByRole('tab', { name: 'AI Assist' }).click();
    await expect(page.getByText(/Locked until/)).toBeVisible();
    await expectClean(page, 'ai-locked');

    // AI settings / consent screen.
    await page.getByRole('button', { name: 'AI settings', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'AI settings' })).toBeVisible();
    await expectClean(page, 'ai-settings');
    await page.getByRole('button', { name: 'Close AI settings' }).click();

    // Annotated read bar.
    await page.getByRole('banner').getByRole('button', { name: 'Annotated read', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Private annotated read' })).toBeVisible();
    await expectClean(page, 'read-bar');
    await page.getByRole('button', { name: 'Exit read', exact: true }).click();

    // Export menu.
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Export screenplay' })).toBeVisible();
    await expectClean(page, 'export-menu');
    await page.getByRole('button', { name: 'Close', exact: true }).click();
  });
}
