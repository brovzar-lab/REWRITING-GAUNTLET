import { create } from 'zustand';
import type { Connection, Screenplay } from '../model/screenplay';
import type { EvidenceRecord } from '../model/evidence';
import { sampleConnections, sampleEvidence, sampleScreenplay } from '../model/sample/gauntlet-sample';
import {
  emptyWorkflow,
  MAX_INITIAL_READERS,
  MAX_INTERIM_READERS,
  type Approval,
  type Finding,
  type Reader,
  type ReaderNote,
  type ReadMark,
  type WorkflowState,
} from '../workflow/types';
import { EPPS_PASSES } from '../model/passes';
import { emptyGamePlan, type Compass, type ElementAnchor, type GamePlan } from '../model/gameplan';
import { emptyScenePoint, type ScenePoint } from '../model/scenepoint';
import { isStructuralRole, type HighPointMarker, type HighPointRole, type StoryBeat, type StoryBeatKind } from '../model/markers';
import { db } from './db';

export interface Selection {
  sceneId: string;
  elementId: string;
}

/** What just happened in a completed pass — shown as the pass summary. */
export interface PassSummary {
  passId: string;
  passName: string;
  approved: Approval[];
  rejectedCount: number;
  unresolvedCount: number;
  snapshotLabel: string;
  draftLabel: string;
  nextPassId: string | null;
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
  inspectorTab: 'evidence' | 'pass' | 'gameplan';
  setInspectorTab: (tab: 'evidence' | 'pass' | 'gameplan') => void;

  /** WriterDuet-informed workstation IA. The left panel (Project/Scenes or
      none), the right context panel, and the overall layout mode are chosen
      independently so the workspace shows one thing per region, not all. */
  leftWorkspace: 'project' | 'scenes' | null;
  setLeftWorkspace: (ws: 'project' | 'scenes' | null) => void;
  rightWorkspace: 'passes' | 'evidence' | 'gameplan';
  setRightWorkspace: (ws: 'passes' | 'evidence' | 'gameplan') => void;
  layoutMode: 'workbench' | 'board' | 'focus' | 'script_notes';
  setLayoutMode: (mode: 'workbench' | 'board' | 'focus' | 'script_notes') => void;
  /** The rail item the writer explicitly selected. Only this one carries the
      strong active state in the rail; other region-active items (e.g. the
      Journey guide sitting in the right panel by default) show a quiet dot. */
  railFocus: 'project' | 'journey' | 'scenes' | 'board' | 'evidence' | 'gameplan' | 'passes' | 'polish';
  setRailFocus: (id: 'project' | 'journey' | 'scenes' | 'board' | 'evidence' | 'gameplan' | 'passes' | 'polish') => void;
  /** Read-only viewing (Format menu). The editor respects it. */
  readOnly: boolean;
  toggleReadOnly: () => void;
  /** In-script find bar. */
  findOpen: boolean;
  setFindOpen: (open: boolean) => void;
  /** Stage-3 Notes intake takes over the center region when true. */
  notesIntakeOpen: boolean;
  setNotesIntakeOpen: (open: boolean) => void;
  /** Change the current document's format (Production menu / Studio extension). */
  setDocFormat: (format: 'feature' | 'one_hour' | 'half_hour') => void;
  /** Whether a script document is open in the center. False shows the empty
      "Open or import a script" state (a fresh, empty project). */
  documentOpen: boolean;
  newProject: () => Promise<void>;
  openSampleProject: () => void;
  /** Project-side documents (local-first, never exported, never seen by AI). */
  privatePad: string;
  setPrivatePad: (text: string) => void;
  projectNotes: string;
  setProjectNotes: (text: string) => void;
  loadProjectDocs: (docs: { privatePad?: string; projectNotes?: string }) => void;
  exportOpen: boolean;
  setExportOpen: (open: boolean) => void;
  noteComposerOpen: boolean;
  setNoteComposerOpen: (open: boolean) => void;
  historyOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  printViewOpen: boolean;
  setPrintViewOpen: (open: boolean) => void;

  /** The writer's Game Plan + Compass. Writer-authored only; the analyzer never fills it. */
  gamePlan: GamePlan;
  updateGamePlan: (patch: Partial<Omit<GamePlan, 'compass'>>) => void;
  updateCompass: (patch: Partial<Omit<Compass, 'motifs'>>) => void;
  setPassPriorities: (passIds: string[]) => void;
  addMotif: (name: string) => void;
  removeMotif: (motifId: string) => void;
  addMotifOccurrence: (motifId: string, anchor: ElementAnchor) => void;
  removeMotifOccurrence: (motifId: string, elementId: string) => void;
  loadGamePlan: (gamePlan: GamePlan) => void;

  /** Per-scene Scene Points, writer-authored. Keyed by scene id. */
  scenePoints: Record<string, ScenePoint>;
  updateScenePoint: (sceneId: string, patch: Partial<Omit<ScenePoint, 'sceneId'>>) => void;
  loadScenePoints: (scenePoints: Record<string, ScenePoint>) => void;

  /** Set-up / pay-off beats anchored to exact elements. */
  storyBeats: StoryBeat[];
  /** Mark a line as a set-up or pay-off. Same kind toggles off; other kind switches. */
  setStoryBeat: (kind: StoryBeatKind, sceneId: string, elementId: string) => void;
  pairBeats: (setupId: string, payoffId: string) => void;
  unpairBeat: (beatId: string) => void;
  loadStoryBeats: (storyBeats: StoryBeat[]) => void;

  /** Four Major High Points + emotional highs/lows. One marker per scene. */
  highPoints: HighPointMarker[];
  setHighPoint: (sceneId: string, role: HighPointRole | null) => void;
  loadHighPoints: (highPoints: HighPointMarker[]) => void;

  /** Polish Read: the final cover-to-cover page walk. active/page are ephemeral;
      complete persists as workflow progress. */
  polishReadActive: boolean;
  polishReadPage: number;
  polishReadComplete: boolean;
  startPolishRead: () => void;
  setPolishReadPage: (page: number) => void;
  exitPolishRead: () => void;
  completePolishRead: () => void;
  loadPolishReadComplete: (complete: boolean) => void;

  /** Rewrite workflow: annotated read, readers, findings, approvals. */
  workflow: WorkflowState;
  /** Guided private annotated read (scene by scene). */
  readModeActive: boolean;
  enterReadMode: () => void;
  exitReadMode: () => void;
  /** Move the read to a scene by index; clamps, selects, and records the visit. */
  goToReadScene: (index: number) => void;
  addReader: (name: string, role: Reader['role'], title?: string) => void;
  addReaderNote: (readerId: string, note: ReaderNote) => void;
  setReaderNoteKind: (readerId: string, noteId: string, kind: ReaderNote['kind']) => void;
  /** Private-read pencil marks (writer only; element-level). */
  addReadMark: (mark: ReadMark) => void;
  removeReadMark: (id: string) => void;
  /** Wall-clock start of the current sitting; null when not reading. */
  readSittingStartedAt: number | null;
  removeReader: (readerId: string) => void;
  markSceneVisited: (sceneId: string) => void;
  completeAnnotatedRead: () => void;
  /** Store-level AI gate: throws until the private annotated read is complete. */
  setFindings: (passRunId: string, findings: Finding[]) => void;
  approveProposal: (findingId: string) => void;
  rejectFinding: (findingId: string) => void;
  setPassRunState: (passId: string, state: WorkflowState['passRuns'][string]) => void;
  /** Complete the active pass: snapshot the draft, mark the run complete,
      bump the draft label, and publish a pass summary. Passes stay repeatable. */
  completePass: (passId: string) => Promise<void>;
  passSummary: PassSummary | null;
  clearPassSummary: () => void;
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
  /** Where the story board lives: beside the page (approved hybrid) or as a bottom drawer.
      Follows the viewport; not persisted. */
  boardDock: 'side' | 'bottom';
  setBoardDock: (boardDock: 'side' | 'bottom') => void;
  /** Autosave heartbeat for the top-bar indicator. Owned by persistence.ts. */
  saveState: 'saving' | 'saved';
  setSaveState: (saveState: 'saving' | 'saved') => void;

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

  leftWorkspace: 'project',
  setLeftWorkspace: (leftWorkspace) => set((s) => ({ leftWorkspace: s.leftWorkspace === leftWorkspace ? null : leftWorkspace })),
  rightWorkspace: 'evidence',
  setRightWorkspace: (rightWorkspace) => set({ rightWorkspace }),
  layoutMode: 'workbench',
  setLayoutMode: (layoutMode) =>
    set({
      layoutMode,
      focusMode: layoutMode === 'focus',
      fullBoard: layoutMode === 'board',
    }),
  railFocus: 'project',
  setRailFocus: (railFocus) => set({ railFocus }),
  readOnly: false,
  toggleReadOnly: () => set((s) => ({ readOnly: !s.readOnly })),
  findOpen: false,
  setFindOpen: (findOpen) => set({ findOpen }),
  notesIntakeOpen: false,
  setNotesIntakeOpen: (notesIntakeOpen) => set({ notesIntakeOpen }),
  setDocFormat: (format) => set((s) => ({ screenplay: { ...s.screenplay, docFormat: format } })),
  documentOpen: true,
  newProject: async () => {
    await get().takeSnapshot(`Before new project: ${get().screenplay.title}`);
    set({ documentOpen: false, leftWorkspace: 'project', rightWorkspace: 'evidence', layoutMode: 'workbench', railFocus: 'project' });
  },
  openSampleProject: () => {
    get().resetToSample();
    set({ documentOpen: true });
  },
  privatePad: '',
  setPrivatePad: (privatePad) => set({ privatePad }),
  projectNotes: '',
  setProjectNotes: (projectNotes) => set({ projectNotes }),
  loadProjectDocs: ({ privatePad, projectNotes }) =>
    set({ privatePad: privatePad ?? '', projectNotes: projectNotes ?? '' }),
  exportOpen: false,
  setExportOpen: (exportOpen) => set({ exportOpen }),
  noteComposerOpen: false,
  setNoteComposerOpen: (noteComposerOpen) => set({ noteComposerOpen }),
  historyOpen: false,
  setHistoryOpen: (historyOpen) => set({ historyOpen }),
  printViewOpen: false,
  setPrintViewOpen: (printViewOpen) => set({ printViewOpen }),

  gamePlan: emptyGamePlan(),

  updateGamePlan: (patch) => set((s) => ({ gamePlan: { ...s.gamePlan, ...patch } })),

  updateCompass: (patch) =>
    set((s) => ({ gamePlan: { ...s.gamePlan, compass: { ...s.gamePlan.compass, ...patch } } })),

  setPassPriorities: (passPriorities) =>
    set((s) => ({ gamePlan: { ...s.gamePlan, passPriorities: [...passPriorities] } })),

  addMotif: (name) =>
    set((s) => ({
      gamePlan: {
        ...s.gamePlan,
        compass: {
          ...s.gamePlan.compass,
          motifs: [
            ...s.gamePlan.compass.motifs,
            { id: `motif-${crypto.randomUUID()}`, name, occurrences: [] },
          ],
        },
      },
    })),

  removeMotif: (motifId) =>
    set((s) => ({
      gamePlan: {
        ...s.gamePlan,
        compass: {
          ...s.gamePlan.compass,
          motifs: s.gamePlan.compass.motifs.filter((m) => m.id !== motifId),
        },
      },
    })),

  addMotifOccurrence: (motifId, anchor) =>
    set((s) => ({
      gamePlan: {
        ...s.gamePlan,
        compass: {
          ...s.gamePlan.compass,
          motifs: s.gamePlan.compass.motifs.map((m) =>
            m.id !== motifId || m.occurrences.some((o) => o.elementId === anchor.elementId)
              ? m
              : { ...m, occurrences: [...m.occurrences, anchor] },
          ),
        },
      },
    })),

  removeMotifOccurrence: (motifId, elementId) =>
    set((s) => ({
      gamePlan: {
        ...s.gamePlan,
        compass: {
          ...s.gamePlan.compass,
          motifs: s.gamePlan.compass.motifs.map((m) =>
            m.id !== motifId
              ? m
              : { ...m, occurrences: m.occurrences.filter((o) => o.elementId !== elementId) },
          ),
        },
      },
    })),

  loadGamePlan: (gamePlan) => set({ gamePlan }),

  scenePoints: {},

  updateScenePoint: (sceneId, patch) =>
    set((s) => ({
      scenePoints: {
        ...s.scenePoints,
        [sceneId]: { ...(s.scenePoints[sceneId] ?? emptyScenePoint(sceneId)), ...patch },
      },
    })),

  loadScenePoints: (scenePoints) => set({ scenePoints }),

  storyBeats: [],

  setStoryBeat: (kind, sceneId, elementId) =>
    set((s) => {
      const existing = s.storyBeats.find((b) => b.elementId === elementId);
      if (existing && existing.kind === kind) {
        // Same kind again: remove it and release its partner.
        return {
          storyBeats: s.storyBeats
            .filter((b) => b.id !== existing.id)
            .map((b) => (b.pairedWith === existing.id ? { ...b, pairedWith: null } : b)),
        };
      }
      if (existing) {
        // Switch kind: release its partner, keep the anchor.
        return {
          storyBeats: s.storyBeats
            .map((b) => (b.pairedWith === existing.id ? { ...b, pairedWith: null } : b))
            .map((b) => (b.id === existing.id ? { ...b, kind, pairedWith: null } : b)),
        };
      }
      const beat: StoryBeat = { id: `beat-${crypto.randomUUID()}`, kind, sceneId, elementId, pairedWith: null };
      return { storyBeats: [...s.storyBeats, beat] };
    }),

  pairBeats: (setupId, payoffId) =>
    set((s) => {
      const setup = s.storyBeats.find((b) => b.id === setupId && b.kind === 'setup');
      const payoff = s.storyBeats.find((b) => b.id === payoffId && b.kind === 'payoff');
      if (!setup || !payoff) return s;
      const freed = new Set([setup.pairedWith, payoff.pairedWith].filter((x): x is string => !!x));
      return {
        storyBeats: s.storyBeats.map((b) => {
          if (b.id === setupId) return { ...b, pairedWith: payoffId };
          if (b.id === payoffId) return { ...b, pairedWith: setupId };
          if (freed.has(b.id)) return { ...b, pairedWith: null };
          return b;
        }),
      };
    }),

  unpairBeat: (beatId) =>
    set((s) => ({
      storyBeats: s.storyBeats.map((b) =>
        b.id === beatId || b.pairedWith === beatId ? { ...b, pairedWith: null } : b,
      ),
    })),

  loadStoryBeats: (storyBeats) => set({ storyBeats }),

  highPoints: [],

  setHighPoint: (sceneId, role) =>
    set((s) => {
      // A scene holds at most one marker; structural roles are unique across scenes.
      let markers = s.highPoints.filter((m) => m.sceneId !== sceneId);
      if (role) {
        if (isStructuralRole(role)) markers = markers.filter((m) => m.role !== role);
        markers = [...markers, { role, sceneId }];
      }
      return { highPoints: markers };
    }),

  loadHighPoints: (highPoints) => set({ highPoints }),

  polishReadActive: false,
  polishReadPage: 1,
  polishReadComplete: false,
  startPolishRead: () => set({ polishReadActive: true, polishReadPage: 1 }),
  setPolishReadPage: (polishReadPage) => set({ polishReadPage: Math.max(1, polishReadPage) }),
  exitPolishRead: () => set({ polishReadActive: false }),
  completePolishRead: () =>
    set((s) => ({
      polishReadActive: false,
      polishReadComplete: true,
      workflow: {
        ...s.workflow,
        passRuns: {
          ...s.workflow.passRuns,
          polish: s.workflow.passRuns.polish === 'complete' ? 'complete' : 'reviewing',
        },
      },
    })),
  loadPolishReadComplete: (polishReadComplete) => set({ polishReadComplete }),

  workflow: emptyWorkflow(),

  readModeActive: false,

  enterReadMode: () => {
    set({ readModeActive: true, readSittingStartedAt: Date.now() });
    get().goToReadScene(0);
  },

  exitReadMode: () => set({ readModeActive: false, readSittingStartedAt: null }),

  readSittingStartedAt: null,

  addReadMark: (mark) =>
    set((s) => ({ workflow: { ...s.workflow, readMarks: [...s.workflow.readMarks, mark] } })),

  removeReadMark: (id) =>
    set((s) => ({
      workflow: { ...s.workflow, readMarks: s.workflow.readMarks.filter((m) => m.id !== id) },
    })),

  goToReadScene: (index) => {
    const scenes = get().screenplay.scenes;
    const scene = scenes[Math.min(scenes.length - 1, Math.max(0, index))];
    if (!scene) return;
    get().select({ sceneId: scene.id, elementId: scene.elements[0].id });
    get().markSceneVisited(scene.id);
  },

  addReader: (name, role, title) => {
    const readers = get().workflow.readers;
    if (role === 'initial' && readers.filter((r) => r.role === 'initial').length >= MAX_INITIAL_READERS) {
      throw new Error('Epps rule: never more than five initial readers (three are recommended).');
    }
    if (role === 'interim' && readers.filter((r) => r.role === 'interim').length >= MAX_INTERIM_READERS) {
      throw new Error('Epps rule: exactly one trusted interim reader.');
    }
    const reader: Reader = { id: `reader-${crypto.randomUUID()}`, name, role, title, addedAt: Date.now(), notes: [] };
    set((s) => ({ workflow: { ...s.workflow, readers: [...s.workflow.readers, reader] } }));
  },

  addReaderNote: (readerId, note) =>
    set((s) => ({
      workflow: {
        ...s.workflow,
        readers: s.workflow.readers.map((r) =>
          r.id === readerId ? { ...r, notes: [...(r.notes ?? []), note] } : r,
        ),
      },
    })),

  setReaderNoteKind: (readerId, noteId, kind) =>
    set((s) => ({
      workflow: {
        ...s.workflow,
        readers: s.workflow.readers.map((r) =>
          r.id === readerId
            ? { ...r, notes: (r.notes ?? []).map((n) => (n.id === noteId ? { ...n, kind } : n)) }
            : r,
        ),
      },
    })),

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
    const snapshotLabel = `After ${pass?.name ?? passId} pass`;
    await state.takeSnapshot(snapshotLabel);
    set((s) => {
      const passRuns: WorkflowState['passRuns'] = { ...s.workflow.passRuns, [passId]: 'complete' };
      const completed = Object.values(passRuns).filter((v) => v === 'complete').length;
      const draftLabel = `Rewrite ${completed}`;
      const passFindings = s.workflow.findings.filter((f) => f.passId === passId);
      return {
        workflow: { ...s.workflow, passRuns },
        screenplay: { ...s.screenplay, draftLabel },
        passSummary: {
          passId,
          passName: pass?.name ?? passId,
          approved: s.workflow.approvals.filter((a) => a.passId === passId),
          rejectedCount: passFindings.filter((f) => f.resolution === 'rejected').length,
          unresolvedCount: passFindings.filter((f) => f.resolution === 'open').length,
          snapshotLabel,
          draftLabel,
          nextPassId: EPPS_PASSES.find((p) => p.order === (pass?.order ?? 0) + 1)?.id ?? null,
        },
      };
    });
  },

  passSummary: null,
  clearPassSummary: () => set({ passSummary: null }),

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
      gamePlan: emptyGamePlan(),
      scenePoints: {},
      storyBeats: [],
      highPoints: [],
      polishReadActive: false,
      polishReadPage: 1,
      polishReadComplete: false,
      readModeActive: false,
      notesIntakeOpen: false,
      leftWorkspace: 'project',
      rightWorkspace: 'evidence',
      layoutMode: 'workbench',
      railFocus: 'project',
      focusMode: false,
      fullBoard: false,
      documentOpen: true,
      privatePad: '',
      projectNotes: '',
    }),

  loadWorkflow: (workflow, evidence, connections) =>
    // Normalize legacy rows: pre-handoff workflows lack readMarks/reader notes.
    set({
      workflow: {
        ...emptyWorkflow(),
        ...workflow,
        readMarks: workflow.readMarks ?? [],
        readers: (workflow.readers ?? []).map((r) => ({ notes: [], ...r })),
      },
      evidence,
      connections,
    }),

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
  boardDock: 'side',
  setBoardDock: (boardDock) => set({ boardDock }),
  saveState: 'saved',
  setSaveState: (saveState) => set({ saveState }),

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
  // Choosing a pass opens its guided workspace in the right context panel.
  setActivePass: (activePassId) =>
    set((s) => ({
      activePassId,
      inspectorTab: activePassId ? 'pass' : s.inspectorTab,
      rightWorkspace: activePassId ? 'passes' : s.rightWorkspace,
    })),
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
      gamePlan: emptyGamePlan(),
      scenePoints: {},
      storyBeats: [],
      highPoints: [],
      polishReadActive: false,
      polishReadPage: 1,
      polishReadComplete: false,
      readModeActive: false,
      notesIntakeOpen: false,
      noteComposerOpen: false,
      inspectorTab: 'evidence',
      leftWorkspace: 'project',
      rightWorkspace: 'evidence',
      layoutMode: 'workbench',
      railFocus: 'project',
      documentOpen: true,
      privatePad: '',
      projectNotes: '',
      passSummary: null,
    }),
}));

/** Read one element's text out of a screenplay (test and UI helper). */
export function elementText(screenplay: Screenplay, sceneId: string, elementId: string): string | undefined {
  return screenplay.scenes.find((s) => s.id === sceneId)?.elements.find((e) => e.id === elementId)?.text;
}
