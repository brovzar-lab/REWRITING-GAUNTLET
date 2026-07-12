import type { Element, ElementType, Screenplay } from '../model/screenplay';

/** US-letter screenplay layout (inches). Courier 12pt: 10 chars/inch, 6 lines/inch. */
export const PAGE = {
  width: 8.5,
  marginLeft: 1.5,
  marginRight: 1.0,
  marginTop: 1.0,
  marginBottom: 1.0,
};

/** Per-element indent and width, measured from the 1.5in left margin. */
export const ELEMENT_LAYOUT: Record<ElementType, { indent: number; width: number; align?: 'right'; uppercase?: boolean }> = {
  scene_heading: { indent: 0, width: 6.0, uppercase: true },
  action: { indent: 0, width: 6.0 },
  character: { indent: 2.2, width: 3.8, uppercase: true },
  parenthetical: { indent: 1.6, width: 2.0 },
  dialogue: { indent: 1.0, width: 3.5 },
  transition: { indent: 0, width: 6.0, align: 'right', uppercase: true },
};

/** APPROXIMATE pagination for Slice 1 only: a plain line-count heuristic so the
    paper reads as pages. True industry pagination lands in Slice 2. */
export const LINES_PER_PAGE = 55;

const CHARS_PER_INCH = 10;

export function approximateElementLines(element: Element): number {
  const layout = ELEMENT_LAYOUT[element.type];
  const charsPerLine = Math.max(1, Math.floor(layout.width * CHARS_PER_INCH));
  const textLines = Math.max(1, Math.ceil(element.text.length / charsPerLine));
  // Blank line before every element except a continuing dialogue stack.
  const leading = element.type === 'dialogue' || element.type === 'parenthetical' ? 0 : 1;
  return textLines + leading;
}

export interface ApproximatePagination {
  /** elementId -> 1-based page number it starts on */
  pageOfElement: Map<string, number>;
  /** element ids that begin a new page (page 2+) */
  pageBreakBefore: Set<string>;
  pageCount: number;
}

export function approximatePagination(screenplay: Screenplay): ApproximatePagination {
  const pageOfElement = new Map<string, number>();
  const pageBreakBefore = new Set<string>();
  let page = 1;
  let lines = 0;
  for (const scene of screenplay.scenes) {
    for (const element of scene.elements) {
      const needed = approximateElementLines(element);
      if (lines + needed > LINES_PER_PAGE) {
        page += 1;
        lines = 0;
        pageBreakBefore.add(element.id);
      }
      pageOfElement.set(element.id, page);
      lines += needed;
    }
  }
  return { pageOfElement, pageBreakBefore, pageCount: page };
}
