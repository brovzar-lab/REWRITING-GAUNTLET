import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { db, type SnapshotRow } from '../store/db';
import { useT } from '../i18n/strings';

/** Visible snapshot history: every automatic snapshot (imports, completed
    passes) is listed and restorable. Restoring asks first and always saves a
    safety snapshot of the current draft, so nothing is ever lost. */
export function HistoryDialog() {
  const open = useAppStore((s) => s.historyOpen);
  const setOpen = useAppStore((s) => s.setHistoryOpen);
  const screenplayId = useAppStore((s) => s.screenplay.id);
  const takeSnapshot = useAppStore((s) => s.takeSnapshot);
  const restoreSnapshot = useAppStore((s) => s.restoreSnapshot);
  const t = useT();

  const [rows, setRows] = useState<SnapshotRow[] | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setConfirming(null);
    let cancelled = false;
    void db.snapshots
      .where('screenplayId')
      .equals(screenplayId)
      .toArray()
      .then((list) => {
        if (!cancelled) setRows(list.sort((a, b) => b.takenAt - a.takenAt));
      });
    return () => {
      cancelled = true;
    };
  }, [open, screenplayId]);

  if (!open) return null;

  const close = () => setOpen(false);

  const restore = async (id: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await takeSnapshot(t('history.safetyLabel'));
      await restoreSnapshot(id);
      close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="import-overlay" onClick={close}>
      <div
        className="import-dialog history-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t('history.title')}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') close();
        }}
      >
        <h2 className="panel-title">{t('history.title')}</h2>
        {rows !== null && rows.length === 0 && <p className="inspector-hint">{t('history.empty')}</p>}
        {rows !== null && rows.length > 0 && (
          <ul className="history-list">
            {rows.map((row) => (
              <li key={row.id} className="history-row">
                <div className="history-row-main">
                  <span className="history-label">{row.label}</span>
                  <span className="history-time">{new Date(row.takenAt).toLocaleString()}</span>
                  {confirming !== row.id && (
                    <button
                      type="button"
                      className="seg-button"
                      disabled={busy}
                      onClick={() => setConfirming(row.id)}
                    >
                      {t('history.restore')}
                    </button>
                  )}
                </div>
                {confirming === row.id && (
                  <div className="history-confirm">
                    <p className="import-note">{t('history.confirmMsg')}</p>
                    <div className="import-actions">
                      <button type="button" className="seg-button" onClick={() => setConfirming(null)}>
                        {t('import.cancel')}
                      </button>
                      <button
                        type="button"
                        className="seg-button history-confirm-btn"
                        disabled={busy}
                        onClick={() => void restore(row.id)}
                      >
                        {t('history.confirm')}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="import-actions">
          <button type="button" className="seg-button" onClick={close}>
            {t('history.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
