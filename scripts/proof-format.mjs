// Format Fidelity Pass proof shots into docs/proof/format/. Dev server on :5213.
//   cd /Users/quantumcode/CODE/REWRITING-GAUNTLET && node scripts/proof-format.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = 'docs/proof/format';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

async function shot(file) {
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${file}` });
  console.log(`saved ${file}`);
}

await page.goto('http://127.0.0.1:5213');
await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await page.reload();
await page.waitForSelector('.sp-page .ProseMirror');

// 1. Import menu — every choice, including PDF (best effort) with its caveat.
await page.getByRole('button', { name: 'Import', exact: true }).click();
await shot('01-import-menu.png');

// 2. PDF best-effort preview + honest warning.
const content =
  'BT /F1 12 Tf 72 720 Td (INT. NEWSROOM - NIGHT) Tj 0 -20 Td (Phones ring in the dark.) Tj 0 -20 Td (EDITOR) Tj 0 -14 Td (Hold the front page.) Tj ET';
const pdf = `%PDF-1.4\n4 0 obj<</Length ${content.length}>>\nstream\n${content}\nendstream\nendobj\n%%EOF\n`;
await page.setInputFiles('[data-testid="import-file-pdf"]', {
  name: 'script.pdf',
  mimeType: 'application/pdf',
  buffer: Buffer.from(pdf, 'latin1'),
});
await page.getByText(/Best effort/i).waitFor();
await shot('02-pdf-best-effort-warning.png');

await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await browser.close();
console.log('format proof done');
