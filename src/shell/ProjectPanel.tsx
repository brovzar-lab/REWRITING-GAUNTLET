import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { db } from '../store/db';
import { useT } from '../i18n/strings';

/** The Project workspace — the starting place. Local-first: a project is the
    open script plus its private pad, notes, and title page. Open / Import /
    New / Export live here, next to the recent-projects list and save status. */
export function ProjectPanel() {
  const t = useT();
  const screenplay = useAppStore((s) => s.screenplay);
  const saveState = useAppStore((s) => s.saveState);
  const privatePad = useAppStore((s) => s.privatePad);
  const setPrivatePad = useAppStore((s) => s.setPrivatePad);
  const projectNotes = useAppStore((s) => s.projectNotes);
  const setProjectNotes = useAppStore((s) => s.setProjectNotes);
  const setImportOpen = useAppStore((s) => s.setImportOpen);
  const setExportOpen = useAppStore((s) => s.setExportOpen);
  const newProject = useAppStore((s) => s.newProject);
  const loadScreenplay = useAppStore((s) => s.loadScreenplay);
  const [recent, setRecent] = useState<{ id: string; title: string }[]>([]);
  const [openDoc, setOpenDoc] = useState<'pad' | 'notes' | null>(null);

  useEffect(() => {
    let live = true;
    void db.documents.toArray().then((rows) => {
      if (!live) return;
      setRecent(rows.filter((r) => r.id !== screenplay.id).map((r) => ({ id: r.id, title: r.screenplay.title })));
    });
    return () => {
      live = false;
    };
  }, [screenplay.id, saveState]);

  return (
    <aside className="project-panel" aria-label={t('proj.title')}>
      <div className="proj-head">
        <h2 className="panel-title">{t('proj.title')}</h2>
        <span className={`save-indicator save-${saveState}`} aria-live="polite">
          {saveState === 'saved' ? t('topbar.saved') : t('topbar.saving')}
        </span>
      </div>
      <p className="proj-name">{screenplay.title}</p>
      <p className="proj-draft">{screenplay.draftLabel}</p>

      <div className="proj-actions">
        <button type="button" className="seg-button" onClick={() => setImportOpen(true)}>
          {t('proj.open')}
        </button>
        <button type="button" className="seg-button" onClick={() => setImportOpen(true)}>
          {t('mi.import')}
        </button>
        <button type="button" className="seg-button" onClick={() => setExportOpen(true)}>
          {t('mi.export')}
        </button>
        <button type="button" className="seg-button" onClick={() => void newProject()}>
          {t('proj.new')}
        </button>
      </div>

      <h3 className="inspector-section">{t('proj.documents')}</h3>
      <ul className="proj-docs">
        <li className="proj-doc is-active">
          <span className="proj-doc-kind">{t('proj.script')}</span>
          <span className="proj-doc-name">{screenplay.title}</span>
        </li>
        <li className="proj-doc">
          <button type="button" className="proj-doc-toggle" onClick={() => setOpenDoc(openDoc === 'pad' ? null : 'pad')}>
            {t('proj.privatePad')}
          </button>
        </li>
        {openDoc === 'pad' && (
          <li>
            <textarea
              className="proj-doc-text"
              aria-label={t('proj.privatePad')}
              placeholder={t('proj.padPlaceholder')}
              value={privatePad}
              onChange={(e) => setPrivatePad(e.target.value)}
            />
          </li>
        )}
        <li className="proj-doc">
          <button type="button" className="proj-doc-toggle" onClick={() => setOpenDoc(openDoc === 'notes' ? null : 'notes')}>
            {t('proj.notes')}
          </button>
        </li>
        {openDoc === 'notes' && (
          <li>
            <textarea
              className="proj-doc-text"
              aria-label={t('proj.notes')}
              placeholder={t('proj.notesPlaceholder')}
              value={projectNotes}
              onChange={(e) => setProjectNotes(e.target.value)}
            />
          </li>
        )}
      </ul>

      <h3 className="inspector-section">{t('proj.recent')}</h3>
      {recent.length === 0 ? (
        <p className="inspector-hint">{t('proj.noRecent')}</p>
      ) : (
        <ul className="proj-recent">
          {recent.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="proj-recent-item"
                onClick={() => void db.documents.get(r.id).then((row) => row && loadScreenplay(row.screenplay))}
              >
                {r.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
