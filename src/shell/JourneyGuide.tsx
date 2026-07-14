import { useAppStore } from '../store/appStore';
import { useT, type StringKey } from '../i18n/strings';

/** The right-panel "what do I do next" guide: the draft-to-polish journey as a
    checklist. The current stage is highlighted with its why + primary action;
    finished stages carry a check. Soft guidance — the writer can jump anywhere.
    (Diagnose / Review / Complete are the sub-steps inside Rewrite.) */

interface Stage {
  id: 'open' | 'read' | 'plan' | 'rewrite' | 'polish' | 'export';
  done: (s: ReturnType<typeof useAppStore.getState>) => boolean;
  act: (s: ReturnType<typeof useAppStore.getState>) => void;
}

const STAGES: Stage[] = [
  { id: 'open', done: (s) => s.screenplay.scenes.length > 0, act: (s) => s.setLeftWorkspace('project') },
  { id: 'read', done: (s) => s.workflow.annotatedReadComplete, act: (s) => s.enterReadMode() },
  { id: 'plan', done: (s) => s.gamePlan.statementOfIntent.trim() !== '', act: (s) => s.setRightWorkspace('gameplan') },
  {
    id: 'rewrite',
    done: (s) => Object.values(s.workflow.passRuns).some((v) => v === 'complete'),
    act: (s) => s.setRightWorkspace('passes'),
  },
  { id: 'polish', done: (s) => s.polishReadComplete, act: (s) => s.startPolishRead() },
  { id: 'export', done: () => false, act: (s) => s.setExportOpen(true) },
];

export function currentJourneyStage(s: ReturnType<typeof useAppStore.getState>): number {
  const i = STAGES.findIndex((stage) => !stage.done(s));
  return i === -1 ? STAGES.length - 1 : i;
}

export function JourneyGuide() {
  const t = useT();
  // Subscribe to the fields the stages read so the guide stays live.
  useAppStore((s) => s.workflow.annotatedReadComplete);
  useAppStore((s) => s.gamePlan.statementOfIntent);
  useAppStore((s) => s.workflow.passRuns);
  useAppStore((s) => s.polishReadComplete);
  const state = useAppStore.getState();
  const current = currentJourneyStage(state);

  return (
    <aside className="journey-guide" aria-label={t('jg.title')}>
      <h2 className="panel-title">{t('jg.title')}</h2>
      <ol className="jg-list">
        {STAGES.map((stage, i) => {
          const done = stage.done(state);
          const isCurrent = i === current;
          return (
            <li
              key={stage.id}
              className={`jg-stage${done ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="jg-marker" aria-hidden="true">
                {done ? '✓' : i + 1}
              </span>
              <div className="jg-body">
                <span className="jg-name">{t(`jg.${stage.id}.name` as StringKey)}</span>
                {isCurrent && (
                  <>
                    <p className="jg-why">{t(`jg.${stage.id}.why` as StringKey)}</p>
                    <button
                      type="button"
                      className="seg-button jg-action"
                      onClick={() => stage.act(useAppStore.getState())}
                    >
                      {t(`jg.${stage.id}.action` as StringKey)}
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
