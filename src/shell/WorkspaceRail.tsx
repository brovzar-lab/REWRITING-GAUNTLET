import { useAppStore } from '../store/appStore';
import { useT, type StringKey } from '../i18n/strings';

/** The left workspace rail — the router. Starts with Project. Each item drives
    one region (a left panel, the right context panel, or a center mode), so the
    workspace never shows everything at once. */

type RailId =
  | 'project'
  | 'journey'
  | 'scenes'
  | 'board'
  | 'evidence'
  | 'gameplan'
  | 'passes'
  | 'polish'
  | 'history'
  | 'layouts';

const GLYPH: Record<RailId, string> = {
  project: '▣',
  journey: '⚑',
  scenes: '☰',
  board: '▦',
  evidence: '✎',
  gameplan: '◎',
  passes: '⟳',
  polish: '✦',
  history: '⧗',
  layouts: '▤',
};

const ORDER: RailId[] = [
  'project',
  'journey',
  'scenes',
  'board',
  'evidence',
  'gameplan',
  'passes',
  'polish',
  'history',
  'layouts',
];

const LAYOUT_CYCLE = ['workbench', 'focus', 'board', 'script_notes'] as const;

export function WorkspaceRail() {
  const t = useT();
  const s = useAppStore();

  const isActive = (id: RailId): boolean => {
    switch (id) {
      case 'project':
        return s.leftWorkspace === 'project';
      case 'scenes':
        return s.leftWorkspace === 'scenes';
      case 'journey':
        return s.rightWorkspace === 'journey' && s.layoutMode !== 'board';
      case 'evidence':
        return s.rightWorkspace === 'evidence';
      case 'gameplan':
        return s.rightWorkspace === 'gameplan';
      case 'passes':
        return s.rightWorkspace === 'passes';
      case 'board':
        return s.layoutMode === 'board';
      case 'polish':
        return s.polishReadActive;
      case 'history':
        return s.historyOpen;
      case 'layouts':
        return false;
    }
  };

  const activate = (id: RailId) => {
    // History opens a dialog and Layouts cycles a mode; neither is a workspace
    // selection, so neither takes the rail focus.
    if (id !== 'history' && id !== 'layouts') s.setRailFocus(id);
    switch (id) {
      case 'project':
        return s.setLeftWorkspace('project');
      case 'scenes':
        return s.setLeftWorkspace('scenes');
      case 'journey':
        s.setRightWorkspace('journey');
        if (s.layoutMode === 'board') s.setLayoutMode('workbench');
        return;
      case 'evidence':
        return s.setRightWorkspace('evidence');
      case 'gameplan':
        return s.setRightWorkspace('gameplan');
      case 'passes':
        s.setRightWorkspace('passes');
        if (s.layoutMode === 'board') s.setLayoutMode('workbench');
        return;
      case 'board':
        return s.setLayoutMode(s.layoutMode === 'board' ? 'workbench' : 'board');
      case 'polish':
        if (s.layoutMode === 'board') s.setLayoutMode('workbench');
        return s.startPolishRead();
      case 'history':
        return s.setHistoryOpen(true);
      case 'layouts': {
        const next = LAYOUT_CYCLE[(LAYOUT_CYCLE.indexOf(s.layoutMode) + 1) % LAYOUT_CYCLE.length];
        return s.setLayoutMode(next);
      }
    }
  };

  return (
    <nav className="workspace-rail" aria-label={t('rail.label')}>
      {ORDER.map((id) => {
        // Strong active state belongs to the one workspace the writer selected;
        // other region-active items (e.g. Journey merely holding the right
        // panel) show a quiet "live" dot instead of a second active bar.
        const regionActive = isActive(id);
        const selected = regionActive && s.railFocus === id;
        const live = regionActive && !selected;
        return (
          <button
            key={id}
            type="button"
            className={`rail-item${selected ? ' is-active' : ''}${live ? ' is-live' : ''}`}
            aria-pressed={regionActive}
            title={t(`ws.${id}` as StringKey)}
            onClick={() => activate(id)}
          >
            <span className="rail-glyph" aria-hidden="true">
              {GLYPH[id]}
            </span>
            <span className="rail-label">{t(`ws.${id}` as StringKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
