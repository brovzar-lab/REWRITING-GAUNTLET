import { chromium } from '@playwright/test';

const out = 'docs/proof/slice-1';
const browser = await chromium.launch();
const page = await browser.newPage();

async function shot(theme, width, height, name) {
  await page.setViewportSize({ width, height });
  await page.goto('http://localhost:5213');
  await page.waitForSelector('.sp-page .ProseMirror');
  await page.getByRole('button', { name: theme, exact: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(`saved ${name}.png`);
}

await shot('Night', 1280, 800, 'night-1280');
await shot('Day', 1280, 800, 'day-1280');
await shot('Night', 1920, 1080, 'night-1920');
await shot('Day', 1920, 1080, 'day-1920');

// Reload-recovery proof: type a marker, reload, screenshot the recovered text.
await page.setViewportSize({ width: 1280, height: 800 });
await page.goto('http://localhost:5213');
await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await page.reload();
await page.waitForSelector('[data-element-id="sc2-e5"]');
await page.click('[data-element-id="sc2-e5"]');
await page.keyboard.press('End');
await page.keyboard.type(' PROOF: THIS EDIT SURVIVED A RELOAD.');
await page.waitForTimeout(1200);
await page.reload();
await page.waitForSelector('[data-element-id="sc2-e5"]');
const text = await page.textContent('[data-element-id="sc2-e5"]');
console.log('after reload, line reads:', text);
await page.click('[data-element-id="sc2-e5"]');
await page.screenshot({ path: `${out}/reload-recovery.png` });
// Clean the demo edit out of local storage so Billy starts pristine.
await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await browser.close();
