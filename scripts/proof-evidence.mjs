import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://localhost:5213');
await page.waitForSelector('[data-element-id="sc4-e4"]');
await page.click('[data-element-id="sc4-e4"]');
await page.waitForSelector('.evidence-card');
await page.screenshot({ path: 'docs/proof/slice-1/evidence-link-night.png' });
console.log('saved evidence-link-night.png');
await browser.close();
