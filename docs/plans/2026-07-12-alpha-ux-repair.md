# Alpha UX Repair Pass (2026-07-12)

Scope dictated by Billy after hands-on alpha testing. No new methodology features, no Slice 3. Same app, port 5213, host 127.0.0.1, strictPort, one repo one editor. All existing tests stay passing (selectors may adapt to the new UI, coverage may not shrink).

## Tasks

- **U1 Import experience.** Replace the developer-form dialog with an app-style chooser: Paste screenplay / Open Fountain file / Open Final Draft file, plus "PDF import is not available yet, paste the text instead." Chooser leads to a focused paste or file step with the same preview and snapshot-before-replace. It should feel like opening a script.
- **U2 Guided pass workspace.** Clicking a pass chip opens a pass workspace (inspector column switches to it automatically): pass objective, "what this pass examines" checklist, Diagnose, findings with approve/reject queue, progress (resolved/total, notes this pass), Complete pass, and the recommended next pass. The workspace change must be visible and testable.
- **U3 Screenplay-native annotation.** One obvious flow: select a line, an Add note affordance is always visible (editor status bar + inspector), type, save. Notes get an optional passId (stamped from the active pass). Scene navigator shows a per-scene note count badge; the pass workspace shows the note count for the current pass. Writer / reader / producer / AI sources stay visibly separated (existing chips).
- **U4 Pass completion summary.** Complete pass opens a summary: approved changes, rejected proposals, unresolved concerns, snapshot created (label), draft label updated, Export button, recommended next pass button.
- **U5 Screenplay working area.** The page is the center: centered page column with a desk backdrop, comfortable scroll padding, page shadow per DESIGN.md Paper Rest, stronger selected-line visibility, selection scrolls into view. No pagination changes.
- **U6 Snapshot history UI.** Top-bar History: list snapshots (label, time) for the current document, restore with a safety snapshot taken first, confirm step. Restores are already store-tested; this adds the visible UI.
- **U7 Usability e2e.** New Playwright spec: pass click changes the workspace; note count updates after annotating; completing a pass shows the summary; import menu exposes all choices; history UI reachable and restorable; screenplay page visually centered. Full regression + updated proof screenshots.

## Test discipline

TDD per task, commit at every green, axe stays clean on changed surfaces in both themes, EN/ES for all new strings, DESIGN.md tokens only.
