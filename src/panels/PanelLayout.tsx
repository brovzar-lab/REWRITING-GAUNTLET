import { useCallback, useRef, type ReactNode } from 'react';
import { useAppStore } from '../store/appStore';
import { StatusBar } from './StatusBar';
import { useT } from '../i18n/strings';
import './panels.css';

interface ResizerProps {
  panel: string;
  orientation: 'vertical' | 'horizontal';
  min: number;
  max: number;
  /** For right-side panels the drag delta is inverted. */
  invert?: boolean;
  label: string;
}

/** Draggable + keyboard-operable panel divider. Double-click collapses. */
function Resizer({ panel, orientation, min, max, invert, label }: ResizerProps) {
  const setPanelSize = useAppStore((s) => s.setPanelSize);
  const togglePanel = useAppStore((s) => s.togglePanel);
  const sizes = useAppStore((s) => s.panelSizes);
  const startRef = useRef<{ at: number; size: number } | null>(null);

  const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max]);
  const current = sizes[panel] ?? 0;

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const size = useAppStore.getState().panelSizes[panel] ?? defaultSize(panel);
    startRef.current = { at: orientation === 'vertical' ? e.clientX : e.clientY, size };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!startRef.current) return;
    const at = orientation === 'vertical' ? e.clientX : e.clientY;
    let delta = at - startRef.current.at;
    if (invert || orientation === 'horizontal') delta = -delta;
    setPanelSize(panel, clamp(startRef.current.size + delta));
  }

  function onPointerUp() {
    startRef.current = null;
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const step = e.shiftKey ? 40 : 12;
    const size = useAppStore.getState().panelSizes[panel] ?? defaultSize(panel);
    const grow = orientation === 'vertical' ? (invert ? 'ArrowLeft' : 'ArrowRight') : 'ArrowUp';
    const shrink = orientation === 'vertical' ? (invert ? 'ArrowRight' : 'ArrowLeft') : 'ArrowDown';
    if (e.key === grow) setPanelSize(panel, clamp(size + step));
    else if (e.key === shrink) setPanelSize(panel, clamp(size - step));
    else if (e.key === 'Enter') togglePanel(panel);
    else return;
    e.preventDefault();
  }

  return (
    <div
      className={`panel-resizer ${orientation}`}
      role="separator"
      tabIndex={0}
      aria-orientation={orientation}
      aria-label={label}
      aria-valuenow={Math.round(current)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={() => togglePanel(panel)}
      onKeyDown={onKeyDown}
    />
  );
}

const DEFAULT_SIZES: Record<string, number> = { navigator: 232, inspector: 296, board: 200 };
export function defaultSize(panel: string): number {
  return DEFAULT_SIZES[panel] ?? 200;
}

export interface PanelLayoutProps {
  topBar: ReactNode;
  navigator: ReactNode;
  editor: ReactNode;
  board: ReactNode;
  inspector: ReactNode;
  tray: ReactNode;
}

/** Default workspace: navigator | screenplay page | inspector, board shelf, pass tray.
    Focus mode hides everything but the page and tray; full-board mode gives the
    board the whole middle region. */
export function PanelLayout({ topBar, navigator, editor, board, inspector, tray }: PanelLayoutProps) {
  const sizes = useAppStore((s) => s.panelSizes);
  const collapsed = useAppStore((s) => s.collapsedPanels);
  const focusMode = useAppStore((s) => s.focusMode);
  const fullBoard = useAppStore((s) => s.fullBoard);
  const t = useT();

  const navWidth = collapsed.navigator || focusMode ? 0 : (sizes.navigator ?? defaultSize('navigator'));
  const inspectorWidth = collapsed.inspector || focusMode ? 0 : (sizes.inspector ?? defaultSize('inspector'));
  const boardHeight = collapsed.board || focusMode ? 0 : (sizes.board ?? defaultSize('board'));

  return (
    <div className={`workspace${focusMode ? ' focus-mode' : ''}${fullBoard ? ' full-board' : ''}`}>
      <header className="top-bar">{topBar}</header>
      {fullBoard ? (
        <div className="middle board-only">{board}</div>
      ) : (
        <>
          <div className="middle" style={{ gridTemplateColumns: `${navWidth}px auto 1fr auto ${inspectorWidth}px` }}>
            <div className="panel navigator-panel" hidden={navWidth === 0}>
              {navigator}
            </div>
            <Resizer panel="navigator" orientation="vertical" min={160} max={420} label={t('nav.title')} />
            <main className="editor-panel">
              {editor}
              <StatusBar />
            </main>
            <Resizer panel="inspector" orientation="vertical" min={220} max={480} invert label={t('inspector.title')} />
            <div className="panel inspector-panel" hidden={inspectorWidth === 0}>
              {inspector}
            </div>
          </div>
          <Resizer panel="board" orientation="horizontal" min={120} max={420} label={t('board.title')} />
          <div className="board-shelf" style={{ height: boardHeight }} hidden={boardHeight === 0}>
            {board}
          </div>
        </>
      )}
      {tray}
    </div>
  );
}
