# Alpha proof pack (2026-07-12, after the UX Repair Pass)

Captured live against http://localhost:5213 by `scripts/proof-alpha.mjs` (dev server running; the script wipes its demo data afterwards).

## The journey, step by step

| # | Screenshot | What it proves |
|---|-----------|----------------|
| 01 | import-menu.png | Import opens as an app-style menu: Paste screenplay / Open Fountain file / Open Final Draft file, PDF note up front |
| 02 | import-paste-preview.png | Paste step with live preview: title, scenes, approximate pages, act-guess note, snapshot note |
| 03 | pass-workspace-locked.png | Clicking a pass chip opens the guided workspace (objective, what it examines) with diagnosis locked before the private read |
| 04 | annotated-read.png | Scene-by-scene private read with margin notes |
| 05 | note-flow-and-badges.png | Add note from the status bar; per-scene note badges in the navigator |
| 06 | pass-workspace-findings.png | Pass workspace after Diagnose: findings queue, progress (proposals resolved, notes this pass), Complete pass |
| 07 | approved-and-rejected.png | One proposal approved (revision asterisk on the page), one rejected (line untouched) |
| 08 | revision-mark-and-provenance.png | The changed line carries AI-source, writer-confirmed provenance |
| 09 | pass-summary.png | Complete pass shows the summary: approved / rejected / unresolved, snapshot, Rewrite 1, Export now, next pass |
| 10 | export-menu.png | Export options with fidelity caveats |
| 11 | snapshot-history.png | Visible snapshot history (across documents) with safe two-step restore |
| 12 | print-view.png | Print/PDF view rendering the engine pages 1:1 |
| 13 | ai-consent-screen.png | Cloud AI consent: exact disclosure, checkbox, local-only key |
| 14 | day-theme-workspace.png | Same hierarchy in Day theme |

## The exported file

`exported-the-ledger.fountain` came through the real export flow (from the pass summary's Export now):

- Approved change IS in: `Marta cooks. The radio hums.` (doubled space gone).
- Rejected change is NOT in: `A taxi waits  outside.` keeps its doubled space.
- Draft label reads `Rewrite 1` because the Polish pass was completed.

## Verification at capture time

- 192 unit tests passing (`npm test`)
- 38 Playwright tests passing (`npx playwright test`): the full alpha journey, the six usability acceptance tests, axe scans (WCAG 2.1 AA) of every alpha surface in both themes, and the full pre-alpha regression
- Production build exit 0 (`npm run build`)

## Honest list of what is still approximate

1. **FDX is unvalidated in Final Draft.** Structurally valid and round-trip tested, never yet opened in the real application. The UI says so. One round-trip in Billy's FD copy is the open task.
2. **PDF is via the system print dialog** (Save as PDF). No direct .pdf writer. PDF import stays deferred; the import menu says to paste instead.
3. **Act assignment on import is a guess** by thirds, labeled as such; no per-scene act reassignment UI yet.
4. **The local analyzer is honest but shallow** (spacing, name near-duplicates, single-appearance characters, act balance, outliers, talky scenes, backwards setups). The cloud assistant (consent + own key) is where diagnosis deepens.
5. **Analyzer findings and pass snapshot labels are English-only**; interface chrome is fully EN/ES.
6. **Restore is whole-draft, not per-approval undo.** The history UI restores snapshots (with a safety snapshot first); individual approvals cannot be un-done one by one yet.
7. **Completing a pass does not end its revision set**; marks accumulate until the set is ended in the status bar.
8. **Imported-script pagination** uses the same wrap heuristics as the sample; unusual formatting may paginate slightly differently than Final Draft.
