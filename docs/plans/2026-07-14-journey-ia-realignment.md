# Journey / IA Realignment — WriterDuet-informed rewriting workstation

> **Status: DRAFT — awaiting Billy's approval. Do not code until approved.**
> Planning deliverable only. Borrows WriterDuet's mature *structure*, not its
> visuals or branding. The approved Rewrite Studio visual language (tokens,
> Day/Night themes, Courier page, amber accent, colored board cards) is kept.

## 0. Scope and non-negotiables carried in

- App at `/Users/quantumcode/CODE/REWRITING-GAUNTLET`, port 5213, host
  127.0.0.1, strictPort. One repo, one editor. Test-first, no dead UI.
- The **direct-manipulation law stays**: Scene Point edited on the card, set-up
  / pay-off marked on the line, high points set on the card. Panels are for
  deeper detail. No floating popovers on the board.
- **Every existing Epps tool keeps working**: Game Plan + Compass, Scene Point,
  Set-Up / Pay-off map, Four High Points + momentum, pass workspaces, Polish
  Read, TV adapter, the AI-behind-private-read gate, the no-numeric-score rule.
- Screenplay formatting stays honest — no rich-text controls that break the
  Fountain/FDX round-trip. Canonical model (never rendered HTML) stays the
  source of truth. Pagination engine untouched.
- Local-first. A project workspace, not a cloud account system.
- Day and Night both work at every step. WCAG 2.1 AA maintained.

---

## 1. Diagnosis of the current IA problem

The app renders **every surface at once**, with the wrong things holding the
prime real estate:

- **Middle region today:** `[SceneNavigator | ScreenplayEditor + StatusBar |
  Board (side) | InspectorTabs]`, with `WorkflowStrip` (7 steps) as a thin
  strip on top and `PassTray` (11 passes) pinned to the bottom.
- **Import/Open** is a small top-bar button, not a first step.
- **The scene list owns the prime left column** by default, even though it is
  navigation, not the journey.
- **Rewrite passes are buried at the bottom** in the tray, yet they drive the
  work.
- **The board sits between the script and the inspector**, so the "what do I do
  now" guidance (the Rewrite-pass inspector tab) is pushed to the far right and
  split from the script — the "split-brain" layout.
- **The draft-to-polish journey is present but timid** (a thin strip) and does
  not reveal the right tools per stage; the writer sees all tools always, which
  reads as "throwing darts at a wall."

Root cause: the layout is **panel-first** (show all panels), not
**workspace-first** (show the one workspace the current step needs).

---

## 2. WriterDuet-informed principles (adopted, not cloned)

1. **The screenplay editor is always the center.** Everything else is
   supporting furniture that comes and goes around it.
2. **The left rail is a workspace switcher, and it starts with Project** — not
   Scenes. Scenes is a tool you open, not the permanent left column.
3. **The right panel is contextual** — it shows the one workflow for the current
   state, not every workflow at once.
4. **A top app-menu + a professional toolbar** carry document and formatting
   actions, so the working surfaces stay uncluttered.
5. **Layouts are first-class** — a small set of named layout modes, not a
   free-for-all of floating panels.
6. **A project is a container of documents** (script, private pad, notes, title
   page, snapshots), opened/imported/exported as a unit.

Adopted with Rewrite Studio's own spine: the **Epps draft-to-polish journey**
is the backbone that WriterDuet does not have. We keep it and make it the
right-panel "what do I do next" guide.

---

## 3. Proposed new layout

```
┌───────────────────────────────────────────────────────────────────────────┐
│  App menu:  File   Edit   View   Format   Revisions   Production   Help      │  ← top menu bar (new)
│  Toolbar:  ↶ ↷  [Element ▾]  ⌕ Find  ⛃ Filter  ⇥ Go to page   |             │  ← editor toolbar (evolved)
│            Page ⇔ Board   − 100% +   Revision ▸   ◧ Notes   Export   Layout ▾ │
├──────┬───────────────────────┬──────────────────────────┬───────────────────┤
│ Rail │  Active LEFT panel     │   CENTER: Screenplay      │  RIGHT context    │
│ ▣ Prj│  (Project / Scenes /   │   editor  (always the     │  panel            │
│ ⚑ Jrn│   collapsed)           │   main object)            │  (Journey /       │
│ ☰ Scn│                        │                           │   Pass workspace /│
│ ▦ Brd│                        │                           │   Evidence /      │
│ ✎ Evd│                        │                           │   Game Plan)      │
│ ◎ Pln│                        │                           │                   │
│ ⟳ Pass│                       │                           │                   │
│ ✦ Pol│                        │                           │                   │
│ ⧗ His│                        │                           │                   │
│ ▤ Lay│                        │                           │                   │
└──────┴───────────────────────┴──────────────────────────┴───────────────────┘
```

- **Left workspace rail**: a slim vertical icon+label rail (the router).
- **Active left panel**: filled only when the selected rail item is a
  *left-panel* workspace (Project, Scenes). Collapsible; can be zero-width.
- **Center**: the screenplay editor, always — except Board mode, where the
  board takes the center or splits with the script.
- **Right context panel**: the one contextual workflow for the current state
  (Journey guide by default; Pass workspace in Rewrite mode; Evidence on
  selection; Game Plan when chosen).

The board is **a mode**, reached from the rail (▦ Board) or the toolbar
(Page ⇔ Board). It is never permanently wedged between script and guidance.

---

## 4. Default app state (first open)

- **Left rail active:** Project (▣).
- **Left panel:** Project — Open Project, Import, Open Recent, Current Draft,
  Export, New Project, save status.
- **Center:** the screenplay editor if a script is loaded; otherwise an empty
  **"Open or import a script"** state with two big actions (Open / Import) and a
  one-line "or start from the sample."
- **Right panel:** the **Start here** Journey guide — the 9-step checklist with
  step 1 (Open/Import) highlighted and "what to do next" copy.

The very first thing a writer sees is **how to get a script in**, then **the
path from there**. Not a wall of tools.

The 9-step journey shown in the guide:
1. Open or import a script
2. Private annotated read
3. Game Plan
4. Choose a rewrite pass
5. Diagnose
6. Review proposals
7. Complete pass
8. Polish read
9. Export

(These collapse into the compact 6-stage spine — Open, Read, Game Plan,
Rewrite, Polish, Export — for the always-visible strip; Diagnose/Review/Complete
are sub-steps inside Rewrite.)

---

## 5. Left rail inventory

Each rail item is a **router** that drives a specific region. This table is the
contract that keeps the rail from becoming "everything at once."

| Rail item | Drives | What it shows | Reuses |
|---|---|---|---|
| ▣ **Project** | Left panel | Documents, Open, Import, Recent, Current Draft, Export, New Project, save status | ImportDialog, ExportMenu, new Project model |
| ⚑ **Journey** | Right panel | The 9-step "what do I do next" checklist with current/next | evolves `WorkflowStrip` |
| ☰ **Scenes** | Left panel | Searchable scene navigator (collapsible; not default) | `SceneNavigator` + new search |
| ▦ **Board** | Center **mode** | Board takes center or splits with script; cards direct-edit | `Board`, `StructureView` |
| ✎ **Evidence / Notes** | Right panel | Evidence for the selected line/finding; margin notes | `EvidenceInspector` |
| ◎ **Game Plan** | Right panel | Game Plan + Compass form | `GamePlanPanel` |
| ⟳ **Rewrite Passes** | Top strip + right panel | 11-pass strip + active pass workspace | `PassTray` → strip, `PassWorkspace` |
| ✦ **Polish** | Center **mode** | Starts / resumes the Polish Read page walk | `PolishReadBar` |
| ⧗ **History** | Dialog/panel | Snapshots, restore, imported drafts | `HistoryDialog` |
| ▤ **Layouts** | Menu | Pick a layout mode (below) | new |

Rail is icon + label; the active item is highlighted (amber). Only **one left
panel** and **one right panel** are populated at a time — that is the anti-
overwhelm rule.

**Layout modes (few, per Billy):**
- **Workbench (default):** rail + left panel (collapsible) + script + right
  context panel.
- **Focus:** script only (+ compact journey strip); rail and panels hidden.
- **Board:** board center/split; script ribbon; right structural panel.
- **Script + Notes:** script + evidence/notes; no board, no rail panel.

---

## 6. Top menu + toolbar inventory

Fewer menus than WriterDuet; **every item maps to a real action or is omitted**
(no dead menu entries).

**Top app menu bar**

- **File:** New Project · Open Project · Open Recent · Save (auto; shows state) ·
  Import (Fountain / FDX / PDF best-effort) · Export (Fountain / FDX) · Quick
  Export PDF (print view) · Print.
- **Edit:** Undo · Redo · Find · Filter *(phase 2)* · Go to page.
- **View:** Page view · Board view · Focus mode · Page breaks (always on;
  informational) · Text size / Zoom · Day / Night / System · Layout ▸.
- **Format:** Element (Scene Heading / Action / Character / Parenthetical /
  Dialogue / Transition) · Dual dialogue *(deferred, needs schema work — listed
  as "coming")* · Read-only. (No font/margin controls — pagination is fixed and
  honest.)
- **Revisions:** Start / end revision set · Choose color · Snapshot · History ·
  Restore. (Accept/Reject already happens per-approval in the pass workspace.)
- **Production:** Scene numbers (on) · (MORE)/(CONT'D) (on) · docFormat
  (Feature / One-hour / Half-hour, Studio Extension). Header/footer &
  watermarks *(deferred)*.
- **Help:** Journey guide · What is a rewrite pass? · Keyboard shortcuts ·
  About.

Anything marked *(deferred)* is **not shown** until built (no dead UI); it is
listed here only so the menu structure has room to grow.

**Editor toolbar** (evolves current `EditorToolbar`)

Undo · Redo · Element selector · **Find** · Filter *(phase 2)* · Go to page ·
**Page ⇔ Board toggle** · Zoom − / % / + · Revision set · **Notes / Evidence
toggle** · Export · **Layout selector**. Existing: undo/redo, element, zoom,
go-to-page. New: Find, Page/Board toggle (from full-board), Notes toggle,
Layout selector.

---

## 7. Right panel behavior by selected workspace

The right panel shows exactly one thing, chosen by (in priority order): an
explicit rail selection, else the current journey stage, else selection.

| State | Right panel shows |
|---|---|
| Fresh / no script | **Start here** journey guide |
| Private Read active | Read controls + "mark notes as you read" |
| Game Plan selected | Game Plan + Compass form |
| A pass is active (Rewrite) | **Pass workspace**: objective · what to inspect · required action · **Diagnose** · proposal queue · **Complete pass** · next recommended step |
| A line/finding selected | **Evidence / Notes** for that line (writer notes vs AI findings kept separate) |
| Board mode | structural panel (Set-Up/Pay-off map, Four High Points) |
| Nothing special | Journey guide (compact) |

The pass workspace is the answer to "what do I do next" and it sits **beside the
script**, never behind the board.

---

## 8. Rewrite journey flow, import to export

1. **Open/Import** (Project panel) → script loads in the center; journey advances
   to step 2. Empty state disappears.
2. **Private Read** (rail ⚑ or the guide's primary action) → guided scene walk;
   margin notes; AI stays sealed. Completion unlocks diagnosis.
3. **Game Plan** (rail ◎) → statement of intent, compass, pass priorities.
4. **Choose a rewrite pass** (rail ⟳ → top pass strip) → picks a lens; right
   panel becomes that pass's workspace.
5. **Diagnose** → local analyzer (or cloud, behind consent) produces findings
   with citations.
6. **Review proposals** → approve/reject; approvals apply under a revision set
   with provenance.
7. **Complete pass** → snapshot + summary + recommended next pass. Passes repeat/
   reorder/skip freely (soft guidance, not hard locks).
8. **Polish read** (rail ✦) → cover-to-cover page walk; doubled-word check;
   export-readiness.
9. **Export** (Project panel / File menu) → Fountain / FDX / PDF, approved
   changes only, docFormat preserved.

Soft guidance throughout: the guide shows current + recommended-next + done
checks, but the writer can jump anywhere. The **one real lock stays**: AI
diagnosis sealed until the private read is complete.

---

## 9. What moves, hides, collapses, or is removed

- **Scene list:** MOVED from the permanent left column to the **Scenes rail
  workspace** (collapsible left panel) + gains search. No longer default.
- **Rewrite passes (bottom tray):** MOVED up to a **top pass strip** (in Rewrite
  mode) + a **Rewrite Passes rail workspace**. The bottom tray is **removed**;
  its live status (revision set, resolved count, save) becomes a **thin status
  strip** under the editor.
- **Board:** CHANGED from an always-on side column to a **mode** (rail ▦ /
  toolbar toggle). Full board stays. Direct-manipulation card editing unchanged.
- **`WorkflowStrip`:** EVOLVED into the **Journey right-panel guide** plus a
  compact always-visible spine.
- **`TopBar`:** SPLIT into the **top app-menu bar** (File/Edit/View/…) and the
  **editor toolbar**; import/export/history move under File/Revisions.
- **Inspector tabs (Evidence / Rewrite pass / Game plan):** their content is
  RE-ROUTED to the right context panel driven by the rail/state, instead of a
  fixed three-tab strip. Same components, new routing.
- **Dialogs** (Import, Export, History, AI settings, Print, Pass summary):
  KEPT, now launched from the menu/Project panel.

---

## 10. What stays exactly as-is

- The **screenplay editor** (ProseMirror), **pagination engine**, element
  cycling, revision marks, smart-type, keyboard flow (Tab/Enter/Escape).
- The **canonical screenplay model** and every methodology model
  (`gameplan.ts`, `scenepoint.ts`, `markers.ts`), the store actions, and
  **Dexie persistence** (project model is additive; documents/ui/baselines/
  snapshots/workflow rows unchanged in shape).
- **All Epps methodology tools and their direct-manipulation interactions**:
  Scene Point in-card editor, Set-Up/Pay-off line marking + map, High points on
  cards + momentum, pass workspaces, Polish Read, TV adapter, analyzer lenses.
- The **AI provider boundary and the private-read gate**; no numeric score; no
  one-shot rewrite; approvals-only full-draft assembly.
- The **token system and Day/Night/System themes**; the Page Rule (paper never
  themed); the Meaning Rule (never color alone); i18n EN+ES parity.
- **IO round-trip** (Fountain/FDX/PDF) and the FDX validation workflow.

---

## 11. Acceptance tests (what the build must prove)

New/changed browser (Playwright) tests:

1. **First open shows Open / Import / New Project** front and center (Project
   panel + empty-state actions), and the scene list is **not** the default left
   panel.
2. **Script stays visually central** in Workbench and Rewrite modes (editor
   occupies the center column at desktop width).
3. **Rewrite passes are reachable in ≤ 1 action** from the default state (rail
   ⟳ or the pass strip), and are no longer at the bottom.
4. **Active pass tells the writer what to do**: selecting a pass shows objective
   + what-to-inspect + Diagnose + queue + Complete + next, in the right panel
   beside the script.
5. **Board is a mode**: it is not present between script and guidance in the
   default layout; entering Board mode shows the board; exiting returns to the
   script; full board still works.
6. **Import/Export live in the project/File workflow** and still round-trip
   (existing IO tests stay green; a new test opens Project → Import → script
   loads).
7. **Direct manipulation intact**: Scene Point still edited on the card, set-up/
   pay-off on the line, high point on the card (existing tests kept, re-pointed
   to new containers as needed).
8. **Journey guide reveals stage tools**: the right panel changes with the
   stage; not every tool is shown at once.
9. **Day and Night parity** and **axe-clean** on the new shell (both themes).
10. **All prior unit + e2e suites stay green** (selectors updated where the
    shell moved; no behavior removed).

Unit tests: project model (create/open/add document/save-status), rail router
state, layout-mode switching, right-panel resolution by state, find.

Baseline to preserve/extend: **349 unit / 58 Playwright / build exit 0.**

---

## 12. Proof screenshots required after implementation (`docs/proof/ia/`)

1. `01-first-open-project.png` — default state: Project panel + empty "Open or
   import" center + Start-here guide (Night).
2. `01b-first-open-day.png` — Day twin.
3. `02-script-loaded-workbench.png` — script center, journey guide right, rail
   on Project/Journey.
4. `03-rewrite-pass-active.png` — pass strip up top, pass workspace beside the
   script (objective/Diagnose/queue/Complete/next).
5. `04-board-mode.png` — board as a mode with the script ribbon; maps on the
   right; a card being edited in place.
6. `05-scenes-workspace.png` — Scenes opened from the rail as a searchable
   panel (not the default column).
7. `06-project-panel.png` — documents, import/export, recent, new project, save
   status.
8. `07-layout-focus.png` — Focus layout (script only) to show layouts work.

---

## Proposed phasing (demonstrable vertical slices, TDD, one `ia MN:` commit each)

Not one of Billy's 12 sections, but the repo's build discipline requires
demonstrable slices. Suggested order (each ends green + proof + a stop-point):

- **IA-1 Shell**: top menu bar + left workspace rail + right context panel
  scaffold + Layout modes plumbing. Route existing panels into the new regions
  with zero feature change. Journey guide replaces the thin strip.
- **IA-2 Project model**: local-first project + documents (script, private pad,
  notes, title page), Project panel, Open/Import/Recent/New/Export/save status;
  empty "Open or import" center state.
- **IA-3 Scenes demotion**: scene navigator becomes a rail workspace with
  search; no longer the default left column.
- **IA-4 Passes promotion**: top pass strip + Rewrite Passes workspace; pass
  workspace in the right panel; bottom tray → thin status strip.
- **IA-5 Board as a mode**: board leaves the permanent side; center/split mode;
  direct-manipulation preserved; full board kept.
- **IA-6 Toolbar + Find + Layouts finish**: professional toolbar, Find, Notes/
  Evidence toggle, layout selector; Day/Night + axe parity.
- **IA-7 Regression + journey e2e + proof pack + handoff.**

Billy reviews after IA-1 (the shell) before the rest, because it is the biggest
structural change; then it can run through IA-7.

## Risks and mitigations

1. **Large shell refactor touches many e2e selectors.** Mitigation: IA-1 keeps
   every feature working and only re-homes panels; tests are re-pointed slice by
   slice, suites green before each commit (same discipline as prior passes).
2. **Rail could re-introduce overwhelm.** Mitigation: strict "one left panel +
   one right panel at a time" rule; icons with labels; sensible defaults per
   stage; Focus layout for minimalists.
3. **Project model vs existing single-doc persistence.** Mitigation: additive —
   the existing screenplay stays the canonical "script document"; project is a
   thin container with a documents list; snapshots become imported drafts.
   Migration test loads a pre-project save and loses nothing.
4. **Direct-manipulation regressions when panels move.** Mitigation: the card/
   line interactions are unchanged components; their tests are kept and re-
   pointed, not rewritten.
5. **Scope.** Mitigation: features Billy listed that need real new subsystems
   (Filter, dual dialogue, headers/footers/watermarks, mind-map view) are
   **deferred and not shown** — no dead UI — and listed as "coming" only in this
   plan.

## How Billy tests it after the build

Open http://127.0.0.1:5213 fresh: you should see Open / Import / New Project and
a Start-here guide, not a wall of tools. Import a script, follow the guide left-
to-right and top-to-bottom, run a pass (the right panel tells you what to do),
open Board mode for structure work, run the Polish Read, export. At each step,
only the tools for that step should be prominent.
