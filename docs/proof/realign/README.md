# Visual + UX Realignment — proof pack (2026-07-12)

Captured by `scripts/proof-realign.mjs` at 1600×900 against the dev server on
port 5213. Regenerate any time with:

```
cd /Users/quantumcode/CODE/REWRITING-GAUNTLET && node scripts/proof-realign.mjs
```

## The shots

1. `01-night-workspace.png` — The full room in Night mode on the sample script:
   board docked beside the page, Character pass active with its tray control
   surface, a line selected, journey strip on top. The north-star comparison shot.
2. `02-day-workspace.png` — The identical state in Day mode: same hierarchy,
   blue accent, same seams. The screenplay paper never changes (Page Rule).
3. `03-line-board-evidence-link.png` — A line with a note: margin marker on the
   line, its scene card outlined on the board, and the note card in the
   inspector visibly joined to the selection.
4. `04-pass-tray-open.png` — The active-pass detail band: Focus, Goals, Notes,
   Status with progress, and Open pass.
5. `05-evidence-panel.png` — A structured Rewrite Concern card: numbered,
   severity chip, Suggestion, Example rewrite, Current, Source, Linked to with
   Go to script, Reject/Approve.
6. `06-import-menu.png` — The two-step import menu.
7. `07-annotated-read.png` — The guided private annotated read with a margin
   note saved; AI diagnosis stays locked until this read is complete.

## Honest differences from the approved mockup (deliberate, no dead UI)

- No Outline / Beats / Relationships board tabs — no backing features yet;
  deferred to the backlog rather than shipping dead controls.
- No board minimap or filter — same reason.
- No pass "v2" multi-run versions — the model stores one run state per pass;
  multi-run versioning is deferred.
- LINKED TO cites scene + slug by element identity, not a per-line "Line 7"
  reference — line numbers change with every edit; identity does not.
- Confidence renders only when a finding carries it. The local analyzer never
  fills it; only the cloud provider may.
- No bold/italic/underline in the editor toolbar — the screenplay schema has no
  text marks, and adding them would touch Fountain/FDX round-trip. The honest
  professional set is element type + undo/redo + zoom + page controls.
