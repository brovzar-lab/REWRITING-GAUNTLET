import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

/** Billy's exact acceptance flow, end to end:
    paste a script -> private annotated read -> margin note -> run an Epps pass
    with the local analyzer -> approve one proposal, reject the other ->
    the draft updates with a revision mark and provenance -> the exported
    Fountain contains the approved change and not the rejected one. */

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
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('rewrite-studio'));
  await page.reload();

  // 1. Import by pasting.
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  const importDialog = page.getByRole('dialog', { name: 'Open a screenplay' });
  await importDialog.getByRole('button', { name: 'Paste screenplay' }).click();
  await importDialog.getByLabel(/Paste your script/).fill(SCRIPT);
  await expect(importDialog.getByText('Scenes: 3')).toBeVisible();
  await importDialog.getByRole('button', { name: 'Import and replace draft' }).click();
  await expect(page.locator('.top-bar')).toContainText('THE LEDGER');

  // 2. Choosing a pass opens the guided workspace, but diagnosis is locked
  //    before the private annotated read.
  await page.getByRole('button', { name: /11.*POLISH/ }).click();
  await expect(page.locator('[data-pass-workspace="polish"]')).toBeVisible();
  await expect(page.getByText(/Pass 11 of 11/)).toBeVisible();
  await expect(page.getByText(/What this pass examines/)).toBeVisible();
  await expect(page.getByText(/Locked until your private annotated read/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Diagnose', exact: true })).toHaveCount(0);

  // 3. The private annotated read, scene by scene, with a margin note.
  await page.getByRole('banner').getByRole('button', { name: 'Annotated read', exact: true }).click();
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

  // 4. The Polish workspace is already open; the local analyzer finds the
  //    two spacing problems.
  await expect(page.getByRole('button', { name: 'Diagnose', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Diagnose', exact: true }).click();
  const findings = page.locator('.ai-finding');
  await expect(findings).toHaveCount(2);
  await expect(page.locator('.ai-proposal-old').first()).toHaveText('Marta cooks.  The radio hums.');
  await expect(page.locator('.ai-proposal-new').first()).toHaveText('Marta cooks. The radio hums.');

  // 5. Approve the first proposal, reject the second.
  await findings.first().getByRole('button', { name: 'Approve' }).click();
  await page.locator('.ai-finding.resolution-open').getByRole('button', { name: 'Reject' }).click();
  await expect(page.getByText('Approved', { exact: true })).toBeVisible();
  await expect(page.getByText('Rejected', { exact: true })).toBeVisible();

  // 6. The page updated with a revision mark; the rejected line is untouched.
  const approvedLine = page.locator('.sp-action', { hasText: 'The radio hums.' });
  await expect(approvedLine).toHaveClass(/sp-revised/);
  const rejectedText = await page
    .locator('.sp-action', { hasText: 'A taxi waits' })
    .evaluate((el) => el.textContent);
  expect(rejectedText).toContain('A taxi waits  outside.');

  // 7. Provenance on the changed line: AI source, writer-confirmed.
  await approvedLine.click();
  await page.getByRole('tab', { name: 'Evidence & Notes' }).click();
  const inspector = page.locator('.evidence-inspector');
  await expect(inspector.getByText('AI', { exact: true })).toBeVisible();
  await expect(inspector.getByText('Writer-confirmed')).toBeVisible();
  await expect(inspector.getByText(/Stray spacing/)).toBeVisible();

  // 8. Complete the pass: the summary says what happened.
  await page.getByRole('tab', { name: 'Rewrite pass' }).click();
  await page.getByRole('button', { name: 'Complete pass' }).click();
  const summaryDialog = page.getByRole('dialog', { name: /Polish pass complete/ });
  await expect(summaryDialog).toBeVisible();
  await expect(summaryDialog.getByText('Approved changes: 1')).toBeVisible();
  await expect(summaryDialog.getByText('Rejected proposals: 1')).toBeVisible();
  await expect(summaryDialog.getByText(/Snapshot created: After Polish pass/)).toBeVisible();
  await expect(summaryDialog.getByText(/Rewrite 1/)).toBeVisible();

  // 9. Export straight from the summary: approved change in, rejected out.
  await summaryDialog.getByRole('button', { name: 'Export now' }).click();
  await expect(page.locator('.top-bar')).toContainText('Rewrite 1');
  await expect(page.getByRole('button', { name: /POLISH.*Complete/i })).toBeVisible();
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

  // 10. Everything survives a reload (local persistence; > 500ms debounce).
  await page.waitForTimeout(1200);
  await page.reload();
  await expect(page.locator('.top-bar')).toContainText('THE LEDGER');
  await expect(page.locator('.top-bar')).toContainText('Rewrite 1');
  await expect(page.locator('.sp-action', { hasText: 'The radio hums.' })).toHaveClass(/sp-revised/);
});
