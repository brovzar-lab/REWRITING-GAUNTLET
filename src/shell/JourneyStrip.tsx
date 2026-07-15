import { useAppStore } from '../store/appStore';
import { useT, type StringKey } from '../i18n/strings';
import { JOURNEY_STAGES, currentJourneyStage, stageStat } from './journeyStages';

/** The always-visible "you are here" strip — the antidote to the Circle of
    Confusion. Supersedes the JourneyGuide right panel. Stages are never
    locked, only de-emphasized; ✓ replaces the number when a stage is done. */
export function JourneyStrip() {
  const t = useT();
  // Subscribe to everything the stage predicates read, so the strip stays live.
  useAppStore((s) => s.workflow);
  useAppStore((s) => s.gamePlan.statementOfIntent);
  useAppStore((s) => s.polishReadComplete);
  useAppStore((s) => s.screenplay.scenes.length);
  const state = useAppStore.getState();
  const current = currentJourneyStage(state);
  const currentStage = JOURNEY_STAGES[current];

  const run = (index: number) => {
    const s = useAppStore.getState();
    if (JOURNEY_STAGES[index].id !== 'notes') s.setNotesIntakeOpen(false);
    JOURNEY_STAGES[index].act(s);
  };

  return (
    <nav className="journey-strip" aria-label={t('js.label')} title={t('js.orderNote')}>
      {JOURNEY_STAGES.map((stage, i) => {
        const done = stage.done(state);
        const stat = stageStat(state, stage.id);
        return (
          <span key={stage.id} className="js-segment">
            {i > 0 && (
              <span className="js-sep" aria-hidden="true">
                ›
              </span>
            )}
            <button
              type="button"
              className={`js-stage${i === current ? ' is-current' : ''}${done ? ' is-done' : ''}`}
              aria-current={i === current ? 'step' : undefined}
              onClick={() => run(i)}
            >
              <span className="js-num" aria-hidden="true">
                {done ? '✓' : i + 1}
              </span>
              <span className="js-name">{t(`js.${stage.id}.name` as StringKey)}</span>
              {stat && (
                <span className="js-stat">
                  {stat.current}/{stat.total}
                </span>
              )}
            </button>
          </span>
        );
      })}
      <span className="js-spacer" />
      <button type="button" className="js-continue" onClick={() => run(current)}>
        {t(`js.${currentStage.id}.cta` as StringKey)}
      </button>
    </nav>
  );
}
