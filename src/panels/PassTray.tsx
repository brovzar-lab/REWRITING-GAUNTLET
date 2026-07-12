import { useRef } from 'react';
import { EPPS_PASSES } from '../model/passes';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';

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
  const passRuns = useAppStore((s) => s.workflow.passRuns);
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

  return (
    <footer className="pass-tray" aria-label={t('tray.title')}>
      <span className="panel-title tray-label">{t('tray.title')}</span>
      <div className="tray-chips" role="toolbar" aria-label={t('tray.title')} ref={listRef} onKeyDown={onKeyDown}>
        {EPPS_PASSES.map((pass) => {
          const active = activePassId === pass.id;
          const runState = passRuns[pass.id];
          const stateful = runState && runState !== 'not_started';
          return (
            <button
              key={pass.id}
              type="button"
              className={`ds-pass-chip${active ? ' is-active' : ''}${stateful ? ` run-${runState}` : ''}`}
              aria-pressed={active}
              title={pass.blurb}
              data-run-state={stateful ? runState : undefined}
              onClick={() => setActivePass(active ? null : pass.id)}
            >
              <span className="chip-order">{pass.order}</span>
              {pass.name.toUpperCase()}
              {stateful && (
                <span className={`chip-state chip-state-${runState}`}>
                  <span aria-hidden="true">{STATE_MARK[runState]}</span> {t(`passState.${runState}`)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </footer>
  );
}
