import { useAppStore, type ThemeChoice, type UiLang } from '../store/appStore';
import { resolveDocFormat } from '../model/screenplay';
import { RevisionControl } from './RevisionControl';
import { ExtChip } from './ExtChip';
import { useT } from '../i18n/strings';

const THEMES: { id: ThemeChoice; key: 'theme.day' | 'theme.night' | 'theme.system' }[] = [
  { id: 'day', key: 'theme.day' },
  { id: 'night', key: 'theme.night' },
  { id: 'system', key: 'theme.system' },
];

/** Professional editing-suite toolbar: identity, save state, revision set,
    document actions, language, and appearance. */
export function TopBar() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);
  const focusMode = useAppStore((s) => s.focusMode);
  const setFocusMode = useAppStore((s) => s.setFocusMode);
  const setImportOpen = useAppStore((s) => s.setImportOpen);
  const setExportOpen = useAppStore((s) => s.setExportOpen);
  const setHistoryOpen = useAppStore((s) => s.setHistoryOpen);
  const enterReadMode = useAppStore((s) => s.enterReadMode);
  const readModeActive = useAppStore((s) => s.readModeActive);
  const readComplete = useAppStore((s) => s.workflow.annotatedReadComplete);
  const saveState = useAppStore((s) => s.saveState);
  const title = useAppStore((s) => s.screenplay.title);
  const draftLabel = useAppStore((s) => s.screenplay.draftLabel);
  const docFormat = useAppStore((s) => resolveDocFormat(s.screenplay));
  const t = useT();

  return (
    <>
      <h1 className="app-title">{t('app.title')}</h1>
      <span className="draft-label">
        {title} · {draftLabel}
      </span>
      {docFormat !== 'feature' && (
        <span className="format-badge" title={t('fmt.badgeTip')}>
          {t(`fmt.${docFormat}`)} <ExtChip />
        </span>
      )}
      <span className="top-bar-spacer" />
      <span className={`save-indicator save-${saveState}`} aria-live="polite">
        {saveState === 'saved' ? t('topbar.saved') : t('topbar.saving')}
      </span>
      <RevisionControl />
      <span className="top-bar-divider" aria-hidden="true" />
      <button type="button" className="tool-button" onClick={() => setImportOpen(true)}>
        {t('import.open')}
      </button>
      <button type="button" className="tool-button" onClick={() => setExportOpen(true)}>
        {t('export.open')}
      </button>
      <button type="button" className="tool-button" onClick={() => setHistoryOpen(true)}>
        {t('history.open')}
      </button>
      <span className="top-bar-divider" aria-hidden="true" />
      <button type="button" className="tool-button" aria-pressed={readModeActive} onClick={enterReadMode}>
        {readComplete ? t('read.completeDone') : t('read.enter')}
      </button>
      <button
        type="button"
        className="tool-button"
        aria-pressed={focusMode}
        onClick={() => setFocusMode(!focusMode)}
      >
        {focusMode ? t('focus.exit') : t('focus.enter')}
      </button>
      <span className="top-bar-divider" aria-hidden="true" />
      <span className="control-group" role="group" aria-label={t('lang.label')}>
        {(['en', 'es'] as UiLang[]).map((l) => (
          <button
            key={l}
            type="button"
            className="seg-button"
            aria-pressed={lang === l}
            onClick={() => setLang(l)}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </span>
      <span className="control-group">
        <label className="control-label" htmlFor="appearance-select">
          {t('topbar.appearance')}
        </label>
        <select
          id="appearance-select"
          className="seg-button"
          value={theme}
          onChange={(e) => setTheme(e.target.value as ThemeChoice)}
        >
          {THEMES.map(({ id, key }) => (
            <option key={id} value={id}>
              {t(key)}
            </option>
          ))}
        </select>
      </span>
    </>
  );
}
