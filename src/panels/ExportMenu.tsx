import { useAppStore } from '../store/appStore';
import { serializeFountain } from '../io/fountain';
import { serializeFdx } from '../io/fdx';
import { downloadText, fileSlug } from '../io/download';
import { useT } from '../i18n/strings';

/** Export the working draft. Each option carries its honest fidelity caveat.
    The draft is always the accumulation of approved changes only — that is
    what these files contain. */
export function ExportMenu() {
  const open = useAppStore((s) => s.exportOpen);
  const setOpen = useAppStore((s) => s.setExportOpen);
  const setPrintViewOpen = useAppStore((s) => s.setPrintViewOpen);
  const screenplay = useAppStore((s) => s.screenplay);
  const t = useT();

  if (!open) return null;

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
