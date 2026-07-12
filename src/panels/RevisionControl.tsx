import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';

const REV_LABEL_KEYS = ['rev.white', 'rev.blue', 'rev.pink', 'rev.yellow', 'rev.green'] as const;

export function RevisionControl() {
  const label = useAppStore((s) => s.revisionSetLabel);
  const startRevisionSet = useAppStore((s) => s.startRevisionSet);
  const endRevisionSet = useAppStore((s) => s.endRevisionSet);
  const t = useT();
  const [choice, setChoice] = useState<string>(() => t('rev.blue'));

  if (label) {
    return (
      <button type="button" className="seg-button" data-testid="rev-end" onClick={endRevisionSet}>
        {t('rev.end')} · {label}
      </button>
    );
  }
  return (
    <span className="control-group">
      <label className="control-label" htmlFor="rev-select">
        {t('rev.label')}
      </label>
      <select
        id="rev-select"
        className="seg-button"
        value={choice}
        onChange={(e) => setChoice(e.target.value)}
      >
        {REV_LABEL_KEYS.map((key) => (
          <option key={key} value={t(key)}>
            {t(key)}
          </option>
        ))}
      </select>
      <button type="button" className="seg-button" data-testid="rev-start" onClick={() => startRevisionSet(choice)}>
        {t('rev.start')}
      </button>
    </span>
  );
}
