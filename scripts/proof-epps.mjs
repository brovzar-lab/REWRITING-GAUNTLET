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
await page.locator('#sp-point').fill('The wake reopens the ledger Marisol swore she closed.');
await page.getByRole('button', { name: 'Earns it' }).click();
await page.locator('.sp-dynamics summary').click();
await page.getByLabel('Conflict').fill('Grief vs arithmetic.');
await page.getByLabel('Turn', { exact: true }).fill('She pockets the ledger instead of burning it.');

// A second scene marked as a cut candidate, surfaced in the Scene pass.
await board.getByRole('button', { name: /Scene 3/ }).click();
await page.locator('#sp-point').fill('A drive-by of the cemetery.');
await page.getByRole('button', { name: 'Cut candidate' }).click();
await board.getByRole('button', { name: /Scene 2/ }).click();
await shot('02-scene-point.png');

await page.getByRole('button', { name: /8.*SCENE/ }).click();
await shot('02b-scene-pass-cutlist.png');

// M2R2: the dotted chip is the editor — typing happens inside the card.
const frame4 = page.locator('[data-card-frame="sc4"]');
await frame4.evaluate((el) => el.scrollIntoView({ block: 'center' }));
await frame4.getByRole('button', { name: 'No point yet' }).click();
const editor = frame4.locator('.card-point-edit');
await editor.fill('Raúl shows what the water cost him.');
await shot('02c-inline-editor-open.png');
await editor.press('Enter');
await frame4.getByRole('button', { name: /Scene 4/ }).click();
await page.getByRole('tab', { name: 'Evidence & Notes' }).click();
await page.locator('.scene-point-card').getByRole('button', { name: 'Unsure' }).click();
await frame4.evaluate((el) => el.scrollIntoView({ block: 'center' }));
await shot('02d-inline-saved-inspector-matches.png');

// M3: Set-Up / Pay-off — marked directly on the line, mapped in full board.
await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await page.reload();
await page.waitForSelector('.sp-page .ProseMirror');

const markBar = page.locator('.status-beats');
// Mark an action line as a set-up directly from its status bar.
await page.locator('.sp-page .sp-action').first().click();
await markBar.getByRole('button', { name: 'Set-up' }).click();
await shot('03-setup-marked-on-line.png');

// A pay-off, plus an unpaid set-up and an orphan pay-off to show every status.
await page.locator('[data-scene-card="sc3"]').click();
await markBar.getByRole('button', { name: 'Pay-off' }).click();
await page.locator('[data-scene-card="sc5"]').click();
await markBar.getByRole('button', { name: 'Set-up' }).click();
await page.locator('[data-scene-card="sc7"]').click();
await markBar.getByRole('button', { name: 'Pay-off' }).click();

await page.getByRole('region', { name: 'Story Board' }).first().getByRole('button', { name: 'Full board' }).click();
const map = page.getByRole('region', { name: 'Set-Up / Pay-off Map' });
await map.locator('.map-row', { hasText: 'Set-up · Scene 1' }).getByLabel(/Pair with a pay-off/).selectOption({ label: 'Scene 3' });
await shot('03b-setup-payoff-map.png');

// M4: Four High Points placed on cards + momentum strip (full board).
await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await page.reload();
await page.waitForSelector('.sp-page .ProseMirror');
await page.getByRole('region', { name: 'Story Board' }).first().getByRole('button', { name: 'Full board' }).click();
await page.locator('[data-card-frame="sc4"]').getByLabel('High point').selectOption('midpoint');
await page.locator('[data-card-frame="sc8"]').getByLabel('High point').selectOption('act_two_end');
await page.locator('[data-card-frame="sc2"]').getByLabel('High point').selectOption('emotional_high');
await page.locator('[data-card-frame="sc6"]').getByLabel('High point').selectOption('emotional_low');
await shot('04-high-points-momentum.png');
await page.getByRole('button', { name: 'Exit full board' }).click();

// M5: methodology tools surfaced inside a pass workspace (Structure).
await page.getByRole('button', { name: /4.*STRUCTURE/ }).click();
await shot('05-pass-workspace-integration.png');

// M6: Polish Read in progress, then export readiness.
await page.getByRole('button', { name: /11.*POLISH/ }).click();
await page.getByRole('button', { name: 'Start Polish Read' }).click();
await shot('06-polish-read.png');
const polishBar = page.getByRole('region', { name: 'Polish Read', exact: true });
for (let i = 0; i < 20; i++) {
  const finish = polishBar.getByRole('button', { name: 'Finish Polish Read' });
  if (await finish.isEnabled()) break;
  await polishBar.getByRole('button', { name: 'Next page' }).click();
}
await polishBar.getByRole('button', { name: 'Finish Polish Read' }).click();
await page.getByRole('button', { name: 'Export', exact: true }).click();
await shot('07-export-readiness.png');
await page.getByRole('dialog', { name: 'Export screenplay' }).getByRole('button', { name: 'Close' }).click();

// M7: TV pilot adapter (Studio extension) — import as a one-hour pilot.
await page.getByRole('button', { name: 'Import', exact: true }).click();
const dialog = page.getByRole('dialog', { name: 'Open a screenplay' });
await dialog.getByRole('button', { name: /Paste screenplay/ }).click();
await dialog.getByLabel(/Paste your script/).fill(
  'Title: THE PILOT\n\nINT. WRITERS ROOM - DAY\n\nThe team argues about the cold open.\n\nEXT. STUDIO LOT - DAY\n\nGolf carts weave between sound stages.\n\nINT. STAGE 4 - DAY\n\nThe set is half struck.\n\nINT. NETWORK OFFICE - DAY\n\nThe verdict lands.\n',
);
await dialog.getByLabel(/Format/).selectOption('one_hour');
await shot('08-tv-adapter-import.png');
await dialog.getByRole('button', { name: /Import and replace draft/ }).click();
await page.locator('.scene-row').first().click();
await page.waitForTimeout(300);
await shot('08b-tv-adapter-badge.png');

// Leave no demo data behind.
await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await browser.close();
console.log('epps proof pack done');
