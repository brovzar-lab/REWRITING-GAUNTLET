// Journey / IA realignment proof pack into docs/proof/ia/. Dev server on :5213.
//   cd /Users/quantumcode/CODE/REWRITING-GAUNTLET && node scripts/proof-ia.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = 'docs/proof/ia';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });

async function shot(file) {
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${out}/${file}` });
  console.log(`saved ${file}`);
}
const railBtn = (name) => page.getByRole('navigation', { name: 'Workspaces' }).getByRole('button', { name, exact: true });

await page.goto('http://127.0.0.1:5213');
await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await page.reload();
await page.waitForSelector('.sp-page .ProseMirror');

// 1. First open: Project workspace, script centered, journey guide.
await shot('01-first-open-project.png');
await page.getByLabel('Appearance').selectOption('day');
await shot('01b-first-open-day.png');
await page.getByLabel('Appearance').selectOption('night');

// 2. Rewrite pass: pass strip up top + pass workspace beside the script.
await railBtn('Rewrite passes').click();
await page.locator('.pass-strip').getByRole('button', { name: /STRUCTURE/ }).click();
await shot('03-rewrite-pass-active.png');

// 3. Board mode: board center + maps on the right.
await railBtn('Board').click();
await page.locator('[data-card-frame="sc4"]').getByLabel('High point').selectOption('midpoint');
await shot('04-board-mode.png');
await railBtn('Board').click(); // back to workbench

// 4. Scenes workspace with search.
await railBtn('Scenes').click();
await shot('05-scenes-workspace.png');

// 5. Project panel with a document open.
await railBtn('Project').click();
await page.locator('.project-panel').getByRole('button', { name: 'Private pad' }).click();
await shot('06-project-panel.png');

// 6. Focus layout.
await page.getByLabel('Layout').selectOption('focus');
await shot('07-layout-focus.png');
await page.getByLabel('Layout').selectOption('workbench');

// 7. Top menu open (File), then New Project → the empty "Open or import" state.
await page.getByRole('toolbar', { name: 'Menu' }).getByRole('button', { name: 'File' }).click();
await shot('08-file-menu.png');
await page.getByRole('menuitem', { name: 'New Project' }).click();
await page.waitForSelector('.empty-script');
await shot('09-empty-open-or-import.png');

await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await browser.close();
console.log('ia proof done');
