import { useEffect } from 'react';
import { PanelLayout } from './panels/PanelLayout';
import { GoToPage } from './panels/GoToPage';
import { ImportDialog } from './panels/ImportDialog';
import { AnnotatedReadBar } from './panels/AnnotatedReadBar';
import { AiSettings } from './panels/AiSettings';
import { ExportMenu } from './panels/ExportMenu';
import { PrintView } from './panels/PrintView';
import { PassSummaryDialog } from './panels/PassSummaryDialog';
import { HistoryDialog } from './panels/HistoryDialog';
import { SceneNavigator } from './panels/SceneNavigator';
import { InspectorTabs } from './panels/InspectorTabs';
import { PassTray } from './panels/PassTray';
import { ScreenplayEditor } from './editor/ScreenplayEditor';
import { Board } from './board/Board';
import { TopBar } from './panels/TopBar';
import { initPersistence } from './store/persistence';
import { useAppStore } from './store/appStore';

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
        inspector={<InspectorTabs />}
        tray={<PassTray />}
      />
      <GoToPage />
      <ImportDialog />
      <AiSettings />
      <ExportMenu />
      <PrintView />
      <PassSummaryDialog />
      <HistoryDialog />
    </>
  );
}
