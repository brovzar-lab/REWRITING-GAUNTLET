import { useAppStore } from '../store/appStore';
import { useT, type StringKey } from '../i18n/strings';

/** The left workspace rail — the router. Grouped by the Epps journey (in
    journey order) vs. studio tools. Each item drives one region (a left
    panel, the right context panel, or a center mode), so the workspace never
    shows everything at once. */

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

/** Delta 2: two labeled groups. JOURNEY holds the Epps stages in journey
    order; STUDIO holds the workshop tools. The `journey` id is the Read item
    (the private annotated read). Project is management, not a journey stage:
    once a script is open it lives in Studio (and the top-bar project chip). */
const GROUPS: { key: 'journey' | 'studio'; items: RailId[] }[] = [
  { key: 'journey', items: ['journey', 'evidence', 'gameplan', 'passes', 'polish'] },
  { key: 'studio', items: ['project', 'scenes', 'board', 'history', 'layouts'] },
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
        return s.readModeActive;
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
    if (id !== 'history' && id !== 'layouts') {
      s.setRailFocus(id);
      // Leaving for any workspace closes the stage-3 Notes intake center view.
      s.setNotesIntakeOpen(false);
    }
    switch (id) {
      case 'project':
        return s.setLeftWorkspace('project');
      case 'scenes':
        return s.setLeftWorkspace('scenes');
      case 'journey':
        // Read: the guided private annotated read (journey stage 2).
        if (s.layoutMode === 'board') s.setLayoutMode('workbench');
        return s.enterReadMode();
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
      {GROUPS.map((group, gi) => (
        <div key={group.key} className="rail-group" role="group" aria-label={t(`railgroup.${group.key}` as StringKey)}>
          {gi > 0 && <span className="rail-divider" aria-hidden="true" />}
          <span className="rail-group-label" aria-hidden="true">
            {t(`railgroup.${group.key}` as StringKey)}
          </span>
          {group.items.map((id) => {
            // Strong active state belongs to the one workspace the writer
            // selected; other region-active items show a quiet "live" dot.
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
        </div>
      ))}
    </nav>
  );
}
