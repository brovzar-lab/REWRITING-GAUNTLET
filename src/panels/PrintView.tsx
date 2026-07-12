import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { paginate } from '../pagination/engine';
import { useT } from '../i18n/strings';
import type { ElementType } from '../model/screenplay';

/** Renders the pagination engine's pages 1:1 for the system print dialog
    (Save as PDF). What you see on screen is exactly what the engine placed —
    same lines, same breaks, same (MORE)/(CONT'D) artifacts. */
export function PrintView() {
  const open = useAppStore((s) => s.printViewOpen);
  const setOpen = useAppStore((s) => s.setPrintViewOpen);
  const screenplay = useAppStore((s) => s.screenplay);
  const t = useT();

  const result = useMemo(() => (open ? paginate(screenplay) : null), [open, screenplay]);

  const typeOf = useMemo(() => {
    const map = new Map<string, ElementType>();
    for (const scene of screenplay.scenes) for (const el of scene.elements) map.set(el.id, el.type);
    return map;
  }, [screenplay]);

  if (!open || !result) return null;

  return (
    <div className="print-view" role="region" aria-label={t('print.title')}>
      <div className="print-toolbar">
        <h2 className="panel-title">{t('print.title')}</h2>
        <span className="import-note">{t('export.printNote')}</span>
        <span className="top-bar-spacer" />
        <button type="button" className="seg-button" onClick={() => window.print()}>
          {t('print.print')}
        </button>
        <button type="button" className="seg-button" onClick={() => setOpen(false)}>
          {t('print.close')}
        </button>
      </div>
      <div className="print-pages">
        {result.pages.map((page) => (
          <div className="print-page" key={page.number}>
            {page.lines.map((line, i) => {
              const cls =
                line.kind === 'text' ? `pv-${typeOf.get(line.elementId) ?? 'action'}` : `pv-${line.kind}`;
              return (
                <div key={i} className={`pv-line ${cls}`}>
                  {line.text === '' ? ' ' : line.text}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
