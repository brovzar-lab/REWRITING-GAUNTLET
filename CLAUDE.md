# Rewrite Studio: Claude Code Instructions

## Owner and working style

Billy Rovzar is a film producer, not an engineer. Use plain language, interpret dictated typos charitably, and keep moving. Only request confirmation before destructive or irreversible actions. Give short progress updates and show proof with a working URL, screenshot, or test output.

## Required reading before planning or coding

Read these files completely:

1. `PRODUCT.md`
2. `DESIGN.md`
3. `DESIGN.json`
4. `/Users/quantumcode/Downloads/Screenwriting is Rewriting.pdf`
5. `tmp/pdfs/screenwriting-is-rewriting.txt` as searchable support for the PDF
6. `CLAUDE-CODE-HANDOFF.md`

The PDF is the methodology source. `PRODUCT.md` and `DESIGN.md` contain approved product and visual decisions. Do not replace those decisions with generic assumptions.

## Required skills

Invoke these skills when available:

- `epps-rewriting` for the rewriting methodology.
- `pdf` to inspect the source book.
- `superpowers:brainstorming` before changing approved design or scope.
- `superpowers:writing-plans` before implementation.
- `frontend-design` for building the interface.
- `impeccable` for design-system compliance and polish.
- `superpowers:test-driven-development` during implementation.
- `superpowers:verification-before-completion` before claiming completion.

## Approval status

Approved:

- Product identity, audience, supported formats, languages, and AI role.
- Epps methodology corrections from the independent audit.
- Hybrid visual direction in both Day and Night modes.
- Final Draft-familiar screenplay editing plus a tactile spatial board.
- Local-first, cloud-ready technical foundation.

Not authorized:

- Replacing the approved visual direction.
- Turning the product into a chatbot-first AI script doctor.
- Sending screenplay content to a cloud provider without explicit disclosure and consent.
- Destructive git or filesystem operations without approval.

## Governing product rule

AI supports the writer's rewriting process. It does not perform that process invisibly. The screenplay page is the center of the app. Analysis, boards, notes, and AI assistance must connect back to exact screenplay evidence.

## Methodology requirements

- Require the writer's private annotated read before revealing AI diagnosis.
- Keep human reader notes distinct. Recommend three readers and support no more than five initial readers.
- Visibly separate writer, reader, AI, producer or executive, and interim-reader note sources.
- Label claims as textual facts, reader reactions, AI hypotheses, writer-confirmed interpretations, or unresolved hypotheses.
- Use evidence-backed statuses: Clear, Uncertain, and Priority Concern. Do not produce an overall numerical screenplay score.
- Keep market readiness separate, optional, and explicitly caveated.
- Treat rewrite passes as reusable lenses that can repeat, combine, reorder, or skip.
- Support Epps tools including Set-Up Map, Opposition Characters, Essential Three-Act Questions, four high points, midpoint and end-of-Act-II escalation, index-card board, Scene Point, conflict map, relationship map, read-aloud or table read, holdovers and orphans, and final cover-to-cover Polish Read.
- For television pilots, provide a transparent adapter for series engine, pilot promise, repeatable conflict, ensemble, A/B/C stories, teaser or cold open, act-outs, episodic versus serialized design, season trajectory, and sustainability.
- Never produce an unreviewed one-shot page-one rewrite. Assemble a full revised draft only from approved pass-by-pass changes. Lock unaffected scenes.
- Track stable scene and beat identities, per-draft page references, change provenance, and setup/payoff relationships.

## Supported product scope

- Feature films, one-hour television pilots, and half-hour television pilots.
- English, Spanish, and bilingual screenplays.
- Import and export PDF, FDX, and Fountain.
- Collaborative co-writer mode plus writer-controlled full-draft assembly.
- Local-first storage, autosave, recoverable versions, and optional cloud synchronization later.

## Interface requirements

Default workspace:

1. Scene navigator.
2. Final Draft-style professional screenplay editor.
3. Expandable tactile visual story board.
4. Evidence and notes inspector.
5. Persistent rewrite-pass tray.

The editor must support professional screenplay formatting, pagination, revision marks, scene navigation, keyboard flow, and adjustable visual zoom without changing pagination. Panels resize, collapse, and expand. Provide focused screenplay mode and full-board mode.

Day, Night, and System themes must have identical hierarchy and behavior. Follow all tokens and guardrails in `DESIGN.md` and `DESIGN.json`. Use compact interface typography. Do not use oversized headings, generic rounded-card grids, glassmorphism, gradients, neon cyberpunk styling, excessive empty space, or decorative AI imagery.

Meet WCAG 2.1 AA. Support full keyboard navigation, visible focus, reduced motion, color-independent meaning, and longer Spanish interface text.

## Architecture boundaries

Keep the following modules independently understandable and testable:

- screenplay import and export
- canonical screenplay and draft model
- professional editor and pagination
- story board and structural maps
- Epps rewrite engine
- evidence and note provenance
- rewrite pass orchestration
- AI provider adapter
- local persistence and version recovery
- optional synchronization boundary
- evaluation and regression suite

No module should depend directly on a specific AI vendor. The canonical screenplay model, not rendered HTML, is the source of truth.

## Build discipline

Do not begin with the entire application. First create a written implementation plan divided into demonstrable vertical slices. The first slice should prove the application shell, screenplay page, scene navigator, tactile board, evidence link, rewrite-pass tray, Day and Night themes, local persistence, and keyboard accessibility using realistic sample data.

For each slice:

1. Define acceptance criteria.
2. Write tests first where practical.
3. Implement the smallest coherent slice.
4. Run automated checks.
5. Launch on the fixed project port from `~/.Codex/dev-ports.md`.
6. Confirm the exact URL loads.
7. Show Billy proof before moving to the next major slice.

Preserve user-authored files and unrelated changes. Use `apply_patch` for text edits. Do not use destructive git commands.
