/** Output model of the pagination engine. Pure data — no DOM, no rendering. */

export type LineKind = 'text' | 'blank' | 'more' | 'contd' | 'page_header';

export interface PaginatedLine {
  /** Owning element; empty string for page_header lines. */
  elementId: string;
  sceneId: string;
  /** Index of this line within its element's wrapped lines (0 for artifacts). */
  lineIndex: number;
  text: string;
  kind: LineKind;
}

export interface PageModel {
  number: number;
  /** Header (pages 2+) followed by at most LINES_PER_PAGE body lines.
      The page_header line never counts toward the body limit. */
  lines: PaginatedLine[];
}

export interface PaginationResult {
  pages: PageModel[];
  /** elementId -> first page the element appears on. */
  pageOfElement: Map<string, number>;
  /** Elements that begin a new page. */
  breakBeforeElement: Set<string>;
  /** elementId -> wrapped-line index at which the element splits to the next page. */
  splitElements: Map<string, number>;
  pageCount: number;
}
