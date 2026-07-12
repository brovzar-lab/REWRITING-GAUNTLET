import { describe, expect, it } from 'vitest';
import { suggestCharacters } from './smartType';
import { ELEMENT_KEY_ORDER } from './editorKeymap';
import { sampleScreenplay } from '../model/sample/gauntlet-sample';

describe('ELEMENT_KEY_ORDER (Mod-1..6)', () => {
  it('maps the six element keys in workspace order', () => {
    expect(ELEMENT_KEY_ORDER).toEqual([
      'scene_heading',
      'action',
      'character',
      'parenthetical',
      'dialogue',
      'transition',
    ]);
  });
});

describe('suggestCharacters', () => {
  it('returns unique cues, most recently used first', () => {
    const all = suggestCharacters(sampleScreenplay, '');
    expect(new Set(all).size).toBe(all.length);
    expect(all.filter((n) => n === 'MARISOL')).toHaveLength(1);
    // the finale's last exchange is Lupita then Marisol
    expect(all.slice(0, 2)).toEqual(['MARISOL', 'LUPITA']);
  });

  it('filters by prefix, case-insensitively', () => {
    expect(suggestCharacters(sampleScreenplay, 'lu')).toEqual(['LUPITA']);
  });

  it('matches accents insensitively (RAU finds RAÚL)', () => {
    expect(suggestCharacters(sampleScreenplay, 'RAU')).toEqual(['RAÚL']);
  });

  it('drops an exact match (nothing left to complete)', () => {
    expect(suggestCharacters(sampleScreenplay, 'LUPITA')).toEqual([]);
  });
});
