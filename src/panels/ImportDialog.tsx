import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { parseFountain } from '../io/fountain';
import { parseFdx } from '../io/fdx';
import { paginate } from '../pagination/engine';
import { useT } from '../i18n/strings';

/** Fountain is line-based text; FDX is XML. A pasted FDX always carries its root tag. */
function looksLikeFdx(text: string, fileName: string | null): boolean {
  if (fileName?.toLowerCase().endsWith('.fdx')) return true;
  return /<FinalDraft[\s>]/.test(text);
}

/** Import dialog: paste a script or open a .fountain/.fdx file, preview it,
    then replace the working draft (after an automatic snapshot of the old one).
    PDF import is deferred; the dialog says to paste the text instead. */
export function ImportDialog() {
  const open = useAppStore((s) => s.importOpen);
  const setOpen = useAppStore((s) => s.setImportOpen);
  const oldTitle = useAppStore((s) => s.screenplay.title);
  const takeSnapshot = useAppStore((s) => s.takeSnapshot);
  const replaceDocument = useAppStore((s) => s.replaceDocument);
  const t = useT();

  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setText('');
      setFileName(null);
      setBusy(false);
      pasteRef.current?.focus();
    }
  }, [open]);

  const preview = useMemo(() => {
    if (!open || text.trim() === '') return null;
    const fdx = looksLikeFdx(text, fileName);
    const screenplay = fdx ? parseFdx(text) : parseFountain(text);
    return { screenplay, fdx, sceneCount: screenplay.scenes.length, pageCount: paginate(screenplay).pageCount };
  }, [open, text, fileName]);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    document.querySelector<HTMLElement>('.sp-page-scroller')?.focus();
  };

  const doImport = async () => {
    if (!preview || busy) return;
    setBusy(true);
    try {
      await takeSnapshot(`Before import: ${oldTitle}`);
      replaceDocument(preview.screenplay);
      close();
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setText(await file.text());
  };

  return (
    <div className="import-overlay" onClick={close}>
      <div
        className="import-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t('import.title')}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') close();
        }}
      >
        <h2 className="panel-title">{t('import.title')}</h2>
        <label className="control-label" htmlFor="import-paste">
          {t('import.pasteLabel')}
        </label>
        <textarea
          id="import-paste"
          ref={pasteRef}
          value={text}
          spellCheck={false}
          onChange={(e) => {
            setFileName(null);
            setText(e.target.value);
          }}
        />
        <label className="control-label" htmlFor="import-file">
          {t('import.fileLabel')}
        </label>
        <input
          id="import-file"
          type="file"
          accept=".fountain,.fdx,.txt,text/plain"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        <p className="import-note">{t('import.pdfNote')}</p>
        {preview && (
          <div className="import-preview" data-testid="import-preview">
            <span className="control-label">{t('import.preview')}</span>
            <span className="import-preview-title">{preview.screenplay.title}</span>
            <span>
              {t('import.scenes')}: {preview.sceneCount} · {t('import.pages')}: {preview.pageCount}
            </span>
            <p className="import-note">{t('import.actGuess')}</p>
            {preview.fdx && <p className="import-note">{t('import.fdxCaveat')}</p>}
          </div>
        )}
        <p className="import-note">{t('import.snapshotNote')}</p>
        <div className="import-actions">
          <button type="button" className="seg-button" onClick={close}>
            {t('import.cancel')}
          </button>
          <button
            type="button"
            className="seg-button import-confirm"
            disabled={!preview || busy}
            onClick={() => void doImport()}
          >
            {t('import.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
