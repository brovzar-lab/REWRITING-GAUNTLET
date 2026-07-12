---
name: Rewrite Studio
description: A cinematic, tactile, focused workspace for professional screenplay rewriting.
colors:
  night-frame: "#111A21"
  night-panel: "#17232C"
  night-divider: "#34414A"
  day-frame: "#E9E6DE"
  day-panel: "#F4F1EA"
  day-divider: "#C8C4BA"
  screenplay-paper: "#F8F1DF"
  ink: "#202321"
  night-text: "#E7E6E0"
  selection-amber: "#DCA52E"
  selection-blue: "#2C72C7"
  card-blue: "#8DAFC1"
  card-ochre: "#D6AE69"
  card-brick: "#BC776A"
  card-sage: "#8FA584"
  card-plum: "#9A829F"
  concern: "#C5534B"
  confirmed: "#4F8B62"
typography:
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.25
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.03em"
  screenplay:
    fontFamily: "Courier Prime, Courier New, monospace"
    fontSize: "12pt"
    fontWeight: 400
    lineHeight: 1
rounded:
  control: "4px"
  panel: "2px"
  card: "5px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "28px"
components:
  button-primary-night:
    backgroundColor: "{colors.selection-amber}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  button-primary-day:
    backgroundColor: "{colors.selection-blue}"
    textColor: "{colors.day-panel}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  scene-card:
    backgroundColor: "{colors.card-ochre}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "10px"
  screenplay-page:
    backgroundColor: "{colors.screenplay-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "28px"
---

# Design System: Rewrite Studio

<!-- SEED -->

## Overview

**Creative North Star: "The Professional Rewrite Room"**

Rewrite Studio joins the concentrated atmosphere of a professional film editing suite with the tactile intelligence of a physical writers' room. The screenplay page remains visually central. Structural tools, evidence, notes, and rewrite passes stay close enough to support decisions without competing for authorship or attention.

The interface uses compact professional density, familiar desktop controls, and spatial story objects that feel directly manipulable. It rejects generic AI dashboards, oversized marketing typography, chatbot-first workflows, playful startup styling, school-exercise language, excessive empty space, and repetitive rounded-card grids.

**Key Characteristics:**

- Final Draft-familiar screenplay editing.
- Tactile spatial cards and visible story relationships.
- Evidence connected directly to screenplay text.
- Day, Night, and System themes with identical hierarchy.
- Compact, keyboard-first, production-grade controls.

## Colors

The palette combines tinted editing-suite neutrals, warm screenplay paper, and muted production colors that carry story meaning without overwhelming the page.

### Primary

- **Selection Amber** (#DCA52E): Night-mode selection, current action, and primary approval states.
- **Selection Blue** (#2C72C7): Day-mode selection, focus, and primary action.

### Secondary

- **Production Blue** (#8DAFC1): Plot and discovery cards.
- **Production Ochre** (#D6AE69): setup, turning points, and selected spatial objects.
- **Production Brick** (#BC776A): opposition, pressure, and escalation.
- **Production Sage** (#8FA584): resolution, theme, and confirmed interpretation.
- **Production Plum** (#9A829F): relationship and character material.

### Tertiary

- **Concern Red** (#C5534B): evidence-backed concerns and destructive-change warnings.
- **Confirmed Green** (#4F8B62): writer-confirmed interpretations and completed checks.

### Neutral

- **Night Frame** (#111A21): night application shell.
- **Night Panel** (#17232C): night tool surfaces.
- **Day Frame** (#E9E6DE): day application shell.
- **Day Panel** (#F4F1EA): day tool surfaces.
- **Screenplay Paper** (#F8F1DF): paginated screenplay surface in both themes.
- **Ink** (#202321): screenplay copy and primary day text.

**The Page Rule.** The screenplay page remains warm and paper-like in both themes. Theme switching changes the workspace, not the writing surface.

**The Meaning Rule.** Color supports a label, icon, pattern, or line style. It never communicates status alone.

## Typography

**Display Font:** Inter with system sans-serif fallback
**Body Font:** Inter with system sans-serif fallback
**Label/Mono Font:** Courier Prime for screenplay content only

**Character:** UI typography is compact, quiet, and dependable. Courier belongs to the screenplay and screenplay-specific measurements, never to general application controls.

### Hierarchy

- **Headline** (650, 18px, 1.25): rare workspace and project headings.
- **Title** (650, 14px, 1.25): panel titles, selected pass, and major controls.
- **Body** (400, 13px, 1.45): evidence, notes, explanations, and settings.
- **Label** (600, 11px, 0.03em): navigation, metadata, card taxonomy, and compact controls.
- **Screenplay** (400, 12pt, 1): industry-standard screenplay text and pagination.

**The Scale Rule.** No oversized interface type. Hierarchy comes from weight, placement, contrast, and controlled scale.

## Elevation

The system is flat by default and uses tonal layering plus crisp separators. Shadows appear only when an object lifts, overlaps, drags, or must be distinguished from the screenplay canvas.

### Shadow Vocabulary

- **Paper Rest** (`0 1px 4px rgba(20, 24, 25, 0.14)`): screenplay page against the workspace.
- **Card Lift** (`0 8px 20px rgba(12, 18, 22, 0.22)`): only while dragging or opening a spatial card.
- **Floating Tool** (`0 10px 30px rgba(12, 18, 22, 0.28)`): temporary menus and command surfaces.

**The Structural Depth Rule.** Depth explains interaction. It is never ambient decoration.

## Components

### Buttons

- **Shape:** compact, subtly softened rectangle (4px).
- **Primary:** amber with dark ink in Night; blue with pale text in Day; 8px by 12px padding.
- **Hover / Focus:** tonal shift plus a visible 2px focus ring. Transitions last 150ms to 200ms.
- **Secondary / Ghost:** transparent or tonal surface with a 1px divider-color border.

### Chips

- **Style:** compact pass and source labels with a 4px radius, readable text, and semantic icon or abbreviation.
- **State:** selected chips use accent outline and stronger text; unselected chips remain quiet.

### Cards / Containers

- **Corner Style:** tactile scene cards use 5px; tool panels use 2px or square joins.
- **Background:** muted production colors for story cards; neutral tonal surfaces for panels.
- **Shadow Strategy:** cards are flat at rest and lift during direct manipulation.
- **Border:** 1px neutral edge; selected objects use accent outline plus a non-color marker.
- **Internal Padding:** 8px to 12px at normal density.

### Inputs / Fields

- **Style:** tonal background, 1px divider stroke, 4px radius, compact height.
- **Focus:** 2px theme accent ring with no layout shift.
- **Error / Disabled:** error includes icon and text; disabled reduces contrast without becoming unreadable.

### Navigation

Navigation uses compact labels, familiar icons, visible active states, and resizable panels. The scene navigator groups scenes by act and preserves per-draft page references. Panels collapse rather than transform into unfamiliar controls.

### Screenplay Page

The screenplay page uses professional screenplay layout, Courier Prime, visible pagination, revision marks, scene navigation, and keyboard formatting behavior familiar to Final Draft users. Adjustable zoom never changes pagination rules.

### Story Card

Story cards display stable scene or beat identity, slug or beat label, story function, and meaningful markers. Cards can be reordered, connected, filtered, and opened without losing the screenplay selection.

### Evidence Link

Evidence links connect a textual fact, reader reaction, AI hypothesis, writer confirmation, or unresolved question to its exact screenplay location and related story objects.

## Do's and Don'ts

### Do:

- **Do** keep the screenplay editor at the center of the default workspace.
- **Do** preserve identical hierarchy and interaction behavior across Day and Night themes.
- **Do** use compact 11px to 14px UI typography and 12pt Courier screenplay typography.
- **Do** connect analysis to exact scenes, beats, lines, drafts, and sources.
- **Do** use direct manipulation for cards, relationships, and rewrite-pass organization.
- **Do** support full keyboard navigation, visible focus, reduced motion, and color-independent meaning.

### Don't:

- **Don't** resemble a generic AI dashboard, oversized marketing page, chatbot-first workflow, playful startup tool, or school exercise.
- **Don't** use excessive empty space, repetitive rounded-card grids, inflated typography, or decorative AI imagery.
- **Don't** hide the screenplay behind analysis or make chat the primary workspace.
- **Don't** use gradient text, glassmorphism, neon cyberpunk accents, or decorative gradients.
- **Don't** use colored side-stripe borders greater than 1px as accents.
- **Don't** animate for decoration or make users wait for page-load choreography.
- **Don't** invent unfamiliar screenplay editing conventions where established professional behavior exists.
