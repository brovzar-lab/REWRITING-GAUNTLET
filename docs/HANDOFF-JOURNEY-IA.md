# HANDOFF — Journey / IA Realignment (for the next Claude Code session)

> ⚠️ **DO NOT MERGE TO MAIN. DO NOT ABANDON THE BRANCH. Continue on
> `codex/journey-ia-realignment`.** `main` is untouched and must stay that way
> until Billy explicitly says merge. This branch is our undo button.

## 1. Branch
`codex/journey-ia-realignment` (branched from a clean `main`).

## 2. Latest commit
`f73d4e7` — "ia: proof-ia README + handoff marked complete (349 unit / 65 e2e / build 0)"
(full hash `f73d4e72412f9d93a2a29a8985c1aeaca1953527`)

## 3. Repo path
`/Users/quantumcode/CODE/REWRITING-GAUNTLET`

## 4. Dev server
- Running: node **PID 45637**, LISTEN `127.0.0.1:5213`, HTTP 200. This is Billy's
  own `npm run dev`; vite HMR serves whatever branch is checked out. **Leave it
  running — do not kill it.** If it is ever down, `npm run dev` from the repo root.
- URL: **http://127.0.0.1:5213** (hand out the 127.0.0.1 form; `localhost` can
  resolve to IPv6 where nothing listens).

## 5. What was built (Journey / IA Realignment)
A WriterDuet-informed rewriting workstation. New code lives in `src/shell/`:
- **WorkstationShell** (`src/shell/WorkstationShell.tsx`) — the new top-level layout
  (replaces `PanelLayout`; App.tsx now renders the shell). Regions: top menu bar +
  toolbar, then `[rail | left panel | center editor | right context panel]`.
- **AppMenuBar** — File / Edit / View / Format / Revisions / Production / Help, every
  item mapped to a real action (no dead items); plus EN/ES, Appearance, save state,
  and the docFormat badge on the right.
- **WorkspaceRail** — Project / Journey / Scenes / Board / Evidence / Game plan /
  Rewrite passes / Polish / History / Layouts. Each routes exactly one region.
- **ProjectPanel** — the starting place: Open / Import / Export / New Project /
  Recent, private pad + notes (local-first, persisted), save state.
- **RightContextPanel** — one thing at a time: JourneyGuide (default) / PassWorkspace /
  EvidenceInspector / GamePlanPanel.
- **JourneyGuide** — the 9-step "what to do next" checklist; current stage shows why +
  primary action; done stages carry a check.
- **PassStrip** — the 11 Epps passes promoted to a top strip (shown in the Rewrite
  stage); the old bottom `PassTray` is retired.
- **WorkstationToolbar** — undo/redo, element type, Find, go to page, Page↔Board,
  zoom, revision set, Notes, Export, Layout selector.
- **FindBar** (in-script find), **EmptyScriptState** (New Project → "Open or import a
  script"), **shell.css**.
- Store (`src/store/appStore.ts`): `leftWorkspace` / `rightWorkspace` / `layoutMode`
  (+focus/board sync), `readOnly`, `findOpen`, `setDocFormat`, `documentOpen`,
  `newProject` / `openSampleProject`, `privatePad` / `projectNotes` (persisted,
  additive on `WorkflowRow`). Editor honors `readOnly`; Escape from the page lands in
  the right context panel; "Add note" and margin-marker clicks route the right panel
  to Evidence; SceneNavigator gained a search box.
- Board is a **mode** (center), never wedged between script and guidance; full-board
  behavior and direct manipulation (scene point on card, set-up/pay-off on line, high
  points on card, no floating popovers) preserved.

State: **349 unit / 65 Playwright (58 re-pointed + 7 new `journey-ia.spec.ts`) /
build exit 0.** All green.

## 6. Approved directionally
Billy accepted the WriterDuet-informed IA direction (this is the built result of the
approved plan `docs/plans/2026-07-14-journey-ia-realignment.md`). The structure,
routing, journey spine, board-as-mode, passes-on-top, project-first left, and layout
modes are the agreed direction. What remains is **visual polish, not re-architecture.**

## 7. Must still be polished before merge (Billy's list — visual only, keep the IA)
1. **Top toolbar too cramped/raw** — group controls, add separators/breathing room,
   consider icon+label balance and a tidier wrap; it currently reads as a raw button row.
2. **Rewrite pass strip too dense** — 11 chips are cramped; reduce weight, improve
   spacing/scroll affordance, maybe number+short-name styling.
3. **Left rail too boxy** — soften the rail items (active state, hover, glyph/label
   rhythm); it reads blocky.
4. **Project panel action buttons need stronger hierarchy** — Open / Import / Export /
   New Project are equal-weight; make the primary action(s) stand out, demote the rest.
5. **Right panel** — mostly works; only light polish (spacing, section headers).
6. **Board mode concept works** — polish the board header and card spacing (header row,
   card padding, the maps column alignment).

Constraints for the polish pass: keep the current IA and routing, keep the token
system + Day/Night, keep direct manipulation, no dead UI, all tests green, and use the
`impeccable` / `frontend-design` skills as the repo instructs.

## 8. Exact prompt for the next Claude session
```
Continue the Journey / IA Realignment on branch codex/journey-ia-realignment in
/Users/quantumcode/CODE/REWRITING-GAUNTLET (do NOT merge to main, do NOT abandon the
branch). The IA direction is approved; this is a VISUAL POLISH pass only — keep the
layout, routing, and journey exactly as built. Read docs/HANDOFF-JOURNEY-IA.md and
docs/plans/2026-07-14-journey-ia-realignment.md first. Polish, in this order:
(1) the top toolbar (too cramped/raw — group + space controls),
(2) the rewrite pass strip (too dense),
(3) the left workspace rail (too boxy),
(4) the Project panel action buttons (need clear primary/secondary hierarchy),
(5) light polish on the right context panel,
(6) board mode header + card spacing.
Keep the token system and Day/Night, keep direct manipulation, no dead UI. Work
test-first where practical; keep all unit + Playwright tests green (baseline
349 unit / 65 e2e / build 0); update selectors only if you move DOM. Re-capture
docs/proof/ia/ with node scripts/proof-ia.mjs and show before/after. Commit each polish
step with an `ia polish:` prefix. When done, give Billy the URL, counts, build result,
and proof — then stop for his review.
```

## 9. Exact test commands
```
cd /Users/quantumcode/CODE/REWRITING-GAUNTLET
git checkout codex/journey-ia-realignment

# Unit (capped threads = the stable gate under machine load) — expect 349 passing
npx vitest run --pool=threads --poolOptions.threads.minThreads=1 --poolOptions.threads.maxThreads=2

# Build — expect exit 0
npm run build

# Browser — expect 65 passing, 0 failing
npx playwright test --reporter=line

# Regenerate proof (dev server on :5213 must be up)
node scripts/proof-ia.mjs
```

## 10. Proof screenshots
`docs/proof/ia/` (with `README.md`): 01 first-open project (Night) · 01b Day twin ·
03 rewrite-pass active · 04 board mode · 05 scenes workspace · 06 project panel ·
07 focus layout · 08 file menu · 09 empty open/import.

## 11. Warning
**Do NOT merge to main. Do NOT abandon the branch. Continue on
`codex/journey-ia-realignment`.**

---

### Retired-but-not-deleted (safe to remove after Billy approves the merge)
`src/panels/PanelLayout.tsx`, `WorkflowStrip.tsx`, `src/editor/EditorToolbar.tsx`,
`src/panels/InspectorTabs.tsx`, `src/panels/PassTray.tsx` — replaced by the shell; their
unit tests still pass in isolation.

### Deferred (shown nowhere — no dead UI)
Filter, dual dialogue, headers/footers/watermarks, mind-map view, a true multi-project
portfolio. The project model is intentionally light (script + private pad + notes +
recent), local-first, not cloud accounts.
