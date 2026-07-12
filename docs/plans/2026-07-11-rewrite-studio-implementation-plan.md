# Rewrite Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Slice 1 is specified at task level below; Slices 2–7 each get a task-level plan written (and approved) immediately before that slice begins.

**Goal:** Build Rewrite Studio, a local-first professional web application that operationalizes Jack Epps Jr.'s *Screenwriting Is Rewriting* for feature screenplays and TV pilots, per the approved PRODUCT.md / DESIGN.md / DESIGN.json.

**Architecture:** A Vite + React + TypeScript single-page app with no backend. A canonical screenplay model (plain TypeScript data, not HTML) is the single source of truth; the ProseMirror-based editor, the pagination engine, the tactile board, and all import/export flows read from and write to that model. Persistence is IndexedDB (Dexie) with debounced autosave and recoverable version snapshots. AI access goes exclusively through a provider-agnostic adapter interface with an explicit consent gate; no module imports a vendor SDK directly.

**Tech Stack:** Vite, React 18, TypeScript (strict), Zustand (state), ProseMirror (editor), dnd-kit (board drag/drop with keyboard support), Dexie/IndexedDB (persistence), Vitest + React Testing Library (unit/component tests), Playwright + axe-core (e2e and accessibility), Courier Prime bundled locally (screenplay font), fast-xml-parser (FDX, later slice), pdf.js (PDF import, later slice). Future desktop wrapper: Tauri (not in scope until after Slice 7).

## Global Constraints

Copied from CLAUDE.md / PRODUCT.md / DESIGN.md — every task implicitly includes these:

- The screenplay page is the center of the app; analysis, boards, notes, and AI must link back to exact screenplay evidence.
- The canonical screenplay model, not rendered HTML, is the source of truth.
- No module depends directly on a specific AI vendor.
- No screenplay content is sent to any cloud provider without explicit disclosure and consent (Slice 6 gate).
- Never an unreviewed one-shot page-one rewrite. Full drafts are assembled only from approved pass-by-pass changes; unaffected scenes are locked.
- Writer's private annotated read is required before AI diagnosis is revealed.
- Note sources visibly separated: writer, reader, AI, producer/executive, interim reader. Claim labels: textual fact, reader reaction, AI hypothesis, writer-confirmed interpretation, unresolved hypothesis. Statuses: Clear, Uncertain, Priority Concern. No overall numerical screenplay score.
- Day, Night, and System themes with identical hierarchy. All tokens from DESIGN.json exactly (colors, type sizes, radii, spacing, shadows, motion curves). Screenplay paper `#F8F1DF` stays warm in both themes (The Page Rule).
- Compact UI type only: 11px labels, 13px body, 14px titles, 18px max headline. Screenplay text 12pt Courier Prime. No gradients, glassmorphism, neon, oversized type, decorative AI imagery, or rounded-card grids.
- WCAG 2.1 AA: full keyboard navigation, visible 2px focus rings, reduced motion support, color never carries meaning alone, contrast checked.
- UI in English and Spanish from the start (string dictionary; no hardcoded UI copy); screenplay content may be EN, ES, or mixed.
- Fixed dev port **5213** (register in `~/.claude/dev-ports.md` with strictPort in vite config).
- One repo, one editor: subagents that write files must use separate worktrees or run sequentially.
- Use `apply_patch`-style targeted edits; no destructive git commands. Initialize git in Slice 1, commit at every green test.

## Methodology corrections from the book audit (2026-07-11)

An independent full read of the extracted book text against CLAUDE.md's methodology requirements found these genuine facts the build must honor:

1. **Epps's eleven passes, verbatim, in his order** (the pass tray must use these names): Foundation, Character, Story and Theme, Structure, Plot, Complications/Obstacles/Reveals/Reversals, Relationship, Scene, Dialogue, Consistency, Polish. Interim reader feedback sits after the Plot Pass. "Start with Character" is his stated default emphasis; reordering is allowed (he says so explicitly) but the default order is his.
2. **Reader counts:** at least three, at most five readers for the *initial* draft; exactly **one trusted reader** for the *interim* draft (with his protocol: ground rules, ~30-minute session, open-ended pointed questions, start positive, never show producers an interim draft). The app must not generalize 3–5 to all phases.
3. **Ordering nuance:** Epps collects outside notes before the annotated self-read. The approved product rule (private annotated read before *AI* diagnosis) is compatible — human reader notes may be collected any time; only the AI diagnosis reveal is gated behind the writer's annotated read. Implement it that way.
4. **Missing Epps artifacts now added to scope (Slice 5):** the Game Plan (Statement of Intent + Notes & Solutions two-column chart), per-pass Objectives checklists, the Master Note List content categories, "the note behind the note" triage, hard-notes vs smart-notes distinction, Touchstone, Ticking Clock, and the slug file (archive of cut material).
5. **Provenance labels for tools:** "Set-Up Map," "conflict map," "relationship map," and "table read" are product extensions/renames, not Epps's terms (his artifacts: the Set-Up checklist of ~18 establish-items, Opposition Characters, relationship chapters, read-your-script-aloud). The **entire TV-pilot adapter has no basis in this book**. All of these stay in scope (they are approved) but the UI labels them "Studio extension" vs "Epps method" so the product never misattributes to the book.
6. **"Locked scenes" and the five claim labels / three statuses are product constructs** consistent with the book's spirit (Resist a Page One Rewrite; symptom-vs-remedy). Keep them; they're approved product decisions, not book citations.

## Slice overview (each slice ships a working, demonstrable app)

| # | Slice | Proof shown to Billy |
|---|-------|----------------------|
| 1 | Workspace core: shell, themes, navigator, editor with element switching, tactile board, evidence link, pass tray, autosave | URL on :5213, screenshots Day+Night, test output, a11y check output |
| 2 | Professional editor: true pagination, revision marks, zoom without repagination, focus/full-board modes, complete keyboard flow | Same, plus a paginated 8+ page sample matching industry layout |
| 3 | Import/export: Fountain + FDX import/export, PDF export; PDF import (best-effort, flagged risk) | Round-trip demo with a real screenplay file |
| 4 | Notes & evidence system: reader intake (3–5 initial, 1 interim), annotated-read mode, source separation, claim labels, statuses, Master Note List | Demo: a reader note travels to an evidence-linked concern on the page |
| 5 | Epps rewrite engine: Game Plan, 11 passes with objectives checklists and note→solution tables, structural tools (Set-Up checklist, four high points, Essential Three-Act Questions, Scene Point, holdovers/orphans, Polish Read), pass orchestration | Demo: run a Character Pass end to end on the sample script |
| 6 | AI collaborator: provider adapter, consent gate, annotated-read gate, evidence-backed hypotheses, proposal → approval → draft assembly with scene locking and provenance | Demo: AI hypothesis with evidence; approve a change; assembled draft shows provenance |
| 7 | Extensions: TV pilot adapter (labeled as extension), bilingual depth, co-writer mode, sync boundary stub, evaluation/regression suite | Demo per feature + full regression run |

Dependencies: 2 needs 1. 3 needs 2 (pagination for PDF export). 4 needs 1. 5 needs 4. 6 needs 4+5. 7 needs 5 (pilot adapter reuses pass engine). Risks are listed at the end.

---

# Slice 1: Workspace Core (task-level plan)

**Acceptance criteria (from the handoff, all must demo):**

1. Application shell in Day and Night modes (System option follows OS), identical hierarchy, tokens from DESIGN.json.
2. Scene navigator grouped by acts with per-scene slug, number, and page reference.
3. Professionally formatted screenplay page (Courier Prime 12pt, correct element margins, visible page breaks on the sample) with realistic sample content.
4. Keyboard element switching: Tab/Enter cycle Scene Heading → Action → Character → Dialogue → Parenthetical → Transition, Final Draft-style.
5. Tactile board: draggable scene cards (pointer + keyboard), card colors = story function per DESIGN.md, visible connection lines with non-color markers.
6. Selecting a screenplay line highlights its board card and shows its evidence in the inspector; evidence shows source + claim-type labels.
7. Persistent rewrite-pass tray listing Epps's 11 passes in his order, selectable, with state chips.
8. Autosave to IndexedDB (debounced ≤2s) and full reload recovery.
9. Responsive at 1280px and 1920px per DESIGN.json breakpoints; panels resize/collapse.
10. Accessibility: keyboard-only walkthrough works, visible focus, contrast passes axe, `prefers-reduced-motion` respected, no color-only meaning.

**Sample data:** an original ~10-scene, 3-act short feature excerpt written for this project (realistic, bilingual-friendly names), stored as canonical-model JSON with pre-authored evidence records from writer/reader/AI sources. No marketing copy, no lorem ipsum.

## File structure

```
rewrite-studio/                    (app root inside the repo)
  vite.config.ts                   strictPort 5213
  index.html
  src/
    model/
      screenplay.ts                canonical types: Screenplay, Scene, Element, ElementType, StableId
      evidence.ts                  EvidenceRecord, NoteSource, ClaimType, Status enums
      passes.ts                    the 11 Epps passes as data (id, name, order, blurb)
      sample/gauntlet-sample.ts    the realistic sample screenplay + evidence
    store/
      appStore.ts                  Zustand store: selection, theme, panel sizes, active pass
      persistence.ts               Dexie schema, autosave subscription, load-on-boot
    editor/
      schema.ts                    ProseMirror schema mapping ElementType 1:1
      elementCycling.ts            Tab/Enter keymap (pure function + plugin)
      ScreenplayEditor.tsx         editor component, canonical-model sync
      layout.ts                    element margin/width constants (screenplay layout rules)
    board/
      Board.tsx                    spatial canvas
      StoryCard.tsx                DESIGN.json ds-story-card
      connections.tsx              SVG connection layer with markers + line styles
    panels/
      SceneNavigator.tsx
      EvidenceInspector.tsx        source + claim-type labeled evidence display
      PassTray.tsx
      PanelLayout.tsx              resizable/collapsible panel shell
    theme/
      tokens.css                   every DESIGN.json token as CSS custom properties
      themes.css                   day/night/system via data-theme + media query
    i18n/
      strings.ts                   EN/ES dictionaries, t() helper
    App.tsx, main.tsx
  tests/  (Vitest colocated in src/**/*.test.ts; Playwright in e2e/)
  e2e/
    workspace.spec.ts              load, theme switch, keyboard walkthrough
    a11y.spec.ts                   axe scans day + night
    autosave.spec.ts               edit → reload → recovered
```

## Tasks

### Task 1: Scaffold, tokens, git, port registration

**Files:** Create app root via `npm create vite@latest`, `src/theme/tokens.css`, `src/theme/themes.css`, `vite.config.ts` (strictPort 5213); modify `~/.claude/dev-ports.md` (add row: REWRITING-GAUNTLET | 5213 | yes | vite strictPort). Initialize git, first commit.
**Produces:** CSS custom properties named `--color-night-frame`, `--color-selection-amber`, etc., one per DESIGN.json token; `data-theme="day" | "night"` on `<html>`, System = media query.

- [ ] Scaffold Vite react-ts app, install deps (zustand, dexie, prosemirror-* core packages, @dnd-kit/core, courier-prime via @fontsource)
- [ ] Write tokens.css and themes.css with every DESIGN.json value verbatim; write a token snapshot test that parses DESIGN.json and asserts each color token exists in tokens.css with the exact hex
- [ ] Run test → fail → implement → pass
- [ ] Register port 5213 in dev-ports.md; `npm run dev` and confirm http://localhost:5213 serves
- [ ] git init + commit

### Task 2: Canonical model + sample data

**Files:** Create `src/model/screenplay.ts`, `src/model/evidence.ts`, `src/model/passes.ts`, `src/model/sample/gauntlet-sample.ts`, tests alongside.
**Produces (exact interfaces later tasks consume):**

```ts
type ElementType = 'scene_heading' | 'action' | 'character' | 'parenthetical' | 'dialogue' | 'transition';
interface Element { id: string; type: ElementType; text: string }
interface Scene { id: string; number: number; act: 1 | 2 | 3; slug: string; storyFunction: 'plot' | 'setup' | 'opposition' | 'resolution' | 'relationship'; elements: Element[] }
interface Screenplay { id: string; title: string; draftLabel: string; scenes: Scene[] }
type NoteSource = 'writer' | 'reader' | 'ai' | 'producer_executive' | 'interim_reader';
type ClaimType = 'textual_fact' | 'reader_reaction' | 'ai_hypothesis' | 'writer_confirmed' | 'unresolved_hypothesis';
type EvidenceStatus = 'clear' | 'uncertain' | 'priority_concern';
interface EvidenceRecord { id: string; source: NoteSource; claimType: ClaimType; status: EvidenceStatus; summary: string; sceneId: string; elementId: string; readerName?: string }
```

- [ ] Write failing tests: sample has ≥10 scenes across 3 acts; every evidence record points at an existing scene+element; passes.ts exports exactly 11 passes in Epps's order with exact names
- [ ] Implement model + author the sample screenplay (original content, ~10 scenes, with named characters, real dramatic escalation, a bilingual line or two) + 8–12 evidence records covering all five sources and all five claim types
- [ ] Tests pass; commit

### Task 3: Store + autosave persistence

**Files:** Create `src/store/appStore.ts`, `src/store/persistence.ts`, tests with fake-indexeddb.
**Produces:** `useAppStore` with `{ screenplay, selection: {sceneId, elementId} | null, theme, activePassId, select(), updateElementText(), setTheme() }`; `initPersistence()` that hydrates from Dexie on boot and autosaves on change (500ms debounce).

- [ ] Failing test: mutate element text → advance timers → Dexie row updated; fresh store hydrate → text recovered
- [ ] Implement; tests pass; commit

### Task 4: Screenplay editor with element switching

**Files:** Create `src/editor/schema.ts`, `src/editor/elementCycling.ts`, `src/editor/layout.ts`, `src/editor/ScreenplayEditor.tsx`, tests.
**Produces:** `<ScreenplayEditor/>` rendering the canonical model on `--color-screenplay-paper` with correct per-element indents (scene heading/action at left margin, character at 2.2in, dialogue at 1.0in width-limited, parenthetical at 1.6in, transition right-aligned), Courier Prime 12pt; `cycleElementType(current: ElementType, key: 'Tab' | 'Enter'): ElementType` implementing Final Draft conventions (Enter after scene heading → action; Enter after character → dialogue; Tab on empty action → character; Tab in dialogue → parenthetical; etc. — full transition table in the test).
**Note:** true pagination is Slice 2; Slice 1 shows page-break separators computed by a simple line-count heuristic so the paper reads as pages, clearly marked `approximate` in code.

- [ ] Failing unit tests for the full cycling transition table (pure function, every combination)
- [ ] Implement cycling; pass; commit
- [ ] Failing component test: renders sample, typing updates canonical model (model is source of truth — assert store text, not DOM)
- [ ] Implement editor sync; pass; commit

### Task 5: Scene navigator + pass tray + panel layout

**Files:** Create `src/panels/SceneNavigator.tsx`, `src/panels/PassTray.tsx`, `src/panels/PanelLayout.tsx`, tests.
**Produces:** navigator grouped by act headers (ACT ONE/DOS-language-aware), click/Enter selects scene and scrolls editor; pass tray fixed at bottom listing 11 pass chips (DESIGN.json ds-pass-chip), arrow-key navigable, `aria-pressed` on active; panels draggable-resize with double-click collapse, sizes persisted in store.

- [ ] Failing tests: acts grouped correctly; selecting navigator row updates store selection; tray renders 11 chips in order; keyboard operation
- [ ] Implement; pass; commit

### Task 6: Tactile board + connections

**Files:** Create `src/board/Board.tsx`, `src/board/StoryCard.tsx`, `src/board/connections.tsx`, tests.
**Produces:** one card per scene, colored by `storyFunction` (blue plot / ochre setup / brick opposition / sage resolution / plum relationship) **plus a text label of the function** (color never alone); dnd-kit drag with keyboard sensor (space to lift, arrows to move); card-lift shadow only while dragging; SVG connection lines between related scenes (from sample data) with distinct line styles + midpoint glyphs; board expandable to full-board mode.

- [ ] Failing tests: card count and labels; drag reorder updates store; keyboard drag works; connection endpoints resolve
- [ ] Implement; pass; commit

### Task 7: Evidence inspector + selection linking

**Files:** Create `src/panels/EvidenceInspector.tsx`, tests; modify editor/board to publish selection.
**Produces:** selecting an element in the editor highlights its board card (accent outline + corner marker) and lists its evidence records; each record shows source chip, claim-type label, status (icon + word, not color alone); clicking evidence in the inspector selects the exact element in the editor. This is the evidence → page round trip the handoff demands.

- [ ] Failing test: select sample element with known evidence → inspector shows the record with correct source and claim labels → board card carries selected state
- [ ] Implement; pass; commit

### Task 8: Themes, i18n pass, reduced motion, e2e + a11y

**Files:** Create `src/i18n/strings.ts`, `e2e/workspace.spec.ts`, `e2e/a11y.spec.ts`, `e2e/autosave.spec.ts`; sweep all components for hardcoded copy.
**Produces:** every UI string via `t()` with EN and ES entries; theme toggle Day/Night/System; `prefers-reduced-motion` kills transitions; Playwright: full keyboard walkthrough (tab order: navigator → editor → board → inspector → tray), axe scan clean in both themes at 1280 and 1920, edit-reload-recover green.

- [ ] Write the three Playwright specs (failing), implement fixes until green
- [ ] Run full suite: `npx vitest run && npx playwright test` — all green
- [ ] Commit; tag `slice-1`

### Task 9: Proof for Billy (verification before completion)

- [ ] Kill stale port, `npm run dev`, confirm http://localhost:5213 loads (curl + Playwright screenshot)
- [ ] Capture Day and Night screenshots at 1280 and 1920
- [ ] Present URL + screenshots + test output; **stop for Billy's review before Slice 2**

---

# Slices 2–7 (acceptance criteria and risks; task plans written at slice start)

### Slice 2: Professional editor
Accept: true pagination engine computed from the canonical model (industry line-count rules: ~55 lines/page, dialogue widths, (MORE)/(CONT'D) handling), page count stable under zoom (zoom scales rendering only), revision marks (asterisks in margin per changed line, revision color sets), scene numbers, focused screenplay mode, complete Final Draft keyboard flow (Cmd+1..6 element set, smart-type character names). Tests: golden-file pagination fixtures. Risk: pagination fidelity is the hardest pure-engineering problem in the product — budget the most iteration here.

### Slice 3: Import/export
Accept: Fountain import/export round-trips the sample losslessly; FDX import/export interoperates with a real Final Draft file; PDF export matches the pagination engine; PDF import produces a canonical model with per-element confidence flags and a review screen (never silent). Risk: PDF import is heuristic; scope it as best-effort with visible uncertainty, not a promise.

### Slice 4: Notes & evidence system
Accept: reader intake enforcing 3 recommended / 5 max initial readers and exactly one interim reader (with Epps's interim protocol as guided UI); private annotated-read mode (writer margin notes, cover-to-cover flow) recorded as writer-source evidence; Master Note List with Epps's content categories; "note behind the note" triage step separating reaction from proposed remedy; statuses Clear/Uncertain/Priority Concern; no numerical score anywhere; market-readiness section separate, optional, off by default, explicitly caveated.

### Slice 5: Epps rewrite engine
Accept: Game Plan artifact (Statement of Intent + Notes & Solutions chart, living across passes); the 11 passes as reusable lenses (repeat/combine/reorder/skip, default order = Epps's, "start with character" surfaced as his recommendation); per-pass Objectives checklists and note→solution tables from the book; tools: Set-Up checklist (~18 establish items), Opposition Characters, Essential Three-Act Questions, four high points (End of Act I, Mid-Point, End of Act II, Climax), index-card board integration, Scene Point per scene, conflict map and relationship map (labeled "Studio extension"), read-aloud mode ("table read" labeled extension), holdovers/orphans checker, final Polish Read flow, Touchstone, Ticking Clock, slug file for cut material. Provenance labels "Epps method" vs "Studio extension" throughout.

### Slice 6: AI collaborator
Accept: `AIProvider` interface (no vendor import outside `src/ai/adapters/`); consent screen disclosing exactly what text leaves the machine before any call; AI diagnosis locked until the annotated read is marked complete; AI output only as evidence-linked hypotheses (claim type `ai_hypothesis`, never auto-applied); proposal → writer approval → change enters draft with provenance (who/what/why/when, setup–payoff links); scene locking for unaffected scenes; full-draft assembly only from approved changes; version recovery UI. Risk: prompt/response quality needs the evaluation suite early — build eval fixtures in this slice, not slice 7.

### Slice 7: Extensions
Accept: TV pilot adapter (series engine, pilot promise, repeatable conflict, ensemble, A/B/C stories, teaser/cold open, act-outs, episodic vs serialized, season trajectory, sustainability) — every screen labeled as a studio extension beyond the book, since the audit found zero basis in Epps; half-hour and one-hour templates with act-out pagination; bilingual screenplay support hardening; co-writer mode (local multi-profile + change attribution); synchronization boundary as a clean interface stub (no cloud yet); evaluation and regression suite covering pagination goldens, import round-trips, methodology gates (annotated-read gate, reader caps, no-score rule) as executable tests.

## Top risks

1. **Pagination fidelity (Slice 2).** Final Draft users notice one-line differences. Mitigation: golden-file tests against known-good page breaks, treat Slice 1 breaks as explicitly approximate.
2. **PDF import (Slice 3).** Heuristic by nature. Mitigation: confidence flags + mandatory review screen; FDX/Fountain are the reliable paths.
3. **Scope weight of the rewrite engine (Slices 4–5).** The book supplies many artifacts. Mitigation: each artifact is data-driven (checklists as data files), shipped incrementally inside the slice with demos.
4. **Editor complexity (ProseMirror).** Steep but proven. Mitigation: canonical-model sync tested from Task 4 day one; the editor never owns the truth.
5. **AI gating correctness (Slice 6).** The consent + annotated-read gates are product-defining. Mitigation: they are store-level invariants with tests, not UI-only checks.
