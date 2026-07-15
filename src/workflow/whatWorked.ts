import type { WorkflowState } from './types';
import type { Screenplay } from '../model/screenplay';

export interface WhatWorkedItem {
  id: string;
  text: string;
  attribution: string;
}

/** Epps: protect what works above all. Reader praise + the writer's own
    great-stuff marks, pinned through every stage after Notes. */
export function whatWorkedItems(workflow: WorkflowState, screenplay: Screenplay): WhatWorkedItem[] {
  const fromReaders = workflow.readers.flatMap((r) =>
    (r.notes ?? [])
      .filter((n) => n.kind === 'whatWorked')
      .map((n) => ({ id: n.id, text: n.quote, attribution: r.name })),
  );
  const fromMarks = workflow.readMarks
    .filter((m) => m.type === 'great')
    .map((m) => {
      const scene = screenplay.scenes.find((s) => s.id === m.sceneId);
      const el = scene?.elements.find((e) => e.id === m.elementId);
      return { id: m.id, text: el?.text ?? `p. ${m.page}`, attribution: 'You' };
    });
  return [...fromReaders, ...fromMarks];
}
