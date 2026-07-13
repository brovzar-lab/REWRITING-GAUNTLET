# Epps Methodology Phase Implementation Plan (M1–M7)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task, inline in the main session (this repo forbids subagent writes; helpers stay read-only). Each slice follows repo TDD discipline: failing tests first, one `epps MN:` commit per slice, all suites green before every commit. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Turn the testable alpha into a deeper Epps rewriting system by building the seven missing book-methodology tools, every one connected to exact script evidence.

**Architecture:** All new state is additive on the canonical model (never rendered HTML): a document-level `GamePlan` (with Compass), per-scene `ScenePoint`, element-anchored `StoryBeat` markers (set-ups/payoffs/motifs), scene-level `HighPointMarker`s, a `docFormat` field, and a Polish Read mode that reuses the annotated-read machinery. UI lives where each tool connects: inspector for per-scene tools, full-board mode for structure tools, one Game Plan surface for document-level tools. The local analyzer gains only honest, citable checks.

**Tech Stack:** unchanged — React 18 + TS + Zustand + ProseMirror + dnd-kit + token CSS, Vitest + Playwright. No new dependencies.

**Status: APPROVED by Billy 2026-07-13. Execute in order; STOP after M1 proof for Billy's methodology-direction check before M2.**

## Global Constraints (Billy's rules, verbatim scope)

- App at `/Users/quantumcode/CODE/REWRITING-GAUNTLET`, port 5213, host 127.0.0.1, strictPort. One repo, one editor.
- Screenplay editor stays central. Current visual direction unchanged (tokens/themes as-is; new UI uses existing token vocabulary).
- No dead tabs, no fake controls. Every methodology tool connects to exact script evidence (scene + element ids).
- Human notes and AI findings remain separate. No numeric overall score. No one-shot page-one rewrite. Changes require approval; full-draft assembly only from approved changes.
- Local analyzer modest but honest: it only claims what it can cite. Cloud AI stays optional behind consent.
- EN + ES for every string (parity test enforces). WCAG 2.1 AA. Pagination engine untouched.
- Anything not from the book is labeled **Studio Extension** in the UI (a small `EXT` chip with tooltip "Studio extension — not from Epps's book", `ext.label`/`ext.tip` strings).

## Book vs Studio Extension mapping (verified against tmp/pdfs/screenwriting-is-rewriting.txt)

| Tool | From the book (as written) | Studio Extension (labeled EXT) |
|---|---|---|
| M1 Game Plan | Statement of Intent; categorized/prioritized notes feeding the plan; plan guides many passes (Sister Act example) | "Target audience / genre promise" field; "Emotional truth / spine" field name (spine is book-adjacent, the field label is ours) |
| M1 Compass | Touchstone (image/title/scene/character/song); Ticking Clock; theme carried by action (Story & Theme pass) | Motif occurrence tracking as clickable element links |
| M2 Scene Point | One intent per scene, stated as "The point of this scene is…"; list every scene + its point; cut/split what doesn't earn its place | Conflict / turn / value-change / audience-learns sub-fields (book covers these in Scene Tension & Dynamics chapters; the structured per-scene form is ours) |
| M3 Set-Up / Payoff | The Set-Up (Establish–Complicate–Resolve); set-ups that pay off; Holdovers and Orphans | Element-anchored pair map UI; "late set-up / missing payoff / repeated information" as named statuses |
| M4 High Points | Four Major High Points: End of Act One (Point of No Return), Mid-Point Plot Turn, End of Act Two (Doubt), Third Act Climax; Highs and Lows / Emotional Roller Coaster | The momentum strip visualization itself |
| M6 Polish Read | Polish is the last pass: dialogue, text, description, tightening, consistency, spelling, grammar, holdovers, orphans; cover-to-cover | Repeated-word detector, export-readiness checklist as UI |
| M7 TV adapter | NOT in the book (features only) | Entire tool: one-hour / half-hour structure expectations. Labeled Studio Extension everywhere it appears |

## File Structure (locked decomposition)

| File | Change |
|---|---|
| `src/model/gameplan.ts` | NEW — `GamePlan`, `Compass`, `Motif` types + `emptyGamePlan()` |
| `src/model/scenepoint.ts` | NEW — `ScenePoint` type + helpers |
| `src/model/markers.ts` | NEW — `HighPointMarker`, `StoryBeat` (setup/payoff/motif anchors), pair-derivation helpers |
| `src/model/screenplay.ts` | ADD `docFormat: 'feature' \| 'one_hour' \| 'half_hour'` to `Screenplay` (default 'feature') |
| `src/store/appStore.ts` | ADD gamePlan, scenePoints, highPoints, storyBeats state + actions; polishRead mode flags. Nothing removed |
| `src/store/persistence.ts` | Persist the new fields (additive Dexie payload keys, defaults on hydrate) |
| `src/panels/GamePlanPanel.tsx` | NEW — Game Plan + Compass surface (inspector tab 3) |
| `src/panels/ScenePointCard.tsx` | NEW — per-scene form in the Evidence tab |
| `src/panels/StructureView.tsx` | NEW — full-board enrichment: high-point flags, momentum strip, set-up/payoff list |
| `src/panels/PolishReadBar.tsx` | NEW — cover-to-cover polish mode (extends read-bar machinery) |
| `src/panels/ExportMenu.tsx` | Export-readiness checklist gate (advisory, never blocking) |
| `src/board/StoryCard.tsx` | High-point flag + missing-scene-point indicator (icon + word, never color alone) |
| `src/editor/annotationPlugin.ts` | Motif/set-up/payoff markers reuse the existing margin-marker channel (distinct glyphs) |
| `src/ai/localAnalyzer.ts` | New honest checks (listed per slice); every finding cites elements |
| `src/io/fountain.ts`, `src/io/fdx.ts` | Round-trip `docFormat` + game plan/scene points in a sidecar section (Fountain notes) — never into screenplay text |
| `src/i18n/strings.ts` | All new strings EN+ES |
| `e2e/methodology.spec.ts` | NEW acceptance spec |
| `scripts/proof-epps.mjs`, `docs/proof/epps/` | NEW proof pack |

---

## Slice M1: Game Plan + Compass

**What:** A "Game plan" inspector tab (third real tab). Section A — Objective: statement of intent (the book's exact opener), what the script is about, what this rewrite improves, what must not be lost, pass priorities (drag-order the 11 pass chips into a priority list; passes stay repeatable/skippable). Section B — Compass: touchstone, ticking clock (with optional "established at" element link), theme-through-action statement, motifs (each motif holds writer-marked element occurrences). EXT chips on the two extension fields.

**Evidence link:** ticking clock and every motif occurrence anchor to exact elements via the existing select() round trip; margin markers show motif occurrences.

**Analyzer addition (honest):** none in M1 — the Game Plan is writer-authored by design (the book: the writer writes it after their own read).

**Key tests:** store round-trip + persistence reload of gamePlan; tab renders sections and EXT labels; motif occurrence click selects the exact element; e2e: fill statement → reload → still there; empty state teaches ("Write one sentence: what must this rewrite accomplish?").

**Proof shot:** `01-game-plan.png`.

## Slice M2: Scene Point

**What:** In the Evidence tab, every selected scene gets a Scene Point card: the point (one sentence, the book's "The point of this scene is…" as placeholder), earns-its-place verdict (Earns it / Unsure / Cut candidate — words + icons), and EXT sub-fields (conflict, turn, value change, audience learns). Board cards show a "No point yet" word-chip until stated. Navigator unaffected.

**Analyzer addition (honest):** scene lens gains "scenes with no stated scene point" — cites the scene heading; this is a fact about the writer's own data, not a guess. Cut candidates surface in the pass workspace for the Scene pass as writer-marked (never auto-resolved).

**Key tests:** scene point saves per scene and survives reload; board chip disappears when the point is stated; analyzer cites exactly the unpointed scenes; verdict words present without color; e2e: state a point, see the board chip clear.

**Proof shot:** `02-scene-point.png`.

## Slice M3: Set-Up / Payoff map

**What:** `StoryBeat` anchors: the writer marks an element as a set-up or a payoff and pairs them (extending the existing scene-level `setup_payoff` connections to element anchors; old connections keep working). Full-board mode gains a Set-Up Map list: every pair with status derived by position — OK, **late set-up** (payoff before set-up), **unpaid set-up** (no payoff yet), **orphan payoff** (no set-up). "Repeated information": analyzer finds near-identical dialogue/action lines (normalized text equality ≥ N chars) and cites both. Holdovers stay with the existing near-duplicate-name check (Consistency).

**Key tests:** pair derivation pure functions (late/unpaid/orphan) with hand-built fixtures; marking via UI creates anchors on exact elements; map row click selects the cited element; analyzer repeated-information check cites both occurrences; e2e: mark a set-up and payoff, see the pair; reverse them, see "late set-up".

**Proof shot:** `03-setup-payoff-map.png`.

## Slice M4: Four High Points + momentum

**What:** In full-board mode (StructureView): the writer places the four structural markers — End of Act One (Point of No Return), Mid-Point Plot Turn, End of Act Two (Doubt), Third Act Climax — on scenes (one each), plus any number of emotional high/low markers. A momentum strip under the board draws the high/low sequence per act (position + icon + label, never color alone). Board cards carry the marker flag; the navigator shows a glyph.

**Analyzer addition (honest):** structure lens gains: "no Mid-Point Plot Turn marked in the middle third", "End of Act One marker missing", each citing the relevant act's scenes — facts about marker placement, phrased as the book's questions ("Is your first act endpoint dramatic?").

**Key tests:** one-of-each rule for the four structural markers; marker placement round-trips; momentum strip derivation pure function; e2e: place the midpoint, see it on card + strip + navigator.

**Proof shot:** `04-high-points-momentum.png`.

## Slice M5: analyzer + workspace integration for M1–M4

**What:** The pass workspaces cite the new tools where the book does: Structure pass surfaces high-point placement checks; Plot pass surfaces set-up/payoff statuses; Scene pass surfaces unpointed scenes and writer-marked cut candidates; Story & Theme pass shows the theme statement and motif coverage ("motif X appears in N scenes" with citations). Every surfaced item is either a writer fact or an analyzer finding with citations — sources stay visibly separate (writer-marked items never render as AI findings).

**Key tests:** each pass workspace shows its tool section only when data exists (no dead UI); provenance chips correct per source; empty states say what was checked (extends the T3 pattern).

**Proof shot:** `05-pass-workspace-integration.png`.

## Slice M6: Polish Read workflow

**What:** The Polish pass gains "Start Polish Read": a cover-to-cover guided mode (reuses read-bar machinery, clearly distinct header) that walks every page (not scene) with the book's polish objectives as a visible checklist: format/spacing (existing check), spelling-adjacent repeated words ("the the" — new honest detector), dialogue read-aloud prompt per talky scene, holdovers/orphans (existing name check + unpaid set-ups from M3), page-level notes. Completing it marks the Polish pass reviewable and unlocks an **export-readiness checklist** in the Export menu (advisory list, never a blocker): all pages read, open priority concerns count, unpaid set-ups count.

**Analyzer addition (honest):** doubled-word detector with element citations and a fix proposal (like whitespace).

**Key tests:** repeated-word detector unit tests (catches "the the", ignores legitimate doubles like "had had" only if we can't distinguish — then we flag with 'uncertain', honestly); polish-read page walk covers pageCount pages; export menu shows readiness facts; e2e: full polish read on the sample → export menu lists readiness.

**Proof shot:** `06-polish-read.png`, `07-export-readiness.png`.

## Slice M7: TV pilot adapter (Studio Extension) + regression + proof

**What:** `docFormat` picker at import/new-draft time (Feature / One-hour pilot / Half-hour pilot), labeled Studio Extension. Format changes structure *expectations only*: act vocabulary (teaser/cold open + acts with act-outs for TV), high-point slots adapt (act-out markers replace the feature four where appropriate), analyzer act-balance thresholds per format, momentum strip per act. No fake episodic fields (A/B/C stories, season arcs go to the deferred backlog — no dead UI).

**Also in M7:** full regression (target: all unit + e2e green, build exit 0), `scripts/proof-epps.mjs` proof pack (shots 01–08 incl. `08-tv-adapter.png`), HANDOFF update, and Billy's field-test script (below).

**Key tests:** format round-trips through Fountain/FDX sidecar; act vocabulary switches; analyzer thresholds switch; feature remains default and unchanged for existing docs; e2e: import as one-hour, see teaser/act-out vocabulary.

---

## Deferred (explicitly NOT in this phase — no dead UI for any of it)

- Confirm-hypothesis flow and journey-strip redesign (flagged in the trust handoff; needs its own shape session).
- Conflict map and relationship map visualizations (approved product scope, next phase — M3/M4 build the anchor infrastructure they need).
- Read-aloud/table-read audio, index-card printing, board minimap/filter/tabs, pass multi-run versions.
- A/B/C stories, season trajectory, sustainability fields for TV (adapter ships structure expectations only).
- Cloud-AI-specific prompts for the new tools (local-first; cloud reuses the same Finding shape when enabled).
- PDF import; real-Final-Draft FDX validation (still owed a manual check).

## Tests

- Every slice: failing unit tests first, then implementation, then full `vitest run` + `playwright test` green before its commit (load-flake protocol from the trust pass applies).
- New pure-function surfaces (pair derivation, momentum, marker rules, repeated-words) get exhaustive unit fixtures.
- `e2e/methodology.spec.ts` accumulates one acceptance test per slice; final counts recorded in the handoff (baseline today: 232 unit / 50 e2e).
- The i18n parity test automatically covers all new strings.

## Proof screenshots (docs/proof/epps/, captured by scripts/proof-epps.mjs)

1. Game Plan tab filled (Night), 2. Scene Point card + board chip, 3. Set-Up Map with one late set-up, 4. High points + momentum strip, 5. Pass workspace integration, 6. Polish Read in progress, 7. Export readiness, 8. TV adapter vocabulary — plus one Day-mode twin of shot 1 for theme parity.

## Risks (and the mitigation baked into the plan)

1. **Model/persistence migration** — all fields additive with hydrate defaults; a unit test loads a pre-phase Dexie payload and must not lose data.
2. **UI crowding vs "page central"** — new surfaces live in existing containers (inspector tab, full-board mode, read-bar slot); nothing new competes with the page. The Game Plan tab is the only new top-level element.
3. **Scope creep per tool** — each slice ships the smallest honest version; EXT-labeled fields are plain text fields, not new subsystems.
4. **Analyzer overreach** — every new check is a positional/textual fact with citations; anything judgment-shaped is phrased as the book's question, status 'uncertain'.
5. **Suite runtime growth** — e2e additions are one acceptance test per slice; heavy walks reuse `test.slow()`.
6. **Fountain/FDX round-trip** — methodology data rides in a sidecar (Fountain notes section / FDX ignorable custom element), never in screenplay text; round-trip tests per format. Real Final Draft validation remains an open loop and is stated wherever FDX is offered.

## How Billy tests it with a real screenplay

After M7, one sitting with a real script (PDF text paste or FDX):

1. `cd /Users/quantumcode/CODE/REWRITING-GAUNTLET && npm run dev` → http://127.0.0.1:5213. Import your script; pick Feature or a pilot format.
2. Do the private annotated read with margin notes (your notes, before any AI).
3. Open the Game Plan tab: write the statement of intent, what must not be lost, drag three passes into priority order. Set your touchstone and ticking clock (link the clock to the line that establishes it).
4. State Scene Points for the first ten scenes; mark one "Cut candidate".
5. Mark one set-up and its payoff; check the Set-Up Map catches your one unpaid set-up.
6. Place the four high points; look at the momentum strip and ask whether Act Two sags where you already know it sags — the tool should agree with your gut or show you why not.
7. Run your top-priority pass; approve or reject with the Game Plan visible.
8. Start the Polish Read; finish two pages; check the export readiness list tells the truth.
9. Reload the browser at every step — nothing may be lost.

Verdict question for each tool: "did this make me see my script more clearly, or was it homework?" Any tool that fails that question gets reworked or cut before we build deeper.
