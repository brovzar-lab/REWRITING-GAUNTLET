# HANDOFF — Rewrite Studio / REWRITING-GAUNTLET (2026-07-12)

## Where we left off

Billy rejected the alpha's look (too plain, too dashboard) and approved a **Visual + UX Realignment Pass** to match the approved hybrid mockup (`/Users/quantumcode/Downloads/Recommended hybrid, Night mode.png` is the visual north star; feel and hierarchy, not pixels). The full approved plan with per-task code and tests is `docs/plans/2026-07-12-visual-ux-realignment.md` (11 tasks, R1-R11). Execution is mid-flight:

- **R1 done** (`46686a9`): board docks beside the script in a `.board-panel` column at >=1280px viewport (store `boardDock: 'side'|'bottom'` + matchMedia effect in PanelLayout), bottom drawer `.board-shelf` when narrow. New tests: `src/store/boardDock.test.ts`, `src/panels/panelLayout.test.tsx`, e2e `e2e/realignment.spec.ts`.
- **R2 done** (`431ee52`): board grouped by act with `.board-act-header` headings, cards wrap in side dock, hover no longer lifts (drag only), new `board.scenes` string EN/ES.
- **R3 done** (`e5d2cba`): new `src/panels/TopBar.tsx` (extracted from App.tsx): save indicator fed by `saveState` in store + persistence.ts (guarded so its own writes do not reschedule saves), RevisionControl moved from StatusBar to top bar, theme seg-buttons replaced by an Appearance `<select>` (e2e now use `page.getByLabel('Appearance').selectOption('day')`), quiet `.tool-button` style.
- **R4 in progress, red TDD state** (`088f0fe`): `src/editor/editorToolbar.test.tsx` written and INTENTIONALLY FAILING (imports `./EditorToolbar` which does not exist yet). `src/editor/editorHandle.ts` (registerEditorView/getEditorView) created. `editorKeymap.ts` has the EditorView type import added, nothing else.

At R3 commit: 199 unit tests and 40 Playwright tests passing, but right now `npx vitest run` fails 1 file (the intentional R4 red test). That is expected; do not "fix" it by deleting the test.

## Next action

Resume the plan at **task R4 step 3** in `docs/plans/2026-07-12-visual-ux-realignment.md`: implement `src/editor/EditorToolbar.tsx` plus the StatusBar page footer until `npx vitest run src/editor/editorToolbar.test.tsx` passes, then finish R4 steps 4-6 and continue R5-R11 in order. Key implementation notes already scouted:

- Export `applyElementType(view, type)` from `editorKeymap.ts` (extract the Mod-1..6 body) and reuse it in both the keymap and the toolbar select.
- `ScreenplayEditor.tsx` must call `registerEditorView(view)` after creating the view (line ~217, next to `viewRef.current = view`) and `registerEditorView(null)` in the destroy cleanup.
- Undo/redo buttons use `undo/redo/undoDepth/redoDepth` from `prosemirror-history` (1.4.1, already a dep, already imported in ScreenplayEditor). Toolbar re-renders via store subscriptions (screenplay/selection), which is enough to refresh disabled states.
- Prev/next page in the StatusBar footer needs NO EditorView: copy GoToPage.tsx's approach (paginate → `pages[n].lines.find(l => l.kind === 'text')` → `select(...)`), clamped to 1..pageCount.
- Zoom −/%/+ moves from StatusBar to EditorToolbar. `e2e/pagination.spec.ts:49` asserts zoom % text inside `getByTestId('status-bar')` — update that spec to target the toolbar (keep the assertion meaning).
- Mount `<EditorToolbar />` in App.tsx's editor slot between `<AnnotatedReadBar />` and `<ScreenplayEditor />`.
- After toolbar actions, refocus `.sp-page-scroller` (NEVER ProseMirror's DOM; it resets the caret).
- New strings needed EN+ES: `toolbar.element`, `toolbar.undo`, `toolbar.redo`, `toolbar.gotopage`, `footer.prevpage`, `footer.nextpage` (see plan R4). Element-type option labels have NO existing i18n keys; add them (six types in `ELEMENT_KEY_ORDER` order).
- Formatting bold/italic/underline is consciously OUT (schema has no marks; would break FDX/Fountain round-trip). Say so if Billy asks.

## Locked decisions

- The 11-task plan is approved by Billy verbatim; do not re-plan. Deferred on purpose (no dead UI): board tabs Outline/Beats/Relationships, board minimap/filter, pass multi-run "v2" versions, per-line numbers in LINKED TO, confidence for the local analyzer (field only, cloud may fill).
- Commits go directly on main, one per task, message prefix `realign RN:`.
- `boardDock` is NOT persisted and NOT in `resetToSample` (the viewport matchMedia effect owns it; resetting would fight narrow windows).
- `src/theme/tokens.css` untouchable (guarded by tokens.test.ts). New visual values = semantic tokens in `themes.css`, tonally derived (the `--desk` precedent). R9 will add `--surface-toolbar`, `--surface-inset`, `--divider-strong`.
- Do NOT animate `background` on controls that flip to an accent fill from transparent: axe samples mid-transition and fails contrast (this really happened; fix was transition border-color only on `.tool-button`).
- App at repo root, port 5213, host 127.0.0.1, strictPort. One repo one editor; helpers read-only.
- All prior alpha rules stand (AI gate, no numeric score, scene lock, Epps pass names/order, Page Rule, WCAG 2.1 AA, EN+ES for every new string).

## Open loops

1. **Plan tasks R4-R11 unbuilt** — done when each task's tests pass and it is committed; R10 = full green regression (target: >=199 unit + >=40 e2e + new ones, build exit 0); R11 = proof pack `docs/proof/realign/` (7 shots listed in the plan) + handoff + Billy verdict.
2. **Intentional red test on main** — `src/editor/editorToolbar.test.tsx` fails until R4 lands. Done when R4 committed.
3. **FDX round-trip in real Final Draft** — still never validated (UI says so). Unchanged from before.
4. **claude-goal repo location** — gitignored `claude-goal/` inside this repo; Billy's Stop hook and skills symlink point into it. NEVER delete. Waiting on Billy.
5. **Deferred features backlog** — alpha list plus the realignment deferrals above. Waiting on Billy's priorities.

## How to run and verify

```
cd /Users/quantumcode/CODE/REWRITING-GAUNTLET && npm run dev
```

- URL: http://localhost:5213 (also http://127.0.0.1:5213). Port registry: `~/.Codex/dev-ports.md` (NOT ~/.claude/dev-ports.md).
- **As of this handoff a dev server on 5213 is BILLY'S OWN** (vite, PID 33047, started 2026-07-12 04:36, cwd this repo; the ChatGPT/Codex desktop app holds open connections to it). Do not kill it. If it is still up on resume, just use it; Playwright reuses a running 5213 server. Always `lsof -i:5213` before killing anything.
- Tests: `npx vitest run` (1 intentional failure until R4 lands, see above), `npx playwright test` (40 passing), `npm run build`.
- jsdom stubs live in `src/test/setup.ts`: ResizeObserver AND now matchMedia (defaults to desktop/side dock; tests wanting the bottom drawer call `setBoardDock('bottom')` after render).

## Gotchas / context not on disk

- Billy dictates by voice; plain language, short lists, no em dashes, one cd-first terminal block, proof before done claims.
- Billy stopped this session at ~78% token budget mid-R4; nothing else was wrong. No design disagreement is pending; the plan stands approved.
- The approved-mockup PNG lives in Downloads; if it disappears, `docs/proof/alpha/` screenshots plus DESIGN.md describe the target, and the plan's R-tasks encode the layout.
- e2e conventions: `freshApp(page)` helper deletes the `rewrite-studio` IndexedDB then reloads; import dialog is two-step; two "Annotated read" buttons exist when a pass workspace is locked (scope with getByRole('banner')); autosave debounce 500ms so reload assertions wait 1200ms; `alpha-a11y.spec.ts` is test.slow().
- Editor rules: Tab switches element type; Escape exits to `[data-editor-exit]`; widget decoration keys must encode everything they render; dnd-kit spreads aria-pressed so set yours after `{...attributes}`.
- parseFountain trims every line; testing-library normalizes whitespace (use raw textContent for doubled spaces); jsdom Blob lacks .text() (use FileReader).
- The in-session task list (R1-R11) mirrors the plan; statuses at handoff: R1-R3 completed, R4 in progress, R5-R11 pending.
