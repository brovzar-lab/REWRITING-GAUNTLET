import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';
import type { StringKey } from '../i18n/strings';
import {
  momentumByAct,
  setupPayoffRows,
  STRUCTURAL_ROLES,
  type SetupPayoffStatus,
  type StoryBeat,
} from '../model/markers';
import './structure.css';

const ACT_KEY = { 1: 'nav.act1', 2: 'nav.act2', 3: 'nav.act3' } as const;

const STATUS: Record<SetupPayoffStatus, { icon: string; key: StringKey }> = {
  ok: { icon: '✓', key: 'map.status.ok' },
  late_setup: { icon: '⚠', key: 'map.status.late_setup' },
  unpaid_setup: { icon: '○', key: 'map.status.unpaid_setup' },
  orphan_payoff: { icon: '○', key: 'map.status.orphan_payoff' },
};

/** Full-board structural view. M3: the Set-Up / Pay-off Map. Every row is
    derived purely from where the writer's marked beats sit in the script, and
    every reference jumps to the exact line. (M4 will add high points here.) */
export function StructureView() {
  const t = useT();
  const screenplay = useAppStore((s) => s.screenplay);
  const storyBeats = useAppStore((s) => s.storyBeats);
  const highPoints = useAppStore((s) => s.highPoints);
  const select = useAppStore((s) => s.select);
  const pairBeats = useAppStore((s) => s.pairBeats);
  const unpairBeat = useAppStore((s) => s.unpairBeat);

  const rows = setupPayoffRows(storyBeats, screenplay);
  const sceneNumber = (sceneId: string) => screenplay.scenes.find((s) => s.id === sceneId)?.number ?? '?';
  const jumpToScene = (sceneId: string) => {
    const scene = screenplay.scenes.find((s) => s.id === sceneId);
    if (scene) select({ sceneId, elementId: scene.elements[0].id });
  };
  const momentum = momentumByAct(highPoints, screenplay);
  const orphanPayoffs = storyBeats.filter((b) => b.kind === 'payoff' && !b.pairedWith);
  const unpairedSetups = storyBeats.filter((b) => b.kind === 'setup' && !b.pairedWith);

  const ref = (beat: StoryBeat, roleKey: StringKey) => (
    <button
      type="button"
      className="gp-anchor"
      onClick={() => select({ sceneId: beat.sceneId, elementId: beat.elementId })}
    >
      {t(roleKey)} · {t('gp.scene')} {sceneNumber(beat.sceneId)}
    </button>
  );

  return (
    <section className="structure-view" aria-label={t('map.title')}>
      <h3 className="inspector-section">{t('hp.checklist')}</h3>
      {highPoints.length === 0 && <p className="inspector-hint">{t('hp.empty')}</p>}
      <ul className="hp-checklist" aria-label={t('hp.checklist')}>
        {STRUCTURAL_ROLES.map((role) => {
          const placed = highPoints.find((m) => m.role === role);
          return (
            <li key={role} className={`hp-item${placed ? ' is-placed' : ''}`}>
              {placed ? (
                <button type="button" className="gp-anchor" onClick={() => jumpToScene(placed.sceneId)}>
                  {t(`hp.full.${role}` as StringKey)} · {t('gp.scene')} {sceneNumber(placed.sceneId)}
                </button>
              ) : (
                <span className="hp-unplaced">
                  {t(`hp.full.${role}` as StringKey)} — {t('hp.notPlaced')}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {momentum.length > 0 && (
        <div className="hp-momentum" role="group" aria-label={t('hp.momentum')}>
          <h3 className="inspector-section">{t('hp.momentum')}</h3>
          {momentum.map((group) => (
            <div key={group.act} className="hp-momentum-act">
              <span className="hp-momentum-actlabel">{t(ACT_KEY[group.act])}</span>
              <span className="hp-momentum-points">
                {group.points.map((p) => (
                  <button
                    key={p.sceneId}
                    type="button"
                    className={`hp-momentum-point dir-${p.direction}`}
                    onClick={() => jumpToScene(p.sceneId)}
                  >
                    <span aria-hidden="true">{p.direction === 'high' ? '▲' : '▼'}</span> {p.number}{' '}
                    {t(`hp.short.emotional_${p.direction}` as StringKey)}
                  </button>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}

      <h3 className="inspector-section">{t('map.title')}</h3>
      {rows.length === 0 ? (
        <p className="inspector-hint">{t('map.empty')}</p>
      ) : (
        <ul className="map-list" aria-label={t('map.title')}>
          {rows.map((row) => {
            const key = row.setup?.id ?? row.payoff!.id;
            const s = STATUS[row.status];
            return (
              <li key={key} className={`map-row status-${row.status}`}>
                <span className="map-status">
                  <span aria-hidden="true">{s.icon}</span> {t(s.key)}
                </span>
                <span className="map-refs">
                  {row.setup && ref(row.setup, 'map.setup')}
                  {row.payoff && ref(row.payoff, 'map.payoff')}
                </span>
                {row.status === 'unpaid_setup' && orphanPayoffs.length > 0 && (
                  <select
                    className="map-pair"
                    aria-label={t('map.pairWithPayoff')}
                    value=""
                    onChange={(e) => e.target.value && pairBeats(row.setup!.id, e.target.value)}
                  >
                    <option value="">{t('map.pairWithPayoff')}</option>
                    {orphanPayoffs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {t('gp.scene')} {sceneNumber(p.sceneId)}
                      </option>
                    ))}
                  </select>
                )}
                {row.status === 'orphan_payoff' && unpairedSetups.length > 0 && (
                  <select
                    className="map-pair"
                    aria-label={t('map.pairWithSetup')}
                    value=""
                    onChange={(e) => e.target.value && pairBeats(e.target.value, row.payoff!.id)}
                  >
                    <option value="">{t('map.pairWithSetup')}</option>
                    {unpairedSetups.map((setup) => (
                      <option key={setup.id} value={setup.id}>
                        {t('gp.scene')} {sceneNumber(setup.sceneId)}
                      </option>
                    ))}
                  </select>
                )}
                {(row.status === 'ok' || row.status === 'late_setup') && (
                  <button
                    type="button"
                    className="tool-button map-unpair"
                    onClick={() => unpairBeat(row.setup!.id)}
                  >
                    {t('map.unpair')}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
