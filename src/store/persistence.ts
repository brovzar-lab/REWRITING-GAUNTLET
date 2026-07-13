import { db } from './db';
import { useAppStore } from './appStore';
import { emptyGamePlan } from '../model/gameplan';

export { db } from './db';
export type { DocumentRow, UiRow, BaselineRow, SnapshotRow, WorkflowRow } from './db';

export interface PersistenceOptions {
  debounceMs?: number;
}

/** Hydrate the store from IndexedDB, then autosave every change (debounced).
    Returns a dispose function that stops autosaving. */
export async function initPersistence(options: PersistenceOptions = {}): Promise<() => void> {
  const debounceMs = options.debounceMs ?? 500;
  const store = useAppStore;

  const savedUi = await db.ui.get('ui');
  const targetDocId = savedUi?.activeDocumentId ?? store.getState().screenplay.id;

  const savedDoc = await db.documents.get(targetDocId);
  if (savedDoc) store.getState().loadScreenplay(savedDoc.screenplay);

  const savedWorkflow = await db.workflow.get(targetDocId);
  if (savedWorkflow) {
    store.getState().loadWorkflow(savedWorkflow.state, savedWorkflow.evidence, savedWorkflow.connections);
    // Pre-methodology rows have no gamePlan/scenePoints; hydrate defaults, lose nothing.
    store.getState().loadGamePlan(savedWorkflow.gamePlan ?? emptyGamePlan());
    store.getState().loadScenePoints(savedWorkflow.scenePoints ?? {});
  }

  const savedBaseline = await db.baselines.get(targetDocId);
  if (savedBaseline) store.getState().loadRevision(savedBaseline.texts, savedBaseline.label);

  if (savedUi) {
    if (savedUi.lang) store.getState().setLang(savedUi.lang);
    if (savedUi.zoom) store.getState().setZoom(savedUi.zoom);
    store.getState().loadUiState({
      theme: savedUi.theme,
      activePassId: savedUi.activePassId,
      panelSizes: savedUi.panelSizes,
      collapsedPanels: savedUi.collapsedPanels,
    });
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const unsubscribe = store.subscribe((state, prev) => {
    // Our own save-state bookkeeping must not reschedule the save it reports on.
    if (state.saveState !== prev.saveState) return;
    if (store.getState().saveState !== 'saving') store.getState().setSaveState('saving');
    clearTimeout(timer);
    timer = setTimeout(() => {
      void db.documents.put({
        id: state.screenplay.id,
        screenplay: state.screenplay,
        updatedAt: Date.now(),
      });
      void db.workflow.put({
        id: state.screenplay.id,
        state: state.workflow,
        evidence: state.evidence,
        connections: state.connections,
        gamePlan: state.gamePlan,
        scenePoints: state.scenePoints,
      });
      if (state.revisionBaseline && state.revisionSetLabel) {
        void db.baselines.put({
          id: state.screenplay.id,
          label: state.revisionSetLabel,
          texts: state.revisionBaseline,
        });
      } else {
        void db.baselines.delete(state.screenplay.id);
      }
      void db.ui
        .put({
          id: 'ui',
          theme: state.theme,
          lang: state.lang,
          zoom: state.zoom,
          activeDocumentId: state.screenplay.id,
          activePassId: state.activePassId,
          panelSizes: state.panelSizes,
          collapsedPanels: state.collapsedPanels,
        })
        .then(() => store.getState().setSaveState('saved'));
    }, debounceMs);
  });

  return () => {
    clearTimeout(timer);
    unsubscribe();
  };
}
