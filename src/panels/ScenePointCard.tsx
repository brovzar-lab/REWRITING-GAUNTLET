import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';
import type { StringKey } from '../i18n/strings';
import type { ScenePointVerdict } from '../model/scenepoint';
import { emptyScenePoint } from '../model/scenepoint';
import { ExtChip } from './ExtChip';

/** Verdict is always icon + word, never color alone. */
const VERDICTS: { id: ScenePointVerdict; icon: string; key: StringKey }[] = [
  { id: 'earns', icon: '✓', key: 'sp.earns' },
  { id: 'unsure', icon: '?', key: 'sp.unsure' },
  { id: 'cut_candidate', icon: '✕', key: 'sp.cut' },
];

/** The Scene Point card for the selected scene: the book's one-sentence intent
    ("The point of this scene is…"), the earns-its-place verdict, and the
    EXT-labeled scene-dynamics sub-fields. Writer-authored; never auto-filled. */
export function ScenePointCard({ sceneId }: { sceneId: string }) {
  const t = useT();
  const scenePoint = useAppStore((s) => s.scenePoints[sceneId]) ?? emptyScenePoint(sceneId);
  const updateScenePoint = useAppStore((s) => s.updateScenePoint);

  const extField = (
    id: string,
    labelKey: StringKey,
    field: 'conflict' | 'turn' | 'valueChange' | 'audienceLearns',
  ) => (
    <div className="sp-ext-field">
      <label htmlFor={id} className="gp-label">
        {t(labelKey)}
      </label>
      <input
        id={id}
        type="text"
        value={scenePoint[field]}
        onChange={(e) => updateScenePoint(sceneId, { [field]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="scene-point-card">
      <div className="gp-field">
        <label htmlFor="sp-point" className="gp-label">
          {t('sp.title')}
        </label>
        <textarea
          id="sp-point"
          rows={2}
          value={scenePoint.point}
          placeholder={t('sp.placeholder')}
          onChange={(e) => updateScenePoint(sceneId, { point: e.target.value })}
        />
      </div>
      <div className="sp-verdict-row" role="group" aria-label={t('sp.verdict')}>
        <span className="gp-label">{t('sp.verdict')}</span>
        <span className="sp-verdicts">
          {VERDICTS.map(({ id, icon, key }) => (
            <button
              key={id}
              type="button"
              className={`seg-button sp-verdict-${id}`}
              aria-pressed={scenePoint.verdict === id}
              onClick={() =>
                updateScenePoint(sceneId, { verdict: scenePoint.verdict === id ? null : id })
              }
            >
              <span aria-hidden="true">{icon}</span> {t(key)}
            </button>
          ))}
        </span>
      </div>
      <details className="sp-dynamics">
        <summary className="gp-label">
          {t('sp.dynamics')} <ExtChip />
        </summary>
        <div className="sp-ext-grid">
          {extField('sp-conflict', 'sp.conflict', 'conflict')}
          {extField('sp-turn', 'sp.turn', 'turn')}
          {extField('sp-value', 'sp.valueChange', 'valueChange')}
          {extField('sp-learns', 'sp.audienceLearns', 'audienceLearns')}
        </div>
      </details>
    </div>
  );
}
