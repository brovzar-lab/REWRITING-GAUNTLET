import type { ReactNode } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';
import type { StringKey } from '../i18n/strings';
import {
  missingStructuralRoles,
  setupPayoffRows,
  STRUCTURAL_ROLES,
  type SetupPayoffStatus,
  type StoryBeat,
} from '../model/markers';

const STATUS_KEY: Record<SetupPayoffStatus, StringKey> = {
  ok: 'map.status.ok',
  late_setup: 'map.status.late_setup',
  unpaid_setup: 'map.status.unpaid_setup',
  orphan_payoff: 'map.status.orphan_payoff',
};

/** The methodology tools, surfaced read-only inside the matching pass workspace
    where the book uses them. Every item here is a WRITER fact drawn from the
    writer's own marks — visibly separate from AI findings, and it only renders
    when there is something to show (no dead UI). Deeper editing stays on the
    object (card, line) and in the Game Plan tab. */
export function PassToolSection({ passId }: { passId: string }) {
  const t = useT();
  const screenplay = useAppStore((s) => s.screenplay);
  const storyBeats = useAppStore((s) => s.storyBeats);
  const highPoints = useAppStore((s) => s.highPoints);
  const gamePlan = useAppStore((s) => s.gamePlan);
  const select = useAppStore((s) => s.select);

  const sceneNumber = (sceneId: string) => screenplay.scenes.find((s) => s.id === sceneId)?.number ?? '?';
  const jump = (sceneId: string, elementId: string) => select({ sceneId, elementId });
  const jumpScene = (sceneId: string) => {
    const scene = screenplay.scenes.find((s) => s.id === sceneId);
    if (scene) select({ sceneId, elementId: scene.elements[0].id });
  };

  const beatRef = (beat: StoryBeat, roleKey: StringKey) => (
    <button type="button" className="gp-anchor" onClick={() => jump(beat.sceneId, beat.elementId)}>
      {t(roleKey)} · {t('gp.scene')} {sceneNumber(beat.sceneId)}
    </button>
  );

  const frame = (title: string, body: ReactNode) => (
    <section className="pass-tool" aria-label={title}>
      <span className="control-label pass-tool-head">
        <span className="source-chip source-writer">{t('source.writer')}</span>
        {title}
      </span>
      {body}
    </section>
  );

  if (passId === 'plot') {
    const rows = setupPayoffRows(storyBeats, screenplay);
    if (rows.length === 0) return null;
    return frame(
      t('pass.tool.plot'),
      <ul className="pass-tool-list">
        {rows.map((row) => (
          <li key={row.setup?.id ?? row.payoff!.id} className={`pass-tool-row status-${row.status}`}>
            <span className="map-status">{t(STATUS_KEY[row.status])}</span>
            {row.setup && beatRef(row.setup, 'map.setup')}
            {row.payoff && beatRef(row.payoff, 'map.payoff')}
          </li>
        ))}
      </ul>,
    );
  }

  if (passId === 'structure') {
    if (highPoints.filter((m) => (STRUCTURAL_ROLES as string[]).includes(m.role)).length === 0) return null;
    const missing = missingStructuralRoles(highPoints);
    return frame(
      t('pass.tool.structure'),
      <ul className="pass-tool-list">
        {STRUCTURAL_ROLES.map((role) => {
          const placed = highPoints.find((m) => m.role === role);
          return (
            <li key={role} className="pass-tool-row">
              {placed ? (
                <button type="button" className="gp-anchor" onClick={() => jumpScene(placed.sceneId)}>
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
        {missing.length === 0 && <li className="pass-tool-row">{t('pass.tool.allPlaced')}</li>}
      </ul>,
    );
  }

  if (passId === 'story-theme') {
    const theme = gamePlan.compass.themeThroughAction.trim();
    const motifs = gamePlan.compass.motifs;
    if (!theme && motifs.length === 0) return null;
    return frame(
      t('pass.tool.storyTheme'),
      <>
        {theme && <p className="pass-tool-theme">{theme}</p>}
        {motifs.length > 0 && (
          <ul className="pass-tool-list">
            {motifs.map((motif) => (
              <li key={motif.id} className="pass-tool-row">
                <button
                  type="button"
                  className="gp-anchor"
                  disabled={motif.occurrences.length === 0}
                  onClick={() =>
                    motif.occurrences[0] &&
                    jump(motif.occurrences[0].sceneId, motif.occurrences[0].elementId)
                  }
                >
                  {motif.name}
                </button>
                <span className="pass-tool-count">
                  {t('pass.tool.appearsIn').replace('{n}', String(motif.occurrences.length))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </>,
    );
  }

  return null;
}
