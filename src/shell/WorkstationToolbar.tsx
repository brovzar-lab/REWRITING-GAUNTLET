import { redo, redoDepth, undo, undoDepth } from 'prosemirror-history';
import { getEditorView } from '../editor/editorHandle';
import { ELEMENT_KEY_ORDER, applyElementType } from '../editor/editorKeymap';
import type { ElementType } from '../model/screenplay';
import { useAppStore } from '../store/appStore';
import { RevisionControl } from '../panels/RevisionControl';
import { FindBar } from './FindBar';
import { ReadingToolbar } from './ReadingToolbar';
import { useT } from '../i18n/strings';

function refocusPage() {
  document.querySelector<HTMLElement>('.sp-page-scroller')?.focus();
}

/** The professional screenplay toolbar (WriterDuet-informed, our controls):
    undo/redo, element type, find, go-to-page, page/board, zoom, revision,
    notes toggle, export, layout. Screenplay formatting stays honest. */
export function WorkstationToolbar() {
  const screenplay = useAppStore((s) => s.screenplay);
  const selection = useAppStore((s) => s.selection);
  const zoom = useAppStore((s) => s.zoom);
  const setZoom = useAppStore((s) => s.setZoom);
  const setGoToPageOpen = useAppStore((s) => s.setGoToPageOpen);
  const readModeActive = useAppStore((s) => s.readModeActive);
  const readOnly = useAppStore((s) => s.readOnly);
  const layoutMode = useAppStore((s) => s.layoutMode);
  const setLayoutMode = useAppStore((s) => s.setLayoutMode);
  const setRightWorkspace = useAppStore((s) => s.setRightWorkspace);
  const setExportOpen = useAppStore((s) => s.setExportOpen);
  const findOpen = useAppStore((s) => s.findOpen);
  const setFindOpen = useAppStore((s) => s.setFindOpen);
  const documentOpen = useAppStore((s) => s.documentOpen);
  const t = useT();

  const view = getEditorView();
  const canUndo = view !== null && undoDepth(view.state) > 0;
  const canRedo = view !== null && redoDepth(view.state) > 0;
  const scene = selection ? screenplay.scenes.find((s) => s.id === selection.sceneId) : undefined;
  const selectedType = scene?.elements.find((e) => e.id === selection?.elementId)?.type ?? '';

  const runHistory = (command: typeof undo) => {
    const v = getEditorView();
    if (!v) return;
    command(v.state, v.dispatch);
    refocusPage();
  };

  return (
    <div className={`editor-toolbar${readModeActive ? ' is-reading' : ''}`} role="toolbar" aria-label={t('toolbar.label')}>
      {readModeActive && <ReadingToolbar />}
      {/* While reading, the working tools stay visible but genuinely disabled
          (dimmed 35%); disabled controls are exempt from WCAG contrast. */}
      <fieldset className="toolbar-rest" disabled={readModeActive}>
      <div className="toolbar-group" role="group" aria-label={t('toolbar.group.history')}>
        <button type="button" className="tool-button" disabled={!canUndo} onClick={() => runHistory(undo)}>
          {t('toolbar.undo')}
        </button>
        <button type="button" className="tool-button" disabled={!canRedo} onClick={() => runHistory(redo)}>
          {t('toolbar.redo')}
        </button>
      </div>

      <span className="toolbar-sep" aria-hidden="true" />

      <div className="toolbar-group" role="group" aria-label={t('toolbar.group.writing')}>
        <select
          className="toolbar-element-select"
          aria-label={t('toolbar.element')}
          value={selectedType}
          disabled={!selectedType || readModeActive || readOnly}
          onChange={(e) => {
            const v = getEditorView();
            if (!v) return;
            applyElementType(v, e.target.value as ElementType);
            refocusPage();
          }}
        >
          {selectedType === '' && <option value="" />}
          {ELEMENT_KEY_ORDER.map((type) => (
            <option key={type} value={type}>
              {t(`element.${type}`)}
            </option>
          ))}
        </select>
      </div>

      <span className="toolbar-sep" aria-hidden="true" />

      <div className="toolbar-group" role="group" aria-label={t('toolbar.group.navigation')}>
        <button type="button" className="tool-button" aria-pressed={findOpen} onClick={() => setFindOpen(!findOpen)}>
          {t('toolbar.find')}
        </button>
        <button type="button" className="tool-button" disabled={!documentOpen} onClick={() => setGoToPageOpen(true)}>
          {t('toolbar.gotopage')}
        </button>
      </div>

      <span className="toolbar-sep" aria-hidden="true" />

      <div className="toolbar-group" role="group" aria-label={t('toolbar.group.view')}>
        <button
          type="button"
          className="tool-button"
          aria-pressed={layoutMode === 'board'}
          onClick={() => setLayoutMode(layoutMode === 'board' ? 'workbench' : 'board')}
        >
          {t('toolbar.pageBoard')}
        </button>
        <span className="toolbar-zoom" role="group" aria-label="Zoom">
          <button type="button" className="tool-button tool-icon" aria-label={t('status.zoomOut')} onClick={() => setZoom(Math.round((zoom - 0.1) * 10) / 10)}>
            −
          </button>
          <button type="button" className="tool-button tool-zoom-value" aria-label={t('status.zoomReset')} onClick={() => setZoom(1)}>
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" className="tool-button tool-icon" aria-label={t('status.zoomIn')} onClick={() => setZoom(Math.round((zoom + 0.1) * 10) / 10)}>
            +
          </button>
        </span>
        <span className="control-group toolbar-layout">
          <label className="control-label" htmlFor="layout-select">
            {t('toolbar.layout')}
          </label>
          <select
            id="layout-select"
            className="seg-button"
            value={layoutMode}
            onChange={(e) => setLayoutMode(e.target.value as 'workbench' | 'board' | 'focus' | 'script_notes')}
          >
            <option value="workbench">{t('layout.workbench')}</option>
            <option value="script_notes">{t('layout.script_notes')}</option>
            <option value="board">{t('layout.board')}</option>
            <option value="focus">{t('layout.focus')}</option>
          </select>
        </span>
      </div>

      <span className="toolbar-sep" aria-hidden="true" />

      <div className="toolbar-group" role="group" aria-label={t('toolbar.group.revision')}>
        <RevisionControl />
      </div>

      <span className="toolbar-sep" aria-hidden="true" />

      <div className="toolbar-group toolbar-group-output" role="group" aria-label={t('toolbar.group.output')}>
        <button type="button" className="tool-button" onClick={() => setRightWorkspace('evidence')}>
          {t('toolbar.notes')}
        </button>
        <button type="button" className="tool-button tool-button-strong" onClick={() => setExportOpen(true)}>
          {t('toolbar.export')}
        </button>
      </div>

      </fieldset>

      {findOpen && <FindBar />}
    </div>
  );
}
