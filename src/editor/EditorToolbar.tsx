import { redo, redoDepth, undo, undoDepth } from 'prosemirror-history';
import { getEditorView } from './editorHandle';
import { ELEMENT_KEY_ORDER, applyElementType } from './editorKeymap';
import type { ElementType } from '../model/screenplay';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';

/** Focus the screenplay region, never ProseMirror's DOM: raw-focusing the
    contenteditable resets the caret to the document start. */
function refocusPage() {
  document.querySelector<HTMLElement>('.sp-page-scroller')?.focus();
}

/** One 36px control row above the page: undo/redo, element type, zoom, go to page. */
export function EditorToolbar() {
  // The screenplay/selection subscriptions re-render this toolbar after every
  // doc change and caret move, which keeps the history depths fresh.
  const screenplay = useAppStore((s) => s.screenplay);
  const selection = useAppStore((s) => s.selection);
  const zoom = useAppStore((s) => s.zoom);
  const setZoom = useAppStore((s) => s.setZoom);
  const setGoToPageOpen = useAppStore((s) => s.setGoToPageOpen);
  const readModeActive = useAppStore((s) => s.readModeActive);
  const revisionSetLabel = useAppStore((s) => s.revisionSetLabel);
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
    <div className="editor-toolbar" role="toolbar" aria-label={t('toolbar.label')}>
      <button
        type="button"
        className="tool-button"
        disabled={!canUndo}
        onClick={() => runHistory(undo)}
      >
        {t('toolbar.undo')}
      </button>
      <button
        type="button"
        className="tool-button"
        disabled={!canRedo}
        onClick={() => runHistory(redo)}
      >
        {t('toolbar.redo')}
      </button>
      <span className="toolbar-sep" aria-hidden="true" />
      <select
        className="toolbar-element-select"
        aria-label={t('toolbar.element')}
        value={selectedType}
        disabled={!selectedType || readModeActive}
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
      <span className="toolbar-sep" aria-hidden="true" />
      <span className="control-group" role="group" aria-label="Zoom">
        <button
          type="button"
          className="tool-button"
          aria-label={t('status.zoomOut')}
          onClick={() => setZoom(Math.round((zoom - 0.1) * 10) / 10)}
        >
          −
        </button>
        <button
          type="button"
          className="tool-button"
          aria-label={t('status.zoomReset')}
          onClick={() => setZoom(1)}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          className="tool-button"
          aria-label={t('status.zoomIn')}
          onClick={() => setZoom(Math.round((zoom + 0.1) * 10) / 10)}
        >
          +
        </button>
      </span>
      <button type="button" className="tool-button" onClick={() => setGoToPageOpen(true)}>
        {t('toolbar.gotopage')}
      </button>
      {revisionSetLabel && (
        <span className="toolbar-rev-chip">
          {t('rev.label')}: {revisionSetLabel}
        </span>
      )}
    </div>
  );
}
