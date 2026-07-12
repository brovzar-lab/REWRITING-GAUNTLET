# HANDOFF — Rewrite Studio / REWRITING-GAUNTLET (2026-07-12, realignment complete)

## Where we left off

The approved **Visual + UX Realignment Pass** (`docs/plans/2026-07-12-visual-ux-realignment.md`, tasks R1-R11) is **fully built and committed on main**, one commit per task:

- R1 `46686a9` board docks beside the script (side column ≥1280px, bottom drawer when narrow)
- R2 `431ee52` tactile act-grouped board
- R3 `e5d2cba` professional top toolbar (save state, revision control, Appearance select)
- R4 `273cd2c` editor toolbar (undo/redo, element type select, zoom, go to page) + page footer with prev/next page
- R5 `aa9ea6e` structured Evidence / Rewrite Concern cards (Suggestion, Example rewrite, Current, Source, optional Confidence, Linked to + Go to script, Notes), `Finding.confidence` mapped from cloud only
- R6 `c82c44b` pass tray control surface (Focus / Goals / Notes / Status + Open pass)
- R7 `5f12be7` margin note markers + visible line↔board↔evidence links (`annotationPlugin.ts`)
- R8 `a71cfdf` always-visible rewrite journey strip (`WorkflowStrip.tsx`, exported `currentStep`)
- R9 `16887a2` cinematic finish: new semantic tokens `--surface-toolbar`, `--surface-inset`, `--divider-strong` in `themes.css` (all four theme blocks), toolbar bands, panel seams, inset wells, board hint tidied
- R10 `c2c4d95` acceptance spec consolidated in `e2e/realignment.spec.ts`, full regression green
- R11 (this commit) proof pack `docs/proof/realign/` + this handoff

**State at handoff: 220 unit tests, 46 Playwright tests, `npm run build` exit 0, `playwright-core` single deduped 1.48.2.** No red tests, intentional or otherwise.

## Next action

Show Billy the proof pack (`docs/proof/realign/README.md` + the 7 PNGs) and get his verdict. Nothing is mid-flight; any further work starts from his feedback or the deferred backlog.

## Locked decisions (unchanged)

- The 11-task plan was approved verbatim and is now done. Deferred on purpose (no dead UI): board tabs Outline/Beats/Relationships, board minimap/filter, pass multi-run "v2" versions, per-line numbers in LINKED TO, confidence for the local analyzer (field exists, cloud may fill).
- `src/theme/tokens.css` untouchable (guarded by tokens.test.ts). New visual values are semantic tokens in `themes.css`, tonally derived (`--desk` precedent): Night `--surface-toolbar #141E26`, `--surface-inset #121B23`, `--divider-strong #43525C`; Day `#F8F6F0 / #ECE8DF / #B3AEA2`.
- `boardDock` NOT persisted, NOT in `resetToSample` (viewport matchMedia owns it).
- Do NOT animate `background` on controls that flip to an accent fill from transparent (axe samples mid-transition; `.tool-button` transitions border-color only).
- No bold/italic/underline in the editor toolbar: schema has no marks; adding them touches FDX/Fountain round-trip. Say so if Billy asks.
- App at repo root, port 5213, host 127.0.0.1, strictPort. One repo one editor; helpers read-only.
- All prior alpha rules stand (AI gate, no numeric score, scene lock, Epps pass names/order, Page Rule, WCAG 2.1 AA, EN+ES for every new string).

## Open loops

1. **Billy's verdict on the realignment** — proof pack ready in `docs/proof/realign/`.
2. **FDX round-trip in real Final Draft** — still never validated (UI says so).
3. **claude-goal repo location** — gitignored `claude-goal/` inside this repo; Billy's Stop hook and skills symlink point into it. NEVER delete. Waiting on Billy.
4. **Deferred features backlog** — alpha list plus the realignment deferrals above. Waiting on Billy's priorities.

## How to run and verify

```
cd /Users/quantumcode/CODE/REWRITING-GAUNTLET && npm run dev
```

- URL: http://localhost:5213 (also http://127.0.0.1:5213). Port registry: `~/.Codex/dev-ports.md` (NOT ~/.claude/dev-ports.md).
- **A dev server on 5213 was BILLY'S OWN throughout this session** (vite, PID 33047, started 2026-07-12 04:36; the Codex desktop app holds connections to it). It was left running and untouched. If it is still up, just use the URL; Playwright reuses a running 5213 server. Always `lsof -i:5213` before killing anything.
- Tests: `npx vitest run` (220), `npx playwright test` (46), `npm run build`.
- Proof pack: `node scripts/proof-realign.mjs` (needs the dev server; wipes its own demo data).

## Gotchas / context not on disk

- Billy dictates by voice; plain language, short lists, no em dashes, one cd-first terminal block, proof before done claims.
- **Vitest full-suite runs flake under machine load** (Billy's dev server + Codex app): userEvent tests hit the 5s timeout when run with default parallelism while the box is busy. They all pass in isolation. Stable invocation used for commit gates: `npx vitest run --pool=threads --poolOptions.threads.minThreads=1 --poolOptions.threads.maxThreads=2`. Don't "fix" the tests; it's environmental.
- `src/test/setup.ts` stubs matchMedia (desktop/side dock default), ResizeObserver, AND now `Range.getClientRects`/`getBoundingClientRect` (ProseMirror `coordsAtPos` needs them when a transaction carries scrollIntoView — undo/redo from prosemirror-history do).
- The e2e undo test types ONE character on purpose: one char = one history event; multi-char typing can split into two history groups under load and one Undo click won't revert it all.
- Page-footer prev/next skips lines whose element starts on the previous page (an element straddling the break maps to its starting page in `pageOfElement`); see `jumpToPage` in `StatusBar.tsx`.
- The editor rebuilds `EditorState` (losing undo history) when evidence/findings/revision baseline change from outside — pre-existing pattern, extended to annotations in R7.
- e2e conventions: `freshApp(page)` deletes the `rewrite-studio` IndexedDB then reloads; import dialog is two-step; two "Annotated read" buttons exist when a pass workspace is locked (scope with getByRole('banner')); autosave debounce 500ms so reload assertions wait 1200ms; `alpha-a11y.spec.ts` is test.slow(); theme switching is `page.getByLabel('Appearance').selectOption('day')`.
- Editor rules: Tab switches element type; Escape exits to `[data-editor-exit]`; widget decoration keys must encode everything they render (annotationPlugin keys are `elementId:count`); dnd-kit spreads aria-pressed so set yours after `{...attributes}`; after toolbar actions refocus `.sp-page-scroller`, never ProseMirror's DOM.
- parseFountain trims every line; testing-library normalizes whitespace (use raw textContent for doubled spaces); jsdom Blob lacks .text() (use FileReader).
