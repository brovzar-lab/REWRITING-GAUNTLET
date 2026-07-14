import { useEffect, useRef, useState } from 'react';
import { redo, undo } from 'prosemirror-history';
import { getEditorView } from '../editor/editorHandle';
import { useAppStore, type ThemeChoice, type UiLang } from '../store/appStore';
import { useT, type StringKey } from '../i18n/strings';
import type { DocFormat } from '../model/screenplay';

type Item =
  | { kind: 'item'; label: string; onClick: () => void; checked?: boolean; disabled?: boolean }
  | { kind: 'header'; label: string }
  | { kind: 'sep' };

function refocusPage() {
  document.querySelector<HTMLElement>('.sp-page-scroller')?.focus();
}

/** The top app-menu bar. Every item maps to a real action — no dead entries.
    File / Edit / View / Format / Revisions / Production / Help. */
export function AppMenuBar() {
  const t = useT();
  const s = useAppStore();
  const [open, setOpen] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const run = (fn: () => void) => () => {
    fn();
    setOpen(null);
  };
  const history = (cmd: typeof undo) => () => {
    const v = getEditorView();
    if (v) cmd(v.state, v.dispatch);
    refocusPage();
  };
  const setTheme = (theme: ThemeChoice) => s.setTheme(theme);
  const setFmt = (f: DocFormat) => s.setDocFormat(f);
  const curFmt = s.screenplay.docFormat ?? 'feature';

  const menus: { id: string; label: StringKey; items: Item[] }[] = [
    {
      id: 'file',
      label: 'menu.file',
      items: [
        { kind: 'item', label: t('mi.newProject'), onClick: () => s.newProject() },
        { kind: 'item', label: t('mi.openProject'), onClick: () => s.setLeftWorkspace('project') },
        { kind: 'sep' },
        { kind: 'item', label: t('mi.import'), onClick: () => s.setImportOpen(true) },
        { kind: 'item', label: t('mi.export'), onClick: () => s.setExportOpen(true) },
        { kind: 'item', label: t('mi.quickPdf'), onClick: () => s.setPrintViewOpen(true) },
        { kind: 'item', label: t('mi.print'), onClick: () => s.setPrintViewOpen(true) },
      ],
    },
    {
      id: 'edit',
      label: 'menu.edit',
      items: [
        { kind: 'item', label: t('mi.undo'), onClick: history(undo) },
        { kind: 'item', label: t('mi.redo'), onClick: history(redo) },
        { kind: 'sep' },
        { kind: 'item', label: t('mi.find'), onClick: () => s.setFindOpen(true) },
        { kind: 'item', label: t('mi.gotopage'), onClick: () => s.setGoToPageOpen(true) },
      ],
    },
    {
      id: 'view',
      label: 'menu.view',
      items: [
        { kind: 'item', label: t('mi.pageView'), onClick: () => s.setLayoutMode('workbench'), checked: s.layoutMode === 'workbench' },
        { kind: 'item', label: t('mi.boardView'), onClick: () => s.setLayoutMode('board'), checked: s.layoutMode === 'board' },
        { kind: 'item', label: t('mi.focus'), onClick: () => s.setLayoutMode('focus'), checked: s.layoutMode === 'focus' },
        { kind: 'sep' },
        { kind: 'header', label: t('layout.label') },
        { kind: 'item', label: t('layout.workbench'), onClick: () => s.setLayoutMode('workbench'), checked: s.layoutMode === 'workbench' },
        { kind: 'item', label: t('layout.script_notes'), onClick: () => s.setLayoutMode('script_notes'), checked: s.layoutMode === 'script_notes' },
        { kind: 'sep' },
        { kind: 'header', label: t('mi.theme') },
        { kind: 'item', label: t('theme.day'), onClick: () => setTheme('day'), checked: s.theme === 'day' },
        { kind: 'item', label: t('theme.night'), onClick: () => setTheme('night'), checked: s.theme === 'night' },
        { kind: 'item', label: t('theme.system'), onClick: () => setTheme('system'), checked: s.theme === 'system' },
      ],
    },
    {
      id: 'format',
      label: 'menu.format',
      items: [{ kind: 'item', label: t('mi.readonly'), onClick: () => s.toggleReadOnly(), checked: s.readOnly }],
    },
    {
      id: 'revisions',
      label: 'menu.revisions',
      items: [
        { kind: 'item', label: t('mi.snapshot'), onClick: () => void s.takeSnapshot('Manual snapshot') },
        { kind: 'item', label: t('mi.history'), onClick: () => s.setHistoryOpen(true) },
      ],
    },
    {
      id: 'production',
      label: 'menu.production',
      items: [
        { kind: 'header', label: t('mi.docFormat') },
        { kind: 'item', label: t('fmt.feature'), onClick: () => setFmt('feature'), checked: curFmt === 'feature' },
        { kind: 'item', label: t('fmt.one_hour'), onClick: () => setFmt('one_hour'), checked: curFmt === 'one_hour' },
        { kind: 'item', label: t('fmt.half_hour'), onClick: () => setFmt('half_hour'), checked: curFmt === 'half_hour' },
        { kind: 'sep' },
        { kind: 'header', label: t('mi.sceneNumbers') },
        { kind: 'header', label: t('mi.moresConts') },
      ],
    },
    {
      id: 'help',
      label: 'menu.help',
      items: [
        { kind: 'item', label: t('mi.helpJourney'), onClick: () => s.setRightWorkspace('journey') },
        { kind: 'item', label: t('mi.helpPass'), onClick: () => s.setRightWorkspace('passes') },
      ],
    },
  ];

  return (
    <div className="app-menubar" role="menubar" aria-label="Menu" ref={barRef}>
      <span className="app-menubar-brand">{t('app.title')}</span>
      {menus.map((m) => (
        <div key={m.id} className="menu-root">
          <button
            type="button"
            className={`menu-top${open === m.id ? ' is-open' : ''}`}
            aria-haspopup="true"
            aria-expanded={open === m.id}
            onClick={() => setOpen(open === m.id ? null : m.id)}
          >
            {t(m.label)}
          </button>
          {open === m.id && (
            <ul className="menu-drop" role="menu" aria-label={t(m.label)}
              onKeyDown={(e) => e.key === 'Escape' && setOpen(null)}>
              {m.items.map((it, i) =>
                it.kind === 'sep' ? (
                  <li key={i} className="menu-sep" role="separator" />
                ) : it.kind === 'header' ? (
                  <li key={i} className="menu-header">{it.label}</li>
                ) : (
                  <li key={i} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="menu-item"
                      disabled={it.disabled}
                      onClick={run(it.onClick)}
                    >
                      <span className="menu-check" aria-hidden="true">{it.checked ? '✓' : ''}</span>
                      {it.label}
                    </button>
                  </li>
                ),
              )}
            </ul>
          )}
        </div>
      ))}
      <span className="top-bar-spacer" />
      <span className={`save-indicator save-${s.saveState}`} aria-live="polite">
        {s.saveState === 'saved' ? t('topbar.saved') : t('topbar.saving')}
      </span>
      <span className="control-group" role="group" aria-label={t('lang.label')}>
        {(['en', 'es'] as UiLang[]).map((l) => (
          <button key={l} type="button" className="seg-button" aria-pressed={s.lang === l} onClick={() => s.setLang(l)}>
            {l.toUpperCase()}
          </button>
        ))}
      </span>
      <span className="control-group">
        <label className="control-label" htmlFor="appearance-select">
          {t('topbar.appearance')}
        </label>
        <select
          id="appearance-select"
          className="seg-button"
          value={s.theme}
          onChange={(e) => s.setTheme(e.target.value as ThemeChoice)}
        >
          <option value="day">{t('theme.day')}</option>
          <option value="night">{t('theme.night')}</option>
          <option value="system">{t('theme.system')}</option>
        </select>
      </span>
    </div>
  );
}
