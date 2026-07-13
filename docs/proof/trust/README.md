# Trust & Testability Repair — proof pack (2026-07-12)

Captured by `scripts/proof-trust.mjs` at 1600×900 against the dev server on
port 5213. Regenerate any time with:

```
cd /Users/quantumcode/CODE/REWRITING-GAUNTLET && node scripts/proof-trust.mjs
```

## The shots

1. `01-page-break-night.png` / `02-page-break-day.png` — the repaired page
   boundary: full paper width in both themes, page number aligned, never a
   partial-width slab (it used to break inside split dialogue).
2. `03-approve-loop-proposal.png` — the shipped sample now produces a real
   approvable proposal (stray spacing it can cite), with Suggestion, Example
   rewrite, and Current text.
3. `04-approve-loop-applied.png` — after Approve under a Blue revision set:
   the change is in the draft, progress reads "1 of 2 proposals resolved",
   and the line carries a revision mark.
4. `05-reject-archived.png` — the second proposal rejected and archived
   visibly; the text stays untouched.
5. `06-narrow-900.png` — 900px window: paper's left edge and scene numbers
   fully visible, top bar wrapped, board legend present.
6. `07-zoom-140.png` — zoom raised: the page stays reachable and scrolls.

## What the sample's seeded flaws are (honest, citable)

- Two doubled spaces in action lines (Polish pass proposals).
- One misspelled character cue, CAMEN for CARMEN (Consistency pass proposal).
  Until fixed, the page-2 (CONT'D) honestly reads "CAMEN (CONT'D)".
