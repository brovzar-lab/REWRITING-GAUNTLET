import { describe, expect, it } from 'vitest';
import { buildDoc, parseDoc } from './docSync';
import { sampleScreenplay } from '../model/sample/gauntlet-sample';

describe('canonical model <-> ProseMirror doc sync', () => {
  it('round-trips the sample screenplay losslessly', () => {
    const doc = buildDoc(sampleScreenplay);
    const parsed = parseDoc(doc, sampleScreenplay);
    expect(parsed).toEqual(sampleScreenplay);
  });

  it('renders one block node per element with stable ids', () => {
    const doc = buildDoc(sampleScreenplay);
    const ids: string[] = [];
    doc.descendants((node) => {
      if (node.isBlock && node.attrs.elementId) ids.push(node.attrs.elementId as string);
      return true;
    });
    const expected = sampleScreenplay.scenes.flatMap((s) => s.elements.map((e) => e.id));
    expect(ids).toEqual(expected);
  });

  it('parseDoc preserves scene metadata (act, slug, story function) by scene id', () => {
    const doc = buildDoc(sampleScreenplay);
    const parsed = parseDoc(doc, sampleScreenplay);
    parsed.scenes.forEach((s, i) => {
      expect(s.act).toBe(sampleScreenplay.scenes[i].act);
      expect(s.storyFunction).toBe(sampleScreenplay.scenes[i].storyFunction);
    });
  });
});
