# Slice 2: Professional Editor & Pagination — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Slice 1 approximate page breaks with a true Final Draft-style pagination engine, and complete the professional editing feel: zoom that never repaginates, revision marks, (MORE)/(CONT'D), direct element keys, smart-type character names, and page-aware navigation.

**Architecture:** A pure, DOM-free pagination engine (`src/pagination/`) computes pages, break decisions, and dialogue continuations from the canonical model only. The ProseMirror editor renders the engine's output as decorations (page frames, headers, (MORE)/(CONT'D), revision asterisks); it never decides pagination itself. Zoom is pure CSS scaling of the rendered page. Revision marks diff current element text against a persisted baseline snapshot.

**Tech Stack:** Existing pinned set only (Vite 5.4.11, React 18.3.1, TypeScript 5.6.3, ProseMirror, Zustand 4.5.5, Dexie 4.0.8, Vitest 2.1.8, Playwright 1.48.2 + axe). **No new dependencies.**

## Global Constraints

- App stays at `/Users/quantumcode/CODE/REWRITING-GAUNTLET`, port **5213**, `host: '127.0.0.1'`, strictPort.
- Canonical model is the source of truth; the engine consumes `Screenplay`, never DOM.
- Element/scene stable ids are never regenerated — evidence links and autosave must keep working untouched.
- All tokens from DESIGN.json verbatim; Page Rule (warm paper both themes); compact UI type; no new visual language.
- Every new UI string goes through `src/i18n/strings.ts` with EN and ES entries.
- WCAG 2.1 AA: new popups/dialogs keyboard-operable, visible focus, axe stays clean in both themes.
- TDD per task; commit at every green; `npm test`, `npm run build`, `npx playwright test` all green before proof.
- Layout constants live in ONE place (`src/editor/layout.ts`) and are consumed by both CSS-facing code and the engine.

## Industry pagination rules implemented (the spec for the engine)

US Letter, Courier 12pt: 6 lines/inch vertical, 10 chars/inch horizontal. Text block 1.0in top → 1.0in bottom on 11in paper, minus the 1-line page header = **55 content lines per page** (page 1 has no header number). Element widths from `ELEMENT_LAYOUT` (action/heading 6.0in→60 chars, dialogue 3.5in→35, parenthetical 2.0in→20, character 3.8in→38, transition 60 right-aligned). One blank line before every element except inside a dialogue stack (character/parenthetical/dialogue run) and except the first element on a page.

Break rules:
1. A scene heading or transition is never the last line of a page (push to next page).
2. A character cue is never separated from its dialogue: keep cue + (parenthetical) + ≥2 dialogue lines, else push the whole stack.
3. Dialogue may split only if ≥2 dialogue lines remain on the current page AND ≥2 lines move; a split inserts a `(MORE)` line at the page bottom and `NAME (CONT'D)` cue at the top of the next page (both are render artifacts, not model elements).
4. A parenthetical never splits (push it, keeping rule 2 intact).
5. Action may split at a line boundary, but never leaving a single orphan line on either side (else push the whole element).

---

## File structure

```
src/pagination/
  types.ts            PaginatedLine, PageBreak, Continuation, PaginationResult
  metrics.ts          wrapText(), elementLines() (pure text wrapping, char-count based)
  engine.ts           paginate(screenplay): PaginationResult  (the break rules)
  engine.test.ts      rule-by-rule unit tests
  goldens.test.ts     golden-file fixtures
  fixtures/
    rules-fixture.ts  synthetic screenplay exercising every break rule
    rules-golden.json expected page/line layout for rules-fixture
    las-garzas-golden.json  expected layout for the (extended) sample
src/editor/
  layout.ts           MODIFY: keep ELEMENT_LAYOUT; delete approximate* functions
  paginationPlugin.ts PM decorations: page frame gaps, page-number headers,
                      (MORE)/(CONT'D) widgets, scene numbers on headings
  revision.ts         computeRevisedElements(screenplay, baseline): Set<string>
  revisionPlugin.ts   margin-asterisk decorations for revised elements
  editorKeymap.ts     Mod-1..6 element set, Mod-ArrowUp/Down scene jump
  smartType.ts        character-name suggestions (pure): suggestCharacters()
  SmartTypePopup.tsx  popup UI wired into ScreenplayEditor
  ScreenplayEditor.tsx MODIFY: mount new plugins, popup, remove old pageBreakPlugin
  editor.css          MODIFY: page-frame visuals, header, zoom, asterisks
src/store/
  appStore.ts         MODIFY: zoom, revisionBaseline, startRevisionSet(), goToPage helpers
  persistence.ts      MODIFY: Dexie version(2) + baselines table; persist zoom
src/panels/
  SceneNavigator.tsx  MODIFY: true page numbers from engine; revised-scene asterisk
  StatusBar.tsx       "Page X of Y · Scene N" + zoom control + revision set label
  PanelLayout.tsx     MODIFY: mount StatusBar under the editor panel
  GoToPage.tsx        Mod-G dialog
src/model/sample/gauntlet-sample.ts  MODIFY: extend LAS GARZAS to 8+ true pages
e2e/
  pagination.spec.ts  page frames, headers, MORE/CONT'D, zoom stability
  editorpro.spec.ts   Mod-1..6, smart-type, scene jump, go-to-page, revision marks
  (existing workspace/autosave/a11y specs must stay green — regression gate)
```

---

### Task 1: Pagination metrics (pure text wrapping)

**Files:**
- Create: `src/pagination/types.ts`, `src/pagination/metrics.ts`
- Test: `src/pagination/metrics.test.ts`
- Modify: `src/editor/layout.ts` (export `CHARS_PER_INCH = 10`; keep `ELEMENT_LAYOUT`)

**Interfaces — Produces:**
```ts
// types.ts
export interface PaginatedLine { elementId: string; sceneId: string; lineIndex: number; text: string;
  kind: 'text' | 'blank' | 'more' | 'contd' | 'page_header'; }
export interface PageModel { number: number; lines: PaginatedLine[]; }
export interface PaginationResult {
  pages: PageModel[];
  pageOfElement: Map<string, number>;       // elementId -> first page it appears on
  breakBeforeElement: Set<string>;          // element starts a new page
  splitElements: Map<string, number>;       // elementId -> line index where it splits
  pageCount: number;
}
// metrics.ts
export function wrapText(text: string, width: number): string[];   // greedy wrap on spaces
export function elementWidth(type: ElementType): number;           // chars, from ELEMENT_LAYOUT
```

- [ ] **Step 1: Write failing tests** — `wrapText('', 35)` → `['']`; a 70-char sentence at width 35 → 2 lines, no line > 35, words unbroken; a single 40-char unbroken token at width 35 → hard-split at 35 (matches CSS `white-space: pre-wrap` overflow behavior); `elementWidth('dialogue')` → 35.
- [ ] **Step 2:** `npx vitest run src/pagination` → FAIL (module missing).
- [ ] **Step 3:** Implement greedy wrapper (split on spaces, accumulate ≤ width, hard-split oversized tokens).
- [ ] **Step 4:** `npx vitest run src/pagination` → PASS.
- [ ] **Step 5:** `git add -A && git commit -m "Slice 2 Task 1: pagination metrics (pure wrapping)"`

### Task 2: Pagination engine with industry break rules

**Files:**
- Create: `src/pagination/engine.ts`, `src/pagination/fixtures/rules-fixture.ts`
- Test: `src/pagination/engine.test.ts`

**Interfaces — Produces:** `export function paginate(screenplay: Screenplay): PaginationResult` (consumes Task 1). `export const LINES_PER_PAGE = 55;`

`rules-fixture.ts` builds a synthetic screenplay via a tiny builder so each rule is testable in isolation (long action runs of N sentences, a 30-line monologue, a heading placed to land on line 55, etc.).

- [ ] **Step 1: Write failing rule-by-rule tests** (one `describe` per rule):
```ts
it('never leaves a scene heading as the last line of a page', () => {
  const r = paginate(fixtureHeadingAtPageBottom());
  const lastLines = r.pages.map(p => p.lines.filter(l => l.kind === 'text').at(-1)!);
  for (const line of lastLines) expect(typeOf(line.elementId)).not.toBe('scene_heading');
});
it('keeps a character cue with at least two dialogue lines', ...);
it('splits long dialogue with (MORE) and NAME (CONT’D)', () => {
  const r = paginate(fixtureLongMonologue());
  const moreLine = r.pages[0].lines.at(-1)!;
  expect(moreLine.kind).toBe('more');           // "(MORE)" at 1.0in dialogue indent
  const contd = r.pages[1].lines.find(l => l.kind === 'contd')!;
  expect(contd.text).toBe('MARISOL (CONT’D)');
});
it('never splits a parenthetical', ...);
it('never orphans a single action line on either side of a break', ...);
it('every page has at most 55 content lines', ...);
it('page 1 has no header line; pages 2+ start with a page_header line', ...);
```
- [ ] **Step 2:** Run → FAIL. 
- [ ] **Step 3:** Implement `paginate()`: walk scenes/elements → wrap into lines → place onto pages, applying rules 1–5 with a lookahead for dialogue stacks; emit `more`/`contd`/`page_header` lines and fill `pageOfElement`/`breakBeforeElement`/`splitElements`.
- [ ] **Step 4:** Run → PASS. **Step 5:** Commit `"Slice 2 Task 2: pagination engine, industry break rules, MORE/CONT'D"`.

### Task 3: Golden fixtures + extend LAS GARZAS to 8+ pages

**Files:**
- Modify: `src/model/sample/gauntlet-sample.ts` (extend existing 12 scenes with fuller action/dialogue and add scenes 13–16: the archive clerk’s reversal, a dry-well set piece, Raúl’s counter-move, a second Marisol–Lupita porch beat — original content, same characters, same ids for existing elements so evidence links survive)
- Create: `src/pagination/fixtures/rules-golden.json`, `src/pagination/fixtures/las-garzas-golden.json`
- Test: `src/pagination/goldens.test.ts`

**Interfaces — Consumes:** `paginate()` from Task 2. Evidence ids `ev1..ev10` and element ids `sc1-e1 … sc12-*` must remain valid (model tests from Slice 1 enforce this).

- [ ] **Step 1: Failing test** — `paginate(sampleScreenplay).pageCount >= 8`; golden test compares `{pageCount, breakBeforeElement: [...sorted], splits, moreContdPairs}` deep-equal against each golden JSON.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Extend the sample; generate goldens with a one-off script step (`node scripts/gen-goldens.mjs` — created in this task, committed) and **hand-review the JSON** (page counts sane, no rule violations flagged by the Task 2 suite).
- [ ] **Step 4:** Full unit run green (model tests + goldens). **Step 5:** Commit `"Slice 2 Task 3: 8+ page sample, golden pagination fixtures"`.

### Task 4: Editor renders true pages (frames, headers, scene numbers)

**Files:**
- Create: `src/editor/paginationPlugin.ts`
- Modify: `src/editor/ScreenplayEditor.tsx` (swap out old `pageBreakPlugin`), `src/editor/editor.css`, `src/editor/layout.ts` (delete `approximatePagination`/`approximateElementLines`), `src/panels/SceneNavigator.tsx` (import `paginate` instead of `approximatePagination` — same `pageOfElement` shape)

**Interfaces — Produces:** `paginationPlugin(getScreenplay: () => Screenplay): Plugin` rendering, per engine output: a page-bottom gap + crisp divider + next-page header widget (`— 2 —` becomes a real header line: page number top-right, revision-set label top-left when active — Task 6), `(MORE)` widget at split bottoms, `NAME (CONT’D)` widget at split tops, and scene numbers rendered in the left margin of each `scene_heading` block (`data-scene-number` pseudo-element).

- [ ] **Step 1: Failing component test** (`src/editor/paginationRender.test.tsx`): render editor with the 8+ page sample; assert `document.querySelectorAll('.sp-page-header').length === paginate(sample).pageCount - 1`, one `.sp-more` per split, `.sp-contd` text matches `NAME (CONT’D)`, and `.sp-scene_heading[data-scene-number="6"]` exists.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement plugin (decoration rebuild only when `tr.docChanged`, engine memoized on screenplay reference). **Step 4:** Run → PASS; e2e smoke `workspace.spec.ts` still green. **Step 5:** Commit `"Slice 2 Task 4: true page rendering, headers, scene numbers"`.

### Task 5: Zoom that never repaginates

**Files:**
- Modify: `src/store/appStore.ts` (`zoom: number` 0.5–2.0 default 1, `setZoom()`), `src/store/persistence.ts` (persist zoom in `UiRow`), `src/editor/editor.css` (`.sp-page { zoom: var(--sp-zoom); }`), `src/editor/ScreenplayEditor.tsx` (set `--sp-zoom` from store), `src/panels/StatusBar.tsx` (created in Task 8 — zoom buttons live there; until then Mod-= / Mod-- only), `src/editor/editorKeymap.ts` (Mod-=, Mod--, Mod-0 reset)

**Interfaces — Produces:** `setZoom(z: number)` clamped to [0.5, 2]; keyboard Mod-= (+10%), Mod-- (−10%), Mod-0 (100%).

- [ ] **Step 1: Failing unit test** — `setZoom(3)` clamps to 2; `setZoom(0.1)` clamps to 0.5. **Failing e2e** (`pagination.spec.ts`): count `.sp-page-header` at 100%, press Mod-= twice, count unchanged while `.sp-page` bounding box width grew ≥15%.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS. **Step 5:** Commit `"Slice 2 Task 5: CSS zoom, pagination invariant under zoom"`.

### Task 6: Revision marks against a baseline draft

**Files:**
- Create: `src/editor/revision.ts`, `src/editor/revisionPlugin.ts`
- Modify: `src/store/appStore.ts` (`revisionBaseline: Record<string,string> | null`, `revisionSetLabel: string | null`, `startRevisionSet(label)`, `endRevisionSet()`), `src/store/persistence.ts` (Dexie `this.version(2).stores({ documents: 'id', ui: 'id', baselines: 'id' })`), `src/editor/ScreenplayEditor.tsx`, `src/editor/editor.css`, `src/panels/SceneNavigator.tsx` (asterisk + `aria-label` "revised" on scenes with changes)

**Interfaces — Produces:**
```ts
export function computeRevisedElements(screenplay: Screenplay, baseline: Record<string,string>): Set<string>;
// changed text OR element id absent from baseline => revised
```
Revision-mark rendering: right-margin `*` on every wrapped line of a revised element (node decoration class `sp-revised`, CSS `::after` asterisk at the right margin — icon+position, not color, carries meaning). Header shows the set label (e.g. `REV. BLUE — 12 JUL 2026`) via Task 4's header widget. Labels offered: White, Blue, Pink, Yellow, Green (FD convention); label only — no paper tinting in this slice.

- [ ] **Step 1: Failing unit tests** — diff logic (changed text flagged; unchanged not; new element flagged); persistence round-trip: `startRevisionSet('Blue')` → reload store → baseline recovered (fake-indexeddb).
- [ ] **Step 2:** FAIL. **Step 3:** Implement store + plugin. 
- [ ] **Step 4: Failing e2e** (`editorpro.spec.ts`): start revision set from status bar (Task 8 wires the button; here use a temporary top-bar button placed in its final TopBar position), edit Marisol’s line, expect `.sp-revised` on that element and navigator scene 2 marked revised; reload → marks persist. Run → PASS after wiring.
- [ ] **Step 5:** Commit `"Slice 2 Task 6: revision baseline, margin asterisks, set labels"`.

### Task 7: Professional keyboard flow (Mod-1..6, smart-type, scene jump, go-to-page)

**Files:**
- Create: `src/editor/editorKeymap.ts`, `src/editor/smartType.ts`, `src/editor/SmartTypePopup.tsx`, `src/panels/GoToPage.tsx`
- Modify: `src/editor/ScreenplayEditor.tsx`, `src/i18n/strings.ts` (all new labels EN/ES)

**Interfaces — Produces:**
```ts
export const ELEMENT_KEY_ORDER: ElementType[] = ['scene_heading','action','character','parenthetical','dialogue','transition'];
// Mod-1 … Mod-6 retype the current block to ELEMENT_KEY_ORDER[n-1]
export function suggestCharacters(screenplay: Screenplay, prefix: string): string[]; // unique cues, most-recent-first, prefix-insensitive
```
Behavior: typing in a `character` element opens the popup when ≥1 suggestion (listbox role, ArrowUp/Down + Enter/Tab accept, Escape closes and does NOT exit the editor in that state); Mod-ArrowDown/Up moves the cursor to next/previous scene heading; Mod-G opens Go-to-page (label + number input + jump; focus returns to the editor at the first element of that page).

- [ ] **Step 1: Failing unit tests** — keymap table maps Mod-1..6 per `ELEMENT_KEY_ORDER`; `suggestCharacters` dedupes (MARISOL appears once), filters by prefix `LU` → `['LUPITA']`, ignores case/accents.
- [ ] **Step 2:** FAIL. **Step 3:** Implement pure parts; PASS; commit `"Slice 2 Task 7a: element keys + smart-type core"`.
- [ ] **Step 4: Failing e2e** — Mod-3 retypes an action to character; typing `LU` in the empty cue shows popup, Enter completes `LUPITA`; Mod-ArrowDown lands on next `scene_heading`; Mod-G → type `3` → viewport shows page 3 header. Axe scan with popup open stays clean.
- [ ] **Step 5:** Implement UI; e2e PASS; commit `"Slice 2 Task 7b: smart-type popup, scene jump, go-to-page"`.

### Task 8: Status bar, navigator true pages, regression sweep

**Files:**
- Create: `src/panels/StatusBar.tsx`
- Modify: `src/panels/PanelLayout.tsx` (status bar docked under editor), `src/panels/SceneNavigator.tsx` (true pages — done in Task 4; verify), `src/i18n/strings.ts`
- Test: extend `e2e/pagination.spec.ts` + full regression run

**Interfaces — Consumes:** `paginate()`, store selection, zoom, revision set. **Produces:** status bar showing `Page X of Y · Scene N`, zoom −/100%/+ buttons, revision-set start/end control (final home of Task 6's temporary button).

- [ ] **Step 1: Failing e2e** — status bar shows `Page 1 of ≥8` on load; clicking scene 14 in navigator updates it; zoom buttons work and match Mod-=; **regression gate:** all Slice 1 specs (workspace, autosave, a11y incl. axe in both themes at 1280/1920) green.
- [ ] **Step 2:** FAIL → **Step 3:** implement → **Step 4:** `npm test && npm run build && npx playwright test` all green. **Step 5:** Commit `"Slice 2 Task 8: status bar, true page navigation, regression green"`.

### Task 9: Proof for Billy (verification before completion)

- [ ] Fresh full verification: `npm test` (counts), `npm run build` (exit 0), `npx playwright test` (counts) — outputs captured.
- [ ] Clean-restart server on 5213; `curl -I http://localhost:5213` and `http://127.0.0.1:5213` both 200.
- [ ] Regenerate `docs/proof/slice-2/`: Day + Night at 1280/1920; page-2 header close-up; (MORE)/(CONT'D) across a page break; revision asterisks; smart-type popup; 150% zoom shot proving identical page count (page indicator visible in both).
- [ ] Reload-persistence re-proof (typed marker survives reload; zoom + revision set survive reload).
- [ ] Report to Billy: URL, screenshots, test counts, what stayed approximate (if anything). **Stop for review before Slice 3.**

## Self-review notes

- Spec coverage: pagination accuracy (T1–T4), element controls (T7 Mod-1..6), zoom (T5), revision marks (T6), MORE/CONT'D (T2+T4), keyboard flow (T7), page/scene navigation (T4+T7+T8), autosave/evidence preserved (ids untouched; regression gate T8), visual direction (no new language; tokens only).
- Type consistency: `paginate`, `PaginationResult.pageOfElement`, `ELEMENT_KEY_ORDER`, `computeRevisedElements` used with identical signatures across tasks.
- Known risks, stated honestly: (a) char-count wrapping can disagree with browser wrapping by one word in rare cases — golden tests pin the engine, an e2e assertion compares engine line counts to rendered line counts on the sample and fails loudly if they drift; (b) decoration-heavy rendering on 8+ pages needs memoization (T4 requires rebuild-only-on-docChanged); (c) full revision paper tinting and same-page smart (CONT'D) are explicitly deferred, not silently dropped.
