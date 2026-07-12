import { elementWidth, wrapText } from './metrics';
import type { PaginatedLine, PageModel, PaginationResult } from './types';
import type { Element, ElementType, Screenplay } from '../model/screenplay';

/** 55 screenplay body lines per page. The page-number header is a render
    artifact (kind 'page_header') and NEVER counts toward this limit. */
export const LINES_PER_PAGE = 55;

interface Piece {
  element: Element;
  sceneId: string;
  elType: ElementType;
  lines: string[];
}

/** A chunk is placed as a unit: a lone element, or a character-cue stack
    (cue + parentheticals + dialogue) that must obey keep-together rules. */
interface Chunk {
  kind: 'heading' | 'transition' | 'action' | 'stack';
  pieces: Piece[];
}

function toPieces(screenplay: Screenplay): Piece[] {
  return screenplay.scenes.flatMap((scene) =>
    scene.elements.map((element) => ({
      element,
      sceneId: scene.id,
      elType: element.type,
      lines: wrapText(element.text, elementWidth(element.type)),
    })),
  );
}

function toChunks(pieces: Piece[]): Chunk[] {
  const chunks: Chunk[] = [];
  let i = 0;
  while (i < pieces.length) {
    const p = pieces[i];
    if (p.elType === 'character') {
      const stack: Piece[] = [p];
      i += 1;
      while (i < pieces.length && (pieces[i].elType === 'dialogue' || pieces[i].elType === 'parenthetical')) {
        stack.push(pieces[i]);
        i += 1;
      }
      chunks.push({ kind: 'stack', pieces: stack });
    } else {
      const kind = p.elType === 'scene_heading' ? 'heading' : p.elType === 'transition' ? 'transition' : 'action';
      // dangling dialogue/parenthetical without a cue behaves like action
      chunks.push({ kind, pieces: [p] });
      i += 1;
    }
  }
  return chunks;
}

/** Minimal body lines the chunk needs to legally START on a page (incl. its leading blank). */
function minHead(chunk: Chunk | undefined): number {
  if (!chunk) return 0;
  if (chunk.kind === 'stack') {
    const whole = 1 + chunk.pieces.reduce((s, p) => s + p.lines.length, 0);
    // if it can't fit whole, it needs blank + cue + leading parens + 2 dialogue + (MORE)
    return Math.min(whole, stackSplitNeed(chunk));
  }
  const first = chunk.pieces[0];
  if (chunk.kind === 'action') return 1 + Math.min(2, first.lines.length);
  return 1 + first.lines.length + 1; // heading/transition: blank + itself + one line of what follows
}

/** Body lines a stack needs on the current page when it will break mid-stack:
    blank + cue + parentheticals before dialogue + 2 dialogue lines + (MORE). */
function stackSplitNeed(chunk: Chunk): number {
  const cue = chunk.pieces[0];
  let need = 1 + cue.lines.length;
  for (const part of chunk.pieces.slice(1)) {
    if (part.elType === 'parenthetical') need += part.lines.length;
    else {
      need += Math.min(2, part.lines.length);
      break;
    }
  }
  return need + 1; // the (MORE) line
}

class Paginator {
  pages: PageModel[] = [];
  current: PaginatedLine[] = [];
  bodyUsed = 0;
  pageOfElement = new Map<string, number>();
  breakBeforeElement = new Set<string>();
  splitElements = new Map<string, number>();

  get pageNumber(): number {
    return this.pages.length + 1;
  }

  newPage(): void {
    this.pages.push({ number: this.pageNumber, lines: this.current });
    this.current = [];
    this.bodyUsed = 0;
    this.current.push({ elementId: '', sceneId: '', lineIndex: 0, text: `${this.pageNumber}.`, kind: 'page_header' });
  }

  remaining(): number {
    return LINES_PER_PAGE - this.bodyUsed;
  }

  blankCost(): number {
    return this.bodyUsed > 0 ? 1 : 0;
  }

  pushBlank(): void {
    if (this.bodyUsed === 0) return;
    this.current.push({ elementId: '', sceneId: '', lineIndex: 0, text: '', kind: 'blank' });
    this.bodyUsed += 1;
  }

  pushLine(line: PaginatedLine): void {
    this.current.push(line);
    this.bodyUsed += 1;
    if (line.kind === 'text' && !this.pageOfElement.has(line.elementId)) {
      this.pageOfElement.set(line.elementId, this.pageNumber);
      if (this.pageNumber > 1 && this.current.filter((l) => l.kind === 'text').length === 1 && line.lineIndex === 0) {
        this.breakBeforeElement.add(line.elementId);
      }
    }
  }

  pushPieceLines(piece: Piece, from: number, to: number): void {
    for (let i = from; i < to; i++) {
      this.pushLine({ elementId: piece.element.id, sceneId: piece.sceneId, lineIndex: i, text: piece.lines[i], kind: 'text' });
    }
  }

  pushMore(): void {
    this.current.push({ elementId: '', sceneId: '', lineIndex: 0, text: '(MORE)', kind: 'more' });
    this.bodyUsed += 1;
  }

  pushContd(cueName: string, sceneId: string): void {
    this.current.push({ elementId: '', sceneId, lineIndex: 0, text: `${cueName} (CONT'D)`, kind: 'contd' });
    this.bodyUsed += 1;
  }

  /** Place a run of lines that may split across pages, never orphaning a
      single line on either side of any break. Returns split index on the
      first break, or null if unsplit. */
  placeSplittable(piece: Piece): void {
    const n = piece.lines.length;
    const availNow = this.remaining() - this.blankCost();
    if (n + this.blankCost() <= this.remaining()) {
      this.pushBlank();
      this.pushPieceLines(piece, 0, n);
      return;
    }
    let k = availNow;
    if (n - k === 1) k -= 1; // never move a single orphan line
    if (k >= 2 && n - k >= 2) {
      this.pushBlank();
      this.pushPieceLines(piece, 0, k);
      this.splitElements.set(piece.element.id, k);
      this.newPage();
      this.placeContinuationRun(piece, k);
    } else {
      this.newPage();
      if (n <= LINES_PER_PAGE) {
        this.pushPieceLines(piece, 0, n);
      } else {
        // longer than a full page: fill pages obeying the orphan rule
        let placed = LINES_PER_PAGE;
        if (n - placed === 1) placed -= 1;
        this.pushPieceLines(piece, 0, placed);
        this.splitElements.set(piece.element.id, placed);
        this.newPage();
        this.placeContinuationRun(piece, placed);
      }
    }
  }

  private placeContinuationRun(piece: Piece, from: number): void {
    let start = from;
    const n = piece.lines.length;
    while (n - start > LINES_PER_PAGE) {
      let take = LINES_PER_PAGE;
      if (n - start - take === 1) take -= 1;
      this.pushPieceLines(piece, start, start + take);
      start += take;
      this.newPage();
    }
    this.pushPieceLines(piece, start, n);
  }

  placeHeadingLike(chunk: Chunk, next: Chunk | undefined): void {
    const piece = chunk.pieces[0];
    const need = this.blankCost() + piece.lines.length + minHead(next);
    if (need > this.remaining()) this.newPage();
    this.pushBlank();
    this.pushPieceLines(piece, 0, piece.lines.length);
  }

  /** Character-cue stack with keep-together, (MORE)/(CONT'D) rules. */
  placeStack(chunk: Chunk): void {
    const cue = chunk.pieces[0];
    const parts = chunk.pieces.slice(1);
    const cueName = cue.element.text.trim().toUpperCase();
    const totalLines = this.blankCost() + cue.lines.length + parts.reduce((s, p) => s + p.lines.length, 0);

    if (totalLines <= this.remaining()) {
      this.pushBlank();
      this.pushPieceLines(cue, 0, cue.lines.length);
      for (const part of parts) this.pushPieceLines(part, 0, part.lines.length);
      return;
    }

    // A mid-stack break is now inevitable, so the start must also fit the (MORE) line.
    const startNeed = stackSplitNeed(chunk) - (this.blankCost() === 0 ? 1 : 0);
    if (startNeed > this.remaining()) {
      this.newPage();
      this.placeStack(chunk); // at page top the stack either fits or splits legally
      return;
    }

    this.pushBlank();
    this.pushPieceLines(cue, 0, cue.lines.length);
    this.pageOfElement.set(cue.element.id, this.pageNumber);

    let dialoguePlaced = false;
    for (let pi = 0; pi < parts.length; pi++) {
      const part = parts[pi];
      const rest = parts.slice(pi + 1);
      const restLines = rest.reduce((s, p) => s + p.lines.length, 0);
      const wholeRemainderFits = part.lines.length + restLines <= this.remaining();

      if (wholeRemainderFits) {
        this.pushPieceLines(part, 0, part.lines.length);
        if (part.elType === 'dialogue') dialoguePlaced = true;
        continue;
      }

      if (part.elType === 'parenthetical') {
        // never split a parenthetical: break before it (MORE/CONT'D) — cue guaranteed dialogue by minHead
        this.breakStack(cueName, part.sceneId);
        this.placeParts(parts.slice(pi), cueName);
        return;
      }

      // dialogue that cannot fully fit here (with its rest): try to split inside it
      const avail = this.remaining() - 1; // reserve the (MORE) line
      let k = Math.min(avail, part.lines.length);
      if (part.lines.length - k === 1) k -= 1;
      if (k >= 2) {
        this.pushPieceLines(part, 0, k);
        if (!this.splitElements.has(part.element.id) && k < part.lines.length) {
          this.splitElements.set(part.element.id, k);
        }
        this.breakStack(cueName, part.sceneId);
        const remainder: Piece[] = k < part.lines.length ? [{ ...part, lines: part.lines.slice(k) }] : [];
        this.placeParts([...remainder, ...rest], cueName, part.element.id, k);
        return;
      }

      // cannot keep two dialogue lines here: break before this part
      if (dialoguePlaced) {
        this.breakStack(cueName, part.sceneId);
        this.placeParts(parts.slice(pi), cueName);
      } else {
        // nothing meaningful placed: retract is impossible, but minHead guaranteed
        // ≥2 dialogue lines fit, so this branch is unreachable for legal input.
        this.newPage();
        this.placeParts(parts.slice(pi), cueName);
      }
      return;
    }
  }

  private breakStack(cueName: string, sceneId: string): void {
    this.pushMore();
    this.newPage();
    this.pushContd(cueName, sceneId);
  }

  /** Place stack parts at a page top (after a CONT'D cue), chaining further pages. */
  private placeParts(parts: Piece[], cueName: string, splitOriginId?: string, alreadyPlaced = 0): void {
    for (let pi = 0; pi < parts.length; pi++) {
      const part = parts[pi];
      if (part.lines.length <= this.remaining() - (pi < parts.length - 1 ? 0 : 0)) {
        if (part.lines.length > this.remaining()) break;
        // record continuation line indexes relative to the original element
        const baseIndex = part.element.id === splitOriginId ? alreadyPlaced : 0;
        for (let i = 0; i < part.lines.length; i++) {
          this.pushLine({ elementId: part.element.id, sceneId: part.sceneId, lineIndex: baseIndex + i, text: part.lines[i], kind: 'text' });
        }
        continue;
      }
      // part longer than the remaining page: split again with MORE/CONT'D
      const avail = this.remaining() - 1;
      let k = Math.min(avail, part.lines.length);
      if (part.lines.length - k === 1) k -= 1;
      if (part.elType === 'dialogue' && k >= 2) {
        const baseIndex = part.element.id === splitOriginId ? alreadyPlaced : 0;
        for (let i = 0; i < k; i++) {
          this.pushLine({ elementId: part.element.id, sceneId: part.sceneId, lineIndex: baseIndex + i, text: part.lines[i], kind: 'text' });
        }
        this.breakStack(cueName, part.sceneId);
        this.placeParts([{ ...part, lines: part.lines.slice(k) }, ...parts.slice(pi + 1)], cueName, part.element.id === splitOriginId ? splitOriginId : part.element.id, baseIndex + k);
        return;
      }
      this.newPage();
      this.placeParts(parts.slice(pi), cueName, splitOriginId, alreadyPlaced);
      return;
    }
  }

  finish(): void {
    // trim a trailing blank, then close the last page
    while (this.current.length > 0 && this.current[this.current.length - 1].kind === 'blank') {
      this.current.pop();
      this.bodyUsed -= 1;
    }
    this.pages.push({ number: this.pageNumber, lines: this.current });
  }
}

export function paginate(screenplay: Screenplay): PaginationResult {
  const chunks = toChunks(toPieces(screenplay));
  const p = new Paginator();

  chunks.forEach((chunk, i) => {
    const next = chunks[i + 1];
    if (chunk.kind === 'heading' || chunk.kind === 'transition') p.placeHeadingLike(chunk, next);
    else if (chunk.kind === 'stack') p.placeStack(chunk);
    else p.placeSplittable(chunk.pieces[0]);
  });
  p.finish();

  return {
    pages: p.pages,
    pageOfElement: p.pageOfElement,
    breakBeforeElement: p.breakBeforeElement,
    splitElements: p.splitElements,
    pageCount: p.pages.length,
  };
}
