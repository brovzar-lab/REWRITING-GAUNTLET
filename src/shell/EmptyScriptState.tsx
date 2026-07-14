import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';

/** The center when a fresh, empty project has no script yet: the first thing a
    writer sees is how to get a script in. */
export function EmptyScriptState() {
  const t = useT();
  const setImportOpen = useAppStore((s) => s.setImportOpen);
  const openSampleProject = useAppStore((s) => s.openSampleProject);

  return (
    <div className="empty-script" role="region" aria-label={t('empty.title')}>
      <div className="empty-inner">
        <h2 className="empty-title">{t('empty.title')}</h2>
        <p className="empty-body">{t('empty.body')}</p>
        <div className="empty-actions">
          <button type="button" className="seg-button empty-primary" onClick={() => setImportOpen(true)}>
            {t('empty.import')}
          </button>
          <button type="button" className="seg-button" onClick={openSampleProject}>
            {t('empty.sample')}
          </button>
        </div>
      </div>
    </div>
  );
}
