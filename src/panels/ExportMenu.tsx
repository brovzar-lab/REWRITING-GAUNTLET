import { useAppStore } from '../store/appStore';
import { serializeFountain } from '../io/fountain';
import { serializeFdx } from '../io/fdx';
import { downloadText, fileSlug } from '../io/download';
import { setupPayoffRows } from '../model/markers';
import { useT } from '../i18n/strings';

/** Export the working draft. Each option carries its honest fidelity caveat.
    The draft is always the accumulation of approved changes only — that is
    what these files contain. */
export function ExportMenu() {
  const open = useAppStore((s) => s.exportOpen);
  const setOpen = useAppStore((s) => s.setExportOpen);
  const setPrintViewOpen = useAppStore((s) => s.setPrintViewOpen);
  const screenplay = useAppStore((s) => s.screenplay);
  const polishReadComplete = useAppStore((s) => s.polishReadComplete);
  const storyBeats = useAppStore((s) => s.storyBeats);
  const evidence = useAppStore((s) => s.evidence);
  const findings = useAppStore((s) => s.workflow.findings);
  const t = useT();

  if (!open) return null;

  // Advisory readiness facts — never block the export.
  const unpaidSetups = setupPayoffRows(storyBeats, screenplay).filter(
    (r) => r.status === 'unpaid_setup',
  ).length;
  const openConcerns =
    evidence.filter((e) => e.status === 'priority_concern' && e.kind !== 'margin_note').length +
    findings.filter((f) => f.resolution === 'open' && f.status === 'priority_concern').length;
  const readiness = [
    polishReadComplete ? `✓ ${t('export.allRead')}` : `○ ${t('export.notRead')}`,
    `○ ${t('export.concerns').replace('{n}', String(openConcerns))}`,
    `○ ${t('export.unpaid').replace('{n}', String(unpaidSetups))}`,
  ];

  const close = () => setOpen(false);

  const options = [
    {
      key: 'fountain',
      label: t('export.fountain'),
      note: t('export.fountainNote'),
      run: () => {
        downloadText(`${fileSlug(screenplay.title)}.fountain`, 'text/plain', serializeFountain(screenplay));
        close();
      },
    },
    {
      key: 'fdx',
      label: t('export.fdx'),
      note: t('export.fdxNote'),
      run: () => {
        downloadText(`${fileSlug(screenplay.title)}.fdx`, 'application/xml', serializeFdx(screenplay));
        close();
      },
    },
    {
      key: 'print',
      label: t('export.print'),
      note: t('export.printNote'),
      run: () => {
        close();
        setPrintViewOpen(true);
      },
    },
  ];

  return (
    <div className="import-overlay" onClick={close}>
      <div
        className="import-dialog export-menu"
        role="dialog"
        aria-modal="true"
        aria-label={t('export.title')}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') close();
        }}
      >
        <h2 className="panel-title">{t('export.title')}</h2>
        <section className="export-readiness" aria-label={t('export.readiness')}>
          <span className="control-label">{t('export.readiness')}</span>
          <ul className="export-readiness-list">
            {readiness.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <span className="import-note">{t('export.readyNote')}</span>
        </section>
        <ul className="export-options">
          {options.map((o) => (
            <li key={o.key}>
              <button type="button" className="export-option" onClick={o.run}>
                <span className="export-option-label">{o.label}</span>
                <span className="import-note">{o.note}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="import-actions">
          <button type="button" className="seg-button" onClick={close}>
            {t('export.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
