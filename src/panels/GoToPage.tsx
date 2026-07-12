import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { paginate } from '../pagination/engine';
import { useT } from '../i18n/strings';

/** Mod-G dialog: jump the editor to the first line of a page. */
export function GoToPage() {
  const open = useAppStore((s) => s.goToPageOpen);
  const setOpen = useAppStore((s) => s.setGoToPageOpen);
  const screenplay = useAppStore((s) => s.screenplay);
  const select = useAppStore((s) => s.select);
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');

  const result = useMemo(() => (open ? paginate(screenplay) : null), [open, screenplay]);

  useEffect(() => {
    if (open) {
      setValue('');
      inputRef.current?.focus();
    }
  }, [open]);

  if (!open || !result) return null;

  const close = () => {
    setOpen(false);
    // Focus the screenplay region, not the contenteditable: raw-focusing
    // ProseMirror's DOM resets the caret to the document start.
    document.querySelector<HTMLElement>('.sp-page-scroller')?.focus();
  };

  const go = () => {
    const page = Math.min(result.pageCount, Math.max(1, Number(value) || 1));
    const firstText = result.pages[page - 1].lines.find((l) => l.kind === 'text');
    if (firstText) select({ sceneId: firstText.sceneId, elementId: firstText.elementId });
    close();
  };

  return (
    <div className="goto-overlay" onClick={close}>
      <form
        className="goto-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t('goto.title')}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') close();
        }}
      >
        <label className="control-label" htmlFor="goto-page-input">
          {t('goto.title')} (1–{result.pageCount})
        </label>
        <input
          id="goto-page-input"
          ref={inputRef}
          type="number"
          min={1}
          max={result.pageCount}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="submit" className="seg-button">
          {t('goto.go')}
        </button>
      </form>
    </div>
  );
}
