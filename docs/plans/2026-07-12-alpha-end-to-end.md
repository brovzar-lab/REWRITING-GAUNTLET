# Rewrite Studio: End-to-End Alpha Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans as a SINGLE active coding agent (one repo, one editor; helpers read-only or in a separate worktree). Build continuously task-by-task after Billy approves; stop only for destructive actions, broken assumptions, or genuine product decisions.

**Goal:** A testable alpha of the complete Rewrite Studio workflow: import or paste a screenplay → private annotated read → human notes with reader limits → run an Epps rewrite pass with an AI assistant that cites evidence → approve/reject each proposal → the draft updates with provenance and revision marks → export the result.

**Architecture:** Everything already built stays. New: (1) `src/io/` — Fountain and FDX import/export against the canonical model, plus a paste-import dialog and a print view for PDF; (2) `src/workflow/` — project workflow state (annotated read, readers, pass runs, approvals, draft snapshots) persisted in Dexie; (3) `src/ai/` — an `AIProvider` interface with a deterministic local analyzer as default and an optional cloud adapter behind an explicit consent screen; no module outside `src/ai/adapters/` may name a vendor; (4) new panels — Notes authoring in the inspector, an AI Assist panel, and an Export menu.

**Tech stack:** existing pinned set + ONE new pinned dependency: `fast-xml-parser@4.5.0` (FDX XML). The cloud AI adapter uses plain `fetch` (no vendor SDK). Nothing else new.

## Global constraints (unchanged and binding)

- Repo root app, port **5213**, host `127.0.0.1`, strictPort. Canonical model is the source of truth. Stable element/scene ids preserved through import where the format allows; generated fresh otherwise.
- Methodology invariants, enforced in the store (not just UI) with tests:
  - AI diagnosis is not revealed until the writer marks the private annotated read complete.
  - Reader notes: recommend 3, hard-cap 5 initial readers; exactly 1 interim reader. Writer/reader/AI/producer-executive/interim-reader sources visibly separated.
  - Claim labels and Clear/Uncertain/Priority Concern statuses everywhere; **no numeric script score anywhere**.
  - Never a one-shot page-one rewrite: AI proposals are scene-level, per-pass, each requiring writer approval; scenes not cited by an approved finding are never modified (scene locking by construction, tested).
  - Full draft = the accumulation of approved changes only; every applied change carries provenance (who/what/why/when/which pass) and shows revision marks.
- EN/ES strings for all new UI; WCAG 2.1 AA; axe stays clean; all DESIGN tokens; TDD; commit at every green.

## What will be BUILT

1. **Fountain import + export** (required): parser and serializer for scene headings, action, character, parenthetical, dialogue, transitions, title page (title/draft label); paste-a-script dialog and .fountain file open; lossless round-trip on our sample (golden test). Act assignment on import: heuristic thirds, editable later — labeled in UI as a guess.
2. **FDX import + export** (feasible, included): maps FD paragraph types to canonical elements both ways using fast-xml-parser; round-trip structural test against a fixture. Flagged in UI and proof as "not yet validated inside the Final Draft application."
3. **PDF**: **export** via a dedicated print view that renders the pagination engine's exact pages to the system print dialog (Save as PDF) — labeled "via system print dialog." PDF **import is deferred**; the paste dialog is the alpha path for PDFs (Billy pastes the text) and says so.
4. **Workflow spine** (`src/workflow/`): document lifecycle (import replaces the working draft after an automatic snapshot), draft snapshots in Dexie (restorable list), annotated-read state, readers registry, pass runs, approval ledger with provenance.
5. **Notes authoring**: inspector gains "Add note" on the current selection: writer note (default during annotated read), reader note (choose registered reader), producer/executive note; claim label + status pickers; readers manager enforcing 3-recommended/5-max initial and exactly-1 interim.
6. **Annotated read gate**: a guided private read mode (scene-by-scene next/prev, margin notes as writer evidence); "Mark read complete" unlocks AI; the gate is a store invariant with a test (AI diagnose throws before the flag).
7. **AI assistant panel**: per active pass — Diagnose button → findings list. Each finding: one-sentence hypothesis (claim type `ai_hypothesis`), status, clickable evidence citations (exact scenes/lines), and optionally a scene-level proposed text change shown as old→new. Approve applies it (provenance + revision mark + evidence link), Reject archives it. Visibly separated from human notes.
8. **AI providers**: `AIProvider` interface. Default **Local Analyzer**: deterministic, offline, cites real structural evidence (scene length outliers, single-appearance characters, act balance, setup/payoff via connections, dialogue/action ratio per pass lens, orphan detection). Optional **cloud adapter** (Anthropic API via fetch): disabled until the user opens AI Settings, reads a consent screen stating exactly what text leaves the machine, and pastes their own API key (stored locally only). Alpha is fully testable with the local analyzer and no key.
9. **Pass orchestration**: pass states (not started / diagnosing / reviewing / complete) shown as tray chips; completing a pass snapshots the draft and bumps the draft label; passes repeat/reorder/skip freely.
10. **Export menu**: Fountain (.fountain download), FDX (.fdx download), Print/PDF view; each option labeled with its fidelity caveat where applicable.

## What is DEFERRED (explicitly, not silently)

- PDF text-extraction import (paste covers the alpha; import returns post-alpha).
- Validation of FDX inside the real Final Draft app (structural tests only; needs Billy's FD copy to verify — I will ask for one round-trip check during alpha testing).
- The full Epps artifact suite (Game Plan chart, Set-Up checklist, four high points board, Scene Point, holdovers/orphans checker as dedicated tools, Polish Read flow, Touchstone, Ticking Clock, slug file) — the pass engine ships with objectives blurbs per pass; artifacts arrive after the alpha proves the loop.
- TV pilot adapter, co-writer mode, cloud sync, revision paper tinting, multi-document library (one working draft + snapshot history in the alpha).

## Tasks

- **A1 Fountain parser/serializer** (`src/io/fountain.ts`): `parseFountain(text): Screenplay`, `serializeFountain(sp): string`. Tests first: element-type fixtures, our sample round-trips losslessly, malformed input degrades to action lines (never throws).
- **A2 Import UI**: Import dialog (paste box + .fountain/.fdx file picker) with preview (scene count, page count, act-guess note), automatic snapshot of the current draft before replace. e2e: paste a script, see it paginated.
- **A3 FDX in/out** (`src/io/fdx.ts`): `parseFdx(xml): Screenplay`, `serializeFdx(sp): string`; fixture round-trip tests; pin fast-xml-parser 4.5.0.
- **A4 Workflow store + snapshots** (`src/workflow/`): Dexie v3 (`snapshots`, `workflow`, `readers`, `findings`, `approvals` tables); store slice with invariant guards; unit tests incl. the AI gate throw and the reader caps.
- **A5 Notes authoring + readers manager**: inspector add-note flow, readers CRUD with caps, ES/EN strings; component tests.
- **A6 Annotated read mode**: guided scene-by-scene read, margin notes, completion flag; test: AI panel locked before, unlocked after.
- **A7 AI core** (`src/ai/`): `AIProvider` interface, Local Analyzer with per-pass heuristics producing findings with real citations; unit tests per pass lens (deterministic fixtures). Cloud adapter + consent screen + key storage (never exported, disclosed in UI); adapter unit-tested against a mocked fetch.
- **A8 AI Assist panel + approvals**: findings UI, old→new proposal view, approve/reject; approval applies text via store action `applyProposal` (records provenance, marks revision, refuses ids outside the finding's citations — the scene lock); tests: approve updates exactly the cited element; reject changes nothing; provenance row written.
- **A9 Pass orchestration + tray states**: run lifecycle, complete-pass snapshot + draft label bump; tests.
- **A10 Export menu + print view**: downloads + print stylesheet rendering engine pages 1:1; fidelity labels; tests for file contents.
- **A11 Alpha journey e2e + a11y + proof**: one Playwright spec that walks Billy's exact acceptance flow end to end (paste → read → notes → pass → approve/reject → export contains the approved change only), axe re-scan of every new surface, full regression, proof pack.

## Tests (summary)

Unit: Fountain/FDX round-trips + malformed input; workflow invariants (AI gate, reader caps, scene lock, no-score); local analyzer determinism per pass; export content. E2E: import paths, annotated-read gate visible in UI, the full alpha journey, axe on new panels (import dialog, AI panel, consent screen, export menu) in both themes. Regression: all 27 existing e2e + 96 unit tests stay green.

## Proof I will show

- URL (5213, both hosts), clean worktree, fresh `npm test` / build / full Playwright counts.
- A recorded e2e alpha journey (the exact 6-step flow you listed) passing, plus screenshots: import dialog with a pasted script, annotated read mode, AI panel locked before the read and revealing findings after, a proposal old→new with Approve/Reject, the applied change with revision mark + provenance in the inspector, the export menu, and the exported .fountain diff showing the approved change and not the rejected one.
- A plain list of everything approximate: FDX unvalidated in FD, PDF via print dialog, act-guess on import, local-analyzer conservatism.

## Risks

1. **FDX fidelity** — structural tests can't guarantee Final Draft opens it perfectly; needs one check in your FD copy during testing. Mitigation: conservative mapping of the seven core paragraph types only.
2. **Local analyzer usefulness** — deterministic heuristics are honest but shallow; they exist so the loop is testable offline. The cloud adapter (your key, your consent) is where diagnosis gets smart. Both output the same finding shape, so nothing else changes.
3. **Imported-script pagination** — real scripts stress the wrap heuristic more than our sample; golden tests pin the engine and the drift check fails loudly.
4. **Scope weight** — this is 4 former slices in one alpha. Mitigation: strict task order above; the journey e2e is written early (A2) in skeleton form and grows with each task, so the alpha is demonstrably converging the whole way.
5. **Undo semantics for approvals** — alpha supports reverting via snapshots (restore), not per-approval undo; stated in UI.
