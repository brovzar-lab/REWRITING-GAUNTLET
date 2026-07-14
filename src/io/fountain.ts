import { assembleScreenplay, contentHash, type ParsedElement } from './assemble';
import type { DocFormat, ElementType, Screenplay } from '../model/screenplay';

/** Studio-extension metadata rides in a Fountain boneyard comment: ignored by
    every Fountain renderer, never shown on a page, and stripped before parsing
    so it can never become an action line. */
const META_RE = /\/\*\s*rewrite-studio\s+docFormat=([a-z_]+)\s*\*\//i;
const VALID_FORMATS = new Set<DocFormat>(['feature', 'one_hour', 'half_hour']);

/** Fountain import/export against the canonical model.
    Import never throws: anything unrecognized becomes an action line.
    Acts do not exist in Fountain; import assigns them by thirds as a labeled guess. */

const SCENE_HEADING = /^(INT|EXT|EST|INT\.\/EXT|INT\/EXT|I\/E)[. ]/i;
const TRANSITION = /(TO:|FADE OUT\.?|FADE TO BLACK\.?)$/;

function isUpper(line: string): boolean {
  return line === line.toUpperCase() && /[A-ZÀ-ÖØ-Þ]/.test(line);
}

function isSceneHeading(line: string): boolean {
  return SCENE_HEADING.test(line) || line.startsWith('.') /* forced heading */;
}

function isTransition(line: string): boolean {
  return isUpper(line) && TRANSITION.test(line.trim());
}

function isParenthetical(line: string): boolean {
  return line.startsWith('(') && line.endsWith(')');
}

/** A character cue: uppercase, not a heading/transition, next line non-blank. */
function isCharacter(line: string, nextLine: string | undefined): boolean {
  if (!isUpper(line) || isSceneHeading(line) || isTransition(line)) return false;
  const bare = line.replace(/\(.*\)\s*$/, '').trim(); // ignore (CONT'D)-style extensions
  if (bare.length === 0 || bare.length > 40) return false;
  return nextLine !== undefined && nextLine.trim().length > 0;
}

export function parseFountain(text: string): Screenplay {
  // Pull the sidecar format out and remove the whole boneyard comment first,
  // so it never reaches the line parser.
  const metaMatch = text.match(META_RE);
  const docFormat =
    metaMatch && VALID_FORMATS.has(metaMatch[1] as DocFormat) ? (metaMatch[1] as DocFormat) : undefined;
  const cleaned = text.replace(/\/\*\s*rewrite-studio[\s\S]*?\*\//gi, '');
  const rawLines = cleaned.replace(/\r\n/g, '\n').split('\n');

  // Title page: leading "Key: Value" lines up to the first blank line.
  let title = 'UNTITLED';
  let draftLabel = 'Imported draft';
  let bodyStart = 0;
  if (/^[A-Za-z ]+:\s*\S/.test(rawLines[0] ?? '') && !isSceneHeading(rawLines[0] ?? '')) {
    while (bodyStart < rawLines.length && rawLines[bodyStart].trim() !== '') {
      const m = rawLines[bodyStart].match(/^([A-Za-z ]+):\s*(.*)$/);
      if (m) {
        const key = m[1].trim().toLowerCase();
        if (key === 'title') title = m[2].trim();
        if (key === 'draft date' || key === 'draft') draftLabel = m[2].trim();
      }
      bodyStart += 1;
    }
  }

  // Collapse the body into logical lines (paragraphs already split by newline).
  const lines = rawLines.slice(bodyStart);

  const parsed: ParsedElement[] = [];
  let inDialogueBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') {
      inDialogueBlock = false;
      continue;
    }
    const immediateNext = lines[i + 1];

    if (isSceneHeading(line)) {
      parsed.push({ type: 'scene_heading', text: line.replace(/^\./, '').toUpperCase() });
      inDialogueBlock = false;
    } else if (isTransition(line)) {
      parsed.push({ type: 'transition', text: line });
      inDialogueBlock = false;
    } else if (!inDialogueBlock && isCharacter(line, immediateNext)) {
      parsed.push({ type: 'character', text: line });
      inDialogueBlock = true;
    } else if (inDialogueBlock && isParenthetical(line)) {
      parsed.push({ type: 'parenthetical', text: line });
    } else if (inDialogueBlock) {
      parsed.push({ type: 'dialogue', text: line });
    } else {
      parsed.push({ type: 'action', text: line });
    }
  }

  const screenplay = assembleScreenplay(parsed, {
    id: `imported-${contentHash(text)}`,
    title,
    draftLabel,
  });
  if (docFormat) screenplay.docFormat = docFormat;
  return screenplay;
}

export function serializeFountain(screenplay: Screenplay): string {
  const out: string[] = [`Title: ${screenplay.title}`, `Draft date: ${screenplay.draftLabel}`, ''];
  let prevType: ElementType | null = null;
  for (const scene of screenplay.scenes) {
    for (const element of scene.elements) {
      const stackContinues =
        (element.type === 'dialogue' || element.type === 'parenthetical') &&
        (prevType === 'character' || prevType === 'parenthetical' || prevType === 'dialogue');
      if (prevType !== null && !stackContinues) out.push('');
      out.push(element.text);
      prevType = element.type;
    }
  }
  let text = out.join('\n') + '\n';
  // Non-feature formats append the ignorable sidecar comment (feature is the default).
  if (screenplay.docFormat && screenplay.docFormat !== 'feature') {
    text += `\n/* rewrite-studio docFormat=${screenplay.docFormat} */\n`;
  }
  return text;
}
