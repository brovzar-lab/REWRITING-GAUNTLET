# Format Fidelity Pass — proof (2026-07-13)

Captured by `scripts/proof-format.mjs` at 1400×900 against the dev server on
:5213. Regenerate: `node scripts/proof-format.mjs`.

1. `01-import-menu.png` — the import menu with every choice, including the new
   "Open PDF (best effort)" option carrying its ".pdf · Text-based PDFs only.
   Formatting may be imperfect." caveat.
2. `02-pdf-best-effort-warning.png` — a PDF imported: the text was extracted and
   previewed, with the honest warning ("Best effort… This is not Final Draft
   fidelity.") and the EXT-labeled Format picker above the import button.

FDX validation artifacts live in `docs/validation/` (two exported `.fdx` files
plus the manual open-in-Final-Draft checklist and results template).
docFormat round-trip (Fountain boneyard comment / FDX XML comment, never on a
page) is covered by `src/io/docformat.test.ts`.
