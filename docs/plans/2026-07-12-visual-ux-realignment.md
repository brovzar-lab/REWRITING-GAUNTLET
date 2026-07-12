# Visual + UX Realignment Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task, inline in the main session (this repo forbids subagent-driven development; helpers stay read-only). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the working alpha look and feel like the approved "Recommended hybrid" Rewrite Studio design (cinematic screenwriting workstation) without changing any alpha functionality or methodology invariants.

**Architecture:** Pure presentation-layer realignment. The store, workflow, IO, pagination, and AI layers stay untouched except for three tiny additive fields (`boardDock`, `saveState`, optional `Finding.confidence`). All visual work happens in `src/panels/`, `src/board/`, `src/editor/` components and their four feature CSS files, driven by the existing tokens in `src/theme/tokens.css` (never edited) and semantic tokens in `src/theme/themes.css`.

**Tech Stack:** React 18 + TypeScript + Zustand + ProseMirror + dnd-kit + plain token-driven CSS. Vitest for unit/component tests, Playwright for e2e (reuses dev server on 5213).

**Visual north star:** `/Users/quantumcode/Downloads/Recommended hybrid, Night mode.png` — feel, hierarchy, and density; not pixel-for-pixel.

## Global Constraints

- App at repo root; port `5213`; host `127.0.0.1`; `strictPort: true`. Never move ports. Check `lsof -i:5213` ownership before killing anything.
- One repo, one editor. Execute inline; no subagent writes.
- `src/theme/tokens.css` holds DESIGN.md values verbatim, guarded by `src/theme/tokens.test.ts`. Do not edit it. New visual values become semantic tokens in `themes.css`, derived tonally from the existing palette (the `--desk` precedent).
- UI typography 11–14px (label/body/title scales). Courier Prime only on screenplay content. No oversized type, no gradients, no glassmorphism, no rounded-card grids, no decorative imagery.
- Day, Night, System themes keep identical hierarchy. The Page Rule: screenplay paper never themed. Color never carries meaning alone.
- WCAG 2.1 AA: keyboard operability, visible focus, reduced motion, roles/names on every new control. EN and ES strings for every new label (add both to `src/i18n/strings.ts` in the same commit).
- No new dependencies. `prosemirror-history` (1.4.1) is already installed and wired.
- Epps pass names and order locked (`src/model/passes.ts`). No dead controls: the mockup's OUTLINE / BEATS / RELATIONSHIPS board tabs, board minimap, board filter, and pass "v2" multi-run versions are NOT built in this pass (no backing features); they go to the deferred backlog.
- All 192 unit tests and 38 Playwright tests stay green. Tests may be UPDATED where the DOM legitimately moved (e.g. revision control relocating to the top bar), never weakened or deleted.
- Every element/scene identity, selection, approval, provenance, and export behavior is functionally unchanged.
- Commit after every task with a `realign RN:` prefix.

## File Structure (locked decomposition)

| File | Change |
|---|---|
| `src/store/appStore.ts` | ADD `boardDock`, `setBoardDock`, `saveState`, `setSaveState`. Nothing else. |
| `src/store/persistence.ts` | Set `saveState` around the debounced save. |
| `src/workflow/types.ts` | ADD optional `confidence?: number` to `Finding`. |
| `src/panels/PanelLayout.tsx` | Side-docked board column + viewport-driven dock; workflow strip slot. |
| `src/panels/TopBar.tsx` | NEW — extracted from `App.tsx`, redesigned professional toolbar. |
| `src/panels/WorkflowStrip.tsx` | NEW — always-visible journey indicator. |
| `src/panels/StatusBar.tsx` | Becomes the page footer bar (page nav, position, Add note); revision control moves out. |
| `src/panels/PassTray.tsx` | Active-pass control surface (chips + detail band). |
| `src/panels/EvidenceInspector.tsx` / `src/panels/PassWorkspace.tsx` | Structured Evidence / Rewrite Concern cards. |
| `src/board/Board.tsx`, `src/board/StoryCard.tsx`, `src/board/board.css` | Act-grouped tactile board, side + bottom modes. |
| `src/editor/EditorToolbar.tsx` | NEW — undo/redo, element selector, zoom, go-to-page. |
| `src/editor/editorHandle.ts` | NEW — module registry for the live EditorView. |
| `src/editor/annotationPlugin.ts` | NEW — margin note markers + evidence connector. |
| `src/panels/panels.css`, `src/panels/inspector.css`, `src/editor/editor.css`, `src/theme/themes.css` | Styling for all of the above. |
| `src/App.tsx` | Slims down: imports TopBar, wires WorkflowStrip. |
| `src/i18n/strings.ts` | New EN + ES strings. |
| `e2e/realignment.spec.ts` | NEW acceptance spec (Billy's checklist). |
| `e2e/workspace.spec.ts`, `e2e/usability.spec.ts` | Updated only where DOM moved. |
| `scripts/proof-realign.mjs`, `docs/proof/realign/` | NEW proof pack. |

---

### Task R1: Board docks beside the script

**Files:**
- Modify: `src/store/appStore.ts` (state block near line 104 and defaults near line 352)
- Modify: `src/panels/PanelLayout.tsx`
- Modify: `src/panels/panels.css`
- Test: `src/panels/panelLayout.test.tsx` (new), `src/store/boardDock.test.ts` (new)

**Interfaces:**
- Consumes: existing `panelSizes`, `collapsedPanels`, `togglePanel`, `setPanelSize`, `focusMode`, `fullBoard`.
- Produces: `boardDock: 'side' | 'bottom'` and `setBoardDock(dock)` on the store; `.middle.has-side-board` grid with the board as a fourth column between editor and inspector; `panelSizes.boardSide` (width, default 340, min 240, max 520) alongside existing `panelSizes.board` (bottom height). Later tasks rely on `.board-side` / `.board-bottom` classes on the board container.

- [ ] **Step 1: Write the failing store test**

```ts
// src/store/boardDock.test.ts
import { describe, expect, it } from 'vitest';
import { useAppStore } from './appStore';

describe('board dock', () => {
  it('defaults to side and can dock to bottom', () => {
    expect(useAppStore.getState().boardDock).toBe('side');
    useAppStore.getState().setBoardDock('bottom');
    expect(useAppStore.getState().boardDock).toBe('bottom');
    useAppStore.getState().setBoardDock('side');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/store/boardDock.test.ts`
Expected: FAIL — `boardDock` undefined.

- [ ] **Step 3: Add store fields**

In `src/store/appStore.ts`, in the layout-state section:

```ts
/** Where the story board lives: beside the page (approved hybrid) or as a bottom drawer. */
boardDock: 'side' | 'bottom';
setBoardDock: (boardDock: 'side' | 'bottom') => void;
```

Defaults: `boardDock: 'side'`, `setBoardDock: (boardDock) => set({ boardDock })`. Include `boardDock: 'side'` in the reset object near line 403. Do NOT persist it (it follows the viewport).

- [ ] **Step 4: Rework the middle grid in `PanelLayout.tsx`**

Replace the middle grid + shelf block (currently lines ~102-130). Board width `const boardWidth = boardDockedSide ? (collapsedPanels.boardSide ? 0 : (panelSizes.boardSide ?? 340)) : 0;`

```tsx
const boardDock = useAppStore((s) => s.boardDock);
const setBoardDock = useAppStore((s) => s.setBoardDock);
useEffect(() => {
  const mq = window.matchMedia('(min-width: 1280px)');
  const apply = () => setBoardDock(mq.matches ? 'side' : 'bottom');
  apply();
  mq.addEventListener('change', apply);
  return () => mq.removeEventListener('change', apply);
}, [setBoardDock]);
const sideBoard = boardDock === 'side' && !focusMode;
```

```tsx
<div
  className={`middle${sideBoard ? ' has-side-board' : ''}`}
  style={{
    gridTemplateColumns: sideBoard
      ? `${navWidth}px auto minmax(0, 1fr) auto ${boardWidth}px auto ${inspectorWidth}px`
      : `${navWidth}px auto minmax(0, 1fr) auto ${inspectorWidth}px`,
  }}
>
  <div className="panel navigator-panel" hidden={navWidth === 0}>{navigator}</div>
  <Resizer panel="navigator" orientation="vertical" min={160} max={420} ... />
  <main className="editor-panel">{editor}<StatusBar /></main>
  {sideBoard && (
    <>
      <Resizer panel="boardSide" orientation="vertical" min={240} max={520} invert ... />
      <div className="panel board-panel" hidden={boardWidth === 0}>{board}</div>
    </>
  )}
  <Resizer panel="inspector" orientation="vertical" min={220} max={480} invert ... />
  <div className="panel inspector-panel" hidden={inspectorWidth === 0}>{inspector}</div>
</div>
{!sideBoard && !focusMode && (
  <>
    <Resizer panel="board" orientation="horizontal" min={120} max={420} ... />
    <div className="board-shelf" style={{ height: boardHeight }} hidden={boardHeight === 0}>{board}</div>
  </>
)}
```

Keep `focusMode` behavior (board hidden entirely) and `fullBoard` behavior (board fills the middle) exactly as today. Add `.board-panel { min-width: 0; overflow: hidden auto; border-left: 1px solid var(--divider); }` in `panels.css` mirroring `.inspector-panel`.

- [ ] **Step 5: Component test**

```tsx
// src/panels/panelLayout.test.tsx — assert that with boardDock 'side'
// the board renders inside .middle (as .board-panel) and no .board-shelf exists,
// and with 'bottom' the reverse. Use the same render harness as existing
// src/panels/*.test.tsx files (render(<App/>) with store reset in beforeEach),
// set dock via useAppStore.getState().setBoardDock(...) inside act().
it('side dock puts the board in the middle grid', () => { /* per above */ });
it('bottom dock keeps the board shelf', () => { /* per above */ });
```

Write both with real queries: `container.querySelector('.middle .board-panel .board')` and `container.querySelector('.board-shelf .board')`.

Note: jsdom has no `matchMedia` by default — `src/test/setup.ts` must stub it (`window.matchMedia = (q) => ({ matches: true, addEventListener(){}, removeEventListener(){} , ...})`) if not already stubbed; check before assuming.

- [ ] **Step 6: Run unit tests**

Run: `npx vitest run src/store/boardDock.test.ts src/panels/panelLayout.test.tsx`
Expected: PASS.

- [ ] **Step 7: e2e dock behavior**

Append to `e2e/realignment.spec.ts` (create file now with shared imports mirroring `e2e/workspace.spec.ts`):

```ts
test('board sits beside the script on desktop and drops to a bottom drawer when narrow', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/');
  const editorBox = await page.locator('.editor-panel').boundingBox();
  const boardBox = await page.locator('.board-panel').boundingBox();
  expect(boardBox!.x).toBeGreaterThan(editorBox!.x + editorBox!.width - 8);
  await page.setViewportSize({ width: 1100, height: 900 });
  await expect(page.locator('.board-shelf .board')).toBeVisible();
  await expect(page.locator('.board-panel')).toHaveCount(0);
});
```

Run: `npx playwright test e2e/realignment.spec.ts` (dev server on 5213 or Playwright's webServer). Expected: PASS.

- [ ] **Step 8: Update existing specs that assume a bottom shelf**

`npx playwright test` full run; fix ONLY locator paths in `workspace.spec.ts` / `usability.spec.ts` / `a11y.spec.ts` that referenced `.board-shelf` at desktop widths (board is now `.board-panel` at 1280+). Assertions keep their meaning.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "realign R1: board docks beside the script, bottom drawer when narrow"
```

---

### Task R2: Tactile act-grouped board

**Files:**
- Modify: `src/board/Board.tsx`, `src/board/StoryCard.tsx`, `src/board/board.css`
- Test: `src/board/board.test.tsx` (extend), `e2e/realignment.spec.ts` (extend)

**Interfaces:**
- Consumes: `screenplay.scenes` (`scene.act: 1 | 2 | 3`), `ACT_KEYS`-style i18n (`nav.act1..3` already exist), dnd-kit context, `ConnectionLayer`, store `select`, `selection`.
- Produces: `.board.board-side` (vertical, act-grouped, cards wrap) and `.board.board-bottom` (current horizontal strip) container classes chosen by `boardDock`; `.board-act-header` rows; cards keep `data-scene-card={id}` and all drag behavior.

- [ ] **Step 1: Failing component test**

Extend `src/board/board.test.tsx`:

```tsx
it('groups cards by act with act headers in side dock', () => {
  useAppStore.getState().setBoardDock('side');
  render(<Board />);
  const headers = screen.getAllByRole('heading', { level: 3 });
  expect(headers.map((h) => h.textContent)).toEqual(
    expect.arrayContaining([en['nav.act1'], en['nav.act2'], en['nav.act3']]),
  );
});
```

(Use the exact act-string lookup pattern the navigator test uses; sample data has scenes in all three acts.)

- [ ] **Step 2: Run to verify it fails** — `npx vitest run src/board/board.test.tsx` → FAIL (no headings).

- [ ] **Step 3: Implement act grouping in `Board.tsx`**

Group exactly like `SceneNavigator.tsx:30-37` (Map of act → scenes). Render:

```tsx
<section className={`board board-${boardDock}`} aria-label={t('board.title')}>
  <header className="board-header">
    <h2 className="board-title">{t('board.title')}</h2>
    <span className="board-count">{screenplay.scenes.length} {t('board.scenes')}</span>
    <FullBoardToggle />  {/* existing seg-button, unchanged */}
  </header>
  <DndContext ...existing props>
    <div className="board-canvas">
      <ConnectionLayer ... />
      {acts.map(([act, scenes]) => (
        <section key={act} className="board-act" aria-labelledby={`board-act-${act}`}>
          <h3 id={`board-act-${act}`} className="board-act-header">{t(ACT_KEYS[act])}</h3>
          <div className="card-grid">{scenes.map((s) => <StoryCard key={s.id} scene={s} />)}</div>
        </section>
      ))}
    </div>
  </DndContext>
</section>
```

In bottom dock, `.board-bottom .board-canvas { display:flex }` keeps today's single row (act sections lay out inline, headers rotate to compact inline labels). CSS:

```css
.board-side .card-grid { display: flex; flex-wrap: wrap; gap: var(--space-sm); }
.board-act-header { font: var(--font-weight-label) var(--font-size-label)/1.2 var(--font-ui);
  letter-spacing: var(--letter-spacing-label); text-transform: uppercase;
  color: var(--text-secondary); border-bottom: 1px solid var(--divider);
  padding: var(--space-sm) 0 var(--space-xs); }
.board-side .ds-story-card { width: 124px; min-height: 76px; }
```

Card content (StoryCard.tsx) becomes three rows like the mockup: bold number, two-line slug (ellipsis), story-function label — it already renders these; adjust CSS only (small caps function label, 10px). Selected card: existing `is-selected` + amber/blue outline via `outline: 2px solid var(--accent)` plus the existing `▸` marker (non-color meaning). Hover keeps `--shadow-card-lift` on drag only (Structural Depth Rule): change hover to `transform: translateY(-1px)` with `box-shadow` only while `is-dragging`.

- [ ] **Step 4: Run tests** — `npx vitest run src/board/board.test.tsx` → PASS. Keyboard drag test must still pass unchanged.

- [ ] **Step 5: e2e** — extend `realignment.spec.ts`:

```ts
test('board shows act headers and a selected scene highlights its card', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/');
  await expect(page.locator('.board-act-header')).toHaveCount(3);
  await page.locator('.scene-row').nth(1).click();
  await expect(page.locator('.ds-story-card.is-selected')).toHaveCount(1);
});
```

Run: `npx playwright test e2e/realignment.spec.ts` → PASS.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "realign R2: tactile act-grouped board"`

---

### Task R3: Professional top toolbar

**Files:**
- Create: `src/panels/TopBar.tsx` (move from `App.tsx:26-100`)
- Modify: `src/App.tsx`, `src/panels/panels.css`, `src/panels/StatusBar.tsx`, `src/panels/RevisionControl.tsx` (relocation only), `src/store/appStore.ts` (+`saveState`), `src/store/persistence.ts`, `src/i18n/strings.ts`
- Test: `src/panels/topBar.test.tsx` (new)

**Interfaces:**
- Consumes: existing store actions (`setImportOpen`, `setExportOpen`, `setHistoryOpen`, `enterReadMode`, `setFocusMode`, `setTheme`, `setLang`), `RevisionControl` component as-is.
- Produces: `saveState: 'saving' | 'saved'` + `setSaveState` on the store (persistence.ts calls `setSaveState('saving')` when the debounce timer starts and `'saved'` after the IndexedDB write resolves); `<TopBar/>` exported from `src/panels/TopBar.tsx`; theme picker becomes a native `<select aria-label={t('topbar.appearance')}>` with Day/Night/System options (keeps identical behavior, compact like the mockup's "Appearance: Night").

Layout, left → right (one 44px row, `.top-bar`):
1. App mark + "REWRITE STUDIO" title (existing, tightened to label scale).
2. Document: `{title} · {draftLabel}` (existing).
3. Spacer.
4. `● {t('topbar.saved')}` live save indicator (`aria-live="polite"`; shows "Saving…" during debounce; dot uses `--confirmed` + text, never color alone).
5. `RevisionControl` (moved from StatusBar, same component, dropdown + start/end revision set).
6. Grouped ghost buttons: Import, Export, History, Annotated read (toggle), Focus mode (toggle) — existing handlers, restyled as `.tool-button` (icon-free, 11px label, 1px divider separators between groups).
7. Language EN/ES seg pair (existing).
8. Appearance `<select>`.

- [ ] **Step 1: Failing test**

```tsx
// src/panels/topBar.test.tsx
it('shows saved state and a revision set control in the top bar', async () => {
  render(<App />);
  const banner = screen.getByRole('banner');
  expect(within(banner).getByText(en['topbar.saved'])).toBeInTheDocument();
  expect(within(banner).getByRole('button', { name: en['revision.start'] })).toBeInTheDocument();
});
it('appearance select switches theme', async () => {
  render(<App />);
  await userEvent.selectOptions(screen.getByLabelText(en['topbar.appearance']), 'day');
  expect(document.documentElement.dataset.theme).toBe('day');
});
```

(Pull the exact `revision.start` key name from `RevisionControl.tsx` when writing; use whatever key its button already uses.)

- [ ] **Step 2: Run** — `npx vitest run src/panels/topBar.test.tsx` → FAIL.

- [ ] **Step 3: Implement** — extract TopBar, add `saveState` to store + persistence hooks, move `RevisionControl` out of `StatusBar.tsx` (leave the rest of StatusBar for R4), add strings:

```
'topbar.saved': 'Saved' / 'Guardado'
'topbar.saving': 'Saving…' / 'Guardando…'
'topbar.appearance': 'Appearance' / 'Apariencia'
```

CSS: `.top-bar` gets `gap: var(--space-sm); padding: 0 var(--space-md); border-bottom: 1px solid var(--divider);` and `.tool-button` (ghost, label type, 4px radius, 2px focus ring). Existing theme seg-buttons are deleted in favor of the select; `workspace.spec.ts` theme test updates from clicking "Day" button to selecting the option (same assertion on `data-theme` and paper color).

- [ ] **Step 4: Run** — unit file PASS, then `npx vitest run` (whole suite) to catch StatusBar/RevisionControl relocation fallout; update `src/panels/statusBar.test.tsx` expectations (revision control no longer inside status bar).

- [ ] **Step 5: e2e update** — fix `workspace.spec.ts` theme-switch locator; run `npx playwright test e2e/workspace.spec.ts` → PASS.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "realign R3: professional top toolbar with save state and revision control"`

---

### Task R4: Editor toolbar and page footer

**Files:**
- Create: `src/editor/EditorToolbar.tsx`, `src/editor/editorHandle.ts`
- Modify: `src/editor/ScreenplayEditor.tsx` (register view), `src/editor/editorKeymap.ts` (export `applyElementType`), `src/panels/StatusBar.tsx` (page footer), `src/editor/editor.css`, `src/panels/panels.css`, `src/App.tsx` (mount toolbar in editor slot), `src/i18n/strings.ts`
- Test: `src/editor/editorToolbar.test.tsx` (new), `e2e/editorpro.spec.ts` (extend)

**Interfaces:**
- Consumes: `undo`/`redo` from `prosemirror-history` (already imported at `ScreenplayEditor.tsx:6`), the Mod-1..6 element-set command in `editorKeymap.ts` (refactor its body into an exported `applyElementType(view: EditorView, type: ElementType): boolean` and call that from the keymap), `ELEMENT_TYPES` from `src/editor/schema.ts`, store `zoom`/`setZoom`, the go-to-page open action used by Mod-g.
- Produces: `src/editor/editorHandle.ts`:

```ts
import type { EditorView } from 'prosemirror-view';
let current: EditorView | null = null;
export function registerEditorView(view: EditorView | null) { current = view; }
export function getEditorView(): EditorView | null { return current; }
```

`ScreenplayEditor` calls `registerEditorView(view)` after creating the view and `registerEditorView(null)` in the destroy cleanup.

Toolbar contents (one 36px row above `.sp-page-scroller`, inside `.editor-panel`): Undo, Redo (ghost buttons, disabled when `undoDepth === 0` — recompute on store screenplay changes and on selection sync), element `<select aria-label={t('toolbar.element')}>` reflecting the current selection's element type (from `screenplay` + `selection.elementId`; disabled when no selection or read mode), separator, zoom − / % / + (moved from StatusBar, same handlers), Go to page button (opens existing dialog), separator, active revision set chip (read-only echo, hidden when none). Element select dispatches `applyElementType(getEditorView()!, value)` then refocuses `.sp-page-scroller` (never focus ProseMirror DOM directly — repo gotcha).

StatusBar becomes the page footer under the page: `‹` prev page, `Page X of Y · Scene N` (existing text), `›` next page, spacer, `Add note` (existing). Prev/next call the same page-jump the Go-to-page dialog uses (export `jumpToPage(view, page)` from wherever `GoToPage.tsx` executes the jump, and reuse it with `currentPage ± 1`, clamped).

- [ ] **Step 1: Failing tests**

```tsx
// src/editor/editorToolbar.test.tsx
it('element selector reflects and changes the selected element type', async () => {
  render(<App />);
  // select a dialogue element via store (mirror selectedLine.test.tsx setup)
  const select = screen.getByLabelText(en['toolbar.element']);
  expect(select).toHaveValue('dialogue');
  await userEvent.selectOptions(select, 'action');
  expect(useAppStore.getState().screenplay /* element type changed */).toBeTruthy();
});
it('undo is disabled with empty history and enabled after an edit', async () => { /* type into editor via existing editor test helper, assert button disabled flips */ });
```

(Copy the editor-interaction harness from an existing `src/editor/*.test.tsx` — several drive the PM view already.)

- [ ] **Step 2: Run** — FAIL (no toolbar).

- [ ] **Step 3: Implement** toolbar + handle + keymap refactor + StatusBar footer + strings:

```
'toolbar.element': 'Element type' / 'Tipo de elemento'
'toolbar.undo': 'Undo' / 'Deshacer'   'toolbar.redo': 'Redo' / 'Rehacer'
'toolbar.gotopage': 'Go to page' / 'Ir a página'
'footer.prevpage': 'Previous page' / 'Página anterior'
'footer.nextpage': 'Next page' / 'Página siguiente'
```

Note on formatting controls: the screenplay schema has no bold/italic/underline marks, and adding them would touch Fountain/FDX round-trip — explicitly OUT of a visual pass. The element-type selector + undo/redo + zoom + page controls are the honest "professional toolbar" set.

- [ ] **Step 4: Run** — `npx vitest run src/editor` → PASS; whole unit suite green (fix statusBar test expectations for zoom moving up).

- [ ] **Step 5: e2e** — extend `editorpro.spec.ts`: toolbar undo reverts a typed character; element select changes `data-element-type` of the selected block; footer `›` advances the page indicator on a multi-page doc (import the pagination fixture the spec already uses). Run: `npx playwright test e2e/editorpro.spec.ts` → PASS.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "realign R4: editor toolbar (undo/redo, element type, zoom) and page footer"`

---

### Task R5: Evidence / Rewrite Concern inspector

**Files:**
- Modify: `src/panels/PassWorkspace.tsx` (FindingCard), `src/panels/EvidenceInspector.tsx` (EvidenceCard), `src/panels/inspector.css`, `src/workflow/types.ts` (+`confidence?: number`), `src/ai/adapters/cloud.ts` (map confidence when the response supplies one; local analyzer never sets it), `src/i18n/strings.ts`
- Test: `src/panels/findingCard.test.tsx` (new or extend existing PassWorkspace tests), `e2e/realignment.spec.ts` (extend)

**Interfaces:**
- Consumes: `Finding` (`status`, `summary`, `citations`, `proposal {oldText,newText,rationale}`, `provider`, `resolution`), `EvidenceRecord`, store `select`, `setInspectorTab`.
- Produces: FindingCard DOM restructured into labeled sections (all labels 11px caps `control-label` style, EN/ES):

```
[#n] [severity chip: Priority / Uncertain / Clear — icon + word, concern/neutral/confirmed tint]
summary sentence (body)
SUGGESTION        → proposal.rationale
EXAMPLE REWRITE   → proposal.newText  (Courier block, paper-tinted background)
CURRENT           → proposal.oldText  (Courier block, concern-tinted 1px border — existing)
SOURCE            → 'Local analyzer' | 'Cloud assistant' (existing provider label)
CONFIDENCE        → only rendered when finding.confidence != null: '{pct}%' + meter bar (width = pct, 1px border, label carries meaning)
LINKED TO         → per citation: 'Scene {n} · {slug}' + [Go to script] button (existing select behavior, new label)
NOTES             → EvidenceRecords with matching elementId and passId (summary lines, source chips)
[Reject] [Approve] (unchanged logic and order)
```

New strings: `'finding.suggestion' | 'finding.example' | 'finding.current' | 'finding.source' | 'finding.confidence' | 'finding.linked' | 'finding.notes' | 'finding.goto'` with ES twins (`Sugerencia`, `Ejemplo de reescritura`, `Actual`, `Fuente`, `Confianza`, `Vinculado a`, `Notas`, `Ir al guion`). Severity chip mapping: `priority_concern→t('status.priority')` etc. — reuse the existing status strings and icons; add only the chip styling.

- [ ] **Step 1: Failing test** — render a FindingCard with a full proposal finding (fixture from existing PassWorkspace tests) and assert the labeled sections exist by accessible text (`finding.suggestion`, `finding.example`, `finding.linked`, `finding.goto`), that CONFIDENCE is absent without the field and present with `confidence: 0.78` showing `78%`.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** restructure + CSS (`.finding-section`, `.severity-chip`, `.confidence-meter { height:4px; border:1px solid var(--divider); } .confidence-meter > i { background: var(--accent); display:block; height:100%; }`). EvidenceCard gets the same visual family (source chip, status chip, summary, linked line) without inventing fields.
- [ ] **Step 4: Run** — unit suite PASS (existing PassWorkspace/EvidenceInspector tests updated for new DOM but same behaviors: approve, reject, citation click, scene-lock error).
- [ ] **Step 5: e2e** — extend `realignment.spec.ts`:

```ts
test('evidence Go to script selects the exact cited line', async ({ page }) => {
  // run the short diagnose flow usability.spec.ts uses (import sample → complete read → pick pass → Diagnose)
  await page.getByRole('button', { name: /go to script/i }).first().click();
  const cited = await page.locator('.ai-finding').first().getAttribute('data-cited-element');
  await expect(page.locator(`.sp-selected[data-element-id="${cited}"]`)).toBeVisible();
});
```

(Add `data-cited-element` to FindingCard root = first citation's elementId, so the test asserts identity, not position.) Run → PASS.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "realign R5: structured evidence / rewrite concern inspector"`

---

### Task R6: Pass tray as an active control surface

**Files:**
- Modify: `src/panels/PassTray.tsx`, `src/panels/panels.css`, `src/i18n/strings.ts`
- Test: `src/panels/passTray.test.tsx` (extend), `e2e/realignment.spec.ts` (extend)

**Interfaces:**
- Consumes: `EPPS_PASSES` (`id,name,order,blurb`), i18n `pass.obj.<id>` / `pass.ex.<id>` (already exist — same copy the PassWorkspace uses), `workflow.passRuns`, `workflow.findings` (per-pass resolved counts), evidence records with `passId` (note counts), `activePassId`, `setActivePass`, `setInspectorTab`.
- Produces: tray keeps `role="toolbar"` chips row (arrow-key nav unchanged) plus, when a pass is active, a detail band `.tray-detail` (~92px, `aria-label={t('tray.detail')}`) with four columns + action:

```
FOCUS   → pass blurb (body, 2-line clamp)
GOALS   → first three pass.ex items as a compact list (✓-less bullets; they are lenses, not checkboxes)
NOTES   → '{n} notes this pass' + latest note summary (1-line clamp), or t('tray.nonotes')
STATUS  → '{resolved} of {total} proposals resolved' + 4px progress bar + run-state word
[Open pass] → setActivePass(activeId) + setInspectorTab('pass')  (primary button)
```

Chips gain the run-state sub-label they already have; chip title stays `pass.blurb`. New strings: `'tray.title': 'Rewrite passes'/'Pasadas de reescritura'`, `'tray.focus': 'Focus'/'Enfoque'`, `'tray.goals': 'Goals'/'Objetivos'`, `'tray.notes': 'Notes'/'Notas'`, `'tray.status': 'Status'/'Estado'`, `'tray.open': 'Open pass'/'Abrir pasada'`, `'tray.nonotes': 'No notes yet'/'Aún sin notas'`, `'tray.detail': 'Active pass detail'/'Detalle de la pasada activa'`, `'tray.resolved': '{a} of {b} proposals resolved'/'{a} de {b} propuestas resueltas'`.

No fake "v2" versions: the model stores one run state per pass; multi-run versioning goes to the deferred backlog.

- [ ] **Step 1: Failing test** — extend `passTray.test.tsx`: activating a pass shows the detail band with the pass objective text and an Open pass button; Open pass sets `inspectorTab` to `'pass'`; no active pass → no detail band.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** tray + CSS (`.tray-detail { display:grid; grid-template-columns: 1.2fr 1.4fr 1fr 1fr auto; gap: var(--space-md); border-top:1px solid var(--divider); padding: var(--space-sm) var(--space-md); }`, progress bar mirroring the confidence meter). Detail band hidden in `focusMode` (tray already is? — keep existing tray focus-mode behavior, whatever it is today).
- [ ] **Step 4: Run** — `npx vitest run src/panels/passTray.test.tsx` → PASS; whole suite green.
- [ ] **Step 5: e2e** — `realignment.spec.ts`:

```ts
test('clicking a pass opens the pass control surface', async ({ page }) => {
  await page.goto('/');
  await page.locator('.ds-pass-chip').nth(1).click();
  await expect(page.getByRole('button', { name: /open pass/i })).toBeVisible();
  await page.getByRole('button', { name: /open pass/i }).click();
  await expect(page.getByRole('tab', { name: /rewrite pass/i })).toHaveAttribute('aria-selected', 'true');
});
```

Run → PASS.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "realign R6: pass tray becomes an active pass control surface"`

---

### Task R7: Native annotation affordances and visible line↔board↔evidence links

**Files:**
- Create: `src/editor/annotationPlugin.ts`
- Modify: `src/editor/ScreenplayEditor.tsx` (mount plugin, feed it evidence), `src/editor/editor.css`, `src/board/StoryCard.tsx` + `board.css` (`is-linked`), `src/panels/EvidenceInspector.tsx` + `inspector.css` (`is-linked` on the record for the selected element)
- Test: `src/editor/annotationPlugin.test.tsx` (new), `e2e/realignment.spec.ts` (extend)

**Interfaces:**
- Consumes: evidence records (store) keyed by `elementId`, findings' citations, `selection`, `setInspectorTab`, `select`.
- Produces:
  - `annotationPlugin(getCounts: () => Map<string, number>)` — widget decoration at the end of each element that has ≥1 evidence record or open finding citation: `<button class="sp-note-marker" aria-label="{n} notes on this line">{n}</button>`. Decoration key MUST encode `elementId:count` (repo gotcha: widget keys encode everything rendered). Click → `select({sceneId, elementId})` + `setInspectorTab('evidence')`.
  - Selected line that has evidence gets `sp-selected has-evidence`; CSS draws the mockup's connector stub: `.sp-selected.has-evidence::after { content:''; position:absolute; right:-28px; top:50%; width:28px; border-top:1px solid var(--accent); }` plus the marker itself carrying meaning (not color alone).
  - Board: `StoryCard` adds `is-linked` when `selection?.sceneId === scene.id` (already `is-selected`) — strengthen to the amber/blue outline + marker set in R2; no change needed beyond CSS name reuse. Evidence inspector: the record card whose `elementId === selection.elementId` gets `is-linked` (accent 2px left join + "linked" sr-only text).
- ProseMirror plugin recomputes via the same store-subscription pattern `revisionPlugin.ts` uses — copy that wiring exactly.

- [ ] **Step 1: Failing tests**

```tsx
// src/editor/annotationPlugin.test.tsx (harness copied from revision plugin / selectedLine tests)
it('renders a note marker with count on lines that have evidence', () => { /* seed a note via store addEvidence path used by noteComposer tests; assert .sp-note-marker with text '1' inside the element's block */ });
it('marker click selects the line and opens the evidence tab', async () => { /* click; assert store selection + inspectorTab === 'evidence' */ });
```

- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** plugin + CSS + `is-linked` styling. Marker: 14px round-rect, label type, `--surface-panel` bg, 1px `--divider`, accent text; sits in the right page margin (absolute within the block, `right: -24px`) so it never reflows Courier content or pagination (rendering-only, like zoom).
- [ ] **Step 4: Run** — PASS; full unit suite green (pagination goldens untouched — decorations don't affect the engine).
- [ ] **Step 5: e2e** — `realignment.spec.ts`:

```ts
test('a line with a note shows a marker and links to board and evidence', async ({ page }) => {
  // add a note through the UI on scene 2 (same flow usability.spec.ts note test uses)
  await expect(page.locator('.sp-note-marker')).toBeVisible();
  await page.locator('.sp-note-marker').first().click();
  await expect(page.getByRole('tab', { name: /evidence/i })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.ds-story-card.is-selected')).toHaveCount(1);
  await expect(page.locator('.evidence-record.is-linked')).toBeVisible();
});
```

Run → PASS.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "realign R7: line note markers and visible script-board-evidence links"`

---

### Task R8: Always-visible workflow strip

**Files:**
- Create: `src/panels/WorkflowStrip.tsx`
- Modify: `src/panels/PanelLayout.tsx` (render between top bar and middle), `src/panels/panels.css`, `src/i18n/strings.ts`
- Test: `src/panels/workflowStrip.test.tsx` (new)

**Interfaces:**
- Consumes: `workflow.annotatedReadComplete`, `readModeActive`, `activePassId`, `workflow.passRuns`, `workflow.findings`.
- Produces: `<nav class="workflow-strip" aria-label={t('journey.label')}>` — seven fixed steps, 24px tall, label type, separated by `→` glyphs (decorative `aria-hidden`), each step a `<span>` with `is-done` (✓ prefix) / `is-current` (`aria-current="step"`, accent underline + bold — two signals, not color alone):

```
Import → Private read → Choose pass → Diagnose → Review proposals → Complete pass → Export
```

Current-step derivation (pure function `currentStep(state): 0..6`, exported for the unit test):
- 0 Import: never current after load (a screenplay always exists); shown done.
- 1 Private read: `!annotatedReadComplete`.
- 2 Choose pass: read complete && `!activePassId`.
- 3 Diagnose: active pass with `passRuns[id]` `'not_started' | 'diagnosing'`.
- 4 Review proposals: `'reviewing'` with ≥1 open finding for the pass.
- 5 Complete pass: `'reviewing'` with 0 open findings.
- 6 Export: `'complete'`.

Strings: `'journey.label': 'Rewrite journey'/'Recorrido de reescritura'` plus the seven step names (EN/ES; reuse existing strings where the same words exist — import/export/read labels already exist; check before adding duplicates). Visible in all modes including focus mode (Billy: "visible at all times"); hidden only in `PrintView`.

- [ ] **Step 1: Failing test** — unit-test `currentStep` for all seven derivations with hand-built state objects, and one render test: fresh app shows "Private read" as `aria-current="step"`.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — PASS; `a11y.spec.ts` keyboard walkthrough updated if the strip enters tab order (it should NOT — plain text nav, no tabbable children).
- [ ] **Step 5: Commit** — `git add -A && git commit -m "realign R8: always-visible rewrite journey strip"`

---

### Task R9: Cinematic finish — workspace CSS pass (both themes)

**Files:**
- Modify: `src/theme/themes.css` (new semantic tokens only), `src/panels/panels.css`, `src/panels/inspector.css`, `src/board/board.css`, `src/editor/editor.css`
- Test: existing `e2e/a11y.spec.ts` + `e2e/workspace.spec.ts` (must stay green); contrast verified by the axe scans

This task is the "does it feel like the screenshot" sweep, applied strictly within tokens:

- New semantic tokens (both themes + system twins), all derived tonally from the existing palette like `--desk`: `--surface-toolbar` (a step darker than `--surface-panel` in Night, a step lighter in Day), `--surface-inset` (input/code-block wells), `--divider-strong` (panel seams).
- Panel seams: 1px `--divider-strong` between navigator/editor/board/inspector/tray so the room reads as a workstation, not floating cards.
- Compact density audit: navigator rows 26px, inspector section gaps `--space-sm`, tray/board headers use the 11px label scale everywhere; no control taller than 28px outside the page.
- Night mode depth: `--desk` recess behind the page (exists), toolbar/tray on `--surface-toolbar`, page keeps `--shadow-paper-rest` only.
- Day mode parity check: identical hierarchy, blue accent, same seams.
- Reduced-motion + focus-visible verified on every new control.

- [ ] **Step 1:** Apply tokens + sweep, screenshotting `http://127.0.0.1:5213` at 1600×900 in both themes as you go (Playwright screenshot one-liner) and comparing against the north-star PNG for hierarchy/density.
- [ ] **Step 2:** Run `npx playwright test e2e/a11y.spec.ts e2e/alpha-a11y.spec.ts` → PASS (axe both themes; fixes any contrast the new tokens introduced).
- [ ] **Step 3:** Full suites: `npx vitest run` and `npx playwright test` → all green.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "realign R9: cinematic workspace finish, Day/Night parity"`

---

### Task R10: Acceptance spec + full regression

**Files:**
- Modify: `e2e/realignment.spec.ts` (consolidate Billy's checklist — most tests were added in R1–R7; add the one missing)
- Test: everything

Billy's required checks, mapped: scene→script+board+inspector (R2 step 5 + extend to assert `.inspector-context` slug), pass→control surface (R6), selected line note affordance (R7), evidence→correct line (R5), board collapse on narrow (R1), all existing green (below).

- [ ] **Step 1:** Add the missing assertion to the R2 test: after clicking `.scene-row` nth(1), also `await expect(page.locator('.inspector-context')).toContainText(/street/i)` (scene 2 slug in sample data — confirm exact slug from `src/model/sample/gauntlet-sample.ts` when writing).
- [ ] **Step 2:** `npx vitest run` → expect ≥192 passing, 0 failing.
- [ ] **Step 3:** `npx playwright test` → expect ≥38 + new realignment tests passing, 0 failing.
- [ ] **Step 4:** `npm run build` → exit 0. `npm ls playwright-core` → single deduped 1.48.2.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "realign R10: realignment acceptance spec, full regression green"`

---

### Task R11: Proof pack + handoff

**Files:**
- Create: `scripts/proof-realign.mjs` (clone the structure of `scripts/proof-alpha.mjs`), `docs/proof/realign/README.md`
- Modify: `docs/HANDOFF.md`

- [ ] **Step 1:** Script captures, at 1600×900 against the running dev server, wiping its demo data afterwards like proof-alpha does:
  1. `01-night-workspace.png` — full room, Night, pass active, line selected (the north-star comparison shot)
  2. `02-day-workspace.png` — same state, Day
  3. `03-line-board-evidence-link.png` — selected line with note marker + linked card + linked evidence
  4. `04-pass-tray-open.png` — tray detail band
  5. `05-evidence-panel.png` — structured finding card
  6. `06-import-menu.png`
  7. `07-annotated-read.png` — guided read state
- [ ] **Step 2:** README lists each shot + honest approximations (what differs from the mockup and why: no Outline/Beats/Relationships tabs, no minimap/filter, no multi-run pass versions — all deferred, no dead UI).
- [ ] **Step 3:** Update `docs/HANDOFF.md`: realignment done, verdict loop back to Billy, port etiquette block unchanged.
- [ ] **Step 4:** Port etiquette: if this session started the dev server, kill it (`lsof -ti:5213 | xargs kill` after confirming via `lsof -i:5213` the PID is ours) and hand Billy the cd + npm run dev block; if Billy's server was already running, hand only the URL.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "realign R11: proof pack and handoff"`

---

## Self-Review (performed at write time)

- **Spec coverage:** Billy's items 1–10 map to: 1→R1/R9, 2→R4/R9, 3→R1/R2, 4→R6, 5→R5, 6→R7, 7→R8, 8→R10 regression + untouched logic layers, 9→R11, 10→R1/R2/R5/R6/R7/R10. Toolbar item 2's "basic formatting controls where feasible" is consciously resolved as element-type + undo/redo + zoom (no text marks in the schema; adding marks touches import/export — out of scope, stated in R4).
- **Honesty gaps vs mockup, deliberately deferred (no dead UI):** board view tabs (Outline/Beats/Relationships), board minimap + filter, pass multi-run versions ("v2"), per-line "Line 7" reference in LINKED TO (we link by element identity instead), confidence for the local analyzer (field exists, only cloud may fill it).
- **Type consistency:** `boardDock: 'side' | 'bottom'`, `setBoardDock`, `saveState: 'saving' | 'saved'`, `applyElementType(view, type)`, `registerEditorView/getEditorView`, `Finding.confidence?: number` used consistently across tasks.
- **Known verify-at-write-time points (flagged in steps, not placeholders):** exact `revision.start` string key (R3), jsdom matchMedia stub presence (R1), exact scene-2 slug (R10), where GoToPage executes its jump (R4).
