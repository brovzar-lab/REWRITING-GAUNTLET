import type { ClaimType, EvidenceStatus } from '../model/evidence';

/** Human readers. Epps: recommend 3, never more than 5 initial readers;
    exactly ONE trusted interim reader. */
export interface Reader {
  id: string;
  name: string;
  role: 'initial' | 'interim';
  addedAt: number;
}

export const MAX_INITIAL_READERS = 5;
export const RECOMMENDED_INITIAL_READERS = 3;
export const MAX_INTERIM_READERS = 1;

export interface Citation {
  sceneId: string;
  elementId: string;
}

/** A concrete scene-level text change the writer may approve or reject.
    It can only ever touch an element the finding cites. */
export interface Proposal {
  sceneId: string;
  elementId: string;
  oldText: string;
  newText: string;
  rationale: string;
}

/** One AI hypothesis about the current pass, with evidence. Never a score. */
export interface Finding {
  id: string;
  passId: string;
  passRunId: string;
  provider: 'local' | 'cloud';
  claimType: Extract<ClaimType, 'ai_hypothesis' | 'unresolved_hypothesis'>;
  status: EvidenceStatus;
  summary: string;
  citations: Citation[];
  proposal?: Proposal;
  resolution: 'open' | 'approved' | 'rejected';
  createdAt: number;
  /** 0..1, hypothesis confidence. Only the cloud provider may fill this;
      the local analyzer never sets it. Never an overall screenplay score. */
  confidence?: number;
}

/** Provenance for an applied change: who/what/why/when/which pass. */
export interface Approval {
  id: string;
  findingId: string;
  passId: string;
  sceneId: string;
  elementId: string;
  oldText: string;
  newText: string;
  why: string;
  approvedAt: number;
}

export type PassRunState = 'not_started' | 'diagnosing' | 'reviewing' | 'complete';

export interface WorkflowState {
  annotatedReadComplete: boolean;
  visitedScenes: string[];
  readers: Reader[];
  findings: Finding[];
  approvals: Approval[];
  passRuns: Record<string, PassRunState>;
  cloudAiConsent: boolean;
}

export function emptyWorkflow(): WorkflowState {
  return {
    annotatedReadComplete: false,
    visitedScenes: [],
    readers: [],
    findings: [],
    approvals: [],
    passRuns: {},
    cloudAiConsent: false,
  };
}
