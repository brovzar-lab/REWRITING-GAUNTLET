# HANDOFF — Rewrite Studio / REWRITING-GAUNTLET (2026-07-12, alpha complete)

## Where we left off

The **End-to-End Alpha is built, tested, and committed** (plan: `docs/plans/2026-07-12-alpha-end-to-end.md`, tasks A1-A11 all done). The complete journey works and is proven by an e2e test and a screenshot pack:

paste/import a screenplay (Fountain or FDX) → private annotated read (AI locked until complete) → margin + reader/producer notes with Epps caps → run an Epps pass → AI diagnosis (deterministic Local analyzer by default; cloud adapter only behind consent + user key) → approve/reject each proposal (scene-locked, provenance, revision marks, auto revision set) → complete pass (snapshot + "Rewrite N" label) → export Fountain/FDX/Print-PDF where the file contains approved changes only.

Verified at handoff: **174 unit tests**, **32 Playwright tests** (incl. the full journey + axe WCAG 2.1 AA scans of every new surface in both themes), **build exit 0**, worktree clean. Proof pack: `docs/proof/alpha/` (11 screenshots + exported .fountain + README with the honest approximations list).

Commits: A1 `5ed616c`, A3 `1e6a058`, A4 `39c32dd`, A2 `32c0c9a`, A5 `33749a6`, A6 `2e6b388`, A7 `ceebcce`, A8 `a6f00ff`, A9 `666b64b`, A10 `4153265`, A11 `15b3c98`+`a24ed12`.

## Next action

Billy tests the alpha by hand and reports. Specifically ask him to:
1. Paste one of his real scripts (or open a .fountain/.fdx) and walk the whole journey.
2. Round-trip one exported .fdx through his real Final Draft copy (our FDX is structurally tested but never opened in FD — open risk).
3. React to the "honest approximations" list in `docs/proof/alpha/README.md` (act reassignment UI, snapshot browser, per-approval undo, ES-localized findings are the likely next asks).

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
- testing-library normalizes whitespace in matchers: assert doubled-space strings via raw DOM textContent, not getByText.
- jsdom Blob has no .text(); read blobs with FileReader in tests.
- Two "Annotated read" buttons exist when the AI panel is locked (top bar + panel); scope Playwright locators with getByRole('banner').
- Autosave debounce is 500ms: e2e must waitForTimeout(1200) before reload assertions (repo convention).
- Editor: Tab is element switching, Escape exits the page; never focus ProseMirror DOM directly (use .sp-page-scroller). Element ids `sc2-e5` are stable references; only append to scene ends in the sample.
- The AI panel writes findings via store setFindings (throws before read complete) — UI must gate first.
- `npm ls playwright-core` must stay a single deduped 1.48.2.
- Codex (another agent) sometimes inspects this repo; keep the worktree clean between sessions.
