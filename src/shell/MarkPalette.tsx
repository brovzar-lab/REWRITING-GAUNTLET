import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { useT, type StringKey } from '../i18n/strings';
import type { ReadMarkType } from '../workflow/types';
import { paginate } from '../pagination/engine';

const ROWS: { type: ReadMarkType; key: string; hint: string }[] = [
  { type: 'great', key: 'g', hint: 'G' },
  { type: 'cut', key: 'x', hint: 'X' },
  { type: 'dropped', key: 'd', hint: 'D' },
  { type: 'question', key: '?', hint: '?' },
];

function toggleMark(type: ReadMarkType) {
  const s = useAppStore.getState();
  if (!s.selection) return;
  const existing = s.workflow.readMarks.find((m) => m.elementId === s.selection!.elementId && m.type === type);
  if (existing) return s.removeReadMark(existing.id);
  const page = paginate(s.screenplay).pageOfElement.get(s.selection.elementId) ?? 1;
  s.addReadMark({
    id: `mark-${crypto.randomUUID()}`,
    type,
    sceneId: s.selection.sceneId,
    elementId: s.selection.elementId,
    page,
    createdAt: Date.now(),
  });
}

/** The margin-pencil palette (delta 3). Read mode only; editing is locked, so
    single keys are safe as shortcuts. Same key on the same line toggles. */
export function MarkPalette() {
  const t = useT();
  const selection = useAppStore((s) => s.selection);
  const readMarks = useAppStore((s) => s.workflow.readMarks);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
      const row = ROWS.find((r) => r.key === e.key.toLowerCase() || r.key === e.key);
      if (!row) return;
      e.preventDefault();
      toggleMark(row.type);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <aside className="mark-palette" aria-label={t('mark.title')}>
      <span className="mark-palette-title">{t('mark.title')}</span>
      {ROWS.map((row) => {
        const active = selection
          ? readMarks.some((m) => m.elementId === selection.elementId && m.type === row.type)
          : false;
        return (
          <button
            key={row.type}
            type="button"
            className={`mark-row mark-row-${row.type}`}
            aria-pressed={active}
            disabled={!selection}
            onClick={() => toggleMark(row.type)}
          >
            <span className="mark-swatch" aria-hidden="true" />
            <span className="mark-label">{t(`mark.${row.type}` as StringKey)}</span>
            <span className="mark-key" aria-hidden="true">
              {row.hint}
            </span>
          </button>
        );
      })}
      <span className="mark-palette-hint">{t('mark.hint')}</span>
    </aside>
  );
}
