import Dexie, { type Table } from 'dexie';
import type { Connection, Screenplay } from '../model/screenplay';
import type { EvidenceRecord } from '../model/evidence';
import type { WorkflowState } from '../workflow/types';
import type { GamePlan } from '../model/gameplan';
import type { ScenePoint } from '../model/scenepoint';
import type { HighPointMarker, StoryBeat } from '../model/markers';
import type { ThemeChoice, UiLang } from './appStore';

export interface DocumentRow {
  id: string;
  screenplay: Screenplay;
  updatedAt: number;
}

export interface UiRow {
  id: 'ui';
  theme: ThemeChoice;
  lang?: UiLang;
  zoom?: number;
  activeDocumentId?: string;
  activePassId: string | null;
  panelSizes: Record<string, number>;
  collapsedPanels: Record<string, boolean>;
}

export interface BaselineRow {
  id: string; // screenplay id
  label: string;
  texts: Record<string, string>;
}

export interface SnapshotRow {
  id: string;
  screenplayId: string;
  label: string;
  takenAt: number;
  screenplay: Screenplay;
}

export interface WorkflowRow {
  id: string; // screenplay id
  state: WorkflowState;
  evidence: EvidenceRecord[];
  connections: Connection[];
  /** Added in the Epps methodology phase. Optional: pre-phase rows lack them. */
  gamePlan?: GamePlan;
  scenePoints?: Record<string, ScenePoint>;
  storyBeats?: StoryBeat[];
  highPoints?: HighPointMarker[];
  polishReadComplete?: boolean;
}

class RewriteStudioDB extends Dexie {
  documents!: Table<DocumentRow, string>;
  ui!: Table<UiRow, string>;
  baselines!: Table<BaselineRow, string>;
  snapshots!: Table<SnapshotRow, string>;
  workflow!: Table<WorkflowRow, string>;

  constructor() {
    super('rewrite-studio');
    this.version(1).stores({ documents: 'id', ui: 'id' });
    this.version(2).stores({ documents: 'id', ui: 'id', baselines: 'id' });
    this.version(3).stores({
      documents: 'id',
      ui: 'id',
      baselines: 'id',
      snapshots: 'id, screenplayId, takenAt',
      workflow: 'id',
    });
  }
}

export const db = new RewriteStudioDB();
