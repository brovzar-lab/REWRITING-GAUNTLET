# Handoff: Epps Rewrite Journey — Minimal Cleanup (Turn 3 / options 3a + 3b)

## Overview
Targeted UX cleanup for the REWRITING-GAUNTLET app (Rewrite Studio), applying the methodology from **Jack Epps Jr.'s "Screenwriting is Rewriting"**. Three changes only, everything else in the existing app stays as-is:

1. **Journey strip** — a horizontal 8-stage pipeline bar (Script → Private Read → Notes → Organize → Interpret → Game Plan → Passes → Let Go) inserted under the toolbar. It REPLACES the "What to do next" right panel. It is the always-visible orientation system ("you are here") — the antidote to the Circle of Confusion.
2. **Grouped left rail** — keep all existing rail items and icons, but group them under two tiny labels: "JOURNEY" (Project, Read, Evidence, Game plan, Passes, Polish — in Epps order top-to-bottom) and "STUDIO" (Scenes, Board, History, Layouts). Rename "Journey" item → "Read" only.
3. **Private Read mode** (design ref 3a) and **Notes intake screen** (design ref 3b) — detailed below.

## ⚠️ Guiding principle: "if it ain't broke, don't fix it"
The bundled HTML file is a **design reference created in HTML**, NOT production code. Recreate the deltas in the existing codebase (React + CSS custom properties per src/theme/tokens.css) using its established components and patterns. **Do not restyle, rename, move, or remove anything not listed in this README.** Specifically, keep intact:
- The full menu bar (File / Edit / View / Format / Revisions / Production / Help), EN/ES toggle, Appearance/Night selector, Saved indicator
- The full toolbar: Undo/Redo, element dropdown, Find, Go to page, Page/Board toggle, zoom, LAYOUT selector, REVISION SET controls, Notes, Export
- The project panel (Open Project, Import/Export, New Project, Documents, Recent)
- The bottom bar: page nav, Set-up / Pay-off / Add note
- All existing theme tokens, night palette, cream paper (#F8F1DF), amber accent (#DCA52E)
- All existing routes/panels not mentioned here (Board, Scenes, History, Layouts, etc.)

## Fidelity
**High-fidelity.** Colors, spacing, and type below are exact; match them using existing tokens where a token already holds the same value (they mostly do — the mock was built from src/theme/tokens.css).

## Design tokens used (all pre-existing in the app)
- Chrome surfaces: #111A21 (app bg), #141E26 (bars), #17232C (panels), #0D141A / #070B0F (desk behind paper; read mode uses the darker #070B0F)
- Borders: #34414A (hairline), #43525C (strong)
- Text: #E7E6E0 primary; rgba(231,230,224,.72/.55/.45) secondary/tertiary/faint
- Accent amber: #DCA52E; on-accent text #202321
- Paper: #F8F1DF; paper text #202321; paper shadow 0 1px 4px rgba(20,24,25,.14)
- Mark colors: Great stuff #4F8B62 · Cut? #C5534B · Dropped out #9A829F · Question #8DAFC1
- Fonts: Inter (UI), Courier Prime (script/paper)
- UI label style: 11px/600, letter-spacing .03em, uppercase; micro-labels 9-10px/700, letter-spacing .06-.08em

## Delta 1 — Journey strip (all screens)
36px tall bar, background #141E26, bottom border 1px #43525C, sits directly under the toolbar, full width. Content, left to right (8px side padding):
- One segment per stage: number (11px; amber #DCA52E + bold when active, rgba(231,230,224,.45) otherwise; green #4F8B62 "✓" replaces the number when complete) + stage name (11px/600 uppercase, .03em) + optional stat (10px faint: "p. 34/88", "2/5 readers", "0/12").
- Active segment: bold text + inset 0 -2px 0 #DCA52E underline. Complete segments: 55% opacity. Future segments: 70% opacity.
- "›" separators in rgba(231,230,224,.3).
- Right-aligned: one primary continue action, amber pill (11px/600, padding 4px 12px, radius 4px, bg #DCA52E, text #202321) — label is contextual: "Resume read at p. 34", "+ Add reader", etc.
- Clicking a stage navigates to it. Stages are never locked, just visually de-emphasized.
- Stage names: Script, Private Read, Notes, Organize, Interpret, Game Plan, Passes, Let Go.
- REMOVE the "What to do next" right panel; the strip supersedes it.

## Delta 2 — Grouped rail
Same 64px rail, same icons/items. Add two section micro-labels (8px/700, .08em, rgba(231,230,224,.4)): "JOURNEY" above Project/Read/Evidence/Game plan/Passes/Polish; a 1px #34414A divider (36px wide, 6px vertical margin); "STUDIO" above Scenes/Board/History/Layouts. Active item: bg rgba(220,165,46,.16) + 2px left border #DCA52E. Rename "Journey" → "Read".

## Delta 3 — Private Read mode (ref: option 3a in the HTML)
Entered from Journey strip stage 2. A ritual, not a feature — single sitting, editing disabled. Chrome behavior:
- Menu bar: unchanged.
- Toolbar swaps content while reading: left, a lock chip (bg rgba(220,165,46,.16), 1px #DCA52E border, radius 4px, "🔒 READING — EDITING IS OFF" 11px/700 uppercase amber) + helper text "one sitting · your marks stay private" (11px, .55 alpha). Center-right: "Sitting: 41 min" timer. The normal tools (Undo, Find, Layout, Revision set, Notes, Export) remain visible but at 35% opacity, non-interactive. Far right: "Pause read" (outline button) and "Finish sitting" (amber primary).
- Journey strip stays; stage 2 active with live page count.
- Desk behind paper darkens to #070B0F ("lights down"); paper widens to 680px, shadow deepens to 0 10px 30px rgba(0,0,0,.5).
- Bottom bar: page ‹ › nav, "Page 34 of 88", 140×3px amber progress bar, right side "18 marks so far · they'll be waiting in Notes". The Set-up/Pay-off/Add-note buttons are hidden during read.

### Marks (the margin-pencil vocabulary)
Floating palette, vertically centered at right edge (18px inset): panel bg #17232C, 1px #34414A, radius 6px, padding 8px, shadow 0 10px 30px rgba(12,18,22,.28). Header "MARK" 9px/700 uppercase centered. Four rows (padding 6px 10px, radius 4px, 1px border in the mark color at .6 alpha): 10px color square + label 11px/600 + keyboard hint (G / X / D / ?) 9px faint. Footer "select text, press a key" 9px centered.

Interaction: select script text, press key or click a mark row. Rendering on paper:
- Great stuff: highlight bg rgba(143,165,132,.28) + rotated(-2deg) margin tag "GREAT STUFF" (10px/700 .05em, color+1.5px border #4F8B62, radius 3px, padding 1px 5px, positioned in right margin)
- Cut?: line-through (rgba(197,83,75,.7), 1.5px) + body text dimmed to rgba(32,35,33,.75) + margin tag "CUT?" #C5534B rotated 1.5deg
- Dropped out: 2px dotted bottom border rgba(154,130,159,.9) + margin tag "DROPPED OUT" #9A829F rotated -1deg
- Question: (same pattern, #8DAFC1)
Marks persist and flow into the Notes stage as a "You" reader. Editing is truly disabled (no caret, no typing) for the whole sitting.

## Delta 4 — Notes intake screen (ref: option 3b)
Stage 3 of the journey. Menu bar, rail, journey strip, bottom bar all standard (strip shows "3 · NOTES · 2/5 readers" active; continue action "+ Add reader"). Main area (bg #0D141A, padding 20px 22px, column gap 16px):

1. **Header row**: "Reader Notes" 16px/650 + "up to five readers you trust · capture everything, judge nothing yet" 11.5px faint.
2. **Reader row**: 5-column grid, 10px gap. Filled reader card: bg #17232C, 1px #34414A, radius 6px, padding 12px 14px — 26px circle avatar with initials (bg = a mark color, text #0D141A 11px/700), name 12.5px/600, role line 10px faint ("director · read Draft 2"), chip row (10px, 1px #34414A border, 99px radius: "🎙 62 min", "transcribed ✓" in green), stat line 11px ("31 notes · 6 what-worked"). A recording card shows an amber "● recording…" chip. Empty slots: 1px dashed #34414A, centered "+ Reader N" 11.5px faint. Hard cap of five (Epps).
3. **Two-pane body** (grid 1fr / 340px, gap 14px):
   - **Session pane** (bg #17232C, 1px #34414A, radius 6px): header row with pulsing red dot (8px, #C5534B, 3px rgba halo), "Session with Rodrigo D." 12px/650, "recording 00:23:41 · transcribing live" 10.5px faint, Pause / End session outline buttons. Body: live transcript rows, grid [52px timestamp | text | tag]: timestamp 10px faint, quote 12px/1.5 at .85 alpha. Tags are pills 9.5px/600, 99px radius: symptom notes get a blue outline pill ("note · motivation" #8DAFC1); reader-suggested fixes get a purple pill labeled "their remedy — kept separate" (#9A829F) — the doctor/patient rule: store the symptom, quarantine the remedy; praise gets a filled green pill "★ what worked". Footer: ghost text input "Type a note yourself — or just let the recording run…" + green outline button "★ Mark as 'what worked'".
   - **What worked pane** — visually protected: bg rgba(79,139,98,.08), 1px rgba(79,139,98,.45) border, radius 6px. Header "★ What worked" 12px/700 #7FB08D + "Protected. This is what you must not break in the rewrite." 10.5px. Items are small cream paper cards (bg #F8F1DF, radius 2px, padding 9px 11px, paper shadow, Courier Prime 11.5px/1.4 #202321) with attribution line 9.5px Inter faint ("Rodrigo · 23:40"). Footer: "8 items · pinned through every stage ahead". This list follows the writer into Organize/Interpret/Game Plan/Passes.
4. **Bottom bar** variant: left "Stage 3 · Reader Notes" + "2 of 5 readers in · 49 notes gathered"; right the touchstone "◈ the mural under the white paint" (11px faint).

## Interactions & state
- journeyStage: 1-8, persisted per project; stage completion derives from data (read finished, ≥1 reader ingested, etc.), never blocks navigation.
- readSession: { active, startedAt, pageReached, marks[] } — marks: { type: great|cut|dropped|question, range, page, optional note }. Editing lock is global while active; pause preserves position (single-sitting is encouraged by the timer, not enforced).
- readers[] (max 5): { name, role, draftRead, audio?, transcriptStatus, notes[] }. Note: { quote, timestamp|page, kind: symptom|remedy|whatWorked, category? }. Remedies are stored linked to their symptom but visually quarantined.
- whatWorked[] renders in every later stage (pinned).
- Recording uses the platform's existing audio capture if present; otherwise stub the UI and mark transcription as a TODO integration.

## Assets
None new. Existing icon set, Inter + Courier Prime already in the app. The 🔒 / 🎙 / ★ glyphs in the mock can be replaced with the app's icon system.

## Files
- `Rewrite Studio Redesign.dc.html` — design reference. Turn/section "3" (ids 3a, 3b) is the approved target; section "2" (2a, 2b) shows the same chrome deltas on the project screen; section "1" is exploration history — ignore except 1c (origin of the read-mode palette).
