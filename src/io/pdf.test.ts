import { describe, expect, it } from 'vitest';
import { extractPdfText } from './pdf';
import { parseFountain } from './fountain';

/** A minimal, uncompressed text PDF with one content stream of screenplay lines.
    Enough to exercise the extractor's core path without any dependency. */
function fixturePdf(): Uint8Array {
  const content =
    'BT /F1 12 Tf 72 720 Td (INT. KITCHEN - DAY) Tj 0 -20 Td (Marta cooks. The radio hums.) Tj ' +
    '0 -20 Td (MARTA) Tj 0 -14 Td (Nobody comes home this late for good news.) Tj ' +
    '0 -20 Td [(Split )-10(across )-10(an )-10(array.)] TJ ET';
  const objects = [
    '%PDF-1.4\n',
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n',
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n',
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj\n',
    `4 0 obj<</Length ${content.length}>>\nstream\n${content}\nendstream\nendobj\n`,
    '%%EOF\n',
  ].join('');
  return new TextEncoder().encode(objects);
}

describe('extractPdfText (best effort)', () => {
  it('pulls text from Tj and TJ operators, one show per line', async () => {
    const text = await extractPdfText(fixturePdf());
    expect(text).toContain('INT. KITCHEN - DAY');
    expect(text).toContain('Marta cooks. The radio hums.');
    expect(text).toContain('MARTA');
    expect(text).toContain('Nobody comes home this late for good news.');
    // A TJ array joins its parts into one line.
    expect(text).toContain('Split across an array.');
  });

  it('returns an empty string for bytes with no extractable text', async () => {
    const text = await extractPdfText(new TextEncoder().encode('%PDF-1.4\nno streams here\n%%EOF'));
    expect(text).toBe('');
  });

  it('the extracted text parses into a screenplay via the existing parser', async () => {
    const sp = parseFountain(await extractPdfText(fixturePdf()));
    expect(sp.scenes).toHaveLength(1);
    const types = sp.scenes[0].elements.map((e) => e.type);
    expect(types[0]).toBe('scene_heading');
    expect(types).toContain('character');
    expect(types).toContain('dialogue');
  });
});
