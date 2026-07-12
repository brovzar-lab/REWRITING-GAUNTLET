import { chromium } from '@playwright/test';

const out = 'docs/proof/slice-2';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

async function fresh() {
  await page.goto('http://localhost:5213');
  await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
  await page.reload();
  await page.waitForSelector('.sp-page .ProseMirror');
}

// 1) Day + Night at 1280 and 1920
await fresh();
for (const [theme, w, h] of [['Night', 1280, 800], ['Day', 1280, 800], ['Night', 1920, 1080], ['Day', 1920, 1080]]) {
  await page.setViewportSize({ width: w, height: h });
  await page.getByRole('button', { name: theme, exact: true }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${theme.toLowerCase()}-${w}.png` });
  console.log(`saved ${theme.toLowerCase()}-${w}.png`);
}

// 2) Page-2 boundary close-up (gap, header, page number)
await page.setViewportSize({ width: 1280, height: 800 });
await page.getByRole('button', { name: 'Night', exact: true }).click();
const header2 = page.locator('.sp-page-header').first();
await header2.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await page.screenshot({ path: `${out}/page-2-boundary.png` });
console.log('saved page-2-boundary.png');

// 3) (MORE)/(CONT'D) split
const more = page.locator('.sp-more').first();
await more.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await page.screenshot({ path: `${out}/more-contd.png` });
console.log('saved more-contd.png, MORE text:', await more.textContent(), '| CONTD:', await page.locator('.sp-contd').first().textContent());

// 4) Revision set: start Blue, edit, show asterisk + header label + navigator mark
await page.locator('#rev-select').selectOption('Blue');
await page.getByTestId('rev-start').click();
const line = page.locator('[data-element-id="sc2-e5"]');
await line.click();
await page.keyboard.press('End');
await page.keyboard.type(' AND EVERY LITER.');
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/revision-marks.png` });
console.log('saved revision-marks.png, revised class:', await line.getAttribute('class'));

// 5) Smart-type popup
await page.locator('[data-element-id="sc2-e3"]').click();
await page.keyboard.press('End');
await page.keyboard.press('Enter');
await page.keyboard.press('Enter');
await page.keyboard.type('LU');
await page.waitForSelector('.smart-type-popup');
await page.screenshot({ path: `${out}/smart-type.png` });
console.log('saved smart-type.png');
await page.keyboard.press('Escape');

// 6) Zoom 150%: same page count, bigger page (status bar visible in shot)
const headersBefore = await page.locator('.sp-page-header').count();
for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Zoom in' }).click();
await page.waitForTimeout(300);
const headersAfter = await page.locator('.sp-page-header').count();
await page.screenshot({ path: `${out}/zoom-150.png` });
console.log(`saved zoom-150.png, page headers before=${headersBefore} after=${headersAfter}`);

// 7) Reload persistence: edit + zoom + revision set survive
await page.waitForTimeout(1200);
await page.reload();
await page.waitForSelector('[data-element-id="sc2-e5"]');
const text = await page.textContent('[data-element-id="sc2-e5"]');
const zoomLabel = await page.getByRole('button', { name: 'Reset zoom' }).textContent();
const revEnd = await page.getByTestId('rev-end').textContent();
const revisedClass = await page.locator('[data-element-id="sc2-e5"]').getAttribute('class');
console.log('AFTER RELOAD ->');
console.log('  line:', text);
console.log('  zoom:', zoomLabel);
console.log('  revision set:', revEnd);
console.log('  still marked revised:', /sp-revised/.test(revisedClass ?? ''));
await page.screenshot({ path: `${out}/reload-recovery.png` });
// leave storage pristine for Billy
await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
await browser.close();
