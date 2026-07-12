// Captures the Visual + UX Realignment proof pack against the dev server on
// :5213 at 1600×900, into docs/proof/realign/. Wipes its demo data afterwards.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = 'docs/proof/realign';
mkdirSync(out, { recursive: true });

const SCRIPT = `Title: THE LEDGER
Draft date: First draft

INT. KITCHEN - NIGHT

Marta cooks.  The radio hums.

MARTA
Nobody comes home this late for good news.

EXT. STREET - NIGHT

A taxi waits  outside.
`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

async function shot(file) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${file}` });
  console.log(`saved ${file}`);
}

await page.goto('http://localhost:5213');
await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await page.reload();
await page.waitForSelector('.sp-page .ProseMirror');

// 1–2. The full room on the sample screenplay: pass active, line selected.
await page.getByRole('button', { name: /^2 CHARACTER/ }).click();
await page.locator('.scene-row').nth(1).click();
await shot('01-night-workspace.png');
await page.getByLabel('Appearance').selectOption('day');
await shot('02-day-workspace.png');
await page.getByLabel('Appearance').selectOption('night');

// 3. Line ↔ board ↔ evidence: the sample note's marker links all three surfaces.
await page.locator('.sp-note-marker').first().click();
await page.locator('.evidence-card.is-linked').first().waitFor();
await shot('03-line-board-evidence-link.png');

// 4. The tray's active-pass control surface (already open on Character).
await shot('04-pass-tray-open.png');

// 6. Import menu (captured before the demo import replaces the sample).
await page.getByRole('button', { name: 'Import', exact: true }).click();
await shot('06-import-menu.png');
await page.getByRole('button', { name: 'Paste screenplay' }).click();
await page.getByLabel(/Paste your script/).fill(SCRIPT);
await page.getByRole('button', { name: 'Import and replace draft' }).click();
await page.locator('.top-bar').getByText('THE LEDGER').waitFor();

// 7. The guided private annotated read, margin note saved.
await page.getByRole('banner').getByRole('button', { name: 'Annotated read', exact: true }).click();
const readBar = page.getByRole('region', { name: 'Private annotated read' });
await readBar.getByLabel('Margin note').fill('Opening feels slow.');
await readBar.getByRole('button', { name: 'Save margin note' }).click();
await shot('07-annotated-read.png');
await readBar.getByRole('button', { name: 'Next scene' }).click();
await readBar.getByRole('button', { name: 'Mark read complete' }).click();

// 5. The structured Rewrite Concern card, after a Polish diagnose.
await page.getByRole('button', { name: /11.*POLISH/ }).click();
await page.getByRole('button', { name: 'Diagnose', exact: true }).click();
await page.locator('.ai-finding').first().waitFor();
await shot('05-evidence-panel.png');

// Leave no demo data behind.
await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await browser.close();
console.log('realignment proof pack complete in', out);
