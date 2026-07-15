import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { AppMenuBar } from './AppMenuBar';
import { WorkspaceRail } from './WorkspaceRail';
import { ProjectPanel } from './ProjectPanel';
import { RightContextPanel } from './RightContextPanel';
import { PassStrip } from './PassStrip';
import { JourneyStrip } from './JourneyStrip';
import { MarkPalette } from './MarkPalette';
import { EmptyScriptState } from './EmptyScriptState';
import { WorkstationToolbar } from './WorkstationToolbar';
import { SceneNavigator } from '../panels/SceneNavigator';
import { StatusBar } from '../panels/StatusBar';
import { AnnotatedReadBar } from '../panels/AnnotatedReadBar';
import { PolishReadBar } from '../panels/PolishReadBar';
import { ScreenplayEditor } from '../editor/ScreenplayEditor';
import { Board } from '../board/Board';
import { NotesIntake } from '../panels/NotesIntake';
// Shared control styles (tool/seg buttons, scene rows, chips, save indicator).
// PanelLayout used to import this; the shell owns it now. Keep before shell.css
// so the workstation overrides win the cascade.
import '../panels/panels.css';
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
  const readModeActive = useAppStore((s) => s.readModeActive);
  const notesIntakeOpen = useAppStore((s) => s.notesIntakeOpen);

  // The board renders in the center here; keep its internal dock in side mode.
  useEffect(() => {
    setBoardDock('side');
  }, [setBoardDock]);

  const showRail = layoutMode !== 'focus';
  const showLeftPanel = layoutMode === 'workbench' && leftWorkspace !== null && documentOpen;
  const centerBoard = layoutMode === 'board' && documentOpen;
  // Board mode swaps the center for the board but keeps the context panel, so
  // structure work still has evidence / the pass workspace beside it.
  const showRight = layoutMode !== 'focus' && documentOpen;
  const effectiveRight = layoutMode === 'script_notes' ? 'evidence' : rightWorkspace;
  const showPassStrip = documentOpen && !centerBoard && rightWorkspace === 'passes';

  return (
    <div className={`workstation mode-${layoutMode}`}>
      <AppMenuBar />
      <WorkstationToolbar />
      {documentOpen && <JourneyStrip />}
      {showPassStrip && <PassStrip />}
      <div className="workstation-body">
        {showRail && <WorkspaceRail />}
        {showLeftPanel && (
          <div className="left-panel">
            {leftWorkspace === 'project' ? <ProjectPanel /> : <SceneNavigator />}
          </div>
        )}
        <main className={`center-region${readModeActive ? ' is-reading' : ''}`}>
          {!documentOpen ? (
            <EmptyScriptState />
          ) : notesIntakeOpen ? (
            <NotesIntake />
          ) : centerBoard ? (
            <Board />
          ) : (
            <>
              <AnnotatedReadBar />
              <PolishReadBar />
              <ScreenplayEditor />
              {readModeActive && <MarkPalette />}
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
