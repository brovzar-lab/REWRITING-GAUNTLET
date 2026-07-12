import { useAppStore } from '../store/appStore';
import { EPPS_PASSES } from '../model/passes';
import { useT } from '../i18n/strings';

/** After Complete pass: a plain account of what just happened — approved
    changes, rejected proposals, unresolved concerns, the snapshot, the new
    draft label — plus the two obvious next moves (export, next pass). */
export function PassSummaryDialog() {
  const summary = useAppStore((s) => s.passSummary);
  const clearPassSummary = useAppStore((s) => s.clearPassSummary);
  const setExportOpen = useAppStore((s) => s.setExportOpen);
  const setActivePass = useAppStore((s) => s.setActivePass);
  const screenplay = useAppStore((s) => s.screenplay);
  const t = useT();

  if (!summary) return null;

  const nextPass = summary.nextPassId ? EPPS_PASSES.find((p) => p.id === summary.nextPassId) : undefined;
  const sceneOf = (sceneId: string) => screenplay.scenes.find((s) => s.id === sceneId);
  const title = `${summary.passName} ${t('summary.complete')}`;

  return (
    <div className="import-overlay" onClick={clearPassSummary}>
      <div
        className="import-dialog pass-summary"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') clearPassSummary();
        }}
      >
        <h2 className="panel-title">{title}</h2>

        <section aria-label={t('summary.approved')} className="summary-block">
          <span className="control-label">
            {t('summary.approved')}: {summary.approved.length}
          </span>
          {summary.approved.length > 0 && (
            <ul className="summary-approvals">
              {summary.approved.map((a) => {
                const scene = sceneOf(a.sceneId);
                return (
                  <li key={a.id}>
                    <span className="summary-scene">
                      {scene ? `${scene.number} · ${scene.slug}` : a.sceneId}
                    </span>
                    <span className="ai-proposal-text ai-proposal-new">{a.newText}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="summary-line">
          {t('summary.rejected')}: {summary.rejectedCount}
        </p>
        <p className="summary-line">
          {t('summary.unresolved')}: {summary.unresolvedCount}
        </p>
        <p className="summary-line">
          {t('summary.snapshot')}: {summary.snapshotLabel}
        </p>
        <p className="summary-line">
          {t('summary.draftLabel')}: {summary.draftLabel}
        </p>

        <div className="import-actions">
          <button type="button" className="seg-button" onClick={clearPassSummary}>
            {t('summary.close')}
          </button>
          <button
            type="button"
            className="seg-button"
            onClick={() => {
              clearPassSummary();
              setExportOpen(true);
            }}
          >
            {t('summary.export')}
          </button>
          {nextPass && (
            <button
              type="button"
              className="seg-button pass-next"
              onClick={() => {
                clearPassSummary();
                setActivePass(nextPass.id);
              }}
            >
              {t('pass.next')}: {nextPass.order} {nextPass.name}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
