import { assembleScreenplay, contentHash, type ParsedElement } from './assemble';
import type { ElementType, Screenplay } from '../model/screenplay';

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
  const rawLines = text.replace(/\r\n/g, '\n').split('\n');

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

  return assembleScreenplay(parsed, {
    id: `imported-${contentHash(text)}`,
    title,
    draftLabel,
  });
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
  return out.join('\n') + '\n';
}
