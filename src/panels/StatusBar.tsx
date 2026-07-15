import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { paginate } from '../pagination/engine';
import { useT } from '../i18n/strings';

/** Page footer under the script: previous/next page, position, and Add note. */
export function StatusBar() {
  const screenplay = useAppStore((s) => s.screenplay);
  const selection = useAppStore((s) => s.selection);
  const select = useAppStore((s) => s.select);
  const setInspectorTab = useAppStore((s) => s.setInspectorTab);
  const setNoteComposerOpen = useAppStore((s) => s.setNoteComposerOpen);
  const storyBeats = useAppStore((s) => s.storyBeats);
  const setStoryBeat = useAppStore((s) => s.setStoryBeat);
  const readModeActive = useAppStore((s) => s.readModeActive);
  const marksCount = useAppStore((s) => s.workflow.readMarks.length);
  const t = useT();

  const selectedBeat = selection ? storyBeats.find((b) => b.elementId === selection.elementId) : undefined;

  const pagination = useMemo(() => paginate(screenplay), [screenplay]);
  const page = selection ? (pagination.pageOfElement.get(selection.elementId) ?? 1) : 1;
  const scene = selection ? screenplay.scenes.find((s) => s.id === selection.sceneId) : undefined;

  // Same jump the Go-to-page dialog performs: select the page's first text
  // line — skipping lines whose element starts on the previous page, so the
  // position readout lands on the page we jumped to.
  const jumpToPage = (target: number) => {
    const clamped = Math.min(pagination.pageCount, Math.max(1, target));
    const lines = pagination.pages[clamped - 1].lines;
    const firstText =
      lines.find((l) => l.kind === 'text' && pagination.pageOfElement.get(l.elementId) === clamped) ??
      lines.find((l) => l.kind === 'text');
    if (firstText) select({ sceneId: firstText.sceneId, elementId: firstText.elementId });
  };

  return (
    <div className="status-bar" data-testid="status-bar">
      <button
        type="button"
        className="tool-button"
        aria-label={t('footer.prevpage')}
        disabled={page <= 1}
        onClick={() => jumpToPage(page - 1)}
      >
        ‹
      </button>
      <span className="status-position">
        {t('status.page')} {page} {t('status.of')} {pagination.pageCount}
        {scene && (
          <>
            {' · '}
            {t('status.scene')} {scene.number}
          </>
        )}
      </span>
      <button
        type="button"
        className="tool-button"
        aria-label={t('footer.nextpage')}
        disabled={page >= pagination.pageCount}
        onClick={() => jumpToPage(page + 1)}
      >
        ›
      </button>
      {readModeActive && (
        <>
          <span className="status-read-progress" aria-hidden="true">
            <span
              className="status-read-progress-fill"
              style={{ width: `${Math.round((page / Math.max(1, pagination.pageCount)) * 100)}%` }}
            />
          </span>
          <span className="status-read-marks">
            {marksCount} {t('readmode.marksSoFar')}
          </span>
        </>
      )}
      <span className="top-bar-spacer" />
      {!readModeActive && (
      <span className="status-beats" role="group" aria-label={t('beat.mark')}>
        <button
          type="button"
          className="seg-button"
          aria-pressed={selectedBeat?.kind === 'setup'}
          disabled={!selection}
          onClick={() => selection && setStoryBeat('setup', selection.sceneId, selection.elementId)}
        >
          {t('beat.setup')}
        </button>
        <button
          type="button"
          className="seg-button"
          aria-pressed={selectedBeat?.kind === 'payoff'}
          disabled={!selection}
          onClick={() => selection && setStoryBeat('payoff', selection.sceneId, selection.elementId)}
        >
          {t('beat.payoff')}
        </button>
      </span>
      )}
      {!readModeActive && (
      <button
        type="button"
        className="seg-button"
        disabled={!selection}
        onClick={() => {
          setInspectorTab('evidence');
          useAppStore.getState().setRightWorkspace('evidence');
          setNoteComposerOpen(true);
        }}
      >
        {t('notes.add')}
      </button>
      )}
    </div>
  );
}
