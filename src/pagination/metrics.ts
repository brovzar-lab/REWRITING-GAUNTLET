import { ELEMENT_LAYOUT } from '../editor/layout';
import type { ElementType } from '../model/screenplay';

const CHARS_PER_INCH = 10; // Courier 12pt

/** Greedy word wrap on spaces; tokens longer than the width hard-split,
    matching how the CSS page (pre-wrap, fixed-width Courier) overflows. */
export function wrapText(text: string, width: number): string[] {
  if (text.length === 0) return [''];
  const tokens = text.split(' ').filter((t) => t.length > 0);
  if (tokens.length === 0) return [''];

  const lines: string[] = [];
  let current = '';
  for (let token of tokens) {
    while (token.length > width) {
      if (current) {
        lines.push(current);
        current = '';
      }
      lines.push(token.slice(0, width));
      token = token.slice(width);
    }
    if (token.length === 0) continue;
    if (current.length === 0) current = token;
    else if (current.length + 1 + token.length <= width) current += ' ' + token;
    else {
      lines.push(current);
      current = token;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

/** Wrapping width in characters for an element type, from the shared layout. */
export function elementWidth(type: ElementType): number {
  return Math.floor(ELEMENT_LAYOUT[type].width * CHARS_PER_INCH);
}
