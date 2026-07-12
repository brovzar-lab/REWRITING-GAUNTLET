// Walks the full alpha journey (post-UX-repair) against the dev server on
// :5213, screenshotting every stage into docs/proof/alpha/, and saves the
// exported Fountain file. Wipes its demo data afterwards.
import { chromium } from '@playwright/test';
import { mkdirSync, copyFileSync } from 'node:fs';

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

// 1. The import menu: opening a script like an app, not a form.
await page.getByRole('button', { name: 'Import', exact: true }).click();
await shot('import-menu');
await page.getByRole('button', { name: 'Paste screenplay' }).click();
await page.getByLabel(/Paste your script/).fill(SCRIPT);
await page.getByText('Scenes: 3').waitFor();
await shot('import-paste-preview');
await page.getByRole('button', { name: 'Import and replace draft' }).click();

// 2. Clicking a pass opens the guided workspace — locked before the read.
await page.getByRole('button', { name: /11.*POLISH/ }).click();
await page.getByText('What this pass examines').waitFor();
await shot('pass-workspace-locked');

// 3. Annotated read with a margin note.
await page.getByRole('banner').getByRole('button', { name: 'Annotated read', exact: true }).click();
const readBar = page.getByRole('region', { name: 'Private annotated read' });
await readBar.getByLabel('Margin note').fill('Opening feels slow.');
await readBar.getByRole('button', { name: 'Save margin note' }).click();
await shot('annotated-read');
await readBar.getByRole('button', { name: 'Next scene' }).click();
await readBar.getByRole('button', { name: 'Next scene' }).click();
await readBar.getByRole('button', { name: 'Mark read complete' }).click();

// 4. A quick note from the status bar (note badge appears in the navigator).
await page.locator('.sp-action', { hasText: 'A taxi waits' }).click();
await page.locator('.status-bar').getByRole('button', { name: 'Add note' }).click();
await page.getByLabel('Note text').fill('Whose taxi? Plant it earlier.');
await page.getByRole('button', { name: 'Save note' }).click();
await shot('note-flow-and-badges');

// 5. Diagnose in the pass workspace: findings, queue, progress.
await page.getByRole('tab', { name: 'Rewrite pass' }).click();
await page.getByRole('button', { name: 'Diagnose', exact: true }).click();
await page.locator('.ai-finding').first().waitFor();
await shot('pass-workspace-findings');

// 6. Approve one, reject one.
await page.locator('.ai-finding').first().getByRole('button', { name: 'Approve' }).click();
await page.locator('.ai-finding.resolution-open').getByRole('button', { name: 'Reject' }).click();
await shot('approved-and-rejected');

// 7. Revision mark + provenance on the changed line.
await page.locator('.sp-action', { hasText: 'The radio hums.' }).click();
await page.getByRole('tab', { name: 'Evidence & Notes' }).click();
await page.getByText('Writer-confirmed').waitFor();
await shot('revision-mark-and-provenance');

// 8. Complete pass -> the summary.
await page.getByRole('tab', { name: 'Rewrite pass' }).click();
await page.getByRole('button', { name: 'Complete pass' }).click();
await page.getByRole('dialog', { name: /Polish pass complete/ }).waitFor();
await shot('pass-summary');

// 9. Export straight from the summary; capture the Fountain file.
const [download] = await Promise.all([
  page.waitForEvent('download'),
  (async () => {
    await page.getByRole('dialog', { name: /Polish pass complete/ }).getByRole('button', { name: 'Export now' }).click();
    await shot('export-menu');
    await page.getByRole('dialog', { name: 'Export screenplay' }).getByRole('button', { name: /Fountain/ }).click();
  })(),
]);
copyFileSync(await download.path(), `${out}/exported-the-ledger.fountain`);
console.log('saved exported-the-ledger.fountain');

// 10. Snapshot history with safe restore.
await page.getByRole('button', { name: 'History', exact: true }).click();
await page.getByRole('dialog', { name: 'Snapshots' }).getByText('After Polish pass').waitFor();
await shot('snapshot-history');
await page.getByRole('dialog', { name: 'Snapshots' }).getByRole('button', { name: 'Close', exact: true }).click();

// 11. Print view and the consent screen.
await page.getByRole('button', { name: 'Export', exact: true }).click();
await page.getByRole('button', { name: 'Print / PDF' }).click();
await page.locator('.print-page').first().waitFor();
await shot('print-view');
await page.getByRole('button', { name: 'Close print view' }).click();
await page.getByRole('tab', { name: 'Rewrite pass' }).click();
await page.getByRole('button', { name: 'AI settings', exact: true }).click();
await shot('ai-consent-screen');
await page.getByRole('button', { name: 'Close AI settings' }).click();

// 12. Day theme, same hierarchy.
await page.getByRole('button', { name: 'Day', exact: true }).click();
await shot('day-theme-workspace');

// Leave no demo data behind.
await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await browser.close();
console.log('proof pack complete in', out);
