import type { Screenplay } from '../model/screenplay';

/** Snapshot of every element's text at the moment a revision set starts. */
export function snapshotTexts(screenplay: Screenplay): Record<string, string> {
  const texts: Record<string, string> = {};
  for (const scene of screenplay.scenes) {
    for (const element of scene.elements) texts[element.id] = element.text;
  }
  return texts;
}

/** Elements whose text differs from the baseline, or that are new since it. */
export function computeRevisedElements(
  screenplay: Screenplay,
  baseline: Record<string, string>,
): Set<string> {
  const revised = new Set<string>();
  for (const scene of screenplay.scenes) {
    for (const element of scene.elements) {
      if (!(element.id in baseline) || baseline[element.id] !== element.text) {
        revised.add(element.id);
      }
    }
  }
  return revised;
}
