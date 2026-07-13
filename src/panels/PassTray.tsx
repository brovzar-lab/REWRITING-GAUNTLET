import { useRef } from 'react';
import { EPPS_PASSES } from '../model/passes';
import { useAppStore } from '../store/appStore';
import { useT, type StringKey } from '../i18n/strings';

/** Persistent rewrite-pass tray: Epps's 11 passes in his book order.
    Passes are lenses — selectable in any order, repeatable, skippable. */
const STATE_MARK: Record<string, string> = {
  diagnosing: '…',
  reviewing: '◐',
  complete: '✓',
};

export function PassTray() {
  const activePassId = useAppStore((s) => s.activePassId);
  const setActivePass = useAppStore((s) => s.setActivePass);
  const setInspectorTab = useAppStore((s) => s.setInspectorTab);
  const passRuns = useAppStore((s) => s.workflow.passRuns);
  const findings = useAppStore((s) => s.workflow.findings);
  const evidence = useAppStore((s) => s.evidence);
  const focusMode = useAppStore((s) => s.focusMode);
  const t = useT();
  const listRef = useRef<HTMLDivElement>(null);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const chips = [...(listRef.current?.querySelectorAll<HTMLButtonElement>('.ds-pass-chip') ?? [])];
    const index = chips.findIndex((c) => c === document.activeElement);
    if (index === -1) return;
    e.preventDefault();
    const next = e.key === 'ArrowRight' ? Math.min(chips.length - 1, index + 1) : Math.max(0, index - 1);
    chips[next].focus();
  }

  const activePass = EPPS_PASSES.find((p) => p.id === activePassId);
  const goals = activePass
    ? t(`pass.ex.${activePass.id}` as StringKey).split('|').slice(0, 3)
    : [];
  const passNotes = activePass ? evidence.filter((e) => e.passId === activePass.id) : [];
  const latestNote = passNotes[passNotes.length - 1];
  const proposals = activePass ? findings.filter((f) => f.passId === activePass.id && f.proposal) : [];
  const resolvedCount = proposals.filter((f) => f.resolution !== 'open').length;
  const runState = activePass ? (passRuns[activePass.id] ?? 'not_started') : 'not_started';
  const progressPct = proposals.length > 0 ? Math.round((resolvedCount / proposals.length) * 100) : 0;

  return (
    <footer className="pass-tray" aria-label={t('tray.title')}>
      <div className="tray-row">
        <span className="panel-title tray-label">{t('tray.title')}</span>
        <div className="tray-chips" role="toolbar" aria-label={t('tray.title')} ref={listRef} onKeyDown={onKeyDown}>
          {EPPS_PASSES.map((pass) => {
            const active = activePassId === pass.id;
            const chipRunState = passRuns[pass.id];
            const stateful = chipRunState && chipRunState !== 'not_started';
            return (
              <button
                key={pass.id}
                type="button"
                className={`ds-pass-chip${active ? ' is-active' : ''}${stateful ? ` run-${chipRunState}` : ''}`}
                aria-pressed={active}
                title={pass.blurb}
                data-run-state={stateful ? chipRunState : undefined}
                onClick={() => setActivePass(active ? null : pass.id)}
              >
                <span className="chip-order">{pass.order}</span>
                {pass.name.toUpperCase()}
                {stateful && (
                  <span className={`chip-state chip-state-${chipRunState}`}>
                    <span aria-hidden="true">{STATE_MARK[chipRunState]}</span> {t(`passState.${chipRunState}`)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      {activePass && !focusMode && (
        <div className="tray-detail" role="group" aria-label={t('tray.detail')}>
          <div className="tray-col">
            <span className="control-label">{t('tray.focus')}</span>
            <p className="tray-focus">{activePass.blurb}</p>
          </div>
          <div className="tray-col">
            <span className="control-label">{t('tray.goals')}</span>
            <ul className="tray-goals">
              {goals.map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ul>
          </div>
          <div className="tray-col">
            <span className="control-label">{t('tray.notes')}</span>
            <p className="tray-notes">
              {passNotes.length > 0 ? `${passNotes.length} ${t('pass.notes')}` : t('tray.nonotes')}
            </p>
            {latestNote && <p className="tray-note-latest">{latestNote.summary}</p>}
          </div>
          <div className="tray-col">
            <span className="control-label">{t('tray.status')}</span>
            <p className="tray-status">
              {proposals.length > 0 && (
                <>
                  {t('tray.resolved')
                    .replace('{a}', String(resolvedCount))
                    .replace('{b}', String(proposals.length))}
                  {' · '}
                </>
              )}
              {t(`passState.${runState}`)}
            </p>
            {proposals.length > 0 && (
              <span className="tray-progress" aria-hidden="true">
                <i style={{ width: `${progressPct}%` }} />
              </span>
            )}
          </div>
          <button
            type="button"
            className="seg-button tray-open"
            onClick={() => {
              setActivePass(activePass.id);
              setInspectorTab('pass');
            }}
          >
            {t('tray.open')}
          </button>
        </div>
      )}
    </footer>
  );
}
