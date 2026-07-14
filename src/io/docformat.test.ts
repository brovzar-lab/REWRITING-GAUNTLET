import { describe, expect, it } from 'vitest';
import { serializeFountain, parseFountain } from './fountain';
import { serializeFdx, parseFdx } from './fdx';
import { resolveDocFormat, type Screenplay } from '../model/screenplay';

function doc(docFormat: Screenplay['docFormat']): Screenplay {
  return {
    id: 'x',
    title: 'THE PILOT',
    draftLabel: 'First draft',
    docFormat,
    scenes: [
      {
        id: 'x-s1',
        number: 1,
        act: 1,
        slug: 'INT. ROOM - DAY',
        storyFunction: 'plot',
        elements: [
          { id: 'x-s1-e1', type: 'scene_heading', text: 'INT. ROOM - DAY' },
          { id: 'x-s1-e2', type: 'action', text: 'A table, a chair, a decision.' },
        ],
      },
    ],
  };
}

const noSidecarInPages = (sp: Screenplay) => {
  for (const scene of sp.scenes) {
    for (const el of scene.elements) {
      expect(el.text).not.toMatch(/rewrite-studio/i);
      expect(el.text).not.toMatch(/docFormat/i);
    }
  }
};

describe('Fountain carries docFormat in a sidecar, not in the pages', () => {
  it('round-trips a one-hour pilot and keeps the marker out of screenplay text', () => {
    const text = serializeFountain(doc('one_hour'));
    // The marker rides in a boneyard comment, never as an element line.
    expect(text).toMatch(/\/\*[^*]*rewrite-studio[^*]*one_hour[^*]*\*\//);
    const back = parseFountain(text);
    expect(resolveDocFormat(back)).toBe('one_hour');
    noSidecarInPages(back);
  });

  it('round-trips a half-hour pilot', () => {
    expect(resolveDocFormat(parseFountain(serializeFountain(doc('half_hour'))))).toBe('half_hour');
  });

  it('a feature emits no marker and re-imports as a feature', () => {
    const text = serializeFountain(doc('feature'));
    expect(text).not.toMatch(/rewrite-studio/);
    expect(resolveDocFormat(parseFountain(text))).toBe('feature');
  });
});

describe('FDX carries docFormat in an ignorable comment, not in the pages', () => {
  it('round-trips a one-hour pilot with the marker outside <Content> text', () => {
    const xml = serializeFdx(doc('one_hour'));
    expect(xml).toMatch(/<!--[^>]*rewrite-studio[^>]*one_hour[^>]*-->/);
    // The marker is an XML comment, never inside a <Text> paragraph.
    expect(xml).not.toMatch(/<Text>[^<]*rewrite-studio/);
    const back = parseFdx(xml);
    expect(resolveDocFormat(back)).toBe('one_hour');
    noSidecarInPages(back);
  });

  it('a feature emits no marker and re-imports as a feature', () => {
    const xml = serializeFdx(doc('feature'));
    expect(xml).not.toMatch(/rewrite-studio/);
    expect(resolveDocFormat(parseFdx(xml))).toBe('feature');
  });
});
