# HANDOFF — Rewrite Studio / REWRITING-GAUNTLET (2026-07-12)

## Where we left off

Two big pieces of work finished and committed on main today:

1. **End-to-End Alpha** (plan `docs/plans/2026-07-12-alpha-end-to-end.md`, tasks A1-A11): the complete rewrite journey works. Import a screenplay (paste, .fountain, or .fdx) → private annotated read (AI locked until it is done) → notes with Epps reader limits → AI pass diagnosis (free local analyzer by default; cloud assistant only behind a consent screen plus Billy's own key; vendor named only in `src/ai/adapters/`, enforced by a test) → approve or reject each proposal (scene-locked, provenance, revision marks) → complete pass (snapshot, "Rewrite N" label) → export Fountain/FDX/print-PDF containing approved changes only.
2. **Alpha UX Repair Pass** (plan `docs/plans/2026-07-12-alpha-ux-repair.md`, tasks U1-U7, dictated by Billy after he tested the alpha and found the UX unclear): app-style import menu; guided pass workspace when you click a pass chip (objective, what it examines, diagnose, approve/reject queue, progress, complete, next pass); always-visible Add note in the status bar with per-scene note badges and per-pass note counts; pass completion summary dialog; the page centered on a desk surface with a real selected-line highlight (old one was a dead style never applied); visible snapshot history with safe two-step restore; six usability acceptance e2e tests.

Verified at handoff: **192 unit tests**, **38 Playwright tests** (full journey, 6 usability checks, axe WCAG 2.1 AA both themes, full regression), **build exit 0**, worktree clean. Proof pack: `docs/proof/alpha/` (14 screenshots, exported .fountain showing approved-in / rejected-out, honest approximations list in its README).

Alpha commits: `5ed616c` (A1) through `a24ed12` (A11). UX repair commits: `af9285d` (U1), `57239a6` (U2), `1156ea5` (U3), `cad5d1e` (U4), `e5020b9` (U5), `9c3f3fd` (U6), `b7acaf0`+`2fd5ea7` (U7).

## Next action

Billy re-tests the repaired alpha by hand at http://localhost:5213 (start command below). Collect his verdict on three things: (1) do passes now feel active, (2) walk one of his real scripts through the whole journey, (3) round-trip one exported .fdx in his real Final Draft copy. Whatever he reports becomes the next plan; do not start new features before his verdict.

## Locked decisions

- Plan first, Billy approves, then build. Continuous build was authorized for the alpha and the UX repair only; new scope needs a new approved plan.
- One repo, one editor. No subagent-driven development here; helpers read-only or in a separate worktree.
- App at repo root, port 5213, host 127.0.0.1, strictPort. Port registry is `~/.Codex/dev-ports.md` (NOT ~/.claude/dev-ports.md).
- Dependencies pinned exact (no ^). fast-xml-parser@4.5.0 was the only alpha addition. `npm ls playwright-core` must stay a single deduped 1.48.2.
- Plain ASCII (MORE) and NAME (CONT'D); 55 body lines per page; page headers never count.
- Methodology invariants live in the store and are tested: AI gate behind the annotated read; 5-max/3-recommended initial readers, exactly 1 interim; claim labels plus Clear/Uncertain/Priority Concern; never a numeric script score; never a one-shot rewrite; scene lock (a proposal may only touch an element its finding cites); draft = approved changes only, with provenance.
- AI boundary: `src/ai/provider.ts` interface; local analyzer default; only `src/ai/adapters/cloud.ts` may name the vendor (model claude-sonnet-5, plain fetch, anthropic-dangerous-direct-browser-access header, key in localStorage via keyStore). Consent resets when a new document is imported.
- Epps pass names and order locked; Studio additions labeled "Studio extension".
- DESIGN.md / DESIGN.json tokens are mandatory; compact type, warm paper both themes, no dashboards, no chatbot-first layout. The desk tone (--desk in themes.css) is a derived tonal layer, not a new palette color.

## Open loops

1. **Billy's re-test of the repaired alpha** — see Next action. Done when he signs off or dictates the next fix list.
2. **FDX validation in real Final Draft** — our .fdx is structurally tested but has never been opened in the actual application; the UI says so. Done when one exported file round-trips in Billy's FD copy.
3. **claude-goal repo location** — a separate tool repo sits gitignored at `claude-goal/` inside this repo; Billy's ~/.claude/settings.json Stop hook and ~/.claude/skills/goal symlink point INTO it, so never delete it. Done when Billy decides to leave it or approves moving it to ~/CODE/claude-goal with the symlink and hook repointed.
4. **Deferred features backlog** (needs Billy's priorities): PDF text-extraction import, per-scene act reassignment UI, per-approval undo, Spanish analyzer findings, deeper Epps artifacts (Game Plan, Set-Up checklist, four high points, Scene Point, holdovers/orphans, Polish Read, Touchstone, Ticking Clock, slug file), TV pilot adapter (labeled Studio extension), co-writer mode, cloud sync, revision paper tinting.

## How to run and verify

```
cd /Users/quantumcode/CODE/REWRITING-GAUNTLET && npm run dev
```

- URL: http://localhost:5213 (also answers on http://127.0.0.1:5213).
- If the port is busy, find out WHOSE server it is before killing anything (`lsof -i:5213`). It may be Billy's own running session. A stale agent server is killed with `lsof -ti:5213 | xargs kill`; never move to another port.
- Agent rule (this bit Billy twice): before telling Billy to run the dev command, kill any server this session started and confirm the port is free, or give him only the URL and say it is already running. Never both.
- Tests: `npm test` (192 passing), `npx playwright test` (38 passing; reuses a running server), `npm run build` (exit 0).
- Proof pack regeneration: dev server running, then `node scripts/proof-alpha.mjs` (wipes its own demo data afterwards).
- Golden pagination fixtures: regenerate only after intentional engine changes (`node scripts/gen-goldens.mjs`), then hand-review the diff.

## Gotchas / context not on disk

- Billy dictates by voice; read charitably. Plain language, short ordered lists, no em dashes, one copy-paste terminal block starting with cd, proof before claiming done.
- Import dialog is two-step (menu → paste or file step): e2e must click "Paste screenplay" before filling the box.
- The pass workspace lives on the "Rewrite pass" inspector tab and only shows the lock message once a pass chip is selected; clicking a chip auto-switches the tab (store setActivePass does it).
- The pass-summary dialog opens automatically after Complete pass and overlays everything; close it or use its Export now button before clicking the top bar in e2e.
- parseFountain TRIMS every line, so trailing spaces never survive paste-import; polish-pass fixtures need internal double spaces.
- testing-library normalizes whitespace: assert doubled-space strings through raw DOM textContent, not getByText. jsdom Blob has no .text(): use FileReader in tests.
- Two "Annotated read" buttons exist while a pass workspace is locked (top bar + workspace); scope Playwright locators with getByRole('banner').
- Autosave debounce is 500ms: e2e waits 1200ms before reload assertions (repo convention).
- alpha-a11y.spec.ts is marked test.slow() (five sequential axe scans time out at the default 30s under load).
- Editor rules: Tab switches element type, Escape exits the page (focuses [data-editor-exit]); never focus ProseMirror's DOM directly (resets the caret; focus .sp-page-scroller instead). Element ids like sc2-e5 are stable references; only append to scene ends in the sample data.
- ProseMirror widget decoration keys must encode everything the widget renders or stale DOM survives redraws. dnd-kit spreads its own aria-pressed; set yours after {...attributes}.
- Snapshot history lists snapshots across ALL documents on purpose (the draft you replaced at import is the one you usually want back).
- Codex (another agent Billy uses) sometimes inspects this repo; keep the worktree clean between sessions.
