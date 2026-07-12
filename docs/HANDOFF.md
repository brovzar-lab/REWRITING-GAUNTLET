# HANDOFF — Rewrite Studio / REWRITING-GAUNTLET (2026-07-12, alpha + UX repair complete)

## Where we left off

The **End-to-End Alpha** (plan: `docs/plans/2026-07-12-alpha-end-to-end.md`, A1-A11) was built and Billy tested it. His verdict: technically complete, UX not clear enough. He dictated an **Alpha UX Repair Pass** (plan: `docs/plans/2026-07-12-alpha-ux-repair.md`, U1-U7), now also **complete and committed**:

- U1: Import is an app-style menu (Paste / Open Fountain / Open Final Draft, PDF-paste note), then one focused step with preview.
- U2: Clicking a pass chip opens a guided pass workspace in the inspector column (auto tab switch): objective, "what this pass examines" (EN/ES for all 11 passes), Diagnose, approve/reject queue, progress, Complete pass, recommended next pass. Guidance visible before the read; only diagnosis stays locked.
- U3: Add note lives in the status bar (always visible), composer opens ready; notes stamped with the active pass; per-scene note badges in the navigator; per-pass note count in the workspace.
- U4: Complete pass opens a summary (approved with applied text / rejected / unresolved / snapshot / Rewrite N / Export now / next pass).
- U5: The page reads as the center: desk backdrop (--desk in themes.css), scroll head/foot room, and a REAL fix — sp-selected was a dead CSS class nothing applied; a ProseMirror decoration plugin now marks the caret's line (tint + accent bar).
- U6: History button → snapshot list across documents, two-step restore with an automatic safety snapshot first.
- U7: e2e/usability.spec.ts — Billy's six acceptance checks, all passing.

Verified at handoff: **192 unit tests**, **38 Playwright tests**, **build exit 0**, worktree clean. Proof pack refreshed: `docs/proof/alpha/` (14 screenshots + exported .fountain + honest approximations).

Alpha commits: A1 `5ed616c` … A11 `a24ed12`. UX repair commits: U1 `af9285d`, U2 `57239a6`, U3 `1156ea5`, U4 `cad5d1e`, U5 `e5020b9`, U6 `9c3f3fd`, U7 `b7acaf0`+`2fd5ea7`.

## Next action

Billy re-tests the repaired alpha. Ask him to:
1. Walk the journey again with a real script and judge whether passes now "feel active".
2. Round-trip one exported .fdx through his real Final Draft copy (still never validated in FD — open risk).
3. React to the approximations list in `docs/proof/alpha/README.md` (likely next asks: act reassignment UI, per-approval undo, ES-localized analyzer findings).

## Locked decisions (unchanged)

- Port 5213, host 127.0.0.1, strictPort; port registry `~/.Codex/dev-ports.md`. One repo, one editor.
- Plan first, Billy approves, then build. Continuous build was authorized for the alpha only.
- Deps pinned exact; the only alpha addition was fast-xml-parser@4.5.0.
- Plain ASCII (MORE)/(CONT'D); 55 body lines/page; headers never count.
- Methodology invariants live in the store and are tested: AI gate behind annotated read, 5-max/3-recommended initial readers + exactly 1 interim, claim labels + Clear/Uncertain/Priority Concern, NO numeric score, no one-shot rewrites, scene lock (proposal must target a cited element), draft = approved changes only with provenance.
- AI: `src/ai/provider.ts` interface; Local analyzer default; ONLY `src/ai/adapters/cloud.ts` may name the vendor (enforced by `src/ai/vendorBoundary.test.ts`); model claude-sonnet-5 via plain fetch with anthropic-dangerous-direct-browser-access; key in localStorage via `src/ai/keyStore.ts`, consent in workflow state (resets on import).
- Epps pass names/order locked; Studio additions labeled "Studio extension".

## Architecture added by the alpha

- `src/io/`: fountain.ts, fdx.ts, assemble.ts (shared act-guess assembly), download.ts.
- `src/workflow/`: types.ts (Reader/Finding/Approval/WorkflowState), store actions in appStore, Dexie v3 (snapshots/workflow tables).
- `src/ai/`: provider.ts, localAnalyzer.ts (11 pass lenses), adapters/cloud.ts, keyStore.ts, index.ts (resolveProvider).
- `src/panels/`: ImportDialog, ExportMenu, PrintView, AnnotatedReadBar, NoteComposer, ReadersManager, AiAssistPanel, AiSettings, InspectorTabs (Evidence & Notes | AI Assist tabs).
- New e2e: import.spec.ts, alpha-journey.spec.ts, alpha-a11y.spec.ts. Proof script: scripts/proof-alpha.mjs.

## Open loops

1. **Billy's hands-on alpha test** — see Next action. Done when he signs off or files change requests.
2. **FDX validation in real Final Draft** — deferred risk, needs Billy's FD copy.
3. **claude-goal repo location** — unchanged: `claude-goal/` (gitignored) must not be deleted; Billy's Stop hook and `~/.claude/skills/goal` symlink point into it. Awaiting his decision to move it.
4. **Deferred features** (post-alpha backlog): PDF text-extraction import, act reassignment UI, snapshot browser/restore UI, per-approval undo, ES-localized analyzer findings, deeper Epps artifacts (Game Plan, Set-Up checklist, four high points, Scene Point, holdovers/orphans, Polish Read, Touchstone, Ticking Clock, slug file), TV pilot adapter (labeled Studio extension), co-writer mode, cloud sync, revision paper tinting.

## How to run and verify

```
cd /Users/quantumcode/CODE/REWRITING-GAUNTLET && npm run dev
```

- URL: http://localhost:5213 (also http://127.0.0.1:5213). Port busy? `lsof -ti:5213 | xargs kill` then restart. Never move ports.
- `npm test` → 174 passing. `npx playwright test` → 32 passing. `npm run build` → exit 0.
- Proof pack regeneration: dev server running, then `node scripts/proof-alpha.mjs` (wipes its own demo data afterwards).
- Golden pagination fixtures: only regenerate after intentional engine changes (`node scripts/gen-goldens.mjs`), hand-review the diff.

## Gotchas / context not on disk

- Billy dictates by voice; plain language, short ordered lists, no em dashes, one copy-paste terminal block starting with cd.
- parseFountain TRIMS every line: trailing whitespace never survives paste-import (matters when crafting polish-pass fixtures; use internal double spaces).
- Import dialog is two-step now (menu → paste/file); e2e must click "Paste screenplay" before filling. Pass workspace lives on the "Rewrite pass" tab; the lock message only shows once a pass is selected.
- The pass-summary dialog opens automatically after Complete pass and overlays everything: e2e must close it (or use its Export now) before clicking the top bar.
- alpha-a11y.spec.ts is marked test.slow() (five sequential axe scans; times out at default 30s under load).
- testing-library normalizes whitespace in matchers: assert doubled-space strings via raw DOM textContent, not getByText.
- jsdom Blob has no .text(); read blobs with FileReader in tests.
- Two "Annotated read" buttons exist when the AI panel is locked (top bar + panel); scope Playwright locators with getByRole('banner').
- Autosave debounce is 500ms: e2e must waitForTimeout(1200) before reload assertions (repo convention).
- Editor: Tab is element switching, Escape exits the page; never focus ProseMirror DOM directly (use .sp-page-scroller). Element ids `sc2-e5` are stable references; only append to scene ends in the sample.
- The AI panel writes findings via store setFindings (throws before read complete) — UI must gate first.
- `npm ls playwright-core` must stay a single deduped 1.48.2.
- Codex (another agent) sometimes inspects this repo; keep the worktree clean between sessions.
