# HANDOFF — Rewrite Studio / REWRITING-GAUNTLET (2026-07-12)

## Where we left off

Rewrite Studio is a local-first web app that turns Jack Epps Jr.'s "Screenwriting Is Rewriting" into a working screenplay rewrite environment. Built and accepted so far:

- Slice 1 (tag `slice-1`): full workspace. Scene navigator, Final Draft-style editor (ProseMirror), tactile story board with connections, evidence inspector with source and claim labels, the 11 Epps passes tray, Day/Night/System themes, EN/ES interface, autosave to IndexedDB with reload recovery.
- Slice 2 (tag `slice-2`, accepted 2026-07-12): true pagination engine (55 body lines per page, headers never count, (MORE) / NAME (CONT'D) in plain ASCII), golden layout fixtures, 10-page sample script LAS GARZAS, zoom that never repaginates (Cmd+= / Cmd+- / Cmd+0), revision sets with margin asterisks and header labels, smart-type character completion, Cmd+1..6 element keys, Cmd+Up/Down scene jump, Cmd+G go-to-page, status bar.
- Verified green just before this handoff: 96 unit tests, 27 Playwright tests (including axe accessibility scans in both themes), production build exit 0, worktree clean.

Billy then said: no more small slices. The next work is one **End-to-End Alpha** so he can test the real product: import or paste a screenplay, do the private annotated read, add reader notes, run an Epps pass with an AI assistant that cites evidence, approve or reject each proposal, watch the draft update with provenance and revision marks, and export.

The alpha plan was written and committed: `docs/plans/2026-07-12-alpha-end-to-end.md` (11 tasks A1-A11). It was presented to Billy for approval as the last message of the session.

## Next action

Billy APPROVED the alpha plan on 2026-07-12 and ordered a continuous build (no micro-approvals, no stopping between tasks). Build `docs/plans/2026-07-12-alpha-end-to-end.md` tasks A1 through A11 with `superpowers:executing-plans`, committing at every green, until the full journey is testable: paste/import → private annotated read → notes → AI pass diagnosis (local analyzer default, cloud behind consent) → approve/reject → draft updates → export. Then produce the proof pack (URL, clean worktree, test counts, build result, a11y result, journey screenshots, Fountain-export diff showing approved-only changes, honest approximations list). Check `git log` for `Alpha A<n>` commits to see which tasks are already done before starting one.

## Locked decisions

- Plan-first workflow: Billy approves plans before code. For the alpha he approved continuous build after plan approval (no per-task check-ins).
- One repo, one editor: NO subagent-driven development here; helper agents read-only or in a separate git worktree.
- App lives at repo root `/Users/quantumcode/CODE/REWRITING-GAUNTLET`, port 5213, host `127.0.0.1`, strictPort. Port registry is `~/.Codex/dev-ports.md` (NOT ~/.claude/dev-ports.md; Billy's explicit rule 2026-07-12).
- Dependencies pinned exact (no ^). Only approved new dependency for the alpha: `fast-xml-parser@4.5.0`.
- Screenplay continuations are plain ASCII: `(MORE)` and `NAME (CONT'D)`. Never curly apostrophes anywhere (export compatibility). A test enforces this.
- 55 screenplay body lines per page; page headers are render artifacts that never count against it.
- Methodology invariants (store-level, tested): AI locked until annotated read complete; 3 recommended / 5 max initial readers, exactly 1 interim; claim labels + Clear/Uncertain/Priority Concern; NO numeric script score; no one-shot rewrites; AI can only touch scenes its finding cites; draft = approved changes only, with provenance.
- AI: provider-agnostic interface. Default local deterministic analyzer (offline, free). Optional cloud adapter (Anthropic, plain fetch, no SDK) behind a consent screen and Billy's own API key. No screenplay text leaves the machine without explicit consent.
- Approved design system in DESIGN.md / DESIGN.json is mandatory. Compact type, warm paper in both themes, no dashboards, no chatbot-first layout.
- Epps pass names and order are locked (Foundation, Character, Story and Theme, Structure, Plot, Complications Obstacles Reveals and Reversals, Relationship, Scene, Dialogue, Consistency, Polish). Studio additions are labeled "Studio extension", never attributed to the book.

## Open loops

1. **Alpha plan approval** — DONE 2026-07-12: approved verbatim, build continuously, local analyzer default (testable with no API key), cloud adapter strictly behind consent, "not another demo."
2. **The alpha build itself** (tasks A1-A11) — not started. Done when the journey e2e passes: paste script, annotated read, note, run pass, approve one / reject one, export contains only the approved change; plus proof pack in `docs/proof/alpha/`.
3. **FDX validation in real Final Draft** — deferred risk. Done when Billy round-trips one exported .fdx in his Final Draft copy during alpha testing.
4. **claude-goal repo location** — a separate tool repo (jthack/claude-goal) sits accidentally inside this repo at `claude-goal/` (gitignored, harmless). Billy's `~/.claude/settings.json` Stop hook and `~/.claude/skills/goal` symlink point INTO it, so it must not be deleted. Done when Billy decides: leave it, or approve moving it to `~/CODE/claude-goal` plus repointing the symlink and the hook path (agent was permission-blocked from doing this unilaterally).
5. **Deferred features list** (post-alpha): PDF text-extraction import, deeper Epps artifacts (Game Plan, Set-Up checklist, four high points, Scene Point, holdovers/orphans, Polish Read, Touchstone, Ticking Clock, slug file), TV pilot adapter (labeled Studio extension), co-writer mode, sync, revision paper tinting, per-approval undo.

## How to run and verify

```
cd /Users/quantumcode/CODE/REWRITING-GAUNTLET && npm run dev
```

- URL: http://localhost:5213 (also answers on http://127.0.0.1:5213; vite is pinned to IPv4 host 127.0.0.1).
- If the port is busy, it is usually our own previous server: `lsof -ti:5213 | xargs kill` then start again. Never move to another port.
- Tests: `npm test` (should be 96 passing), `npx playwright test` (27 passing, needs the port free or reuses the running server), `npm run build` (exit 0).
- Golden pagination fixtures: regenerate only after intentional engine changes with `node scripts/gen-goldens.mjs`, then hand-review the JSON diff.
- Proof screenshots: `node scripts/proof-shots.mjs` (slice 1) and `node scripts/proof-slice2.mjs` (slice 2) with the dev server running; slice-2 script also verifies reload persistence and wipes its demo edits afterward.

## Gotchas / context not on disk

- Billy dictates by voice; read messages charitably. Plain language, no em dashes, short ordered lists, one copy-paste terminal block starting with cd.
- Required reading before any product/design change: CLAUDE.md, PRODUCT.md, DESIGN.md, DESIGN.json, the Epps book PDF at /Users/quantumcode/Downloads/Screenwriting is Rewriting.pdf (searchable text: tmp/pdfs/screenwriting-is-rewriting.txt).
- The editor reserves Tab for element switching; Escape is the keyboard exit from the page (focuses the board's Full board button via [data-editor-exit]). Keep this when touching the editor; the a11y walkthrough test depends on it.
- Never focus ProseMirror's DOM directly (`.ProseMirror.focus()`); it resets the caret to the document start. Focus `.sp-page-scroller` instead, or use the view's own focus.
- ProseMirror widget decorations are cached by their `key`; the key must encode everything the widget renders (page number, MORE, CONT'D text, revision label) or stale DOM survives redraws.
- Element ids like `sc2-e5` are stable references used by evidence records, tests, and e2e. When editing `src/model/sample/gauntlet-sample.ts`, only append elements to scene ends (or insert before a trailing transition, whose id nothing references); never reorder existing elements within a scene.
- jsdom quirks already handled in tests: ResizeObserver is stubbed in `src/test/setup.ts`; parent refs attach after child layout effects (that is why the board connection layer uses useEffect).
- dnd-kit `useDraggable` spreads its own `aria-pressed`; set yours AFTER `{...attributes}` on cards.
- fake-indexeddb + Dexie tests use a real short debounce (5ms) and polling, not fake timers.
- Dexie schema is at version 2 (documents, ui, baselines). The alpha adds version 3 (snapshots, workflow, readers, findings, approvals per plan task A4).
- `npm ls playwright-core` must show a single deduped 1.48.2 (an override pins @axe-core/playwright's copy; do not remove it or typecheck breaks).
- The session ran as a background job; Codex (another agent Billy uses) sometimes inspects this repo. Keep the worktree clean between sessions.
