import type { useAppStore } from '../store/appStore';

/** The nine-stage Epps journey. Amendment 1: Polish is a real stage between
    Passes and Let Go (Epps has a full Polish Read chapter). Stage order note
    (amendment 2): the book gathers reader notes BEFORE the annotated read;
    we read first so the writer's own reactions stay uncolored. That order is
    a Studio Extension and is labeled as such in the strip tooltip. */

type S = ReturnType<typeof useAppStore.getState>;

export type JourneyStageId =
  | 'script'
  | 'privateRead'
  | 'notes'
  | 'organize'
  | 'interpret'
  | 'gameplan'
  | 'passes'
  | 'polish'
  | 'letgo';

export interface JourneyStage {
  id: JourneyStageId;
  done: (s: S) => boolean;
  act: (s: S) => void;
}

const hasReaderNotes = (s: S) => s.workflow.readers.some((r) => (r.notes ?? []).length > 0);
// Organize/Interpret have no dedicated surface yet (next handoff). They count
// done once the writer has moved on to a game plan, so the strip never traps
// the current-stage marker on an unbuildable stage.
const movedPastNotes = (s: S) => s.gamePlan.statementOfIntent.trim() !== '';

export const JOURNEY_STAGES: JourneyStage[] = [
  { id: 'script', done: (s) => s.screenplay.scenes.length > 0, act: (s) => s.setLeftWorkspace('project') },
  { id: 'privateRead', done: (s) => s.workflow.annotatedReadComplete, act: (s) => s.enterReadMode() },
  { id: 'notes', done: hasReaderNotes, act: (s) => s.setNotesIntakeOpen(true) },
  { id: 'organize', done: movedPastNotes, act: (s) => s.setRightWorkspace('evidence') },
  { id: 'interpret', done: movedPastNotes, act: (s) => s.setRightWorkspace('evidence') },
  { id: 'gameplan', done: movedPastNotes, act: (s) => s.setRightWorkspace('gameplan') },
  {
    id: 'passes',
    done: (s) => Object.values(s.workflow.passRuns).some((v) => v === 'complete'),
    act: (s) => s.setRightWorkspace('passes'),
  },
  { id: 'polish', done: (s) => s.polishReadComplete, act: (s) => s.startPolishRead() },
  { id: 'letgo', done: () => false, act: (s) => s.setExportOpen(true) },
];

export function currentJourneyStage(s: S): number {
  const i = JOURNEY_STAGES.findIndex((stage) => !stage.done(s));
  return i === -1 ? JOURNEY_STAGES.length - 1 : i;
}

/** Optional stat for a stage segment, e.g. readers 2/5. Null = no stat. */
export function stageStat(s: S, id: JourneyStageId): { current: number; total: number } | null {
  if (id === 'privateRead') {
    return { current: s.workflow.visitedScenes.length, total: s.screenplay.scenes.length };
  }
  if (id === 'notes') return { current: s.workflow.readers.length, total: 5 };
  return null;
}
