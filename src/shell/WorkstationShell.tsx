import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { AppMenuBar } from './AppMenuBar';
import { WorkspaceRail } from './WorkspaceRail';
import { ProjectPanel } from './ProjectPanel';
import { RightContextPanel } from './RightContextPanel';
import { PassStrip } from './PassStrip';
import { EmptyScriptState } from './EmptyScriptState';
import { WorkstationToolbar } from './WorkstationToolbar';
import { SceneNavigator } from '../panels/SceneNavigator';
import { StatusBar } from '../panels/StatusBar';
import { AnnotatedReadBar } from '../panels/AnnotatedReadBar';
import { PolishReadBar } from '../panels/PolishReadBar';
import { ScreenplayEditor } from '../editor/ScreenplayEditor';
import { Board } from '../board/Board';
import './shell.css';

/** The WriterDuet-informed workstation shell. Editor always center; a workspace
    rail that starts with Project; one contextual right panel; the board as a
    mode. Layout modes reconfigure which regions show. */
export function WorkstationShell() {
  const layoutMode = useAppStore((s) => s.layoutMode);
  const leftWorkspace = useAppStore((s) => s.leftWorkspace);
  const rightWorkspace = useAppStore((s) => s.rightWorkspace);
  const documentOpen = useAppStore((s) => s.documentOpen);
  const setBoardDock = useAppStore((s) => s.setBoardDock);

  // The board renders in the center here; keep its internal dock in side mode.
  useEffect(() => {
    setBoardDock('side');
  }, [setBoardDock]);

  const showRail = layoutMode !== 'focus';
  const showLeftPanel = layoutMode === 'workbench' && leftWorkspace !== null && documentOpen;
  const centerBoard = layoutMode === 'board' && documentOpen;
  const showRight = (layoutMode === 'workbench' || layoutMode === 'script_notes') && documentOpen;
  const effectiveRight = layoutMode === 'script_notes' ? 'evidence' : rightWorkspace;
  const showPassStrip = documentOpen && !centerBoard && rightWorkspace === 'passes';

  return (
    <div className={`workstation mode-${layoutMode}`}>
      <AppMenuBar />
      <WorkstationToolbar />
      {showPassStrip && <PassStrip />}
      <div className="workstation-body">
        {showRail && <WorkspaceRail />}
        {showLeftPanel && (
          <div className="left-panel">
            {leftWorkspace === 'project' ? <ProjectPanel /> : <SceneNavigator />}
          </div>
        )}
        <main className="center-region">
          {!documentOpen ? (
            <EmptyScriptState />
          ) : centerBoard ? (
            <Board />
          ) : (
            <>
              <AnnotatedReadBar />
              <PolishReadBar />
              <ScreenplayEditor />
              <StatusBar />
            </>
          )}
        </main>
        {showRight && (
          <div className="right-panel">
            <RightContextPanel override={effectiveRight} />
          </div>
        )}
      </div>
    </div>
  );
}
