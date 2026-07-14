import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { paginate } from '../pagination/engine';
import { useT } from '../i18n/strings';
import type { StringKey } from '../i18n/strings';

const OBJECTIVES: StringKey[] = [
  'polish.obj.dialogue',
  'polish.obj.description',
  'polish.obj.tighten',
  'polish.obj.consistency',
  'polish.obj.spelling',
  'polish.obj.holdovers',
];

/** The final cover-to-cover Polish Read: a guided page walk (not scene by
    scene) with the book's polish objectives in view. Reuses the read-bar
    machinery; finishing marks the Polish pass reviewable. */
export function PolishReadBar() {
  const active = useAppStore((s) => s.polishReadActive);
  const page = useAppStore((s) => s.polishReadPage);
  const screenplay = useAppStore((s) => s.screenplay);
  const setPolishReadPage = useAppStore((s) => s.setPolishReadPage);
  const exitPolishRead = useAppStore((s) => s.exitPolishRead);
  const completePolishRead = useAppStore((s) => s.completePolishRead);
  const select = useAppStore((s) => s.select);
  const t = useT();

  const pagination = useMemo(() => paginate(screenplay), [screenplay]);

  if (!active) return null;

  const pageCount = pagination.pageCount;
  const goTo = (target: number) => {
    const clamped = Math.min(pageCount, Math.max(1, target));
    setPolishReadPage(clamped);
    const lines = pagination.pages[clamped - 1]?.lines ?? [];
    const firstText =
      lines.find((l) => l.kind === 'text' && pagination.pageOfElement.get(l.elementId) === clamped) ??
      lines.find((l) => l.kind === 'text');
    if (firstText) select({ sceneId: firstText.sceneId, elementId: firstText.elementId });
  };

  return (
    <div className="read-bar polish-read-bar" role="region" aria-label={t('polish.title')}>
      <div className="read-bar-row">
        <span className="read-bar-title">{t('polish.title')}</span>
        <span className="read-bar-progress">
          {t('polish.page')} {page} {t('status.of')} {pageCount}
        </span>
        <span className="top-bar-spacer" />
        <button type="button" className="seg-button" onClick={() => goTo(page - 1)} disabled={page <= 1}>
          {t('polish.prev')}
        </button>
        <button
          type="button"
          className="seg-button"
          onClick={() => goTo(page + 1)}
          disabled={page >= pageCount}
        >
          {t('polish.next')}
        </button>
        <button
          type="button"
          className="seg-button read-complete"
          disabled={page < pageCount}
          onClick={completePolishRead}
        >
          {t('polish.complete')}
        </button>
        <button type="button" className="seg-button" onClick={exitPolishRead}>
          {t('polish.exit')}
        </button>
      </div>
      <div className="read-bar-row polish-objectives-row">
        <span className="control-label">{t('polish.objectives')}</span>
        <ul className="polish-objectives">
          {OBJECTIVES.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
