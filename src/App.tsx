import { useEffect } from 'react';
import { PanelLayout } from './panels/PanelLayout';
import { GoToPage } from './panels/GoToPage';
import { ImportDialog } from './panels/ImportDialog';
import { AnnotatedReadBar } from './panels/AnnotatedReadBar';
import { SceneNavigator } from './panels/SceneNavigator';
import { EvidenceInspector } from './panels/EvidenceInspector';
import { PassTray } from './panels/PassTray';
import { ScreenplayEditor } from './editor/ScreenplayEditor';
import { Board } from './board/Board';
import { initPersistence } from './store/persistence';
import { useAppStore, type ThemeChoice, type UiLang } from './store/appStore';
import { useT } from './i18n/strings';

const THEMES: { id: ThemeChoice; key: 'theme.day' | 'theme.night' | 'theme.system' }[] = [
  { id: 'day', key: 'theme.day' },
  { id: 'night', key: 'theme.night' },
  { id: 'system', key: 'theme.system' },
];

function TopBar() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);
  const focusMode = useAppStore((s) => s.focusMode);
  const setFocusMode = useAppStore((s) => s.setFocusMode);
  const setImportOpen = useAppStore((s) => s.setImportOpen);
  const enterReadMode = useAppStore((s) => s.enterReadMode);
  const readModeActive = useAppStore((s) => s.readModeActive);
  const readComplete = useAppStore((s) => s.workflow.annotatedReadComplete);
  const title = useAppStore((s) => s.screenplay.title);
  const draftLabel = useAppStore((s) => s.screenplay.draftLabel);
  const t = useT();

  return (
    <>
      <h1 className="app-title">{t('app.title')}</h1>
      <span className="draft-label">
        {title} · {draftLabel}
      </span>
      <span className="top-bar-spacer" />
      <button type="button" className="seg-button" onClick={() => setImportOpen(true)}>
        {t('import.open')}
      </button>
      <button type="button" className="seg-button" aria-pressed={readModeActive} onClick={enterReadMode}>
        {readComplete ? t('read.completeDone') : t('read.enter')}
      </button>
      <button
        type="button"
        className="seg-button"
        aria-pressed={focusMode}
        onClick={() => setFocusMode(!focusMode)}
      >
        {focusMode ? t('focus.exit') : t('focus.enter')}
      </button>
      <span className="control-group" role="group" aria-label={t('lang.label')}>
        <span className="control-label">{t('lang.label')}</span>
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
      <span className="control-group" role="group" aria-label={t('theme.label')}>
        <span className="control-label">{t('theme.label')}</span>
        {THEMES.map(({ id, key }) => (
          <button
            key={id}
            type="button"
            className="seg-button"
            aria-pressed={theme === id}
            onClick={() => setTheme(id)}
          >
            {t(key)}
          </button>
        ))}
      </span>
    </>
  );
}

export default function App() {
  const theme = useAppStore((s) => s.theme);
  const lang = useAppStore((s) => s.lang);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    let dispose: (() => void) | undefined;
    let cancelled = false;
    void initPersistence().then((d) => {
      if (cancelled) d();
      else dispose = d;
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return (
    <>
      <PanelLayout
        topBar={<TopBar />}
        navigator={<SceneNavigator />}
        editor={
          <>
            <AnnotatedReadBar />
            <ScreenplayEditor />
          </>
        }
        board={<Board />}
        inspector={<EvidenceInspector />}
        tray={<PassTray />}
      />
      <GoToPage />
      <ImportDialog />
    </>
  );
}
