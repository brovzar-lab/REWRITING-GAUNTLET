import { describe, expect, it } from 'vitest';
import { elementWidth, wrapText } from './metrics';

describe('wrapText', () => {
  it('returns a single empty line for empty text', () => {
    expect(wrapText('', 35)).toEqual(['']);
  });

  it('keeps short text on one line', () => {
    expect(wrapText('Nobody just gets tired.', 35)).toEqual(['Nobody just gets tired.']);
  });

  it('wraps on spaces without breaking words and never exceeds the width', () => {
    const text = 'My father counted every liter you stole. I finished his math.';
    const lines = wrapText(text, 35);
    expect(lines.length).toBe(2);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(35);
    expect(lines.join(' ')).toBe(text);
  });

  it('hard-splits a single token longer than the width', () => {
    const token = 'X'.repeat(40);
    expect(wrapText(token, 35)).toEqual(['X'.repeat(35), 'X'.repeat(5)]);
  });

  it('collapses runs of spaces at wrap points (no leading-space lines)', () => {
    const lines = wrapText('uno  dos  tres cuatro cinco seis siete ocho', 12);
    for (const line of lines) {
      expect(line.startsWith(' ')).toBe(false);
      expect(line.length).toBeLessThanOrEqual(12);
    }
  });
});

describe('elementWidth', () => {
  it('derives character widths from ELEMENT_LAYOUT (10 chars per inch)', () => {
    expect(elementWidth('action')).toBe(60);
    expect(elementWidth('scene_heading')).toBe(60);
    expect(elementWidth('dialogue')).toBe(35);
    expect(elementWidth('parenthetical')).toBe(20);
    expect(elementWidth('character')).toBe(38);
    expect(elementWidth('transition')).toBe(60);
  });
});
