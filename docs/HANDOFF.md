# HANDOFF — Rewrite Studio / REWRITING-GAUNTLET (2026-07-13, Epps phase M1 done, awaiting Billy's direction check)

## Epps methodology phase (current work)

Billy approved `docs/plans/2026-07-12-epps-methodology-phase.md` (M1–M7) with an explicit STOP after M1 proof for a methodology-direction check before M2. **M1 (Game Plan + Compass) is built, committed (`epps M1:`), and proven** — third inspector tab with Objective (statement of intent, about, improves, must-not-be-lost, two EXT-chipped Studio-extension fields) and Compass (touchstone, ticking clock with exact-line link, theme-through-action, motifs with exact-line occurrences that feed the margin markers), pass priorities drag-orderable via the board's keyboard pattern, additive persistence with a pre-phase migration test. Proof: `docs/proof/epps/` (01, 01b Day twin, 01c). Counts after M1: **251 unit / 51 Playwright / build exit 0**.

**M2 (Scene Point) is built, committed (`epps M2:`), and proven** after Billy accepted M1 — ScenePointCard in the Evidence tab (book placeholder, earns/unsure/cut verdict as words+icons, EXT-chipped dynamics sub-fields), "No point yet" board chips, analyzer scene lens citing exactly the unpointed scenes, writer-marked cut candidates in the Scene pass workspace, additive persistence. Proof: `docs/proof/epps/02*.png`. Counts after M2: **268 unit / 52 Playwright / build exit 0**. (Axe lesson: no reduced-opacity text on tinted cards — it fails AA contrast.)

**M2R (direct in-card Scene Point editing) is built, committed (`epps M2R:` + `epps M2R2:`), and proven.** Billy REJECTED the first popover version ("too indirect, opens behind cards") — his standing product principle, verbatim: **"Act on the object itself first. Panels are for deeper detail."** The accepted version: the dotted "No point yet" chip itself becomes an editable textarea inside the card (card grows; Enter saves / Escape cancels / blur saves; focus returns to the chip; tests assert NO popover/dialog renders). Verdict editing stays in the inspector; cards mirror it with UNSURE / CUT CANDIDATE word markers. Card structure: frame div (`data-card-frame`, used by connections + drag tests) holding the main select/drag button (`data-scene-card`) plus the chip/editor — nested buttons fail axe. Counts after M2R2: **273 unit / 53 Playwright / build exit 0**. Proof: `docs/proof/epps/02c-02d`. Carry the act-on-the-object principle into M3+ (mark set-ups/payoffs from the line/card, not only a panel) — and never introduce floating popovers on the board.

**Epps methodology phase M4–M7 are built, committed, and proven** (2026-07-13, Billy authorized building through M7 without per-slice stops):
- **M4** (`epps M4:`) Four High Points + momentum, placed on the scene card (full board), navigator flags, analyzer structure-gap questions in the book's voice.
- **M5** (`epps M5:`) methodology tools surfaced inside their matching pass workspaces (Plot set-up/pay-off statuses, Structure high points, Story & Theme theme+motifs), WRITER-sourced, no dead UI.
- **M6** (`epps M6:`) Polish Read cover-to-cover page walk + doubled-word analyzer check + advisory Export-readiness checklist.
- **M7** (`epps M7:`) TV pilot adapter as a Studio Extension: `Screenplay.docFormat`, EXT format picker at import, EXT top-bar badge, format-aware act-balance + pilot act-out vocabulary.

**State after M7: 339 unit / 57 Playwright / build exit 0.** Full proof pack in `docs/proof/epps/` (shots 01–08b), regenerate with `node scripts/proof-epps.mjs`. Deferred (no dead UI): A/B/C stories, season arcs, teaser/act-out as real scene types, conflict/relationship maps, PDF import, real-Final-Draft FDX validation, docFormat round-trip into Fountain/FDX files (it persists locally via the document store). New methodology model files: `src/model/{gameplan,scenepoint,markers}.ts`; panels `GamePlanPanel`, `ScenePointCard`, `StructureView`, `PassToolSection`, `PolishReadBar`, `ExtChip`.

---

**M3 (Set-Up / Pay-off map) is built, committed (`epps M3:`), and proven.** Marking is on the object: the selected line's status bar has Set-up / Pay-off toggles (`src/model/markers.ts` StoryBeat + pure `setupPayoffRows` → ok/late_setup/unpaid_setup/orphan_payoff by element position; store `setStoryBeat`/`pairBeats`/`unpairBeat`; additive persistence). Full-board `StructureView` renders the map: word+glyph statuses, refs that jump to the exact line, native `<select>` pairing (no popover). Analyzer Plot lens gained repeated-information (cites both near-identical lines). Counts after M3: **297 unit / 54 Playwright / build exit 0**. Proof: `docs/proof/epps/03*`. Note for M4: `StructureView` is the full-board home for high points + momentum strip (the plan already routes them there).

**Next action: WAIT for Billy's verdict on M3, then execute M4 (Four High Points + momentum) per the plan. Do not start M4 unprompted.**

## Where the previous pass left off

Billy accepted the Visual + UX Realignment (R1-R11, all committed) as the design direction, then an /impeccable critique (score 27/40) drove an approved **Trust & Testability Repair Pass** (`docs/plans/2026-07-12-trust-testability-repair.md`, tasks T1-T7, Billy's directive verbatim). All seven tasks are **built and committed on main**, one `trust TN:` commit per task:

- T1 `10a64cc` page breaks span the full paper (the partial black slab came from boundaries landing inside split dialogue; explicit width + per-element-indent compensation, page numbers aligned, (MORE)/(CONT'D) columns corrected)
- T2 `57eb1c5` core loop demonstrable: sample seeded with two doubled spaces (Polish proposals) and one CAMEN/CARMEN cue typo (Consistency proposal); golden regenerated (single honest line changed); e2e walks read → revision set → diagnose → approve → revision mark → provenance
- T3 `6875dad` empty states say what was checked ("Checked {n} scenes for {focus}. Nothing citeable found."), per-pass focus phrases EN/ES; pre-run state says "Not diagnosed yet"
- T4 `ef3860d` paper reachable at narrow widths and high zoom (scroller flex-centering removed for auto margins), smart-type popup flips upward near the bottom, top bar wraps, tray detail hidden <1280px; the old "centered" e2e assertion moved to a wide viewport because it only ever passed by clipping both paper edges
- T5 `f8cfd91` comprehension leaks: History naming unified (was "Snapshots"); no "0 of 0 proposals" before diagnosis; revision dropdown starts on a "Color…" placeholder with Start disabled; margin notes labeled "Margin note" (new `EvidenceRecord.kind`), never "Unresolved hypothesis"; "This line" vs "Elsewhere in this scene" sections; marker labels pluralized; claim-type definitions in the composer + title attrs; interim reader defined; board legend (card colors + line styles, words not color)
- T6 `8cacd45` visible `:disabled` styling on seg/tool buttons; error messages carry recovery copy ("Your script is unchanged…", "Nothing was changed in the script.")
- T7 (this commit) i18n EN/ES key-parity test (a missing ES twin had broken only the type-check — caught and fixed), proof pack `docs/proof/trust/`, this handoff

**State at handoff: 232 unit tests, 50 Playwright tests, `npm run build` exit 0** (verified with a direct exit code, not a piped tail).

## Next action

Billy tests the app hands-on. The proof packs are `docs/proof/trust/` (this pass) and `docs/proof/realign/` (the realignment). Nothing is mid-flight.

## Locked decisions

- Realignment direction accepted by Billy; the trust pass changed no visual direction.
- All realignment-era locks stand: `tokens.css` untouchable; semantic tokens in `themes.css`; no background transitions on accent-fill controls; Epps pass names/order; AI gate; no numeric score; scene lock; Page Rule; WCAG 2.1 AA; EN+ES for every string (now enforced by `src/i18n/strings.test.ts`).
- Sample flaws are deliberate demo material (see `docs/proof/trust/README.md`); do not "clean up" the doubled spaces or the CAMEN cue without replacing them with equivalent citable flaws, or the core-loop tests fail.
- App at repo root, port 5213, host 127.0.0.1, strictPort. One repo one editor; helpers read-only.

## Open loops

1. **Billy's hands-on test of the trust repairs** — waiting on his verdict.
2. **Critique items deliberately NOT done** (not in Billy's directive scope, candidates for next passes): confirm-hypothesis flow (AI hypotheses still only Reject; needs `$impeccable shape`), journey strip still has "Diagnose" as step 4 (Billy deferred the redesign decision to the critique follow-up), keyboard shortcuts for Diagnose/Approve/next-scene, command palette, READERS manager relocation, chip 6 length, re-Diagnose guard.
3. **FDX round-trip in real Final Draft** — still never validated (UI says so).
4. **claude-goal repo location** — gitignored `claude-goal/` in this repo; Billy's Stop hook points into it. NEVER delete.

## How to run and verify

```
cd /Users/quantumcode/CODE/REWRITING-GAUNTLET && npm run dev
```

- URL: http://127.0.0.1:5213 (use the 127.0.0.1 form; "localhost" can resolve to IPv6 where nothing listens — that caused a false "server down" alarm once). Port registry: `~/.Codex/dev-ports.md`.
- Tests: `npx vitest run` (232; under machine load use `--pool=threads --poolOptions.threads.minThreads=1 --poolOptions.threads.maxThreads=2` — default parallelism flakes userEvent tests at 5s when the box is busy; they all pass in isolation, do not weaken them), `npx playwright test` (50), `npm run build`.
- Proof: `node scripts/proof-trust.mjs` and `node scripts/proof-realign.mjs` (dev server required; both wipe their demo data).

## Gotchas / context not on disk

- Billy dictates by voice; plain language, short lists, no em dashes, one cd-first terminal block, proof before done claims. Never claim a server answers without curling BOTH hosts and showing 200s; never pipe `npm run build` through tail without capturing the real exit code.
- Page-boundary CSS: `.sp-page-gap`/`.sp-page-header` use explicit 8.5in width and per-host-indent negative margins (`.sp-dialogue`, `.sp-parenthetical`, `.sp-character` variants). If a new element type can host a page split, add its variant.
- `Range.getClientRects` is stubbed in `src/test/setup.ts` (ProseMirror scrollIntoView paths need it in jsdom).
- The e2e undo test types ONE character on purpose (one history event under load).
- Margin notes: `EvidenceRecord.kind === 'margin_note'` suppresses the claim/status chips in EvidenceCard; the underlying claimType stays `unresolved_hypothesis` for the model.
- The i18n parity test imports the now-exported `dictionaries`; add every new string to BOTH languages or it fails (this is intentional).
- e2e conventions unchanged: `freshApp(page)` wipes IndexedDB; autosave debounce 500ms → 1200ms waits; `alpha-a11y.spec.ts` is test.slow(); theme switching via `getByLabel('Appearance')`; the History dialog is now named "History".
