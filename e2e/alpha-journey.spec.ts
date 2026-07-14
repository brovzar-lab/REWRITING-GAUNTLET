import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { freshApp, openImport, openPass, openEvidence, openPasses } from './helpers';

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

test('the full alpha journey', async ({ page }) => {
  await freshApp(page);

  // 1. Import by pasting.
  await openImport(page);
  const importDialog = page.getByRole('dialog', { name: 'Open a screenplay' });
  await importDialog.getByRole('button', { name: 'Paste screenplay' }).click();
  await importDialog.getByLabel(/Paste your script/).fill(SCRIPT);
  await expect(importDialog.getByText('Scenes: 3')).toBeVisible();
  await importDialog.getByRole('button', { name: 'Import and replace draft' }).click();
  await expect(page.locator('.project-panel')).toContainText('THE LEDGER');

  // 2. Choosing a pass opens the workspace; diagnosis is locked before the read.
  await openPass(page, /POLISH/);
  await expect(page.locator('[data-pass-workspace="polish"]')).toBeVisible();
  await expect(page.getByText(/Pass 11 of 11/)).toBeVisible();
  await expect(page.getByText(/Locked until your private annotated read/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Diagnose', exact: true })).toHaveCount(0);

  // 3. The private annotated read, scene by scene, with a margin note.
  await page.getByRole('button', { name: 'Annotated read', exact: true }).click();
  const readBar = page.getByRole('region', { name: 'Private annotated read' });
  await expect(readBar).toBeVisible();
  await readBar.getByLabel('Margin note').fill('Opening feels slow.');
  await readBar.getByRole('button', { name: 'Save margin note' }).click();
  const complete = readBar.getByRole('button', { name: 'Mark read complete' });
  await expect(complete).toBeDisabled();
  await readBar.getByRole('button', { name: 'Next scene' }).click();
  await readBar.getByRole('button', { name: 'Next scene' }).click();
  await expect(complete).toBeEnabled();
  await complete.click();
  await expect(readBar).toBeHidden();

  // 4. The local analyzer finds the two spacing problems.
  await page.getByRole('button', { name: 'Diagnose', exact: true }).click();
  const findings = page.locator('.ai-finding');
  await expect(findings).toHaveCount(2);
  await expect(page.locator('.ai-proposal-old').first()).toHaveText('Marta cooks.  The radio hums.');
  await expect(page.locator('.ai-proposal-new').first()).toHaveText('Marta cooks. The radio hums.');

  // 5. Approve the first, reject the second.
  await findings.first().getByRole('button', { name: 'Approve' }).click();
  await page.locator('.ai-finding.resolution-open').getByRole('button', { name: 'Reject' }).click();
  await expect(page.getByText('Approved', { exact: true })).toBeVisible();
  await expect(page.getByText('Rejected', { exact: true })).toBeVisible();

  // 6. Revision mark on the approved line; rejected line untouched.
  const approvedLine = page.locator('.sp-action', { hasText: 'The radio hums.' });
  await expect(approvedLine).toHaveClass(/sp-revised/);
  const rejectedText = await page.locator('.sp-action', { hasText: 'A taxi waits' }).evaluate((el) => el.textContent);
  expect(rejectedText).toContain('A taxi waits  outside.');

  // 7. Provenance on the changed line.
  await approvedLine.click();
  await openEvidence(page);
  const inspector = page.locator('.evidence-inspector');
  await expect(inspector.getByText('AI', { exact: true })).toBeVisible();
  await expect(inspector.getByText('Writer-confirmed')).toBeVisible();
  await expect(inspector.getByText(/Stray spacing/)).toBeVisible();

  // 8. Complete the pass: the summary says what happened.
  await openPasses(page);
  await page.getByRole('button', { name: 'Complete pass' }).click();
  const summaryDialog = page.getByRole('dialog', { name: /Polish pass complete/ });
  await expect(summaryDialog).toBeVisible();
  await expect(summaryDialog.getByText('Approved changes: 1')).toBeVisible();
  await expect(summaryDialog.getByText('Rejected proposals: 1')).toBeVisible();
  await expect(summaryDialog.getByText(/Snapshot created: After Polish pass/)).toBeVisible();
  await expect(summaryDialog.getByText(/Rewrite 1/)).toBeVisible();

  // 9. Export straight from the summary: approved in, rejected out.
  await summaryDialog.getByRole('button', { name: 'Export now' }).click();
  await expect(page.locator('.project-panel')).toContainText('Rewrite 1');
  await expect(page.locator('.pass-strip .ds-pass-chip.run-complete')).toContainText('POLISH');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('dialog', { name: 'Export screenplay' }).getByRole('button', { name: /Fountain/ }).click(),
  ]);
  const path = await download.path();
  const exported = readFileSync(path!, 'utf8');
  expect(download.suggestedFilename()).toBe('the-ledger.fountain');
  expect(exported).toContain('Marta cooks. The radio hums.');
  expect(exported).not.toContain('Marta cooks.  The radio hums.');
  expect(exported).toContain('A taxi waits  outside.');

  // 10. Everything survives a reload.
  await page.waitForTimeout(1200);
  await page.reload();
  await expect(page.locator('.project-panel')).toContainText('THE LEDGER');
  await expect(page.locator('.project-panel')).toContainText('Rewrite 1');
  await expect(page.locator('.sp-action', { hasText: 'The radio hums.' })).toHaveClass(/sp-revised/);
});
