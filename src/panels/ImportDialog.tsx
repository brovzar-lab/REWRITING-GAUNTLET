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

/** jsdom has no Blob.text(); FileReader works everywhere. */
function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

type Step = 'menu' | 'paste' | 'file';

/** Opening a script should feel like opening a script: a short menu
    (Paste / Open Fountain / Open Final Draft), then one focused step with a
    live preview. The old draft is snapshotted before anything is replaced.
    PDF import is deferred and the menu says exactly what to do instead. */
export function ImportDialog() {
  const open = useAppStore((s) => s.importOpen);
  const setOpen = useAppStore((s) => s.setImportOpen);
  const oldTitle = useAppStore((s) => s.screenplay.title);
  const takeSnapshot = useAppStore((s) => s.takeSnapshot);
  const replaceDocument = useAppStore((s) => s.replaceDocument);
  const t = useT();

  const [step, setStep] = useState<Step>('menu');
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pasteRef = useRef<HTMLTextAreaElement>(null);
  const fountainInputRef = useRef<HTMLInputElement>(null);
  const fdxInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setStep('menu');
      setText('');
      setFileName(null);
      setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    if (step === 'paste') pasteRef.current?.focus();
  }, [step]);

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

  const backToMenu = () => {
    setStep('menu');
    setText('');
    setFileName(null);
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
    setText(await readFileText(file));
    setStep('file');
  };

  const previewBlock = preview && (
    <div className="import-preview" data-testid="import-preview">
      <span className="control-label">{t('import.preview')}</span>
      <span className="import-preview-title">{preview.screenplay.title}</span>
      <span>
        {t('import.scenes')}: {preview.sceneCount} · {t('import.pages')}: {preview.pageCount}
      </span>
      <p className="import-note">{t('import.actGuess')}</p>
      {preview.fdx && <p className="import-note">{t('import.fdxCaveat')}</p>}
    </div>
  );

  const actions = (
    <div className="import-actions">
      <button type="button" className="seg-button" onClick={backToMenu}>
        {t('import.back')}
      </button>
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
  );

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

        {step === 'menu' && (
          <>
            <ul className="export-options">
              <li>
                <button type="button" className="export-option" onClick={() => setStep('paste')}>
                  <span className="export-option-label">{t('import.optionPaste')}</span>
                  <span className="import-note">{t('import.optionPasteNote')}</span>
                </button>
              </li>
              <li>
                <button type="button" className="export-option" onClick={() => fountainInputRef.current?.click()}>
                  <span className="export-option-label">{t('import.optionFountain')}</span>
                  <span className="import-note">.fountain</span>
                </button>
              </li>
              <li>
                <button type="button" className="export-option" onClick={() => fdxInputRef.current?.click()}>
                  <span className="export-option-label">{t('import.optionFdx')}</span>
                  <span className="import-note">.fdx · {t('import.fdxCaveat')}</span>
                </button>
              </li>
            </ul>
            <p className="import-note">{t('import.pdfNote')}</p>
            <input
              ref={fountainInputRef}
              data-testid="import-file-fountain"
              type="file"
              accept=".fountain,.txt,text/plain"
              hidden
              aria-label={t('import.optionFountain')}
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
            <input
              ref={fdxInputRef}
              data-testid="import-file-fdx"
              type="file"
              accept=".fdx,application/xml,text/xml"
              hidden
              aria-label={t('import.optionFdx')}
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
            <div className="import-actions">
              <button type="button" className="seg-button" onClick={close}>
                {t('import.cancel')}
              </button>
            </div>
          </>
        )}

        {step === 'paste' && (
          <>
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
            {previewBlock}
            <p className="import-note">{t('import.snapshotNote')}</p>
            {actions}
          </>
        )}

        {step === 'file' && (
          <>
            <p className="import-file-name">
              {t('import.fileChosen')}: {fileName}
            </p>
            {previewBlock}
            <p className="import-note">{t('import.snapshotNote')}</p>
            {actions}
          </>
        )}
      </div>
    </div>
  );
}
