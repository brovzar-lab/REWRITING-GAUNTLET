# Epps Journey Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved `design_handoff_epps_journey` handoff (journey strip, grouped rail, Private Read mode, Notes intake) plus Billy's five approved amendments (Polish stage in the strip, Studio Extension labels, writer marks kept separate from the five reader slots, post-session tagging, copy fixes: three-reader floor, consent nudge, subtle timer, paper path).

**Architecture:** All changes ride the existing WorkstationShell architecture. The journey strip is a new bar under the toolbar (same slot as PassStrip). The "What to do next" right panel (JourneyGuide) is retired; the strip supersedes it. Read mode upgrades the existing `readModeActive` machinery with a hard editing lock, a four-mark palette rendered as ProseMirror decorations, and swapped toolbar/status-bar chrome. The Notes intake is a new center view driven by a `notesIntakeOpen` store flag. All new state persists through the existing Dexie `workflow` row.

**Tech Stack:** React 18, TypeScript, Zustand (single store `useAppStore`), ProseMirror decorations, Dexie (IndexedDB), Vitest + @testing-library/react, Playwright e2e.

## Global Constraints

- Dev server: port **5213**, host 127.0.0.1, strictPort (already in `vite.config.ts`). Never start on another port.
- All existing tests stay green: `npm run test`, `npm run typecheck`, `npm run e2e`.
- Every i18n key must exist in BOTH `en` and `es` blocks of `src/i18n/strings.ts` (guarded by `src/i18n/strings.test.ts`).
- `src/theme/tokens.css` is guarded by `src/theme/tokens.test.ts`: any new token must be added to `DESIGN.md` and `DESIGN.json` FIRST.
- Marks are element-level (`sceneId` + `elementId`), matching the app's Selection model. No character ranges.
- No numeric screenplay scores anywhere. AI diagnosis stays gated behind the private read (`annotatedReadComplete`).
- Anything not in the Epps book carries a visible "Studio Extension" label: the on-screen read mode, and the read-before-notes stage order.
- Reader caps come from `src/workflow/types.ts`: `MAX_INITIAL_READERS = 5`, `RECOMMENDED_INITIAL_READERS = 3`. Copy must state "3 recommended · 5 max".
- Day and Night themes both work at every step (use semantic tokens `--surface-*`, `--accent`, never raw hex in components).
- Existing mark colors map to existing tokens: Great stuff → `--color-confirmed` (#4F8B62), Cut? → `--color-concern` (#C5534B), Dropped out → `--color-card-plum` (#9A829F), Question → `--color-card-blue` (#8DAFC1).
- Commit after every task. No destructive git.

---

### Task 1: Journey stage model

The nine-stage journey (amendment: Polish added between Passes and Let Go) as a pure, testable module, following the pattern of the retiring `JourneyGuide.STAGES`.

**Files:**
- Create: `src/shell/journeyStages.ts`
- Test: `src/shell/journeyStages.test.ts`

**Interfaces:**
- Consumes: `useAppStore` state shape (`workflow`, `gamePlan`, `screenplay`, `polishReadComplete`) — read-only.
- Produces: `JourneyStageId` union, `JOURNEY_STAGES: JourneyStage[]` (ordered, 9 items), `currentJourneyStage(s): number`, `stageStat(s, id): { current: number; total: number } | null`. Task 3 (strip) and Task 4 (guide removal) rely on these exact names.

- [ ] **Step 1: Write the failing test**

```ts
// src/shell/journeyStages.test.ts
import { describe, expect, it } from 'vitest';
import { JOURNEY_STAGES, currentJourneyStage } from './journeyStages';
import { emptyWorkflow } from '../workflow/types';

function fakeState(overrides: Record<string, unknown> = {}) {
  return {
    screenplay: { scenes: [{ id: 's1' }] },
    workflow: emptyWorkflow(),
    gamePlan: { statementOfIntent: '' },
    polishReadComplete: false,
    ...overrides,
  } as never;
}

describe('journey stages', () => {
  it('has nine stages ending in polish then letgo (amendment 1)', () => {
    expect(JOURNEY_STAGES.map((s) => s.id)).toEqual([
      'script', 'privateRead', 'notes', 'organize', 'interpret',
      'gameplan', 'passes', 'polish', 'letgo',
    ]);
  });

  it('starts on script when no scenes, privateRead once a script exists', () => {
    expect(currentJourneyStage(fakeState({ screenplay: { scenes: [] } }))).toBe(0);
    expect(currentJourneyStage(fakeState())).toBe(1);
  });

  it('advances to notes after the annotated read completes', () => {
    const wf = { ...emptyWorkflow(), annotatedReadComplete: true };
    expect(currentJourneyStage(fakeState({ workflow: wf }))).toBe(2);
  });

  it('polish is a real stage: passes complete but polish read not done → stage 7', () => {
    const wf = {
      ...emptyWorkflow(),
      annotatedReadComplete: true,
      readers: [{ id: 'r1', name: 'A', role: 'initial', addedAt: 1, notes: [{ id: 'n1', quote: 'x', kind: 'symptom', createdAt: 1 }] }],
      passRuns: { foundation: 'complete' },
    };
    expect(
      currentJourneyStage(fakeState({ workflow: wf, gamePlan: { statementOfIntent: 'intent' } })),
    ).toBe(7);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/shell/journeyStages.test.ts`
Expected: FAIL — `Cannot find module './journeyStages'` (and Reader `notes` type error until Task 9; use `as never` cast in the fixture as shown, so only the module error fires).

- [ ] **Step 3: Write the implementation**

```ts
// src/shell/journeyStages.ts
import type { useAppStore } from '../store/appStore';

/** The nine-stage Epps journey. Amendment 1: Polish is a real stage between
    Passes and Let Go (Epps has a full Polish Read chapter). Stage order note
    (amendment 2): the book gathers reader notes BEFORE the annotated read;
    we read first so the writer's own reactions stay uncolored. That order is
    a Studio Extension and is labeled as such in the strip tooltip. */

type S = ReturnType<typeof useAppStore.getState>;

export type JourneyStageId =
  | 'script' | 'privateRead' | 'notes' | 'organize' | 'interpret'
  | 'gameplan' | 'passes' | 'polish' | 'letgo';

export interface JourneyStage {
  id: JourneyStageId;
  done: (s: S) => boolean;
  act: (s: S) => void;
}

const hasReaderNotes = (s: S) => s.workflow.readers.some((r) => (r.notes ?? []).length > 0);
// Organize/Interpret have no dedicated surface yet (next handoff). They count
// done once the writer has moved on to a game plan, so the strip never traps
// the current-stage marker on an unbuildable stage.
const movedPastNotes = (s: S) => s.gamePlan.statementOfIntent.trim() !== '';

export const JOURNEY_STAGES: JourneyStage[] = [
  { id: 'script', done: (s) => s.screenplay.scenes.length > 0, act: (s) => s.setLeftWorkspace('project') },
  { id: 'privateRead', done: (s) => s.workflow.annotatedReadComplete, act: (s) => s.enterReadMode() },
  { id: 'notes', done: hasReaderNotes, act: (s) => s.setNotesIntakeOpen(true) },
  { id: 'organize', done: movedPastNotes, act: (s) => s.setRightWorkspace('evidence') },
  { id: 'interpret', done: movedPastNotes, act: (s) => s.setRightWorkspace('evidence') },
  { id: 'gameplan', done: movedPastNotes, act: (s) => s.setRightWorkspace('gameplan') },
  {
    id: 'passes',
    done: (s) => Object.values(s.workflow.passRuns).some((v) => v === 'complete'),
    act: (s) => s.setRightWorkspace('passes'),
  },
  { id: 'polish', done: (s) => s.polishReadComplete, act: (s) => s.startPolishRead() },
  { id: 'letgo', done: () => false, act: (s) => s.setExportOpen(true) },
];

export function currentJourneyStage(s: S): number {
  const i = JOURNEY_STAGES.findIndex((stage) => !stage.done(s));
  return i === -1 ? JOURNEY_STAGES.length - 1 : i;
}

/** Optional stat for a stage segment, e.g. readers 2/5. Null = no stat. */
export function stageStat(s: S, id: JourneyStageId): { current: number; total: number } | null {
  if (id === 'privateRead') {
    return { current: s.workflow.visitedScenes.length, total: s.screenplay.scenes.length };
  }
  if (id === 'notes') return { current: s.workflow.readers.length, total: 5 };
  return null;
}
```

Note: `setNotesIntakeOpen` does not exist until Task 9, and `r.notes` does not exist on `Reader` yet. To keep this task green on its own, Task 1 also adds the store stub (Step 3b) and the type-only `ReaderNote` extension (Step 3c).

- [ ] **Step 3b: Add the `notesIntakeOpen` store stub**

In `src/store/appStore.ts`, inside the `AppState` interface (around the other UI flags near `findOpen`/`exportOpen`), add:

```ts
  /** Stage-3 Notes intake takes over the center region when true. */
  notesIntakeOpen: boolean;
  setNotesIntakeOpen: (open: boolean) => void;
```

In the `create` body, next to the other UI flag defaults:

```ts
  notesIntakeOpen: false,
  setNotesIntakeOpen: (open) => set({ notesIntakeOpen: open }),
```

Also set `notesIntakeOpen: false` inside `replaceDocument` (near line 589) and `resetToSample` (near line 704), following how the neighboring UI flags reset there.

- [ ] **Step 3c: Add the type-only `ReaderNote` extension**

In `src/workflow/types.ts`, add above `Reader` (Task 9 adds the store actions; this task only needs the types so `r.notes` typechecks):

```ts
/** A single captured reader comment. kind implements Epps's doctor/patient
    rule: store the symptom; quarantine the reader's remedy; protect praise. */
export interface ReaderNote {
  id: string;
  quote: string;
  page?: number;
  kind: 'symptom' | 'remedy' | 'whatWorked';
  category?: string;
  linkedSymptomId?: string;
  createdAt: number;
}
```

Extend `Reader` with three optional fields: `title?: string; draftRead?: string; notes?: ReaderNote[];` (optional so existing persisted rows and fixtures stay valid; the store always initializes `notes: []` from Task 9 on).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/shell/journeyStages.test.ts && npm run typecheck`
Expected: PASS, typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add src/shell/journeyStages.ts src/shell/journeyStages.test.ts src/store/appStore.ts
git commit -m "feat: nine-stage journey model with polish stage (amendment 1)"
```

---

### Task 2: i18n strings for every new surface

All new keys in one task so `strings.test.ts` parity stays green throughout.

**Files:**
- Modify: `src/i18n/strings.ts` (both `en` and `es` blocks)

**Interfaces:**
- Produces: keys `js.*` (journey strip), `railgroup.*`, `readmode.*`, `mark.*`, `ni.*` (notes intake), `ww.*` (what worked). Consumed by Tasks 3, 5, 7, 8, 9, 10. Changes `ws.journey` label to Read/Lectura (amendment: rail rename).

- [ ] **Step 1: Add EN keys**

In the `en` block of `src/i18n/strings.ts`, change `'ws.journey': 'Journey'` to `'ws.journey': 'Read'`, then add:

```ts
  // Journey strip (supersedes the "What to do next" panel)
  'js.label': 'Rewrite journey',
  'js.script.name': 'Script',
  'js.privateRead.name': 'Private read',
  'js.notes.name': 'Notes',
  'js.organize.name': 'Organize',
  'js.interpret.name': 'Interpret',
  'js.gameplan.name': 'Game plan',
  'js.passes.name': 'Passes',
  'js.polish.name': 'Polish',
  'js.letgo.name': 'Let go',
  'js.script.cta': 'Open a script',
  'js.privateRead.cta': 'Start your private read',
  'js.notes.cta': '+ Add reader',
  'js.organize.cta': 'Open evidence',
  'js.interpret.cta': 'Open evidence',
  'js.gameplan.cta': 'Open game plan',
  'js.passes.cta': 'Open passes',
  'js.polish.cta': 'Start polish read',
  'js.letgo.cta': 'Export',
  'js.orderNote': 'Studio Extension: we read before notes; Epps gathers notes first.',
  // Rail groups
  'railgroup.journey': 'Journey',
  'railgroup.studio': 'Studio',
  // Read mode chrome
  'readmode.lock': 'Reading — editing is off',
  'readmode.helper': 'one sitting · your marks stay private',
  'readmode.extension': 'Studio Extension · Epps reads on paper',
  'readmode.print': 'Print read copy',
  'readmode.pause': 'Pause read',
  'readmode.finish': 'Finish sitting',
  'readmode.minutes': 'min',
  'readmode.marksSoFar': 'marks so far · they’ll be waiting in Notes',
  // Marks
  'mark.title': 'Mark',
  'mark.great': 'Great stuff',
  'mark.cut': 'Cut?',
  'mark.dropped': 'Dropped out',
  'mark.question': 'Question',
  'mark.hint': 'select a line, press a key',
  // Notes intake
  'ni.title': 'Reader Notes',
  'ni.subtitle': '3 recommended · 5 max · capture everything, judge nothing yet',
  'ni.addReader': '+ Reader',
  'ni.you': 'Your private read',
  'ni.youNote': 'Kept separate from your readers',
  'ni.consent': 'Ask permission before recording — a courtesy Epps insists on.',
  'ni.record': 'Record session',
  'ni.recordTodo': 'Recording and transcription arrive in a later slice.',
  'ni.noteInput': 'Type a note the reader gives you…',
  'ni.kind.symptom': 'Symptom',
  'ni.kind.remedy': 'Their remedy — kept separate',
  'ni.kind.whatWorked': '★ What worked',
  'ni.tagLater': 'Tag notes after the session, not during it.',
  'ni.readerCount': 'readers in',
  'ni.notesGathered': 'notes gathered',
  // What worked (protected, pinned)
  'ww.title': '★ What worked',
  'ww.protected': 'Protected. This is what you must not break in the rewrite.',
  'ww.pinned': 'pinned through every stage ahead',
  'ww.empty': 'Nothing marked yet. Great-stuff marks and reader praise land here.',
```

- [ ] **Step 2: Add ES keys**

In the `es` block, change `'ws.journey'` to `'Lectura'`, then add the mirror set:

```ts
  'js.label': 'Camino de reescritura',
  'js.script.name': 'Guion',
  'js.privateRead.name': 'Lectura privada',
  'js.notes.name': 'Notas',
  'js.organize.name': 'Organizar',
  'js.interpret.name': 'Interpretar',
  'js.gameplan.name': 'Plan de juego',
  'js.passes.name': 'Pasadas',
  'js.polish.name': 'Pulido',
  'js.letgo.name': 'Soltar',
  'js.script.cta': 'Abrir un guion',
  'js.privateRead.cta': 'Empieza tu lectura privada',
  'js.notes.cta': '+ Añadir lector',
  'js.organize.cta': 'Abrir evidencia',
  'js.interpret.cta': 'Abrir evidencia',
  'js.gameplan.cta': 'Abrir plan de juego',
  'js.passes.cta': 'Abrir pasadas',
  'js.polish.cta': 'Iniciar lectura de pulido',
  'js.letgo.cta': 'Exportar',
  'js.orderNote': 'Extensión del estudio: leemos antes de las notas; Epps reúne notas primero.',
  'railgroup.journey': 'Camino',
  'railgroup.studio': 'Estudio',
  'readmode.lock': 'Leyendo — edición desactivada',
  'readmode.helper': 'una sentada · tus marcas son privadas',
  'readmode.extension': 'Extensión del estudio · Epps lee en papel',
  'readmode.print': 'Imprimir copia de lectura',
  'readmode.pause': 'Pausar lectura',
  'readmode.finish': 'Terminar sentada',
  'readmode.minutes': 'min',
  'readmode.marksSoFar': 'marcas hasta ahora · te esperan en Notas',
  'mark.title': 'Marca',
  'mark.great': 'Buen material',
  'mark.cut': '¿Cortar?',
  'mark.dropped': 'Me desconecté',
  'mark.question': 'Pregunta',
  'mark.hint': 'elige una línea, pulsa una tecla',
  'ni.title': 'Notas de lectores',
  'ni.subtitle': '3 recomendados · 5 máximo · captura todo, no juzgues aún',
  'ni.addReader': '+ Lector',
  'ni.you': 'Tu lectura privada',
  'ni.youNote': 'Separada de tus lectores',
  'ni.consent': 'Pide permiso antes de grabar — una cortesía en la que Epps insiste.',
  'ni.record': 'Grabar sesión',
  'ni.recordTodo': 'La grabación y transcripción llegan en una fase posterior.',
  'ni.noteInput': 'Escribe una nota que te dé el lector…',
  'ni.kind.symptom': 'Síntoma',
  'ni.kind.remedy': 'Su remedio — se guarda aparte',
  'ni.kind.whatWorked': '★ Lo que funcionó',
  'ni.tagLater': 'Etiqueta las notas después de la sesión, no durante.',
  'ni.readerCount': 'lectores dentro',
  'ni.notesGathered': 'notas reunidas',
  'ww.title': '★ Lo que funcionó',
  'ww.protected': 'Protegido. Esto es lo que no debes romper en la reescritura.',
  'ww.pinned': 'fijado en todas las etapas siguientes',
  'ww.empty': 'Nada marcado aún. Las marcas de buen material y los elogios de lectores llegan aquí.',
```

- [ ] **Step 3: Run the parity test**

Run: `npx vitest run src/i18n/strings.test.ts`
Expected: PASS (both blocks have identical key sets).

- [ ] **Step 4: Commit**

```bash
git add src/i18n/strings.ts
git commit -m "feat: i18n strings for journey strip, read mode, notes intake (EN+ES)"
```

---

### Task 3: JourneyStrip component

The 36px always-visible strip under the toolbar. Same insertion slot as PassStrip (`WorkstationShell.tsx:50`).

**Files:**
- Create: `src/shell/JourneyStrip.tsx`
- Modify: `src/shell/WorkstationShell.tsx:49-51`, `src/shell/shell.css` (append)
- Test: `src/shell/journeyStrip.test.tsx`

**Interfaces:**
- Consumes: `JOURNEY_STAGES`, `currentJourneyStage`, `stageStat` from Task 1; `js.*` strings from Task 2.
- Produces: `<JourneyStrip />` with root `nav.journey-strip`; segments `button.js-stage` with `.is-current`/`.is-done`; continue pill `button.js-continue`. E2E (Task 11) relies on these class names.

- [ ] **Step 1: Write the failing test**

```tsx
// src/shell/journeyStrip.test.tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JourneyStrip } from './JourneyStrip';
import { useAppStore } from '../store/appStore';

describe('JourneyStrip', () => {
  beforeEach(() => {
    useAppStore.getState().resetToSample();
  });

  it('renders nine stages with the current one marked', () => {
    render(<JourneyStrip />);
    const nav = screen.getByRole('navigation', { name: 'Rewrite journey' });
    expect(nav.querySelectorAll('.js-stage')).toHaveLength(9);
    // Sample doc is open, read not complete → Private read is current.
    expect(screen.getByRole('button', { name: /Private read/ })).toHaveAttribute('aria-current', 'step');
  });

  it('stages are never locked: clicking Game plan opens the game plan panel', async () => {
    render(<JourneyStrip />);
    await userEvent.click(screen.getByRole('button', { name: /Game plan/ }));
    expect(useAppStore.getState().rightWorkspace).toBe('gameplan');
  });

  it('shows one contextual continue action', () => {
    render(<JourneyStrip />);
    expect(screen.getByRole('button', { name: 'Start your private read' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/shell/journeyStrip.test.tsx`
Expected: FAIL — `Cannot find module './JourneyStrip'`.

- [ ] **Step 3: Write the component**

```tsx
// src/shell/JourneyStrip.tsx
import { useAppStore } from '../store/appStore';
import { useT, type StringKey } from '../i18n/strings';
import { JOURNEY_STAGES, currentJourneyStage, stageStat } from './journeyStages';

/** The always-visible "you are here" strip — the antidote to the Circle of
    Confusion. Supersedes the JourneyGuide right panel. Stages are never
    locked, only de-emphasized; ✓ replaces the number when a stage is done. */
export function JourneyStrip() {
  const t = useT();
  // Subscribe to everything the stage predicates read, so the strip stays live.
  useAppStore((s) => s.workflow);
  useAppStore((s) => s.gamePlan.statementOfIntent);
  useAppStore((s) => s.polishReadComplete);
  useAppStore((s) => s.screenplay.scenes.length);
  const state = useAppStore.getState();
  const current = currentJourneyStage(state);
  const currentStage = JOURNEY_STAGES[current];

  const run = (index: number) => {
    const s = useAppStore.getState();
    if (JOURNEY_STAGES[index].id !== 'notes') s.setNotesIntakeOpen(false);
    JOURNEY_STAGES[index].act(s);
  };

  return (
    <nav className="journey-strip" aria-label={t('js.label')} title={t('js.orderNote')}>
      {JOURNEY_STAGES.map((stage, i) => {
        const done = stage.done(state);
        const stat = stageStat(state, stage.id);
        return (
          <span key={stage.id} className="js-segment">
            {i > 0 && (
              <span className="js-sep" aria-hidden="true">
                ›
              </span>
            )}
            <button
              type="button"
              className={`js-stage${i === current ? ' is-current' : ''}${done ? ' is-done' : ''}`}
              aria-current={i === current ? 'step' : undefined}
              onClick={() => run(i)}
            >
              <span className="js-num" aria-hidden="true">
                {done ? '✓' : i + 1}
              </span>
              <span className="js-name">{t(`js.${stage.id}.name` as StringKey)}</span>
              {stat && (
                <span className="js-stat">
                  {stat.current}/{stat.total}
                </span>
              )}
            </button>
          </span>
        );
      })}
      <span className="js-spacer" />
      <button type="button" className="js-continue" onClick={() => run(current)}>
        {t(`js.${currentStage.id}.cta` as StringKey)}
      </button>
    </nav>
  );
}
```

- [ ] **Step 4: Mount it in the shell**

In `src/shell/WorkstationShell.tsx`, import `JourneyStrip` and render it between the toolbar and the PassStrip line, only when a document is open:

```tsx
      <WorkstationToolbar />
      {documentOpen && <JourneyStrip />}
      {showPassStrip && <PassStrip />}
```

- [ ] **Step 5: Style it**

Append to `src/shell/shell.css` (semantic tokens only, so Day/Night both work):

```css
/* Journey strip — 36px, sits under the toolbar, full width. */
.journey-strip {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 36px;
  padding: 0 8px;
  background: var(--surface-toolbar);
  border-bottom: 1px solid var(--border-strong);
  overflow-x: auto;
}
.js-segment { display: inline-flex; align-items: center; gap: 2px; }
.js-sep { color: var(--text-faint); font-size: 11px; padding: 0 2px; }
.js-stage {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 0;
  background: none;
  color: var(--text-secondary);
  font: 600 11px/1 inherit;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 0 6px;
  height: 36px;
  cursor: pointer;
  opacity: 0.7;
}
.js-stage .js-num { font-size: 11px; color: var(--text-faint); font-variant-numeric: tabular-nums; }
.js-stage .js-stat { font-size: 10px; color: var(--text-faint); text-transform: none; }
.js-stage.is-done { opacity: 0.55; }
.js-stage.is-done .js-num { color: var(--color-confirmed); }
.js-stage.is-current { opacity: 1; box-shadow: inset 0 -2px 0 var(--accent); }
.js-stage.is-current .js-num { color: var(--accent); font-weight: 700; }
.js-stage:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -2px; }
.js-spacer { flex: 1; }
.js-continue {
  border: 0;
  border-radius: 4px;
  background: var(--accent);
  color: var(--color-ink);
  font: 600 11px/1 inherit;
  padding: 6px 12px;
  cursor: pointer;
  white-space: nowrap;
}
.js-continue:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run src/shell/journeyStrip.test.tsx && npm run typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/shell/JourneyStrip.tsx src/shell/journeyStrip.test.tsx src/shell/WorkstationShell.tsx src/shell/shell.css
git commit -m "feat: journey strip under the toolbar (delta 1)"
```

---

### Task 4: Retire the "What to do next" panel

The strip supersedes JourneyGuide. Default right panel becomes Evidence.

**Files:**
- Delete: `src/shell/JourneyGuide.tsx`
- Modify: `src/shell/RightContextPanel.tsx`, `src/store/appStore.ts` (default `rightWorkspace`, its type union, `resetToSample`/`replaceDocument` defaults), `src/shell/AppMenuBar.tsx:121` (Help item), `src/shell/WorkspaceRail.tsx` (temporarily: `journey` case routes to `evidence` until Task 5 repurposes it)
- Test: modify any unit test referencing `JourneyGuide` or `rightWorkspace: 'journey'` (run `rg -l "JourneyGuide|'journey'" src` first)

- [ ] **Step 1: Find all references**

Run: `rg -n "JourneyGuide|rightWorkspace === 'journey'|setRightWorkspace\('journey'\)|'journey'" src e2e`
Expected: hits in `RightContextPanel.tsx`, `WorkspaceRail.tsx`, `AppMenuBar.tsx`, `appStore.ts`, `JourneyGuide.tsx`, plus e2e specs (e2e handled in Task 11).

- [ ] **Step 2: Update RightContextPanel**

Replace the JourneyGuide fallback with EvidenceInspector and drop `'journey'` from the override type:

```tsx
// src/shell/RightContextPanel.tsx (full new body)
import { useAppStore } from '../store/appStore';
import { PassWorkspace } from '../panels/PassWorkspace';
import { EvidenceInspector } from '../panels/EvidenceInspector';
import { GamePlanPanel } from '../panels/GamePlanPanel';

/** One contextual panel at a time. The journey strip owns "what do I do
    next" now; the panel's fallback is Evidence. */
export function RightContextPanel({ override }: { override?: 'passes' | 'evidence' | 'gameplan' }) {
  const stored = useAppStore((s) => s.rightWorkspace);
  const rightWorkspace = override ?? stored;
  return (
    <div className="right-context" role="region" aria-label="Context" data-editor-exit tabIndex={-1}>
      {rightWorkspace === 'passes' ? (
        <PassWorkspace />
      ) : rightWorkspace === 'gameplan' ? (
        <GamePlanPanel />
      ) : (
        <EvidenceInspector />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update the store**

In `src/store/appStore.ts`: remove `'journey'` from the `rightWorkspace` union type, change every default `rightWorkspace: 'journey'` (initial state ~line 235, `replaceDocument` ~608, `resetToSample` ~729) to `rightWorkspace: 'evidence'`. Keep `railFocus` accepting `'journey'` (the rail id survives; Task 5 repurposes it as Read).

- [ ] **Step 4: Update AppMenuBar and WorkspaceRail**

In `src/shell/AppMenuBar.tsx:121`, the Help item "The rewrite journey" currently calls `setRightWorkspace('journey')`, which no longer exists. Have it run the strip's continue action instead:

```ts
// Help > "The rewrite journey": jump to the current journey stage.
import { JOURNEY_STAGES, currentJourneyStage } from './journeyStages';
// in the item's action:
() => {
  const s = useAppStore.getState();
  JOURNEY_STAGES[currentJourneyStage(s)].act(s);
},
```

In `src/shell/WorkspaceRail.tsx`, change the `journey` case in `activate` to `return s.setRightWorkspace('evidence');` and in `isActive` to `return false;` (placeholder — Task 5 gives it its real Read behavior). Delete `src/shell/JourneyGuide.tsx`.

- [ ] **Step 5: Run the whole unit suite and fix stragglers**

Run: `npm run test && npm run typecheck`
Expected: failures only in tests that assert the old default `rightWorkspace === 'journey'` or render JourneyGuide. Update those assertions to `'evidence'` / JourneyStrip equivalents. Then: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A src
git commit -m "refactor: retire JourneyGuide panel; evidence is the right-panel default"
```

---

### Task 5: Grouped rail (delta 2)

Two micro-labeled groups: JOURNEY (Project, Read, Evidence, Game plan, Passes, Polish) and STUDIO (Scenes, Board, History, Layouts). The `journey` rail item becomes Read and enters read mode.

**Files:**
- Modify: `src/shell/WorkspaceRail.tsx`, `src/shell/shell.css` (append)
- Test: `src/shell/workspaceRail.test.tsx` (create if absent; check with `ls src/shell/*.test.tsx` first)

- [ ] **Step 1: Write the failing test**

```tsx
// src/shell/workspaceRail.test.tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceRail } from './WorkspaceRail';
import { useAppStore } from '../store/appStore';

describe('WorkspaceRail groups', () => {
  beforeEach(() => {
    useAppStore.getState().resetToSample();
  });

  it('shows JOURNEY and STUDIO group labels with a divider', () => {
    render(<WorkspaceRail />);
    expect(screen.getByText('Journey')).toBeInTheDocument();
    expect(screen.getByText('Studio')).toBeInTheDocument();
    expect(document.querySelector('.rail-divider')).not.toBeNull();
  });

  it('renames the journey item to Read and it enters read mode', async () => {
    render(<WorkspaceRail />);
    await userEvent.click(screen.getByRole('button', { name: 'Read' }));
    expect(useAppStore.getState().readModeActive).toBe(true);
  });

  it('keeps journey-order: Project, Read, Evidence, Game plan, Passes, Polish before the divider', () => {
    render(<WorkspaceRail />);
    const labels = Array.from(document.querySelectorAll('.rail-item .rail-label')).map((n) => n.textContent);
    expect(labels.slice(0, 6)).toEqual(['Project', 'Read', 'Evidence', 'Game plan', 'Passes', 'Polish']);
  });
});
```

Note: the exact `ws.*` label spellings come from `src/i18n/strings.ts:397-406` — check them (`rg "'ws\." src/i18n/strings.ts`) and adjust the expected array to the real EN labels for project/evidence/gameplan/passes/polish.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/shell/workspaceRail.test.tsx`
Expected: FAIL (no group labels, Read not found).

- [ ] **Step 3: Regroup the rail**

In `src/shell/WorkspaceRail.tsx`:

1. Replace `ORDER` with two groups:

```ts
const GROUPS: { key: 'journey' | 'studio'; items: RailId[] }[] = [
  { key: 'journey', items: ['project', 'journey', 'evidence', 'gameplan', 'passes', 'polish'] },
  { key: 'studio', items: ['scenes', 'board', 'history', 'layouts'] },
];
```

2. In `isActive`, change the `journey` case to `return s.readModeActive;`.
3. In `activate`, change the `journey` case to:

```ts
      case 'journey':
        s.setNotesIntakeOpen(false);
        if (s.layoutMode === 'board') s.setLayoutMode('workbench');
        return s.enterReadMode();
```

4. Replace the render loop with grouped rendering:

```tsx
    <nav className="workspace-rail" aria-label={t('rail.label')}>
      {GROUPS.map((group, gi) => (
        <div key={group.key} className="rail-group" role="group" aria-label={t(`railgroup.${group.key}` as StringKey)}>
          {gi > 0 && <span className="rail-divider" aria-hidden="true" />}
          <span className="rail-group-label" aria-hidden="true">
            {t(`railgroup.${group.key}` as StringKey)}
          </span>
          {group.items.map((id) => {
            /* existing button JSX unchanged */
          })}
        </div>
      ))}
    </nav>
```

- [ ] **Step 4: Style the groups**

Append to `src/shell/shell.css`:

```css
.rail-group { display: flex; flex-direction: column; align-items: stretch; }
.rail-group-label {
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-faint);
  text-align: center;
  padding: 4px 0 2px;
}
.rail-divider {
  display: block;
  width: 36px;
  height: 1px;
  background: var(--border-hairline);
  margin: 6px auto;
}
```

(Confirm the semantic border token names with `rg "border" src/theme/themes.css | head`; use the app's existing hairline/strong names.)

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/shell/workspaceRail.test.tsx && npm run test && npm run typecheck`
Expected: PASS (fix any test that used the rail name 'Journey' → 'Read').

- [ ] **Step 6: Commit**

```bash
git add src/shell/WorkspaceRail.tsx src/shell/workspaceRail.test.tsx src/shell/shell.css
git commit -m "feat: grouped rail with JOURNEY/STUDIO labels; Journey item becomes Read (delta 2)"
```

---

### Task 6: Read marks — model, store, persistence

The four-mark vocabulary as data, persisted with the workflow row. Amendment 4: marks belong to the writer, never to a reader slot.

**Files:**
- Modify: `src/workflow/types.ts`, `src/store/appStore.ts`, `src/store/db.ts:41-54`, `src/store/persistence.ts:25-37,65-77`
- Test: `src/workflow/workflow.test.ts` (extend), `src/store/persistence.test.ts` (extend)

**Interfaces:**
- Produces: `ReadMarkType = 'great' | 'cut' | 'dropped' | 'question'`, `ReadMark { id, type, sceneId, elementId, page, note?, createdAt }`, `WorkflowState.readMarks: ReadMark[]`; store actions `addReadMark(mark)`, `removeReadMark(id)`; store field `readSittingStartedAt: number | null` (set by `enterReadMode`, cleared by `exitReadMode`). Tasks 7, 8, 10 rely on these names.

- [ ] **Step 1: Write the failing tests**

Extend `src/workflow/workflow.test.ts`:

```ts
import { emptyWorkflow } from './types';

it('emptyWorkflow starts with no read marks', () => {
  expect(emptyWorkflow().readMarks).toEqual([]);
});
```

Extend `src/store/persistence.test.ts` following its existing round-trip pattern (see how `storyBeats` or `passRuns` are asserted there):

```ts
it('persists and rehydrates read marks with the workflow row', async () => {
  const store = useAppStore;
  store.getState().addReadMark({
    id: 'm1', type: 'great', sceneId: 's1', elementId: 'e1', page: 3, createdAt: 1,
  });
  // flush autosave using the file's existing debounce-flush helper, then re-init
  // persistence the same way neighboring tests do, and assert:
  expect(store.getState().workflow.readMarks).toEqual([
    { id: 'm1', type: 'great', sceneId: 's1', elementId: 'e1', page: 3, createdAt: 1 },
  ]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/workflow/workflow.test.ts src/store/persistence.test.ts`
Expected: FAIL — `readMarks` undefined, `addReadMark` not a function.

- [ ] **Step 3: Implement the model**

In `src/workflow/types.ts` add above `WorkflowState`:

```ts
/** The margin-pencil vocabulary from the private read. Element-level, matching
    the app's Selection model. These are the WRITER's marks — they surface in
    Notes as a distinct lane, never as one of the five reader slots. */
export type ReadMarkType = 'great' | 'cut' | 'dropped' | 'question';

export interface ReadMark {
  id: string;
  type: ReadMarkType;
  sceneId: string;
  elementId: string;
  page: number;
  note?: string;
  createdAt: number;
}
```

Add `readMarks: ReadMark[];` to `WorkflowState` and `readMarks: [],` to `emptyWorkflow()`.

- [ ] **Step 4: Implement store actions + timer field**

In `src/store/appStore.ts` interface:

```ts
  addReadMark: (mark: ReadMark) => void;
  removeReadMark: (id: string) => void;
  /** Wall-clock start of the current sitting; null when not reading. */
  readSittingStartedAt: number | null;
```

Implementation in the `create` body:

```ts
  readSittingStartedAt: null,
  addReadMark: (mark) =>
    set((s) => ({ workflow: { ...s.workflow, readMarks: [...s.workflow.readMarks, mark] } })),
  removeReadMark: (id) =>
    set((s) => ({
      workflow: { ...s.workflow, readMarks: s.workflow.readMarks.filter((m) => m.id !== id) },
    })),
```

In the existing `enterReadMode` implementation add `readSittingStartedAt: Date.now()`; in `exitReadMode` add `readSittingStartedAt: null`.

- [ ] **Step 5: Persist**

In `src/store/db.ts` add to `WorkflowRow`: `readMarks?: ReadMark[];` (import the type). In `src/store/persistence.ts`: add `readMarks: state.workflow.readMarks,` to the `db.workflow.put({...})` object (~line 65-77) and hydrate in the `savedWorkflow` block (~line 25-37) with a default: `readMarks: savedWorkflow.readMarks ?? []` merged into the loaded workflow (follow exactly how the neighboring fields hydrate).

- [ ] **Step 6: Run tests**

Run: `npx vitest run src/workflow/workflow.test.ts src/store/persistence.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/workflow/types.ts src/store/appStore.ts src/store/db.ts src/store/persistence.ts src/workflow/workflow.test.ts src/store/persistence.test.ts
git commit -m "feat: read-mark model, store actions, Dexie persistence"
```

---

### Task 7: Mark palette, keyboard shortcuts, and paper rendering

Floating palette at the right edge during read mode; G/X/D/? apply a mark to the selected line; marks render on the paper as decorations.

**Files:**
- Create: `src/shell/MarkPalette.tsx`, `src/editor/readMarksPlugin.ts`
- Modify: `src/editor/ScreenplayEditor.tsx` (register plugin + hard lock), `src/shell/shell.css`, `src/editor/editor.css` (or wherever `.sp-page` styles live — check with `rg -l "sp-selected" src`)
- Test: `src/shell/markPalette.test.tsx`

**Interfaces:**
- Consumes: `addReadMark`, `workflow.readMarks`, `readModeActive`, `selection` from the store; `mark.*` strings.
- Produces: `<MarkPalette />` (rendered by Task 8's chrome); decoration classes `sp-mark-great|cut|dropped|question` + margin tag widgets `.sp-mark-tag`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/shell/markPalette.test.tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkPalette } from './MarkPalette';
import { useAppStore } from '../store/appStore';

describe('MarkPalette', () => {
  beforeEach(() => {
    const s = useAppStore.getState();
    s.resetToSample();
    s.enterReadMode();
    const scene = useAppStore.getState().screenplay.scenes[0];
    s.select({ sceneId: scene.id, elementId: scene.elements[0].id });
  });

  it('clicking a mark row adds a mark on the selected line', async () => {
    render(<MarkPalette />);
    await userEvent.click(screen.getByRole('button', { name: /Great stuff/ }));
    const marks = useAppStore.getState().workflow.readMarks;
    expect(marks).toHaveLength(1);
    expect(marks[0].type).toBe('great');
  });

  it('keyboard shortcut X adds a cut mark', async () => {
    render(<MarkPalette />);
    await userEvent.keyboard('x');
    expect(useAppStore.getState().workflow.readMarks[0]?.type).toBe('cut');
  });

  it('pressing the same key again removes the mark (toggle)', async () => {
    render(<MarkPalette />);
    await userEvent.keyboard('g');
    await userEvent.keyboard('g');
    expect(useAppStore.getState().workflow.readMarks).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/shell/markPalette.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the palette**

```tsx
// src/shell/MarkPalette.tsx
import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { useT, type StringKey } from '../i18n/strings';
import type { ReadMarkType } from '../workflow/types';
import { paginate } from '../pagination/engine';

const ROWS: { type: ReadMarkType; key: string; hint: string }[] = [
  { type: 'great', key: 'g', hint: 'G' },
  { type: 'cut', key: 'x', hint: 'X' },
  { type: 'dropped', key: 'd', hint: 'D' },
  { type: 'question', key: '?', hint: '?' },
];

/** The margin-pencil palette. Read mode only; editing is locked, so single
    keys are safe as shortcuts. Same key on the same line toggles the mark. */
export function MarkPalette() {
  const t = useT();
  const selection = useAppStore((s) => s.selection);
  const readMarks = useAppStore((s) => s.workflow.readMarks);

  const toggle = (type: ReadMarkType) => {
    const s = useAppStore.getState();
    if (!s.selection) return;
    const existing = s.workflow.readMarks.find(
      (m) => m.elementId === s.selection!.elementId && m.type === type,
    );
    if (existing) return s.removeReadMark(existing.id);
    const page = paginate(s.screenplay).pageOfElement.get(s.selection.elementId) ?? 1;
    s.addReadMark({
      id: `mark-${crypto.randomUUID()}`,
      type,
      sceneId: s.selection.sceneId,
      elementId: s.selection.elementId,
      page,
      createdAt: Date.now(),
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      const row = ROWS.find((r) => r.key === e.key.toLowerCase() || r.key === e.key);
      if (!row) return;
      e.preventDefault();
      toggle(row.type);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <aside className="mark-palette" aria-label={t('mark.title')}>
      <span className="mark-palette-title">{t('mark.title')}</span>
      {ROWS.map((row) => {
        const active = selection
          ? readMarks.some((m) => m.elementId === selection.elementId && m.type === row.type)
          : false;
        return (
          <button
            key={row.type}
            type="button"
            className={`mark-row mark-row-${row.type}`}
            aria-pressed={active}
            disabled={!selection}
            onClick={() => toggle(row.type)}
          >
            <span className="mark-swatch" aria-hidden="true" />
            <span className="mark-label">{t(`mark.${row.type}` as StringKey)}</span>
            <span className="mark-key" aria-hidden="true">{row.hint}</span>
          </button>
        );
      })}
      <span className="mark-palette-hint">{t('mark.hint')}</span>
    </aside>
  );
}
```

- [ ] **Step 4: Write the decorations plugin**

Model it on `src/editor/annotationPlugin.ts` (read that file first — reuse its element-to-position mapping approach exactly):

```ts
// src/editor/readMarksPlugin.ts
import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import type { EditorState } from 'prosemirror-state';
import type { ReadMark } from '../workflow/types';

const TAG_TEXT: Record<ReadMark['type'], string> = {
  great: 'GREAT STUFF',
  cut: 'CUT?',
  dropped: 'DROPPED OUT',
  question: 'QUESTION',
};

/** Renders the writer's private-read marks on the paper: a per-element class
    (highlight / strikethrough / dotted underline) plus a rotated margin tag.
    Data lives in the store; the plugin re-reads via the provided getter so it
    stays decoupled from zustand. */
export function readMarksPlugin(getMarks: () => ReadMark[]) {
  const build = (state: EditorState): DecorationSet => {
    const marks = getMarks();
    if (marks.length === 0) return DecorationSet.empty;
    const byElement = new Map<string, ReadMark[]>();
    for (const m of marks) {
      byElement.set(m.elementId, [...(byElement.get(m.elementId) ?? []), m]);
    }
    const decos: Decoration[] = [];
    state.doc.descendants((node, pos) => {
      const id = node.attrs?.id as string | undefined;
      if (!id || !byElement.has(id)) return;
      for (const m of byElement.get(id)!) {
        decos.push(Decoration.node(pos, pos + node.nodeSize, { class: `sp-mark-${m.type}` }));
        decos.push(
          Decoration.widget(pos + 1, () => {
            const tag = document.createElement('span');
            tag.className = `sp-mark-tag sp-mark-tag-${m.type}`;
            tag.textContent = TAG_TEXT[m.type];
            tag.setAttribute('aria-hidden', 'true');
            return tag;
          }),
        );
      }
    });
    return DecorationSet.create(state.doc, decos);
  };
  return new Plugin({
    props: { decorations: build },
  });
}
```

(Adjust the `node.attrs.id` access to whatever attribute name `annotationPlugin.ts` uses for element ids — copy its exact traversal.)

- [ ] **Step 5: Register the plugin and hard-lock editing**

In `src/editor/ScreenplayEditor.tsx`:
1. Add `readMarksPlugin(() => useAppStore.getState().workflow.readMarks)` to the plugins array where `annotationPlugin` is registered (~line 157).
2. Change the `editable` prop (line 225) to `editable: () => !store.getState().readOnly && !store.getState().readModeActive` and mirror the same condition in the `setProps` effect (~lines 104-106), adding `readModeActive` to that effect's dependency list.
3. Force a decoration refresh when marks change: in the existing `store.subscribe` block (~lines 276-288), when `workflow.readMarks` changes identity, dispatch an empty transaction (`view.dispatch(view.state.tr)`) — copy how the file already forces re-renders for evidence counts if such a mechanism exists; reuse it instead if so.

- [ ] **Step 6: Style palette and marks**

Append to `src/shell/shell.css`:

```css
.mark-palette {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--surface-panel);
  border: 1px solid var(--border-hairline);
  border-radius: 6px;
  padding: 8px;
  box-shadow: 0 10px 30px rgba(12, 18, 22, 0.28);
  z-index: 30;
}
.mark-palette-title, .mark-palette-hint {
  font-size: 9px; font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--text-faint); text-align: center;
}
.mark-palette-hint { font-weight: 400; text-transform: none; }
.mark-row {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px; border-radius: 4px; background: none; cursor: pointer;
  font: 600 11px/1 inherit; color: var(--text-primary);
}
.mark-row[aria-pressed='true'] { background: var(--surface-inset); }
.mark-swatch { width: 10px; height: 10px; border-radius: 2px; }
.mark-key { margin-left: auto; font-size: 9px; color: var(--text-faint); }
.mark-row-great { border: 1px solid color-mix(in srgb, var(--color-confirmed) 60%, transparent); }
.mark-row-great .mark-swatch { background: var(--color-confirmed); }
.mark-row-cut { border: 1px solid color-mix(in srgb, var(--color-concern) 60%, transparent); }
.mark-row-cut .mark-swatch { background: var(--color-concern); }
.mark-row-dropped { border: 1px solid color-mix(in srgb, var(--color-card-plum) 60%, transparent); }
.mark-row-dropped .mark-swatch { background: var(--color-card-plum); }
.mark-row-question { border: 1px solid color-mix(in srgb, var(--color-card-blue) 60%, transparent); }
.mark-row-question .mark-swatch { background: var(--color-card-blue); }
```

Append to the editor stylesheet (the file that owns `.sp-selected`):

```css
/* Private-read marks on the paper */
.sp-mark-great { background: rgba(143, 165, 132, 0.28); }
.sp-mark-cut { text-decoration: line-through; text-decoration-color: rgba(197, 83, 75, 0.7); text-decoration-thickness: 1.5px; color: rgba(32, 35, 33, 0.75); }
.sp-mark-dropped { border-bottom: 2px dotted rgba(154, 130, 159, 0.9); }
.sp-mark-question { border-bottom: 2px dotted rgba(141, 175, 193, 0.9); }
.sp-mark-tag {
  position: absolute; right: -8px; transform: translateX(100%) rotate(-2deg);
  font: 700 10px/1 Inter, sans-serif; letter-spacing: 0.05em;
  border: 1.5px solid currentColor; border-radius: 3px; padding: 1px 5px;
  user-select: none;
}
.sp-mark-tag-great { color: #4f8b62; }
.sp-mark-tag-cut { color: #c5534b; transform: translateX(100%) rotate(1.5deg); }
.sp-mark-tag-dropped { color: #9a829f; transform: translateX(100%) rotate(-1deg); }
.sp-mark-tag-question { color: #8dafc1; }
```

(The tag hexes are the paper-side mark colors from the approved handoff; they sit on cream paper in both themes, so raw hex is correct here, same as the paper itself.)

- [ ] **Step 7: Run tests**

Run: `npx vitest run src/shell/markPalette.test.tsx src/editor && npm run typecheck`
Expected: PASS (existing editor tests still green — the lock only engages when `readModeActive`).

- [ ] **Step 8: Commit**

```bash
git add src/shell/MarkPalette.tsx src/shell/markPalette.test.tsx src/editor/readMarksPlugin.ts src/editor/ScreenplayEditor.tsx src/shell/shell.css src/editor/*.css
git commit -m "feat: mark palette with keyboard shortcuts and paper decorations (delta 3)"
```

---

### Task 8: Read mode chrome

Toolbar swap, darkened desk, status-bar variant, Studio Extension label, subtle timer, print path. Retires the old AnnotatedReadBar rows in read mode (page/scene nav lives in the status bar; margin notes are superseded by marks).

**Files:**
- Create: `src/shell/ReadingToolbar.tsx`
- Modify: `DESIGN.md`, `DESIGN.json`, `src/theme/tokens.css` (new desk token), `src/theme/themes.css`, `src/shell/WorkstationToolbar.tsx`, `src/shell/WorkstationShell.tsx`, `src/panels/StatusBar.tsx`, `src/panels/AnnotatedReadBar.tsx`, `src/shell/shell.css`
- Test: `src/shell/readingToolbar.test.tsx`, run `src/theme/tokens.test.ts`

- [ ] **Step 1: Add the desk token (guarded — DESIGN files first)**

Add to `DESIGN.json` under the color tokens: `"--color-night-desk-read": "#070B0F"` with note "desk behind paper during private read (lights down)". Add the matching line to `DESIGN.md`'s token table. Then add to `src/theme/tokens.css` `:root`: `--color-night-desk-read: #070B0F;`.
Run: `npx vitest run src/theme/tokens.test.ts` — Expected: PASS.

- [ ] **Step 2: Write the failing chrome test**

```tsx
// src/shell/readingToolbar.test.tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReadingToolbar } from './ReadingToolbar';
import { useAppStore } from '../store/appStore';

describe('ReadingToolbar', () => {
  beforeEach(() => {
    const s = useAppStore.getState();
    s.resetToSample();
    s.enterReadMode();
  });

  it('shows the lock chip and the Studio Extension label', () => {
    render(<ReadingToolbar />);
    expect(screen.getByText(/Reading — editing is off/i)).toBeInTheDocument();
    expect(screen.getByText(/Studio Extension/)).toBeInTheDocument();
  });

  it('Finish sitting completes the read when all scenes are visited', () => {
    const s = useAppStore.getState();
    s.screenplay.scenes.forEach((sc) => useAppStore.getState().goToReadScene(
      s.screenplay.scenes.findIndex((x) => x.id === sc.id),
    ));
    render(<ReadingToolbar />);
    screen.getByRole('button', { name: 'Finish sitting' }).click();
    expect(useAppStore.getState().workflow.annotatedReadComplete).toBe(true);
    expect(useAppStore.getState().readModeActive).toBe(false);
  });

  it('Pause read exits without completing', () => {
    render(<ReadingToolbar />);
    screen.getByRole('button', { name: 'Pause read' }).click();
    expect(useAppStore.getState().readModeActive).toBe(false);
    expect(useAppStore.getState().workflow.annotatedReadComplete).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/shell/readingToolbar.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Write the reading toolbar**

```tsx
// src/shell/ReadingToolbar.tsx
import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';

/** Read-mode toolbar row: lock chip, helper text, Studio Extension label,
    subtle minutes-only timer (amendment 5: no seconds, no pressure), print
    path, Pause / Finish. Rendered by WorkstationToolbar when reading. */
export function ReadingToolbar() {
  const t = useT();
  const startedAt = useAppStore((s) => s.readSittingStartedAt);
  const [, tick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const minutes = startedAt ? Math.floor((Date.now() - startedAt) / 60_000) : 0;

  const finish = () => {
    const s = useAppStore.getState();
    const allVisited = s.screenplay.scenes.every((sc) => s.workflow.visitedScenes.includes(sc.id));
    if (allVisited) s.completeAnnotatedRead();
    s.exitReadMode();
  };

  return (
    <div className="reading-toolbar" role="group" aria-label={t('readmode.lock')}>
      <span className="reading-lock-chip">🔒 {t('readmode.lock')}</span>
      <span className="reading-helper">{t('readmode.helper')}</span>
      <span className="reading-extension">{t('readmode.extension')}</span>
      <span className="top-bar-spacer" />
      {minutes > 0 && (
        <span className="reading-timer">
          {minutes} {t('readmode.minutes')}
        </span>
      )}
      <button type="button" className="tool-button" onClick={() => window.print()}>
        {t('readmode.print')}
      </button>
      <button type="button" className="tool-button" onClick={() => useAppStore.getState().exitReadMode()}>
        {t('readmode.pause')}
      </button>
      <button type="button" className="tool-button tool-button-strong" onClick={finish}>
        {t('readmode.finish')}
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Wire the chrome swaps**

1. `src/shell/WorkstationToolbar.tsx`: at the top of the returned JSX, when `readModeActive` render `<ReadingToolbar />` as the first child and add the class `is-reading` to the root `editor-toolbar` div. CSS dims the normal groups: `.editor-toolbar.is-reading .toolbar-group, .editor-toolbar.is-reading .toolbar-sep { opacity: 0.35; pointer-events: none; }`.
2. `src/shell/WorkstationShell.tsx`: read `readModeActive` from the store; add the class to the center region: `<main className={`center-region${readModeActive ? ' is-reading' : ''}`}>`; render `<MarkPalette />` inside `center-region` when `readModeActive` (the palette is `position: absolute`, so give `.center-region` `position: relative` if it lacks it).
3. `src/panels/AnnotatedReadBar.tsx`: change the early return to `if (true) return null;` is wrong — instead delete the component's second row (the margin-note input, superseded by marks) and keep only the scene prev/next + complete/exit row IF e2e depends on it; check first with `rg -n "read-bar|read.complete" e2e src`. If nothing outside depends on the bar's second row, remove that row and its local state. The bar's scene-nav row remains the mechanism that populates `visitedScenes`.
4. `src/panels/StatusBar.tsx`: read `readModeActive` and `workflow.readMarks.length`; when reading, hide the beats group and Add-note button and instead render after the page nav:

```tsx
        {readModeActive && (
          <>
            <span className="status-read-progress" aria-hidden="true">
              <span className="status-read-progress-fill" style={{ width: `${(page / pagination.pageCount) * 100}%` }} />
            </span>
            <span className="status-read-marks">
              {marksCount} {t('readmode.marksSoFar')}
            </span>
          </>
        )}
```

Wrap the existing `status-beats` span and Add-note button in `{!readModeActive && (...)}`.

- [ ] **Step 6: Desk darkening + progress bar + print CSS**

In `src/theme/themes.css`, add a semantic token in both themes: night `--surface-desk-read: var(--color-night-desk-read);`, day `--surface-desk-read: var(--surface-inset);` (Day mode dims gently; the hard blackout is a Night ritual). Append to `src/shell/shell.css`:

```css
.center-region.is-reading { background: var(--surface-desk-read); position: relative; }
.center-region.is-reading .sp-page { box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
.reading-toolbar { display: flex; align-items: center; gap: 10px; width: 100%; }
.reading-lock-chip {
  background: color-mix(in srgb, var(--accent) 16%, transparent);
  border: 1px solid var(--accent); border-radius: 4px; color: var(--accent);
  font: 700 11px/1 inherit; letter-spacing: 0.03em; text-transform: uppercase; padding: 4px 8px;
}
.reading-helper, .reading-timer { font-size: 11px; color: var(--text-tertiary); }
.reading-extension { font-size: 10px; color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.06em; }
.status-read-progress { width: 140px; height: 3px; background: var(--surface-inset); border-radius: 2px; overflow: hidden; }
.status-read-progress-fill { display: block; height: 100%; background: var(--accent); }
.status-read-marks { font-size: 11px; color: var(--text-tertiary); }
@media print {
  .app-menu-bar, .editor-toolbar, .journey-strip, .workspace-rail, .status-bar,
  .mark-palette, .right-panel, .left-panel, .read-bar { display: none !important; }
  .center-region { background: white !important; }
}
```

(Verify the real class names for menu bar/panels with `rg -n "app-menu-bar|right-panel" src/shell` and use the actual ones.)

- [ ] **Step 7: Run everything**

Run: `npx vitest run src/shell/readingToolbar.test.tsx && npm run test && npm run typecheck`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A src DESIGN.md DESIGN.json
git commit -m "feat: read-mode chrome — lock chip, darkened desk, subtle timer, print path (delta 3 + amendments 2,5)"
```

---

### Task 9: Notes intake screen (delta 4)

Stage 3 center view: reader cards (5 cap, 3 recommended), post-session note entry with tagging, remedy quarantine, What worked pane, the writer's marks as a distinct lane (amendment 4), recording stubbed.

**Files:**
- Modify: `src/workflow/types.ts` (Reader extension + ReaderNote), `src/store/appStore.ts` (actions), `src/store/persistence.ts` (hydration default for `notes`)
- Create: `src/panels/NotesIntake.tsx`
- Modify: `src/shell/WorkstationShell.tsx` (center view), `src/shell/shell.css`
- Test: `src/panels/notesIntake.test.tsx`, extend `src/workflow/workflow.test.ts`

**Interfaces:**
- Produces: `ReaderNote { id, quote, page?, kind: 'symptom' | 'remedy' | 'whatWorked', category?, linkedSymptomId?, createdAt }`; `Reader.title?: string`, `Reader.draftRead?: string`, `Reader.notes: ReaderNote[]`; store actions `addReader(name, title?)` (throws nothing, no-ops at 5 initial readers), `addReaderNote(readerId, note)`, `setReaderNoteKind(readerId, noteId, kind)`. Task 10 consumes `kind === 'whatWorked'`.

- [ ] **Step 1: Write the failing model tests**

Extend `src/workflow/workflow.test.ts`:

```ts
import { useAppStore } from '../store/appStore';
import { MAX_INITIAL_READERS } from './types';

it('addReader enforces the Epps cap of five initial readers', () => {
  const s = useAppStore.getState();
  s.resetToSample();
  for (let i = 0; i < 7; i += 1) useAppStore.getState().addReader(`Reader ${i}`);
  expect(useAppStore.getState().workflow.readers.filter((r) => r.role === 'initial')).toHaveLength(
    MAX_INITIAL_READERS,
  );
});

it('a remedy note stays linked to its symptom but keeps its own kind', () => {
  const s = useAppStore.getState();
  s.resetToSample();
  useAppStore.getState().addReader('Rodrigo');
  const reader = useAppStore.getState().workflow.readers[0];
  useAppStore.getState().addReaderNote(reader.id, {
    id: 'n1', quote: 'The second act sags', kind: 'symptom', createdAt: 1,
  });
  useAppStore.getState().addReaderNote(reader.id, {
    id: 'n2', quote: 'Cut the insurance subplot', kind: 'remedy', linkedSymptomId: 'n1', createdAt: 2,
  });
  const notes = useAppStore.getState().workflow.readers[0].notes ?? [];
  expect(notes[1].kind).toBe('remedy');
  expect(notes[1].linkedSymptomId).toBe('n1');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/workflow/workflow.test.ts`
Expected: FAIL — `addReader` not a function.

- [ ] **Step 3: Hydration normalization**

The `ReaderNote` type and the `Reader` extension (`title?`, `draftRead?`, `notes?`) were added in Task 1 Step 3c — verify they exist. In `src/store/persistence.ts`'s workflow hydration, normalize old rows so `notes` is always an array: `readers: (savedWorkflow.readers ?? []).map((r) => ({ notes: [], ...r }))`. Everywhere the UI reads notes, use `(r.notes ?? [])` for safety.

- [ ] **Step 4: Store actions**

In `src/store/appStore.ts` interface + implementation:

```ts
  addReader: (name: string, title?: string) => void;
  addReaderNote: (readerId: string, note: ReaderNote) => void;
  setReaderNoteKind: (readerId: string, noteId: string, kind: ReaderNote['kind']) => void;
```

```ts
  addReader: (name, title) =>
    set((s) => {
      const initial = s.workflow.readers.filter((r) => r.role === 'initial');
      if (initial.length >= MAX_INITIAL_READERS) return s;
      const reader: Reader = {
        id: `reader-${crypto.randomUUID()}`,
        name,
        title,
        role: 'initial',
        addedAt: Date.now(),
        notes: [],
      };
      return { workflow: { ...s.workflow, readers: [...s.workflow.readers, reader] } };
    }),
  addReaderNote: (readerId, note) =>
    set((s) => ({
      workflow: {
        ...s.workflow,
        readers: s.workflow.readers.map((r) =>
          r.id === readerId ? { ...r, notes: [...(r.notes ?? []), note] } : r,
        ),
      },
    })),
  setReaderNoteKind: (readerId, noteId, kind) =>
    set((s) => ({
      workflow: {
        ...s.workflow,
        readers: s.workflow.readers.map((r) =>
          r.id === readerId
            ? { ...r, notes: (r.notes ?? []).map((n) => (n.id === noteId ? { ...n, kind } : n)) }
            : r,
        ),
      },
    })),
```

(Import `MAX_INITIAL_READERS`, `Reader`, `ReaderNote` from `../workflow/types`.)

- [ ] **Step 5: Write the failing screen test**

```tsx
// src/panels/notesIntake.test.tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotesIntake } from './NotesIntake';
import { useAppStore } from '../store/appStore';

describe('NotesIntake', () => {
  beforeEach(() => {
    useAppStore.getState().resetToSample();
  });

  it('renders five reader slots plus a separate You lane (never a sixth slot)', () => {
    render(<NotesIntake />);
    expect(screen.getAllByRole('button', { name: /\+ Reader/ })).toHaveLength(5);
    expect(screen.getByText('Your private read')).toBeInTheDocument();
  });

  it('shows the consent nudge and the tag-later guidance', () => {
    render(<NotesIntake />);
    expect(screen.getByText(/Ask permission before recording/)).toBeInTheDocument();
    expect(screen.getByText(/Tag notes after the session/)).toBeInTheDocument();
  });

  it('adding a note defaults to symptom; retagging as remedy quarantines it', async () => {
    useAppStore.getState().addReader('Rodrigo', 'director');
    render(<NotesIntake />);
    await userEvent.type(screen.getByPlaceholderText(/Type a note/), 'Act two sags{Enter}');
    const notes = useAppStore.getState().workflow.readers[0].notes;
    expect(notes[0].kind).toBe('symptom');
  });
});
```

- [ ] **Step 6: Run to verify it fails, then write the screen**

Run: `npx vitest run src/panels/notesIntake.test.tsx` → FAIL (module not found).

```tsx
// src/panels/NotesIntake.tsx
import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT, type StringKey } from '../i18n/strings';
import { MAX_INITIAL_READERS } from '../workflow/types';
import type { ReaderNote } from '../workflow/types';

const AVATAR_TOKENS = [
  'var(--color-confirmed)', 'var(--color-card-blue)', 'var(--color-card-plum)',
  'var(--color-card-ochre)', 'var(--color-concern)',
];

/** Stage 3: reader-notes intake. Five slots max (Epps), three recommended.
    The writer's own private-read marks appear in a separate lane, never as a
    reader (amendment 4). Tagging is a post-session act (amendment: the head
    stays up during the conversation). Recording is a stub — TODO integration. */
export function NotesIntake() {
  const t = useT();
  const readers = useAppStore((s) => s.workflow.readers);
  const readMarks = useAppStore((s) => s.workflow.readMarks);
  const addReader = useAppStore((s) => s.addReader);
  const addReaderNote = useAppStore((s) => s.addReaderNote);
  const setReaderNoteKind = useAppStore((s) => s.setReaderNoteKind);
  const [activeReaderId, setActiveReaderId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const initial = readers.filter((r) => r.role === 'initial');
  const active = initial.find((r) => r.id === activeReaderId) ?? initial[0] ?? null;
  const noteCount = initial.reduce((n, r) => n + (r.notes ?? []).length, 0);

  const submitNote = () => {
    if (!active || draft.trim() === '') return;
    const note: ReaderNote = {
      id: `rn-${crypto.randomUUID()}`,
      quote: draft.trim(),
      kind: 'symptom',
      createdAt: Date.now(),
    };
    addReaderNote(active.id, note);
    setDraft('');
  };

  return (
    <div className="notes-intake" role="region" aria-label={t('ni.title')}>
      <header className="ni-header">
        <h2 className="panel-title">{t('ni.title')}</h2>
        <span className="ni-subtitle">{t('ni.subtitle')}</span>
      </header>

      <div className="ni-reader-row">
        {Array.from({ length: MAX_INITIAL_READERS }, (_, i) => {
          const reader = initial[i];
          if (!reader) {
            return (
              <button
                key={`slot-${i}`}
                type="button"
                className="ni-reader-slot"
                onClick={() => {
                  const name = window.prompt(t('ni.addReader'));
                  if (name && name.trim() !== '') addReader(name.trim());
                }}
              >
                {t('ni.addReader')} {i + 1}
              </button>
            );
          }
          return (
            <button
              key={reader.id}
              type="button"
              className={`ni-reader-card${active?.id === reader.id ? ' is-active' : ''}`}
              onClick={() => setActiveReaderId(reader.id)}
            >
              <span className="ni-avatar" style={{ background: AVATAR_TOKENS[i] }} aria-hidden="true">
                {reader.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="ni-reader-name">{reader.name}</span>
              {reader.title && <span className="ni-reader-role">{reader.title}</span>}
              <span className="ni-reader-stat">
                {(reader.notes ?? []).length} · {(reader.notes ?? []).filter((n) => n.kind === 'whatWorked').length} ★
              </span>
            </button>
          );
        })}
      </div>

      {/* Amendment 4: the writer's marks are a distinct lane, not a reader. */}
      <div className="ni-you-lane" role="group" aria-label={t('ni.you')}>
        <span className="ni-you-title">{t('ni.you')}</span>
        <span className="ni-you-note">{t('ni.youNote')} · {readMarks.length}</span>
      </div>

      <div className="ni-body">
        <section className="ni-session" aria-label={t('ni.record')}>
          <div className="ni-session-head">
            <span className="ni-consent">{t('ni.consent')}</span>
            <button type="button" className="tool-button" disabled title={t('ni.recordTodo')}>
              {t('ni.record')}
            </button>
          </div>
          <p className="ni-taglater">{t('ni.tagLater')}</p>
          <ul className="ni-notes">
            {(active?.notes ?? []).map((n) => (
              <li key={n.id} className={`ni-note ni-note-${n.kind}`}>
                <span className="ni-quote">{n.quote}</span>
                <span className="ni-kind-row" role="group" aria-label="Tag">
                  {(['symptom', 'remedy', 'whatWorked'] as const).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      className={`ni-kind ni-kind-${kind}`}
                      aria-pressed={n.kind === kind}
                      onClick={() => active && setReaderNoteKind(active.id, n.id, kind)}
                    >
                      {t(`ni.kind.${kind}` as StringKey)}
                    </button>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <input
            type="text"
            className="ni-input"
            placeholder={t('ni.noteInput')}
            value={draft}
            disabled={!active}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitNote();
              }
            }}
          />
        </section>

        <aside className="ni-whatworked" aria-label={t('ww.title')}>
          <h3 className="ni-ww-title">{t('ww.title')}</h3>
          <p className="ni-ww-protected">{t('ww.protected')}</p>
          <ul>
            {initial
              .flatMap((r) => (r.notes ?? []).filter((n) => n.kind === 'whatWorked').map((n) => ({ r, n })))
              .map(({ r, n }) => (
                <li key={n.id} className="ni-ww-card">
                  <span className="ni-ww-quote">{n.quote}</span>
                  <span className="ni-ww-attr">{r.name}</span>
                </li>
              ))}
          </ul>
        </aside>
      </div>

      <footer className="ni-footer">
        {initial.length}/5 {t('ni.readerCount')} · {noteCount} {t('ni.notesGathered')}
      </footer>
    </div>
  );
}
```

- [ ] **Step 7: Mount as a center view + style**

In `src/shell/WorkstationShell.tsx`, read `notesIntakeOpen` and render it in the center precedence chain:

```tsx
          {!documentOpen ? (
            <EmptyScriptState />
          ) : notesIntakeOpen ? (
            <NotesIntake />
          ) : centerBoard ? (
            <Board />
          ) : (
            ...
          )}
```

Append styles to `src/shell/shell.css` — panel surfaces `var(--surface-panel)`, hairline borders, the What-worked pane with `background: color-mix(in srgb, var(--color-confirmed) 8%, transparent); border: 1px solid color-mix(in srgb, var(--color-confirmed) 45%, transparent);`, cream cards `background: var(--color-screenplay-paper); color: var(--color-ink); font-family: 'Courier Prime', monospace;`, remedy pill border `var(--color-card-plum)`, symptom pill border `var(--color-card-blue)`, whatWorked pill filled `var(--color-confirmed)`. Grid: `.ni-reader-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }`, `.ni-body { display: grid; grid-template-columns: 1fr 340px; gap: 14px; }`.

- [ ] **Step 8: Run tests**

Run: `npx vitest run src/panels/notesIntake.test.tsx src/workflow/workflow.test.ts && npm run test && npm run typecheck`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A src
git commit -m "feat: notes intake screen with remedy quarantine and separate You lane (delta 4 + amendments 3,4,5)"
```

---

### Task 10: What worked — pinned through later stages

A derived selector plus a compact pinned section above the Game Plan and Passes panels.

**Files:**
- Create: `src/workflow/whatWorked.ts`, `src/shell/WhatWorkedPin.tsx`
- Modify: `src/shell/RightContextPanel.tsx`
- Test: `src/workflow/whatWorked.test.ts`

**Interfaces:**
- Consumes: `workflow.readers[].notes` (kind `whatWorked`), `workflow.readMarks` (type `great`), `screenplay` for element text.
- Produces: `whatWorkedItems(workflow, screenplay): { id: string; text: string; attribution: string }[]`.

- [ ] **Step 1: Write the failing test**

```ts
// src/workflow/whatWorked.test.ts
import { describe, expect, it } from 'vitest';
import { whatWorkedItems } from './whatWorked';
import { emptyWorkflow } from './types';

const screenplay = {
  scenes: [{ id: 's1', elements: [{ id: 'e1', text: 'MARTA laughs through tears.' }] }],
} as never;

describe('whatWorkedItems', () => {
  it('collects reader whatWorked notes and writer great-stuff marks', () => {
    const wf = emptyWorkflow();
    wf.readers = [
      {
        id: 'r1', name: 'Rodrigo', role: 'initial', addedAt: 1,
        notes: [{ id: 'n1', quote: 'The kitchen scene sings', kind: 'whatWorked', createdAt: 1 }],
      },
    ];
    wf.readMarks = [{ id: 'm1', type: 'great', sceneId: 's1', elementId: 'e1', page: 3, createdAt: 2 }];
    const items = whatWorkedItems(wf, screenplay);
    expect(items).toHaveLength(2);
    expect(items[0].attribution).toBe('Rodrigo');
    expect(items[1].text).toContain('MARTA laughs');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/workflow/whatWorked.test.ts` → FAIL.

- [ ] **Step 3: Implement**

```ts
// src/workflow/whatWorked.ts
import type { WorkflowState } from './types';
import type { Screenplay } from '../model/screenplay';

export interface WhatWorkedItem {
  id: string;
  text: string;
  attribution: string;
}

/** Epps: protect what works above all. Reader praise + the writer's own
    great-stuff marks, pinned through every stage after Notes. */
export function whatWorkedItems(workflow: WorkflowState, screenplay: Screenplay): WhatWorkedItem[] {
  const fromReaders = workflow.readers.flatMap((r) =>
    (r.notes ?? [])
      .filter((n) => n.kind === 'whatWorked')
      .map((n) => ({ id: n.id, text: n.quote, attribution: r.name })),
  );
  const fromMarks = workflow.readMarks
    .filter((m) => m.type === 'great')
    .map((m) => {
      const scene = screenplay.scenes.find((s) => s.id === m.sceneId);
      const el = scene?.elements.find((e) => e.id === m.elementId);
      return { id: m.id, text: el?.text ?? `p. ${m.page}`, attribution: 'You' };
    });
  return [...fromReaders, ...fromMarks];
}
```

(Check `src/model/screenplay.ts` for the element text property name — if it is not `.text`, use the real one in both selector and test.)

- [ ] **Step 4: Pin it in the right panel**

```tsx
// src/shell/WhatWorkedPin.tsx
import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';
import { whatWorkedItems } from '../workflow/whatWorked';

/** Collapsible protected list shown above Game Plan and Passes. */
export function WhatWorkedPin() {
  const t = useT();
  const workflow = useAppStore((s) => s.workflow);
  const screenplay = useAppStore((s) => s.screenplay);
  const [open, setOpen] = useState(false);
  const items = whatWorkedItems(workflow, screenplay);
  return (
    <div className="ww-pin">
      <button type="button" className="ww-pin-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        {t('ww.title')} · {items.length}
      </button>
      {open && (
        <ul className="ww-pin-list">
          {items.length === 0 && <li className="ww-pin-empty">{t('ww.empty')}</li>}
          {items.map((i) => (
            <li key={i.id} className="ww-pin-item">
              <span className="ww-pin-text">{i.text}</span>
              <span className="ww-pin-attr">{i.attribution}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

In `src/shell/RightContextPanel.tsx`, render `<WhatWorkedPin />` before `<PassWorkspace />` and `<GamePlanPanel />` branches (wrap each branch in a fragment). Style `.ww-pin` with the same protected-green treatment as `.ni-whatworked`.

- [ ] **Step 5: Run tests and commit**

Run: `npx vitest run src/workflow/whatWorked.test.ts && npm run test && npm run typecheck` → PASS.

```bash
git add src/workflow/whatWorked.ts src/workflow/whatWorked.test.ts src/shell/WhatWorkedPin.tsx src/shell/RightContextPanel.tsx src/shell/shell.css
git commit -m "feat: what-worked items pinned through game plan and passes"
```

---

### Task 11: E2E, accessibility, and proof

Update the specs the redesign breaks, add new journeys, verify everything, launch on 5213, capture proof.

**Files:**
- Modify: `e2e/helpers.ts`, `e2e/journey-ia.spec.ts`, `e2e/realignment.spec.ts` (and any spec `rg -l "journey-guide|'Journey'" e2e` finds)
- Create: `e2e/epps-journey.spec.ts`

- [ ] **Step 1: Update broken selectors**

Run `rg -n "journey-guide|Journey" e2e`. Replace `.journey-guide` assertions with `.journey-strip` equivalents; the rail button name `'Journey'` becomes `'Read'`. Where a spec asserted the right panel defaults to the guide, assert the evidence inspector instead.

- [ ] **Step 2: Write the new journey spec**

```ts
// e2e/epps-journey.spec.ts
import { expect, test } from '@playwright/test';
import { freshApp, rail } from './helpers';

test('journey strip shows nine stages and drives navigation', async ({ page }) => {
  await freshApp(page);
  const strip = page.getByRole('navigation', { name: 'Rewrite journey' });
  await expect(strip.locator('.js-stage')).toHaveCount(9);
  await strip.getByRole('button', { name: /Game plan/ }).click();
  await expect(page.locator('.right-context')).toContainText(/game plan/i);
});

test('read mode locks editing and marks flow to notes', async ({ page }) => {
  await freshApp(page);
  await rail(page, 'Read').click();
  await expect(page.getByText(/Reading — editing is off/i)).toBeVisible();
  await expect(page.locator('.ProseMirror[contenteditable="false"]')).toBeVisible();
  await page.locator('.sp-page .ProseMirror p').first().click();
  await page.keyboard.press('g');
  await expect(page.locator('.sp-mark-great')).toHaveCount(1);
  await page.getByRole('button', { name: 'Pause read' }).click();
  await page.locator('.journey-strip').getByRole('button', { name: /Notes/ }).click();
  await expect(page.getByText('Your private read')).toBeVisible();
  await expect(page.locator('.ni-you-note')).toContainText('1');
});

test('notes intake caps at five readers and quarantines remedies', async ({ page }) => {
  await freshApp(page);
  await page.locator('.journey-strip').getByRole('button', { name: /Notes/ }).click();
  await expect(page.locator('.ni-reader-slot')).toHaveCount(5);
  await expect(page.getByText(/Ask permission before recording/)).toBeVisible();
});
```

(Adjust `contenteditable` and `.sp-page .ProseMirror p` selectors to what `e2e/helpers.ts` already uses for the editor; the reader-add flow uses `window.prompt`, so cover it with `page.on('dialog')` or drive `addReader` via the UI once Task 9's prompt is replaced by an inline input — if `window.prompt` proves untestable, replace it with an inline input field in `NotesIntake` as part of this task.)

- [ ] **Step 3: Full verification (required before claiming done)**

```bash
cd /Users/quantumcode/CODE/REWRITING-GAUNTLET
npm run test && npm run typecheck && npm run e2e
```

Expected: all green, including the existing a11y specs (`a11y.spec.ts` runs axe — the new strip/palette/intake must pass; fix contrast or aria issues it finds).

- [ ] **Step 4: Launch and capture proof**

```bash
cd /Users/quantumcode/CODE/REWRITING-GAUNTLET
lsof -i:5213 -t | xargs -r kill; npm run dev
```

Confirm http://127.0.0.1:5213 loads. Capture Day + Night screenshots of: the strip, read mode with marks, the notes intake, the pinned What worked. Save to `docs/proof/2026-07-15-epps-journey/`. Show Billy the URL and the screenshots.

- [ ] **Step 5: Commit**

```bash
git add e2e docs/proof
git commit -m "test: e2e coverage for journey strip, read mode, notes intake + proof pack"
```

---

## Self-review notes

- **Spec coverage:** Delta 1 → Tasks 1-4; Delta 2 → Task 5; Delta 3 → Tasks 6-8; Delta 4 → Task 9; whatWorked pinning → Task 10. Amendment 1 (Polish stage) → Task 1; Amendment 2 (Studio Extension labels) → Tasks 1 (order note), 8 (read-mode chip); Amendment 3 (paper path) → Task 8 print button + print CSS; Amendment 4 (You lane separate, never a reader slot) → Tasks 6, 9; Amendment 5 (copy fixes: 3-reader floor, consent nudge, subtle timer) → Tasks 2, 8, 9. Post-session tagging → Task 9 (`ni.tagLater`, tagging UI on stored notes, recording stubbed).
- **Deliberately out of scope (next handoff):** the Organize stage's cross-reader pattern detection, live transcription, audio capture. The `ni.recordTodo` string and disabled Record button mark the seam.
- **Known adaptation points** (implementer must verify against the live file, listed in-task): semantic border token names (Task 3/5), `annotationPlugin` element-id traversal (Task 7), element text property name (Task 10), editor selectors in e2e (Task 11), `window.prompt` replacement if untestable (Task 11).
