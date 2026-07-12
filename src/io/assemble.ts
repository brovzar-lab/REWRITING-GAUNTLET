import type { Element, ElementType, Scene, Screenplay } from '../model/screenplay';

export interface ParsedElement {
  type: ElementType;
  text: string;
}

export interface ImportMeta {
  id: string;
  title: string;
  draftLabel: string;
}

/** Build a canonical screenplay from a flat parsed element stream.
    Scenes split at each scene heading (any preamble becomes its own block).
    Acts are a thirds-based GUESS — imported formats carry no act structure. */
export function assembleScreenplay(parsed: ParsedElement[], meta: ImportMeta): Screenplay {
  const stream = parsed.length > 0 ? parsed : [{ type: 'action' as ElementType, text: '' }];

  const groups: ParsedElement[][] = [];
  let current: ParsedElement[] = [];
  for (const p of stream) {
    if (p.type === 'scene_heading' && current.length > 0) {
      groups.push(current);
      current = [];
    }
    current.push(p);
  }
  if (current.length > 0) groups.push(current);

  const sceneCount = groups.length;
  const scenes: Scene[] = groups.map((group, i) => {
    const sceneId = `${meta.id}-s${i + 1}`;
    const elements: Element[] = group.map((p, j) => ({ id: `${sceneId}-e${j + 1}`, type: p.type, text: p.text }));
    const heading = group.find((p) => p.type === 'scene_heading');
    return {
      id: sceneId,
      number: i + 1,
      act: (Math.min(2, Math.floor((i / Math.max(1, sceneCount)) * 3)) + 1) as 1 | 2 | 3,
      slug: heading?.text ?? (group[0]?.text.slice(0, 40) || 'OPENING'),
      storyFunction: 'plot',
      elements,
    };
  });

  return { id: meta.id, title: meta.title, draftLabel: meta.draftLabel, scenes };
}

export function contentHash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
