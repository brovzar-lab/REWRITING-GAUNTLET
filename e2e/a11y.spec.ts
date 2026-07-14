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
      await page.getByLabel('Appearance').selectOption(theme.toLowerCase());
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
    .locator('.rail-item')
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
  // Tab through the default workstation regions: menu bar, workspace rail,
  // the screenplay editor, and the contextual right panel.
  for (let i = 0; i < 160; i++) {
    const region = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      if (el.closest('.app-menubar')) return 'menubar';
      if (el.closest('.workspace-rail')) return 'rail';
      if (el.closest('.left-panel')) return 'left';
      if (el.closest('.ProseMirror') || el.classList.contains('ProseMirror')) return 'editor';
      if (el.closest('.right-panel')) return 'right';
      return null;
    });
    if (region) reached.add(region);
    if (reached.has('menubar') && reached.has('rail') && reached.has('editor') && reached.has('right')) break;
    await page.keyboard.press(region === 'editor' ? 'Escape' : 'Tab');
  }
  expect([...reached]).toEqual(expect.arrayContaining(['menubar', 'rail', 'editor', 'right']));
});
