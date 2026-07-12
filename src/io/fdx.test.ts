import { describe, expect, it } from 'vitest';
import { parseFdx, serializeFdx } from './fdx';
import { sampleScreenplay } from '../model/sample/gauntlet-sample';

const FDX = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<FinalDraft DocumentType="Script" Template="No" Version="5">
  <Content>
    <Paragraph Type="Scene Heading"><Text>INT. RANCH KITCHEN - NIGHT</Text></Paragraph>
    <Paragraph Type="Action"><Text>Maria counts bills. The screen door </Text><Text Style="AllCaps">BANGS</Text><Text>.</Text></Paragraph>
    <Paragraph Type="Character"><Text>MARIA</Text></Paragraph>
    <Paragraph Type="Parenthetical"><Text>(not looking up)</Text></Paragraph>
    <Paragraph Type="Dialogue"><Text>You're late, Tom&#225;s.</Text></Paragraph>
    <Paragraph Type="Transition"><Text>CUT TO:</Text></Paragraph>
    <Paragraph Type="Scene Heading"><Text>EXT. WELL FIELD - DAWN</Text></Paragraph>
    <Paragraph Type="Action"><Text>The pump, half buried &amp; dead.</Text></Paragraph>
    <Paragraph Type="General"><Text>A stray note.</Text></Paragraph>
  </Content>
</FinalDraft>`;

describe('parseFdx', () => {
  it('maps Final Draft paragraph types to canonical elements', () => {
    const sp = parseFdx(FDX);
    expect(sp.scenes).toHaveLength(2);
    expect(sp.scenes[0].elements.map((e) => e.type)).toEqual([
      'scene_heading',
      'action',
      'character',
      'parenthetical',
      'dialogue',
      'transition',
    ]);
  });

  it('concatenates styled text runs and decodes entities', () => {
    const sp = parseFdx(FDX);
    expect(sp.scenes[0].elements[1].text).toBe('Maria counts bills. The screen door BANGS.');
    expect(sp.scenes[0].elements[4].text).toBe("You're late, Tomás.");
    expect(sp.scenes[1].elements[1].text).toBe('The pump, half buried & dead.');
  });

  it('treats General/unknown paragraphs as action and never throws', () => {
    const sp = parseFdx(FDX);
    expect(sp.scenes[1].elements[2].type).toBe('action');
    expect(() => parseFdx('<not really fdx>')).not.toThrow();
  });
});

describe('FDX round trips', () => {
  it('parse(serialize(sample)) preserves every element type and text', () => {
    const xml = serializeFdx(sampleScreenplay);
    const back = parseFdx(xml);
    const flatten = (sp: typeof sampleScreenplay) =>
      sp.scenes.flatMap((s) => s.elements.map((e) => `${e.type}:${e.text}`));
    expect(flatten(back)).toEqual(flatten(sampleScreenplay));
  });

  it('escapes XML-hostile characters safely', () => {
    const sp = parseFdx(serializeFdx({
      ...sampleScreenplay,
      scenes: [
        {
          ...sampleScreenplay.scenes[0],
          elements: [
            { id: 'x-e1', type: 'scene_heading', text: 'INT. R&D LAB <NIGHT> - DAY' },
            { id: 'x-e2', type: 'action', text: 'He types "<Content>" & smiles.' },
          ],
        },
      ],
    }));
    expect(sp.scenes[0].elements[0].text).toBe('INT. R&D LAB <NIGHT> - DAY');
    expect(sp.scenes[0].elements[1].text).toBe('He types "<Content>" & smiles.');
  });
});
