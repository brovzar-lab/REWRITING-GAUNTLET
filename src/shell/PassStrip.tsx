import { useRef } from 'react';
import { EPPS_PASSES } from '../model/passes';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';

const STATE_MARK: Record<string, string> = { diagnosing: '…', reviewing: '◐', complete: '✓' };

/** The 11 Epps passes promoted to a horizontal strip at the top of the Rewrite
    workspace. Selecting a pass opens its workspace in the right context panel.
    Passes are lenses — any order, repeatable, skippable. */
export function PassStrip() {
  const activePassId = useAppStore((s) => s.activePassId);
  const setActivePass = useAppStore((s) => s.setActivePass);
  const passRuns = useAppStore((s) => s.workflow.passRuns);
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const chips = [...(ref.current?.querySelectorAll<HTMLButtonElement>('.ds-pass-chip') ?? [])];
    const i = chips.findIndex((c) => c === document.activeElement);
    if (i === -1) return;
    e.preventDefault();
    chips[e.key === 'ArrowRight' ? Math.min(chips.length - 1, i + 1) : Math.max(0, i - 1)].focus();
  }

  return (
    <div className="pass-strip" role="toolbar" aria-label={t('tray.title')} ref={ref} onKeyDown={onKeyDown}>
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
            title={`${pass.name} — ${pass.blurb}`}
            onClick={() => setActivePass(pass.id)}
          >
            <span className="chip-order" aria-hidden="true">
              {pass.order}
            </span>
            <span className="chip-name">{pass.short.toUpperCase()}</span>
            {stateful && (
              <span className={`chip-state chip-state-${runState}`} aria-hidden="true">
                {STATE_MARK[runState]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
