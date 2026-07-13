import { EPPS_PASSES } from './passes';

/** The Game Plan is writer-authored, written after the private annotated read
    (Epps: it starts with the Statement of Intent). The analyzer never fills it. */

export interface ElementAnchor {
  sceneId: string;
  elementId: string;
}

/** A recurring image or idea the writer tracks across exact lines. */
export interface Motif {
  id: string;
  name: string;
  occurrences: ElementAnchor[];
}

/** The Compass: what keeps the rewrite pointed at the movie the writer wants.
    Touchstone and ticking clock are Epps's tools; occurrence links are ours. */
export interface Compass {
  touchstone: string;
  tickingClock: string;
  tickingClockAnchor: ElementAnchor | null;
  themeThroughAction: string;
  motifs: Motif[];
}

export interface GamePlan {
  statementOfIntent: string;
  about: string;
  improves: string;
  mustNotBeLost: string;
  /** Studio extension — not from Epps's book. */
  audiencePromise: string;
  /** Studio extension — not from Epps's book. */
  emotionalSpine: string;
  /** Pass ids in the writer's priority order. Passes stay repeatable and skippable. */
  passPriorities: string[];
  compass: Compass;
}

export function emptyGamePlan(): GamePlan {
  return {
    statementOfIntent: '',
    about: '',
    improves: '',
    mustNotBeLost: '',
    audiencePromise: '',
    emotionalSpine: '',
    passPriorities: EPPS_PASSES.map((p) => p.id),
    compass: {
      touchstone: '',
      tickingClock: '',
      tickingClockAnchor: null,
      themeThroughAction: '',
      motifs: [],
    },
  };
}

/** Pure drop resolution for the priority list, mirroring the board's pattern. */
export function movePassPriority(priorities: string[], fromId: string, toId: string): string[] {
  if (fromId === toId) return [...priorities];
  const from = priorities.indexOf(fromId);
  const to = priorities.indexOf(toId);
  if (from === -1 || to === -1) return [...priorities];
  const next = [...priorities];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
