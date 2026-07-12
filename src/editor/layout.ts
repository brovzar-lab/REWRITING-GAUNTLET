import type { ElementType } from '../model/screenplay';

/** US-letter screenplay layout (inches). Courier 12pt: 10 chars/inch, 6 lines/inch. */
export const PAGE = {
  width: 8.5,
  marginLeft: 1.5,
  marginRight: 1.0,
  marginTop: 1.0,
  marginBottom: 1.0,
};

/** Per-element indent and width, measured from the 1.5in left margin. */
export const ELEMENT_LAYOUT: Record<ElementType, { indent: number; width: number; align?: 'right'; uppercase?: boolean }> = {
  scene_heading: { indent: 0, width: 6.0, uppercase: true },
  action: { indent: 0, width: 6.0 },
  character: { indent: 2.2, width: 3.8, uppercase: true },
  parenthetical: { indent: 1.6, width: 2.0 },
  dialogue: { indent: 1.0, width: 3.5 },
  transition: { indent: 0, width: 6.0, align: 'right', uppercase: true },
};

/* True pagination lives in src/pagination/engine.ts and consumes these
   layout constants through src/pagination/metrics.ts. */
