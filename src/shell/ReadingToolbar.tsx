import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';

/** Read-mode toolbar row (delta 3): lock chip, helper text, Studio Extension
    label (amendment 2 — Epps reads on paper; this is our digital translation),
    a subtle minutes-only timer (amendment 5 — no seconds, no pressure), the
    print path, and Pause / Finish. Rendered by WorkstationToolbar while
    reading. */
export function ReadingToolbar() {
  const t = useT();
  const startedAt = useAppStore((s) => s.readSittingStartedAt);
  const [, tick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const minutes = startedAt ? Math.floor((Date.now() - startedAt) / 60_000) : 0;

  const finish = () => {
    const s = useAppStore.getState();
    const allVisited = s.screenplay.scenes.every((sc) => s.workflow.visitedScenes.includes(sc.id));
    if (allVisited) s.completeAnnotatedRead();
    s.exitReadMode();
  };

  return (
    <div className="reading-toolbar" role="group" aria-label={t('readmode.lock')}>
      <span className="reading-lock-chip">🔒 {t('readmode.lock')}</span>
      <span className="reading-helper">{t('readmode.helper')}</span>
      <span className="reading-extension">{t('readmode.extension')}</span>
      <span className="top-bar-spacer" />
      {minutes > 0 && (
        <span className="reading-timer">
          {minutes} {t('readmode.minutes')}
        </span>
      )}
      <button type="button" className="tool-button" onClick={() => window.print()}>
        {t('readmode.print')}
      </button>
      <button type="button" className="tool-button" onClick={() => useAppStore.getState().exitReadMode()}>
        {t('readmode.pause')}
      </button>
      <button type="button" className="tool-button tool-button-strong" onClick={finish}>
        {t('readmode.finish')}
      </button>
    </div>
  );
}
