import { useAppStore } from '../store/appStore';
import { EvidenceInspector } from './EvidenceInspector';
import { PassWorkspace } from './PassWorkspace';
import { GamePlanPanel } from './GamePlanPanel';
import { useT } from '../i18n/strings';

/** The inspector column: human evidence & notes on one tab, the guided pass
    workspace (with its AI assist) on another, the writer's Game Plan on the
    third. Separate tabs keep note sources visibly apart, as the method demands. */
export function InspectorTabs() {
  const tab = useAppStore((s) => s.inspectorTab);
  const setTab = useAppStore((s) => s.setInspectorTab);
  const t = useT();

  const tabs = [
    { id: 'evidence' as const, label: t('inspector.tabEvidence') },
    { id: 'pass' as const, label: t('inspector.tabPass') },
    { id: 'gameplan' as const, label: t('gp.tab') },
  ];

  return (
    <div className="inspector-tabs">
      <div className="inspector-tablist" role="tablist" aria-label={t('inspector.title')}>
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`inspector-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`inspector-panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            className={`inspector-tab${tab === id ? ' is-active' : ''}`}
            onClick={() => setTab(id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const at = tabs.findIndex((entry) => entry.id === id);
                const step = e.key === 'ArrowRight' ? 1 : -1;
                const next = tabs[(at + step + tabs.length) % tabs.length].id;
                setTab(next);
                document.getElementById(`inspector-tab-${next}`)?.focus();
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`inspector-panel-${tab}`}
        aria-labelledby={`inspector-tab-${tab}`}
        className="inspector-tabpanel"
      >
        {tab === 'evidence' ? <EvidenceInspector /> : tab === 'pass' ? <PassWorkspace /> : <GamePlanPanel />}
      </div>
    </div>
  );
}
