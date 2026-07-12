import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { paginate } from '../pagination/engine';
import { RevisionControl } from './RevisionControl';
import { useT } from '../i18n/strings';

/** Slim strip under the page: position, zoom, and the revision-set control. */
export function StatusBar() {
  const screenplay = useAppStore((s) => s.screenplay);
  const selection = useAppStore((s) => s.selection);
  const zoom = useAppStore((s) => s.zoom);
  const setZoom = useAppStore((s) => s.setZoom);
  const t = useT();

  const pagination = useMemo(() => paginate(screenplay), [screenplay]);
  const page = selection ? (pagination.pageOfElement.get(selection.elementId) ?? 1) : 1;
  const scene = selection ? screenplay.scenes.find((s) => s.id === selection.sceneId) : undefined;

  return (
    <div className="status-bar" data-testid="status-bar">
      <span className="status-position">
        {t('status.page')} {page} {t('status.of')} {pagination.pageCount}
        {scene && (
          <>
            {' · '}
            {t('status.scene')} {scene.number}
          </>
        )}
      </span>
      <span className="top-bar-spacer" />
      <RevisionControl />
      <span className="control-group" role="group" aria-label="Zoom">
        <button type="button" className="seg-button" aria-label={t('status.zoomOut')} onClick={() => setZoom(Math.round((zoom - 0.1) * 10) / 10)}>
          −
        </button>
        <button type="button" className="seg-button" aria-label={t('status.zoomReset')} onClick={() => setZoom(1)}>
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" className="seg-button" aria-label={t('status.zoomIn')} onClick={() => setZoom(Math.round((zoom + 0.1) * 10) / 10)}>
          +
        </button>
      </span>
    </div>
  );
}
