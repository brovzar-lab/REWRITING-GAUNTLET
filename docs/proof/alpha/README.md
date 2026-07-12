# Alpha proof pack (2026-07-12)

The end-to-end alpha journey, captured live against http://localhost:5213 by `scripts/proof-alpha.mjs` (dev server running, then the script wipes its demo data).

## The journey, step by step

| # | Screenshot | What it proves |
|---|-----------|----------------|
| 01 | import-dialog.png | Paste a script, preview shows title, 3 scenes, page count, the act-guess note, and the PDF-paste note |
| 02 | ai-locked-before-read.png | AI Assist is locked before the private annotated read, with no way to diagnose |
| 03 | annotated-read.png | Guided scene-by-scene private read with a margin note saved as writer evidence |
| 04 | ai-findings-after-read.png | After the read: Polish pass diagnosed by the Local analyzer, findings labeled AI hypothesis with real citations |
| 05 | approved-and-rejected.png | One proposal approved (applied, revision asterisk on the page), one rejected (text untouched) |
| 06 | revision-mark-and-provenance.png | The changed line carries AI-source, writer-confirmed provenance in the inspector |
| 07 | pass-complete-rewrite-1.png | Completing the pass snapshots the draft and bumps the label to Rewrite 1; tray chip shows Complete |
| 08 | export-menu.png | Export menu with per-format fidelity caveats |
| 09 | print-view.png | Print/PDF view rendering the pagination engine's pages 1:1 |
| 10 | ai-consent-screen.png | Cloud AI consent screen: exact disclosure, consent checkbox, local-only key |
| 11 | day-theme-workspace.png | Same hierarchy in Day theme |

## The exported file

`exported-the-ledger.fountain` was downloaded through the real export flow. Compare it with the pasted source:

- Approved change IS in: `Marta cooks. The radio hums.` (the doubled space is gone).
- Rejected change is NOT in: `A taxi waits  outside.` still has its doubled space.
- The draft label reads `Rewrite 1` because the Polish pass was completed.

## Verification at capture time

- 174 unit tests passing (`npm test`)
- 32 Playwright tests passing (`npx playwright test`), including the full alpha journey and axe scans (WCAG 2.1 AA tags) of every new surface in both themes
- Production build exit 0 (`npm run build`)

## Honest list of what is still approximate

1. **FDX is unvalidated in Final Draft.** The .fdx we export is structurally valid and round-trips in our tests, but nobody has opened one inside the real Final Draft application yet. The UI says so. Billy: one round-trip check in your FD copy is the open task.
2. **PDF is via the system print dialog.** Export > Print/PDF renders the engine's exact pages and hands them to the browser print dialog (Save as PDF). There is no direct .pdf file writer yet. PDF **import** is deferred entirely; the import dialog says to paste the text.
3. **Act assignment on import is a guess.** Fountain and FDX carry no act structure, so acts are assigned by thirds and labeled as a guess in the preview. There is no UI to reassign acts per scene yet.
4. **The local analyzer is honest but shallow.** It only reports what it can cite: spacing, name near-duplicates, single-appearance characters, act balance, scene-length outliers, talky scenes, backwards setup/payoff, unconnected scenes. It is deterministic and free. Deeper dramaturgy comes from the optional cloud assistant (your key, your consent) which returns the same finding shape.
5. **Local analyzer findings are written in English** even when the interface is in Spanish. Interface chrome is fully EN/ES; generated finding text is not localized yet.
6. **Approval undo is via snapshots, not per-approval.** Snapshots are taken before import and after each completed pass and restorable from code; there is no snapshot browser UI yet.
7. **Completing a pass does not end its revision set.** Revision marks accumulate until you end the set in the status bar. Deliberate for the alpha, but worth a product decision.
8. **Imported-script pagination** relies on the same wrap heuristics as the sample; unusual formatting in pasted scripts may paginate slightly differently than Final Draft would.
