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
  const currentId = JOURNEY_STAGES[currentJourneyStage(state)].id;
  // The strip only renders once a script is open, so the journey it shows
  // begins with the Private read; getting a script in is project management
  // (File menu / project chip), not a development stage.
  const stages = JOURNEY_STAGES.filter((stage) => stage.id !== 'script');
  const currentStage = stages.find((stage) => stage.id === currentId) ?? stages[0];

  const run = (stage: (typeof stages)[number]) => {
    const s = useAppStore.getState();
    if (stage.id !== 'notes') s.setNotesIntakeOpen(false);
    stage.act(s);
  };

  return (
    <nav className="journey-strip" aria-label={t('js.label')} title={t('js.orderNote')}>
      {stages.map((stage, i) => {
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
              className={`js-stage${stage.id === currentStage.id ? ' is-current' : ''}${done ? ' is-done' : ''}`}
              aria-current={stage.id === currentStage.id ? 'step' : undefined}
              onClick={() => run(stage)}
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
      <button type="button" className="js-continue" onClick={() => run(currentStage)}>
        {t(`js.${currentStage.id}.cta` as StringKey)}
      </button>
    </nav>
  );
}
