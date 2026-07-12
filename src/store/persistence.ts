import Dexie, { type Table } from 'dexie';
import type { Screenplay } from '../model/screenplay';
import { useAppStore, type ThemeChoice, type UiLang } from './appStore';

export interface DocumentRow {
  id: string;
  screenplay: Screenplay;
  updatedAt: number;
}

export interface UiRow {
  id: 'ui';
  theme: ThemeChoice;
  lang?: UiLang;
  activePassId: string | null;
  panelSizes: Record<string, number>;
  collapsedPanels: Record<string, boolean>;
}

class RewriteStudioDB extends Dexie {
  documents!: Table<DocumentRow, string>;
  ui!: Table<UiRow, string>;

  constructor() {
    super('rewrite-studio');
    this.version(1).stores({ documents: 'id', ui: 'id' });
  }
}

export const db = new RewriteStudioDB();

export interface PersistenceOptions {
  debounceMs?: number;
}

/** Hydrate the store from IndexedDB, then autosave every change (debounced).
    Returns a dispose function that stops autosaving. */
export async function initPersistence(options: PersistenceOptions = {}): Promise<() => void> {
  const debounceMs = options.debounceMs ?? 500;
  const store = useAppStore;

  const savedDoc = await db.documents.get(store.getState().screenplay.id);
  if (savedDoc) store.getState().loadScreenplay(savedDoc.screenplay);
  const savedUi = await db.ui.get('ui');
  if (savedUi) {
    if (savedUi.lang) store.getState().setLang(savedUi.lang);
    store.getState().loadUiState({
      theme: savedUi.theme,
      activePassId: savedUi.activePassId,
      panelSizes: savedUi.panelSizes,
      collapsedPanels: savedUi.collapsedPanels,
    });
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const unsubscribe = store.subscribe((state) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      void db.documents.put({
        id: state.screenplay.id,
        screenplay: state.screenplay,
        updatedAt: Date.now(),
      });
      void db.ui.put({
        id: 'ui',
        theme: state.theme,
        lang: state.lang,
        activePassId: state.activePassId,
        panelSizes: state.panelSizes,
        collapsedPanels: state.collapsedPanels,
      });
    }, debounceMs);
  });

  return () => {
    clearTimeout(timer);
    unsubscribe();
  };
}
