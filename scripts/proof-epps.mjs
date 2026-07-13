// Captures the Epps methodology phase proof pack against the dev server on
// :5213 at 1600×900, into docs/proof/epps/. Wipes its demo data afterwards.
// Shots accumulate slice by slice; today: M1 (01 Night + Day twin).
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = 'docs/proof/epps';
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

// M1: a filled Game Plan + Compass with exact-line links.
await page.locator('.sp-page .sp-action').first().click();
await page.getByRole('tab', { name: 'Game plan' }).click();
await page.getByLabel('Statement of intent').fill('Make Marisol drive every scene she is in.');
await page.getByLabel('What the script is about').fill('A daughter who counts everything except what her father cost her.');
await page.getByLabel('What this rewrite improves').fill('Act Two momentum and the Marisol–Raúl opposition.');
await page.getByLabel('What must not be lost').fill('The kitchen scene. The herons. The quiet ending.');
await page.getByLabel(/Target audience/).fill('Adult drama, festival-first, Spanish-English crossover.');
await page.getByLabel(/Emotional truth/).fill('You cannot audit your way out of grief.');
await page.getByLabel('Touchstone').fill('The empty heron nest at dawn.');
await page.getByLabel('Ticking clock', { exact: true }).fill('The bank forecloses in ten days.');
await page.getByRole('button', { name: 'Link current line' }).click();
await page.getByLabel('Theme through action').fill('Marisol stops counting and starts listening.');
await page.getByLabel('Motif name').fill('Herons');
await page.getByRole('button', { name: 'Add motif' }).click();
await page.getByRole('button', { name: /Mark current line/ }).click();

// Shot 01: the Objective half (statement of intent + EXT-labeled fields).
await page.locator('.inspector-tabpanel').evaluate((el) => el.scrollTo(0, 0));
await shot('01-game-plan.png');

// Day-mode twin: identical hierarchy in both themes.
await page.getByLabel('Appearance').selectOption('day');
await shot('01b-game-plan-day.png');
await page.getByLabel('Appearance').selectOption('night');

// Shot 01c: the Compass half (touchstone, linked clock, theme, motif occurrence).
await page.locator('.game-plan .inspector-section').last().scrollIntoViewIfNeeded();
await shot('01c-game-plan-compass.png');

// M2: Scene Point card + board chips + writer-marked cut candidates.
// Fresh state so the "No point yet" chips are honest.
await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await page.reload();
await page.waitForSelector('.sp-page .ProseMirror');

const board = page.getByRole('region', { name: 'Story Board' }).first();
await board.getByRole('button', { name: /Scene 2/ }).click();
await page.getByRole('tab', { name: 'Evidence & Notes' }).click();
await page.getByLabel('Scene point').fill('The wake reopens the ledger Marisol swore she closed.');
await page.getByRole('button', { name: 'Earns it' }).click();
await page.locator('.sp-dynamics summary').click();
await page.getByLabel('Conflict').fill('Grief vs arithmetic.');
await page.getByLabel('Turn', { exact: true }).fill('She pockets the ledger instead of burning it.');

// A second scene marked as a cut candidate, surfaced in the Scene pass.
await board.getByRole('button', { name: /Scene 3/ }).click();
await page.getByLabel('Scene point').fill('A drive-by of the cemetery.');
await page.getByRole('button', { name: 'Cut candidate' }).click();
await board.getByRole('button', { name: /Scene 2/ }).click();
await shot('02-scene-point.png');

await page.getByRole('button', { name: /8.*SCENE/ }).click();
await shot('02b-scene-pass-cutlist.png');

// Leave no demo data behind.
await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await browser.close();
console.log('epps proof pack done');
