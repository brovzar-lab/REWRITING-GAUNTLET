// Exports test .fdx files from the running app (port 5213) into docs/validation/
// so you can open them in the real Final Draft and confirm fidelity.
// Captures the actual Export → Final Draft (.fdx) path a writer uses.
//
//   cd /Users/quantumcode/CODE/REWRITING-GAUNTLET && node scripts/export-validation-fdx.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = 'docs/validation';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

async function exportFdx(file) {
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Export screenplay' });
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    dialog.getByRole('button', { name: /Final Draft/ }).click(),
  ]);
  await download.saveAs(`${out}/${file}`);
  console.log(`saved ${file}`);
}

await page.goto('http://127.0.0.1:5213');
await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await page.reload();
await page.waitForSelector('.sp-page .ProseMirror');

// 1. The shipped sample as a feature (no sidecar metadata at all).
await exportFdx('rewrite-studio-sample-feature.fdx');

// 2. A one-hour pilot, so you can confirm the docFormat comment stays invisible
//    inside Final Draft's pages.
await page.getByRole('button', { name: 'Import', exact: true }).click();
const dialog = page.getByRole('dialog', { name: 'Open a screenplay' });
await dialog.getByRole('button', { name: /Paste screenplay/ }).click();
await dialog.getByLabel(/Paste your script/).fill(
  'Title: THE PILOT\nDraft date: First draft\n\nINT. WRITERS ROOM - DAY\n\nThe team argues about the cold open.\n\nMAYA\n(leaning in)\nOpen on the fire, not the meeting.\n\nEXT. STUDIO LOT - DAY\n\nGolf carts weave between sound stages.\n\nSMASH CUT TO:\n\nINT. STAGE 4 - DAY\n\nThe set is half struck.\n',
);
await dialog.getByLabel(/Format/).selectOption('one_hour');
await dialog.getByRole('button', { name: /Import and replace draft/ }).click();
await exportFdx('rewrite-studio-pilot-onehour.fdx');

await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await browser.close();
console.log('validation FDX export done');
