import { create } from 'zustand';
import type { Connection, Screenplay } from '../model/screenplay';
import type { EvidenceRecord } from '../model/evidence';
import { sampleConnections, sampleEvidence, sampleScreenplay } from '../model/sample/gauntlet-sample';

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

export const useAppStore = create<AppState>((set) => ({
  lang: 'en',
  setLang: (lang) => set({ lang }),
  focusMode: false,
  setFocusMode: (focusMode) => set({ focusMode }),
  fullBoard: false,
  setFullBoard: (fullBoard) => set({ fullBoard }),
  zoom: 1,
  setZoom: (zoom) => set({ zoom: Math.min(2, Math.max(0.5, zoom)) }),
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
      selection: null,
      theme: 'night',
      activePassId: null,
      panelSizes: {},
      collapsedPanels: {},
    }),
}));

/** Read one element's text out of a screenplay (test and UI helper). */
export function elementText(screenplay: Screenplay, sceneId: string, elementId: string): string | undefined {
  return screenplay.scenes.find((s) => s.id === sceneId)?.elements.find((e) => e.id === elementId)?.text;
}
