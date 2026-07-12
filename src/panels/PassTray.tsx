import { useRef } from 'react';
import { EPPS_PASSES } from '../model/passes';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';

/** Persistent rewrite-pass tray: Epps's 11 passes in his book order.
    Passes are lenses — selectable in any order, repeatable, skippable. */
export function PassTray() {
  const activePassId = useAppStore((s) => s.activePassId);
  const setActivePass = useAppStore((s) => s.setActivePass);
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
          return (
            <button
              key={pass.id}
              type="button"
              className={`ds-pass-chip${active ? ' is-active' : ''}`}
              aria-pressed={active}
              title={pass.blurb}
              onClick={() => setActivePass(active ? null : pass.id)}
            >
              <span className="chip-order">{pass.order}</span>
              {pass.name.toUpperCase()}
            </button>
          );
        })}
      </div>
    </footer>
  );
}
