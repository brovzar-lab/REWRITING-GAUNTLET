import { describe, expect, it } from 'vitest';
import { parseFountain, serializeFountain } from './fountain';
import { sampleScreenplay } from '../model/sample/gauntlet-sample';

const SCRIPT = `Title: DRY RIVER
Draft date: First Draft

INT. RANCH KITCHEN - NIGHT

Maria counts bills at the table. The screen door BANGS.

MARIA
(not looking up)
You're late, Tomás.

TOMÁS
The pump died again.

They stare at each other. Outside, a dog barks twice.

CUT TO:

EXT. WELL FIELD - DAWN

The pump, half buried in dust. Tomás kicks it.

TOMÁS (CONT'D)
Piece of junk.
`;

describe('parseFountain', () => {
  it('parses title page metadata', () => {
    const sp = parseFountain(SCRIPT);
    expect(sp.title).toBe('DRY RIVER');
    expect(sp.draftLabel).toBe('First Draft');
  });

  it('splits scenes on scene headings and keeps element order', () => {
    const sp = parseFountain(SCRIPT);
    expect(sp.scenes).toHaveLength(2);
    expect(sp.scenes[0].slug).toBe('INT. RANCH KITCHEN - NIGHT');
    expect(sp.scenes[0].elements.map((e) => e.type)).toEqual([
      'scene_heading',
      'action',
      'character',
      'parenthetical',
      'dialogue',
      'character',
      'dialogue',
      'action',
      'transition',
    ]);
    expect(sp.scenes[1].elements[2].text).toBe("TOMÁS (CONT'D)");
  });

  it('recognizes characters with accents and (CONT\'D) extensions', () => {
    const sp = parseFountain(SCRIPT);
    const cues = sp.scenes.flatMap((s) => s.elements.filter((e) => e.type === 'character'));
    expect(cues.map((c) => c.text)).toEqual(['MARIA', 'TOMÁS', "TOMÁS (CONT'D)"]);
  });

  it('assigns acts by thirds as a labeled guess', () => {
    const sp = parseFountain(SCRIPT);
    expect(sp.scenes[0].act).toBe(1);
    expect(sp.scenes.every((s) => [1, 2, 3].includes(s.act))).toBe(true);
  });

  it('gives every scene and element unique stable ids and sequential numbers', () => {
    const sp = parseFountain(SCRIPT);
    const ids = sp.scenes.flatMap((s) => s.elements.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
    sp.scenes.forEach((s, i) => expect(s.number).toBe(i + 1));
  });

  it('never throws on malformed input; unknown lines become action', () => {
    const sp = parseFountain('just some words\n\n???!!\n');
    expect(sp.scenes).toHaveLength(1);
    expect(sp.scenes[0].elements.some((e) => e.type === 'action' && e.text === 'just some words')).toBe(true);
  });

  it('handles text before the first scene heading', () => {
    const sp = parseFountain('FADE IN:\n\nINT. ROOM - DAY\n\nA table.');
    expect(sp.scenes[0].elements[0].type).not.toBe('scene_heading');
    expect(sp.scenes).toHaveLength(2);
  });
});

describe('round trips', () => {
  it('parse(serialize(sample)) preserves every element type and text', () => {
    const text = serializeFountain(sampleScreenplay);
    const back = parseFountain(text);
    expect(back.title).toBe(sampleScreenplay.title);
    const flatten = (sp: typeof sampleScreenplay) =>
      sp.scenes.flatMap((s) => s.elements.map((e) => `${e.type}:${e.text}`));
    expect(flatten(back)).toEqual(flatten(sampleScreenplay));
  });

  it('serialize(parse(script)) is stable (fixpoint)', () => {
    const once = serializeFountain(parseFountain(SCRIPT));
    const twice = serializeFountain(parseFountain(once));
    expect(twice).toBe(once);
  });
});
