import type { Scene, Screenplay } from './screenplay';

/** Epps's Scene pass tool: every scene states its point in one sentence —
    "The point of this scene is…" — and earns its place or gets cut.
    The structured sub-fields (conflict, turn, value change, audience learns)
    are a Studio extension and are labeled EXT in the UI. */

export type ScenePointVerdict = 'earns' | 'unsure' | 'cut_candidate';

export interface ScenePoint {
  sceneId: string;
  point: string;
  /** Null until the writer judges the scene. Writer-only; never auto-set. */
  verdict: ScenePointVerdict | null;
  /** Studio extension fields. */
  conflict: string;
  turn: string;
  valueChange: string;
  audienceLearns: string;
}

export function emptyScenePoint(sceneId: string): ScenePoint {
  return {
    sceneId,
    point: '',
    verdict: null,
    conflict: '',
    turn: '',
    valueChange: '',
    audienceLearns: '',
  };
}

export function hasStatedPoint(sp: ScenePoint | undefined): boolean {
  return !!sp && sp.point.trim() !== '';
}

/** The scenes with no stated point, in script order. A fact about the
    writer's own data — the analyzer cites these, it never guesses. */
export function unpointedScenes(
  screenplay: Screenplay,
  scenePoints: Record<string, ScenePoint>,
): Scene[] {
  return screenplay.scenes.filter((s) => !hasStatedPoint(scenePoints[s.id]));
}
