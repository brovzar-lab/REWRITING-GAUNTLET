# Claude Code Handoff: Build Rewrite Studio

## Mission

Continue the approved design and build Rewrite Studio, a complete professional application that operationalizes Jack Epps Jr.'s *Screenwriting Is Rewriting* for existing feature screenplays and television pilots.

This is a build assignment, but planning remains the first step. Do not begin implementation until you have read every required source, inspected the repository, written the implementation plan, and shown Billy the plan in plain language.

## Start here

Read `CLAUDE.md` first and follow it as the governing instruction file. Then read the approved product and visual artifacts it references. Inspect the repository and determine what is present rather than assuming an existing application.

## Current state

- The repository is pre-implementation.
- `PRODUCT.md` captures approved product strategy and design principles.
- `DESIGN.md` and `DESIGN.json` capture the approved hybrid Day and Night visual system.
- The book is at `/Users/quantumcode/Downloads/Screenwriting is Rewriting.pdf`.
- Searchable extracted book text is at `tmp/pdfs/screenwriting-is-rewriting.txt`.
- Visual direction: a serious cinematic editing-suite shell, Final Draft-familiar screenplay page, larger tactile spatial board, evidence inspector, and persistent rewrite-pass tray.

## Immediate assignment

1. Read and summarize the governing requirements without rewriting them.
2. Audit the extracted book methodology against the product requirements. Report only genuine gaps or contradictions.
3. Propose the technical stack and explain it in plain language. Favor a maintainable local-first desktop-quality web application with a future desktop wrapper, unless repository evidence supports something better.
4. Write a phased implementation plan with acceptance criteria, tests, dependencies, risks, and proof required for every phase.
5. Present the plan to Billy for approval.
6. After approval, build the first demonstrable vertical slice.

## First vertical slice

The first working slice must prove the approved product character rather than presenting a landing page. It should include:

- application shell in Day and Night modes
- scene navigator grouped by acts
- professionally formatted screenplay page with realistic content
- keyboard-based screenplay element switching
- tactile scene board with draggable cards and story connections
- selected screenplay line linked to its evidence and board card
- visible source and claim-type labels
- persistent rewrite-pass tray
- automatic local saving and reload recovery
- responsive behavior at laptop and large-desktop widths
- accessibility checks for keyboard use, focus, contrast, reduced motion, and color-independent status

Use realistic sample screenplay data. Do not use placeholder marketing copy or generic dashboard metrics.

## Definition of success

Billy can open one exact local URL and immediately understand the workflow. The screen should match the approved `DESIGN.md` direction, feel familiar to a Final Draft user, make the tactile board genuinely useful, and clearly show how a rewrite concern travels from evidence to an approved screenplay change.

## Suggested skills

- `epps-rewriting`
- `pdf`
- `superpowers:writing-plans`
- `frontend-design`
- `impeccable`
- `superpowers:test-driven-development`
- `superpowers:verification-before-completion`

## First response to Billy

Lead with: "I have read the Rewrite Studio handoff and approved design sources. I will not change the product direction. Here is the implementation plan I recommend before I write code."

Then provide a short ordered plan, the recommended stack in plain language, the first vertical-slice acceptance criteria, and the most important risks. Ask for approval before implementation.
