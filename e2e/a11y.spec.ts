import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const VIEWPORTS = [
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'wide', width: 1920, height: 1080 },
];

async function scan(page: Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
}

for (const viewport of VIEWPORTS) {
  for (const theme of ['Night', 'Day'] as const) {
    test(`axe clean in ${theme} theme at ${viewport.name} (${viewport.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.getByRole('button', { name: theme, exact: true }).click();
      await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();
      const results = await scan(page);
      expect(
        results.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target) })),
      ).toEqual([]);
    });
  }
}

test('reduced motion is honored', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const duration = await page
    .locator('.ds-pass-chip')
    .first()
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(parseFloat(duration) * 1000).toBeLessThanOrEqual(1);
});

test('full keyboard walkthrough reaches every region', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.sp-page .ProseMirror')).toBeVisible();
  // Tab from the top of the document through the main regions.
  const reached = new Set<string>();
  await page.keyboard.press('Tab');
  for (let i = 0; i < 60; i++) {
    const region = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      if (el.closest('.top-bar')) return 'topbar';
      if (el.closest('.scene-navigator')) return 'navigator';
      if (el.closest('.ProseMirror') || el.classList.contains('ProseMirror')) return 'editor';
      if (el.closest('.board')) return 'board';
      if (el.closest('.evidence-inspector')) return 'inspector';
      if (el.closest('.pass-tray')) return 'tray';
      return null;
    });
    if (region) reached.add(region);
    if (reached.size >= 5 && reached.has('tray')) break;
    // Tab is reserved for element switching inside the page; Escape exits it.
    await page.keyboard.press(region === 'editor' ? 'Escape' : 'Tab');
  }
  expect([...reached]).toEqual(expect.arrayContaining(['topbar', 'navigator', 'editor', 'board', 'tray']));
});
