# Trust & Testability Repair Pass (approved by Billy 2026-07-12)

Source of truth: the /impeccable critique of the realigned workspace (combined LLM + detector
assessment, 27/40) and Billy's verbatim directive answering it. Not a redesign: the realigned
visual direction stays. One commit per task, prefix `trust TN:`, tests first where practical,
all existing suites stay green. App at repo root, port 5213, host 127.0.0.1, strictPort,
one repo one editor.

## Tasks

- **T1 Page break**: the screenplay page must never show a partial-width black bar inside the
  cream paper. Page breaks read as real page boundaries: full paper width, proper edge/shadow,
  correct in Day and Night. Test: gap spans ≥ paper width in both themes.
- **T2 Core loop demonstrable**: sample and/or local analyzer adjusted so the default journey
  shows Diagnose → finding → old/new proposal → approve → revision mark → provenance → export
  with the approved change. No faking: proposals must cite real script text. Test: ≥1 approvable
  proposal in the default alpha journey.
- **T3 Empty states**: a no-finding pass says what was checked ("Checked 16 scenes for … .
  Nothing citeable found."), EN+ES. Test asserts the copy.
- **T4 Responsive/zoom**: below 1100px and at 200% zoom the paper stays reachable and
  horizontally scrollable; scene numbers and selected lines don't clip; smart-type popup not cut
  off near the bottom; pass footer and top bar don't clip. Tests at narrow viewport.
- **T5 Comprehension leaks** (Billy's list, verbatim scope): History/Snapshots naming unified;
  no "0 of 0 proposals resolved" before diagnosis; revision dropdown must not imply an active
  Blue set before one starts; journey strip must not mark "Choose pass" complete while Private
  read is pending; line vs scene evidence labeled so "No evidence on this line" never sits above
  visible scene evidence unexplained; writer margin notes must not come back as "Unresolved
  hypothesis"; fix "1 notes"; define Epps terms (interim reader, unresolved hypothesis); board
  legend for connection lines and card colors. EN+ES for every string.
- **T6 Disabled/error states**: visible :disabled styling everywhere; raw technical errors become
  writer-readable messages with recovery steps. Tests.
- **T7 Regression + proof + handoff**: all suites green, build exit 0; fresh screenshots (fixed
  page break, full approve/reject loop, narrow/zoom proof); test counts; leave the app running
  and hand only the URL, or stop it and prove 5213 free; update HANDOFF.md.
