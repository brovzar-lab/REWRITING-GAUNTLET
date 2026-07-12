import { create } from 'zustand';
import type { Connection, Screenplay } from '../model/screenplay';
import type { EvidenceRecord } from '../model/evidence';
import { sampleConnections, sampleEvidence, sampleScreenplay } from '../model/sample/gauntlet-sample';
import {
  emptyWorkflow,
  MAX_INITIAL_READERS,
  MAX_INTERIM_READERS,
  type Finding,
  type Reader,
  type WorkflowState,
} from '../workflow/types';
import { EPPS_PASSES } from '../model/passes';
import { db } from './db';

export interface Selection {
  sceneId: string;
  elementId: string;
}

export type ThemeChoice = 'day' | 'night' | 'system';

export type UiLang = 'en' | 'es';

export interface AppState {
  lang: UiLang;
  setLang: (lang: UiLang) => void;
  focusMode: boolean;
  setFocusMode: (on: boolean) => void;
  fullBoard: boolean;
  setFullBoard: (on: boolean) => void;
  /** Screenplay rendering zoom, 0.5–2.0. Rendering only — never affects pagination. */
  zoom: number;
  setZoom: (zoom: number) => void;
  /** Revision set: element texts snapshotted when the set started, or null. */
  revisionBaseline: Record<string, string> | null;
  revisionSetLabel: string | null;
  goToPageOpen: boolean;
  setGoToPageOpen: (open: boolean) => void;
  importOpen: boolean;
  setImportOpen: (open: boolean) => void;
  aiSettingsOpen: boolean;
  setAiSettingsOpen: (open: boolean) => void;
  inspectorTab: 'evidence' | 'ai';
  setInspectorTab: (tab: 'evidence' | 'ai') => void;

  /** Rewrite workflow: annotated read, readers, findings, approvals. */
  workflow: WorkflowState;
  /** Guided private annotated read (scene by scene). */
  readModeActive: boolean;
  enterReadMode: () => void;
  exitReadMode: () => void;
  /** Move the read to a scene by index; clamps, selects, and records the visit. */
  goToReadScene: (index: number) => void;
  addReader: (name: string, role: Reader['role']) => void;
  removeReader: (readerId: string) => void;
  markSceneVisited: (sceneId: string) => void;
  completeAnnotatedRead: () => void;
  /** Store-level AI gate: throws until the private annotated read is complete. */
  setFindings: (passRunId: string, findings: Finding[]) => void;
  approveProposal: (findingId: string) => void;
  rejectFinding: (findingId: string) => void;
  setPassRunState: (passId: string, state: WorkflowState['passRuns'][string]) => void;
  /** Complete the active pass: snapshot the draft, mark the run complete,
      and bump the draft label. Passes stay repeatable afterwards. */
  completePass: (passId: string) => Promise<void>;
  setCloudAiConsent: (consented: boolean) => void;
  addEvidenceNote: (record: EvidenceRecord) => void;
  /** Replace the working draft (import). Caller is responsible for snapshotting first. */
  replaceDocument: (screenplay: Screenplay) => void;
  loadWorkflow: (state: WorkflowState, evidence: EvidenceRecord[], connections: Connection[]) => void;
  takeSnapshot: (label: string) => Promise<string>;
  restoreSnapshot: (snapshotId: string) => Promise<void>;

  startRevisionSet: (label: string) => void;
  endRevisionSet: () => void;
  loadRevision: (baseline: Record<string, string>, label: string) => void;
  screenplay: Screenplay;
  evidence: EvidenceRecord[];
  connections: Connection[];
  selection: Selection | null;
  theme: ThemeChoice;
  activePassId: string | null;
  panelSizes: Record<string, number>;
  collapsedPanels: Record<string, boolean>;

  select: (selection: Selection | null) => void;
  updateElementText: (sceneId: string, elementId: string, text: string) => void;
  reorderScenes: (fromIndex: number, toIndex: number) => void;
  setTheme: (theme: ThemeChoice) => void;
  setActivePass: (passId: string | null) => void;
  setPanelSize: (panel: string, px: number) => void;
  togglePanel: (panel: string) => void;
  loadScreenplay: (screenplay: Screenplay) => void;
  loadUiState: (ui: {
    theme: ThemeChoice;
    activePassId: string | null;
    panelSizes: Record<string, number>;
    collapsedPanels: Record<string, boolean>;
  }) => void;
  resetToSample: () => void;
}

const clone = <T>(v: T): T => (typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)));

export const useAppStore = create<AppState>((set, get) => ({
  lang: 'en',
  setLang: (lang) => set({ lang }),
  focusMode: false,
  setFocusMode: (focusMode) => set({ focusMode }),
  fullBoard: false,
  setFullBoard: (fullBoard) => set({ fullBoard }),
  zoom: 1,
  setZoom: (zoom) => set({ zoom: Math.min(2, Math.max(0.5, zoom)) }),
  revisionBaseline: null,
  revisionSetLabel: null,
  goToPageOpen: false,
  setGoToPageOpen: (goToPageOpen) => set({ goToPageOpen }),
  importOpen: false,
  setImportOpen: (importOpen) => set({ importOpen }),
  aiSettingsOpen: false,
  setAiSettingsOpen: (aiSettingsOpen) => set({ aiSettingsOpen }),
  inspectorTab: 'evidence',
  setInspectorTab: (inspectorTab) => set({ inspectorTab }),

  workflow: emptyWorkflow(),

  readModeActive: false,

  enterReadMode: () => {
    set({ readModeActive: true });
    get().goToReadScene(0);
  },

  exitReadMode: () => set({ readModeActive: false }),

  goToReadScene: (index) => {
    const scenes = get().screenplay.scenes;
    const scene = scenes[Math.min(scenes.length - 1, Math.max(0, index))];
    if (!scene) return;
    get().select({ sceneId: scene.id, elementId: scene.elements[0].id });
    get().markSceneVisited(scene.id);
  },

  addReader: (name, role) => {
    const readers = get().workflow.readers;
    if (role === 'initial' && readers.filter((r) => r.role === 'initial').length >= MAX_INITIAL_READERS) {
      throw new Error('Epps rule: never more than five initial readers (three are recommended).');
    }
    if (role === 'interim' && readers.filter((r) => r.role === 'interim').length >= MAX_INTERIM_READERS) {
      throw new Error('Epps rule: exactly one trusted interim reader.');
    }
    const reader: Reader = { id: `reader-${crypto.randomUUID()}`, name, role, addedAt: Date.now() };
    set((s) => ({ workflow: { ...s.workflow, readers: [...s.workflow.readers, reader] } }));
  },

  removeReader: (readerId) =>
    set((s) => ({ workflow: { ...s.workflow, readers: s.workflow.readers.filter((r) => r.id !== readerId) } })),

  markSceneVisited: (sceneId) =>
    set((s) =>
      s.workflow.visitedScenes.includes(sceneId)
        ? s
        : { workflow: { ...s.workflow, visitedScenes: [...s.workflow.visitedScenes, sceneId] } },
    ),

  completeAnnotatedRead: () => set((s) => ({ workflow: { ...s.workflow, annotatedReadComplete: true } })),

  setFindings: (passRunId, findings) => {
    if (!get().workflow.annotatedReadComplete) {
      throw new Error('AI diagnosis stays sealed until the private annotated read is complete.');
    }
    set((s) => ({
      workflow: {
        ...s.workflow,
        findings: [...s.workflow.findings.filter((f) => f.passRunId !== passRunId), ...findings],
      },
    }));
  },

  approveProposal: (findingId) => {
    const state = get();
    const finding = state.workflow.findings.find((f) => f.id === findingId);
    if (!finding || finding.resolution !== 'open') throw new Error('Finding is not open for approval.');
    const proposal = finding.proposal;
    if (!proposal) throw new Error('Finding has no proposal to apply.');
    if (!finding.citations.some((c) => c.elementId === proposal.elementId)) {
      throw new Error('Scene lock: the proposal targets an element the finding does not cite.');
    }
    // Every applied change must show a revision mark: start a set if none is open.
    if (!state.revisionBaseline) {
      const pass = EPPS_PASSES.find((p) => p.id === finding.passId);
      state.startRevisionSet(pass ? `${pass.name} pass` : finding.passId);
    }
    state.updateElementText(proposal.sceneId, proposal.elementId, proposal.newText);
    const approvalId = `approval-${crypto.randomUUID()}`;
    set((s) => ({
      evidence: [
        ...s.evidence,
        {
          id: `ev-${approvalId}`,
          source: 'ai',
          claimType: 'writer_confirmed',
          status: finding.status,
          summary: finding.summary,
          sceneId: proposal.sceneId,
          elementId: proposal.elementId,
        },
      ],
      workflow: {
        ...s.workflow,
        findings: s.workflow.findings.map((f) => (f.id === findingId ? { ...f, resolution: 'approved' } : f)),
        approvals: [
          ...s.workflow.approvals,
          {
            id: approvalId,
            findingId,
            passId: finding.passId,
            sceneId: proposal.sceneId,
            elementId: proposal.elementId,
            oldText: proposal.oldText,
            newText: proposal.newText,
            why: proposal.rationale,
            approvedAt: Date.now(),
          },
        ],
      },
    }));
  },

  rejectFinding: (findingId) =>
    set((s) => ({
      workflow: {
        ...s.workflow,
        findings: s.workflow.findings.map((f) => (f.id === findingId ? { ...f, resolution: 'rejected' } : f)),
      },
    })),

  setPassRunState: (passId, runState) =>
    set((s) => ({ workflow: { ...s.workflow, passRuns: { ...s.workflow.passRuns, [passId]: runState } } })),

  completePass: async (passId) => {
    const state = get();
    const pass = EPPS_PASSES.find((p) => p.id === passId);
    await state.takeSnapshot(`After ${pass?.name ?? passId} pass`);
    set((s) => {
      const passRuns: WorkflowState['passRuns'] = { ...s.workflow.passRuns, [passId]: 'complete' };
      const completed = Object.values(passRuns).filter((v) => v === 'complete').length;
      return {
        workflow: { ...s.workflow, passRuns },
        screenplay: { ...s.screenplay, draftLabel: `Rewrite ${completed}` },
      };
    });
  },

  setCloudAiConsent: (cloudAiConsent) => set((s) => ({ workflow: { ...s.workflow, cloudAiConsent } })),

  addEvidenceNote: (record) => set((s) => ({ evidence: [...s.evidence, record] })),

  replaceDocument: (screenplay) =>
    set({
      screenplay,
      evidence: [],
      connections: [],
      selection: null,
      activePassId: null,
      revisionBaseline: null,
      revisionSetLabel: null,
      workflow: emptyWorkflow(),
      readModeActive: false,
    }),

  loadWorkflow: (workflow, evidence, connections) => set({ workflow, evidence, connections }),

  takeSnapshot: async (label) => {
    const s = get();
    const id = `snap-${crypto.randomUUID()}`;
    await db.snapshots.put({
      id,
      screenplayId: s.screenplay.id,
      label,
      takenAt: Date.now(),
      screenplay: clone(s.screenplay),
    });
    return id;
  },

  restoreSnapshot: async (snapshotId) => {
    const row = await db.snapshots.get(snapshotId);
    if (!row) throw new Error('Snapshot not found.');
    set({ screenplay: clone(row.screenplay), selection: null });
  },
  startRevisionSet: (label) =>
    set((s) => ({
      revisionSetLabel: label,
      revisionBaseline: Object.fromEntries(
        s.screenplay.scenes.flatMap((scene) => scene.elements.map((e) => [e.id, e.text])),
      ),
    })),
  endRevisionSet: () => set({ revisionBaseline: null, revisionSetLabel: null }),
  loadRevision: (revisionBaseline, revisionSetLabel) => set({ revisionBaseline, revisionSetLabel }),
  screenplay: clone(sampleScreenplay),
  evidence: sampleEvidence,
  connections: sampleConnections,
  selection: null,
  theme: 'night',
  activePassId: null,
  panelSizes: {},
  collapsedPanels: {},

  select: (selection) => set({ selection }),

  updateElementText: (sceneId, elementId, text) =>
    set((state) => ({
      screenplay: {
        ...state.screenplay,
        scenes: state.screenplay.scenes.map((scene) =>
          scene.id !== sceneId
            ? scene
            : {
                ...scene,
                elements: scene.elements.map((el) => (el.id === elementId ? { ...el, text } : el)),
              },
        ),
      },
    })),

  reorderScenes: (fromIndex, toIndex) =>
    set((state) => {
      const scenes = [...state.screenplay.scenes];
      const [moved] = scenes.splice(fromIndex, 1);
      scenes.splice(toIndex, 0, moved);
      return {
        screenplay: {
          ...state.screenplay,
          scenes: scenes.map((s, i) => ({ ...s, number: i + 1 })),
        },
      };
    }),

  setTheme: (theme) => set({ theme }),
  setActivePass: (activePassId) => set({ activePassId }),
  setPanelSize: (panel, px) => set((s) => ({ panelSizes: { ...s.panelSizes, [panel]: px } })),
  togglePanel: (panel) =>
    set((s) => ({ collapsedPanels: { ...s.collapsedPanels, [panel]: !s.collapsedPanels[panel] } })),

  loadScreenplay: (screenplay) => set({ screenplay }),
  loadUiState: (ui) => set(ui),
  resetToSample: () =>
    set({
      screenplay: clone(sampleScreenplay),
      evidence: sampleEvidence,
      connections: sampleConnections,
      selection: null,
      theme: 'night',
      activePassId: null,
      panelSizes: {},
      collapsedPanels: {},
      zoom: 1,
      revisionBaseline: null,
      revisionSetLabel: null,
      workflow: emptyWorkflow(),
      readModeActive: false,
    }),
}));

/** Read one element's text out of a screenplay (test and UI helper). */
export function elementText(screenplay: Screenplay, sceneId: string, elementId: string): string | undefined {
  return screenplay.scenes.find((s) => s.id === sceneId)?.elements.find((e) => e.id === elementId)?.text;
}
