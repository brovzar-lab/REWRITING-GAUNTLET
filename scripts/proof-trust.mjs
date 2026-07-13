// Captures the Trust & Testability Repair proof pack against the dev server
// on :5213 at 1600×900, into docs/proof/trust/. Wipes its demo data afterwards.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = 'docs/proof/trust';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

async function shot(file) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${file}` });
  console.log(`saved ${file}`);
}

await page.goto('http://127.0.0.1:5213');
await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await page.reload();
await page.waitForSelector('.sp-page .ProseMirror');

// 1–2. The repaired page break: full paper width, both themes.
await page.locator('.sp-page-gap').first().scrollIntoViewIfNeeded();
await shot('01-page-break-night.png');
await page.getByLabel('Appearance').selectOption('day');
await shot('02-page-break-day.png');
await page.getByLabel('Appearance').selectOption('night');

// 3–5. The full approve/reject loop on the shipped sample.
await page.getByRole('banner').getByRole('button', { name: 'Annotated read', exact: true }).click();
const readBar = page.getByRole('region', { name: 'Private annotated read' });
for (let i = 0; i < 15; i++) {
  await readBar.getByRole('button', { name: 'Next scene' }).click();
}
await readBar.getByRole('button', { name: 'Mark read complete' }).click();
await page.locator('#rev-select').selectOption('Blue');
await page.getByTestId('rev-start').click();
await page.getByRole('button', { name: /11.*POLISH/ }).click();
await page.getByRole('button', { name: 'Diagnose', exact: true }).click();
const approvable = page.locator('.ai-finding').filter({ has: page.getByRole('button', { name: 'Approve' }) });
await approvable.first().waitFor();
await shot('03-approve-loop-proposal.png');
const cited = await approvable.first().getAttribute('data-cited-element');
await approvable.first().getByRole('button', { name: 'Approve' }).click();
await page.locator(`[data-element-id="${cited}"]`).scrollIntoViewIfNeeded();
await shot('04-approve-loop-applied.png');
await page.locator('.ai-finding.resolution-open').first().getByRole('button', { name: 'Reject' }).click();
await shot('05-reject-archived.png');

// 6–7. Narrow window and raised zoom: the paper stays reachable.
await page.setViewportSize({ width: 900, height: 700 });
await page.locator('.sp-page-scroller').evaluate((el) => {
  el.scrollLeft = 0;
  el.scrollTop = 0;
});
await shot('06-narrow-900.png');
for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Zoom in' }).click();
await page.locator('.sp-page-scroller').evaluate((el) => {
  el.scrollLeft = 0;
});
await shot('07-zoom-140.png');

// Leave no demo data behind.
await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await browser.close();
console.log('trust proof pack complete in', out);
