import { XMLParser } from 'fast-xml-parser';
import { assembleScreenplay, contentHash, type ParsedElement } from './assemble';
import type { DocFormat, ElementType, Screenplay } from '../model/screenplay';

/** Studio-extension metadata rides in an XML comment: any XML parser (Final
    Draft included) ignores comments, so it never appears on a page. */
const META_RE = /<!--\s*rewrite-studio\s+docFormat="([a-z_]+)"\s*-->/i;
const VALID_FORMATS = new Set<DocFormat>(['feature', 'one_hour', 'half_hour']);

/** Final Draft (.fdx) import/export. Maps the seven core paragraph types;
    anything else becomes action. Structurally tested; not yet validated
    inside the Final Draft application (the UI says so). */

const FDX_TO_CANONICAL: Record<string, ElementType> = {
  'Scene Heading': 'scene_heading',
  Action: 'action',
  Character: 'character',
  Parenthetical: 'parenthetical',
  Dialogue: 'dialogue',
  Transition: 'transition',
};

const CANONICAL_TO_FDX: Record<ElementType, string> = {
  scene_heading: 'Scene Heading',
  action: 'Action',
  character: 'Character',
  parenthetical: 'Parenthetical',
  dialogue: 'Dialogue',
  transition: 'Transition',
};

/** fast-xml-parser decodes named entities but not numeric character references. */
function decodeNumericEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)));
}

function textOf(node: unknown): string {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return decodeNumericEntities(String(node));
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (typeof node === 'object') return textOf((node as Record<string, unknown>)['#text'] ?? '');
  return '';
}

function toArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

export function parseFdx(xml: string): Screenplay {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: false,
    trimValues: false,
  });
  let doc: Record<string, any> | null = null;
  try {
    doc = parser.parse(xml) as Record<string, any>;
  } catch {
    doc = null;
  }

  const paragraphs = toArray<Record<string, unknown>>(doc?.FinalDraft?.Content?.Paragraph);
  const parsed: ParsedElement[] = paragraphs.map((p) => ({
    type: FDX_TO_CANONICAL[String(p?.['@_Type'] ?? '')] ?? 'action',
    text: textOf(p?.Text),
  }));

  const screenplay = assembleScreenplay(parsed, {
    id: `imported-fdx-${contentHash(xml)}`,
    title: 'IMPORTED SCRIPT (FDX)',
    draftLabel: 'Imported from Final Draft',
  });
  const metaMatch = xml.match(META_RE);
  if (metaMatch && VALID_FORMATS.has(metaMatch[1] as DocFormat)) {
    screenplay.docFormat = metaMatch[1] as DocFormat;
  }
  return screenplay;
}

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function serializeFdx(screenplay: Screenplay): string {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
    '<FinalDraft DocumentType="Script" Template="No" Version="5">',
    '  <Content>',
  ];
  for (const scene of screenplay.scenes) {
    for (const element of scene.elements) {
      lines.push(
        `    <Paragraph Type="${CANONICAL_TO_FDX[element.type]}"><Text>${escapeXml(element.text)}</Text></Paragraph>`,
      );
    }
  }
  lines.push('  </Content>');
  // Non-feature formats append the ignorable comment (feature is the default).
  if (screenplay.docFormat && screenplay.docFormat !== 'feature') {
    lines.push(`  <!-- rewrite-studio docFormat="${screenplay.docFormat}" -->`);
  }
  lines.push('</FinalDraft>', '');
  return lines.join('\n');
}
