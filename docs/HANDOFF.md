# HANDOFF — Journey / IA Realignment (2026-07-14, mid-build, pre-compaction)

## 1. Branch
`codex/journey-ia-realignment` (branched from `main`). **Do NOT merge to main. Do NOT delete main.**
`main` is untouched and green (349 unit / 58 Playwright / build 0 at commit `0e93b1c`).

## 2. Latest commit
`b077297` — "ia: open Scenes workspace before navigator assertions (editorpro, pagination); proof-ia script"

Branch commit chain (newest first): b077297, 4c44754, d11a842, a7bbfc7, d9b527a (plan), then main's 0e93b1c…

## 3. Current task status
- IA-1 shell — DONE. IA-2 project model — DONE (light, local-first). IA-3 scenes demotion — DONE. IA-4 passes promotion — DONE. IA-5 board-as-mode — DONE. IA-6 toolbar/find/layouts/read-only — DONE.
- IA-7 regression + proof + report — **IN PROGRESS.** Unit + build green. e2e: the last full run finished with **2 failures**, and BOTH have just been fixed in commit `b077297` (editorpro revision-nav + pagination nav now call openScenes first). **Not yet re-verified as green.**

## 4. Completed
- New WriterDuet-informed shell: `src/shell/` — WorkstationShell, AppMenuBar (File/Edit/View/Format/Revisions/Production/Help, all mapped, no dead items), WorkspaceRail (Project/Journey/Scenes/Board/Evidence/Game plan/Rewrite passes/Polish/History/Layouts), ProjectPanel (Open/Import/Export/New/Recent/private pad/notes/save status), RightContextPanel (journey/passes/evidence/gameplan), JourneyGuide (9-step "what to do next"), PassStrip (11 passes up top), WorkstationToolbar (undo/redo/element/Find/go-to-page/Page↔Board/zoom/revision/Notes/Export/Layout), FindBar, EmptyScriptState, shell.css.
- Store (`src/store/appStore.ts`): leftWorkspace / rightWorkspace / layoutMode(+focus/board sync), readOnly, findOpen, setDocFormat, documentOpen, newProject/openSampleProject, privatePad/projectNotes (persisted, additive in WorkflowRow). App.tsx now renders WorkstationShell (PanelLayout retired but file kept).
- Editor: `editable: () => !readOnly` wired; Escape from the page lands in the right context panel (`data-editor-exit` on `.right-context`). StatusBar "Add note" and margin-marker clicks now route the right panel to Evidence. Format badge moved into the menu bar. SceneNavigator gained a search box.
- e2e re-pointed to the new IA via `e2e/helpers.ts` (freshApp, rail(), openScenes/openBoardMode/openEvidence/openGamePlan/openPasses/openImport(File menu)/openPass/openHistory/completeRead). New acceptance spec `e2e/journey-ia.spec.ts` (7 tests, all passing) proves the new journey.
- Proof: `scripts/proof-ia.mjs` captured `docs/proof/ia/01…09` (default project view, day twin, rewrite pass, board mode, scenes, project panel, focus layout, file menu, empty state). Screenshots verified visually — they match the WriterDuet-informed design.
- Plan: `docs/plans/2026-07-14-journey-ia-realignment.md` (committed).

## 5. Remaining
1. Re-run the full e2e suite and confirm 0 failures (the 2 fixes in b077297 are unverified).
2. Write `docs/proof/ia/README.md` describing the shots (not yet written).
3. Update `docs/plans/…` status to reflect completion, and this HANDOFF once green.
4. Give Billy the final report: branch, URL, plain-language changes, how to test the journey, proof location, test counts, build result, caveats.

## 6. Background process PID
**None running now.** The last full e2e (`/tmp/ia-e2e-full.log`) already COMPLETED (63 passed / 2 failed, both since fixed). Do not start a second e2e until the current one (if any) is confirmed stopped. The dev server on :5213 is Billy's own (node PID **45637**, LISTEN 127.0.0.1:5213) — leave it; vite HMR serves this branch.

## 7. Log path
`/tmp/ia-e2e-full.log` (last completed full e2e run for this branch).

## 8. Check the log
```
sed 's/\x1b\[[0-9;]*m//g' /tmp/ia-e2e-full.log | grep -E "[0-9]+ passed|[0-9]+ failed|✘" | tail
```

## 9. Resume verification
```
cd /Users/quantumcode/CODE/REWRITING-GAUNTLET && git checkout codex/journey-ia-realignment
npx vitest run --pool=threads --poolOptions.threads.minThreads=1 --poolOptions.threads.maxThreads=2   # expect 349 pass
npm run build                                                                                          # expect exit 0
npx playwright test --reporter=line                                                                    # expect 0 failures (58+7 new)
```
Regenerate proof (dev server on :5213 must be up): `node scripts/proof-ia.mjs`.

## 10. Known risks / failing tests
- The 2 previously-failing e2e (`editorpro.spec.ts` revision-set navigator, `pagination.spec.ts` status-bar navigator) were fixed in `b077297` by opening the Scenes workspace first — **re-verify green.**
- Board mode keeps the right context panel (a deliberate reconciliation so structure work has evidence/pass beside it); if that reads wrong to Billy it is a 1-line change in `WorkstationShell` (`showRight`).
- `Format` menu currently has only Read-only; `Production` has doc-format + two always-on info headers. Deferred (no dead UI): Filter, dual dialogue, headers/footers/watermarks, mind-map view, real multi-project portfolio.
- Retired but not deleted: `PanelLayout.tsx`, `WorkflowStrip.tsx`, `EditorToolbar.tsx`, `InspectorTabs.tsx`, `PassTray.tsx` (their tests still pass in isolation; safe to delete later).
- Direct-manipulation law preserved: scene point on the card, set-up/pay-off on the line, high points on the card, no floating board popovers.
