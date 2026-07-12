// Walks the full alpha journey against the dev server on :5213,
// screenshotting every stage into docs/proof/alpha/, and saves the exported
// Fountain file. Wipes its demo data afterwards so Billy starts pristine.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';

const out = 'docs/proof/alpha';
mkdirSync(out, { recursive: true });

const SCRIPT = `Title: THE LEDGER
Draft date: First draft

INT. KITCHEN - NIGHT

Marta cooks.  The radio hums.

MARTA
Nobody comes home this late for good news.

EXT. STREET - NIGHT

A taxi waits  outside.

INT. HALLWAY - NIGHT

Keys tremble against the lock.
`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

let n = 0;
async function shot(name) {
  n += 1;
  const file = `${String(n).padStart(2, '0')}-${name}.png`;
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${out}/${file}` });
  console.log(`saved ${file}`);
}

await page.goto('http://localhost:5213');
await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await page.reload();
await page.waitForSelector('.sp-page .ProseMirror');

// 1. Import dialog with the pasted script and preview.
await page.getByRole('button', { name: 'Import', exact: true }).click();
await page.getByLabel(/Paste your script/).fill(SCRIPT);
await page.getByText('Scenes: 3').waitFor();
await shot('import-dialog');
await page.getByRole('button', { name: 'Import and replace draft' }).click();

// 2. AI Assist locked before the private read.
await page.getByRole('tab', { name: 'AI Assist' }).click();
await page.getByText(/Locked until/).waitFor();
await shot('ai-locked-before-read');

// 3. Annotated read with a margin note.
await page.getByRole('banner').getByRole('button', { name: 'Annotated read', exact: true }).click();
const readBar = page.getByRole('region', { name: 'Private annotated read' });
await readBar.getByLabel('Margin note').fill('Opening feels slow.');
await readBar.getByRole('button', { name: 'Save margin note' }).click();
await shot('annotated-read');
await readBar.getByRole('button', { name: 'Next scene' }).click();
await readBar.getByRole('button', { name: 'Next scene' }).click();
await readBar.getByRole('button', { name: 'Mark read complete' }).click();

// 4. Polish pass diagnosed: findings with citations and proposals.
await page.getByRole('button', { name: /11.*POLISH/ }).click();
await page.getByRole('button', { name: 'Diagnose', exact: true }).click();
await page.locator('.ai-finding').first().waitFor();
await shot('ai-findings-after-read');

// 5. Approve one, reject one.
await page.locator('.ai-finding').first().getByRole('button', { name: 'Approve' }).click();
await page.locator('.ai-finding.resolution-open').getByRole('button', { name: 'Reject' }).click();
await shot('approved-and-rejected');

// 6. Revision mark on the page + provenance in the inspector.
await page.locator('.sp-action', { hasText: 'The radio hums.' }).click();
await page.getByRole('tab', { name: 'Evidence & Notes' }).click();
await page.getByText('Writer-confirmed').waitFor();
await shot('revision-mark-and-provenance');

// 7. Complete the pass: tray state + Rewrite 1 label.
await page.getByRole('tab', { name: 'AI Assist' }).click();
await page.getByRole('button', { name: 'Complete pass' }).click();
await page.locator('.top-bar', { hasText: 'Rewrite 1' }).waitFor();
await shot('pass-complete-rewrite-1');

// 8. Export menu, then capture the exported Fountain.
await page.getByRole('button', { name: 'Export', exact: true }).click();
await shot('export-menu');
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('dialog', { name: 'Export screenplay' }).getByRole('button', { name: /Fountain/ }).click(),
]);
const path = await download.path();
copyFileSync(path, `${out}/exported-the-ledger.fountain`);
console.log('saved exported-the-ledger.fountain');

// 9. Print view (PDF via system dialog).
await page.getByRole('button', { name: 'Export', exact: true }).click();
await page.getByRole('button', { name: 'Print / PDF' }).click();
await page.locator('.print-page').first().waitFor();
await shot('print-view');
await page.getByRole('button', { name: 'Close print view' }).click();

// 10. AI settings / consent screen, and the Day theme for good measure.
await page.getByRole('tab', { name: 'AI Assist' }).click();
await page.getByRole('button', { name: 'AI settings', exact: true }).click();
await shot('ai-consent-screen');
await page.getByRole('button', { name: 'Close AI settings' }).click();
await page.getByRole('button', { name: 'Day', exact: true }).click();
await shot('day-theme-workspace');

// Leave no demo data behind.
await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await browser.close();
console.log('proof pack complete in', out);
