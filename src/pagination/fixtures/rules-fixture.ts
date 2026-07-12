import type { ElementType, Scene, Screenplay } from '../../model/screenplay';

/** Deterministic fixture builder for pagination tests.
    Filler tokens are exactly as wide as the element, so one token = one line. */

let idCounter = 0;

export function fx(scenesSpec: Array<Array<[ElementType, string]>>): Screenplay {
  idCounter = 0;
  const scenes: Scene[] = scenesSpec.map((elements, i) => {
    const sceneId = `fs${i + 1}`;
    return {
      id: sceneId,
      number: i + 1,
      act: 1,
      slug: elements[0][1],
      storyFunction: 'plot',
      elements: elements.map(([type, text]) => ({ id: `${sceneId}-e${++idCounter}`, type, text })),
    };
  });
  return { id: 'fixture', title: 'FIXTURE', draftLabel: 'test', scenes };
}

/** Action text that wraps to exactly n lines (tokens of width 60). */
export function actionLines(n: number): string {
  return Array.from({ length: n }, (_, i) => `A${String(i).padStart(2, '0')}${'x'.repeat(57)}`).join(' ');
}

/** Dialogue text that wraps to exactly n lines (tokens of width 35). */
export function dialogueLines(n: number): string {
  return Array.from({ length: n }, (_, i) => `D${String(i).padStart(2, '0')}${'x'.repeat(32)}`).join(' ');
}
