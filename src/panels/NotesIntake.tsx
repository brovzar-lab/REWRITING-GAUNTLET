import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT, type StringKey } from '../i18n/strings';
import { MAX_INITIAL_READERS, type ReaderNote } from '../workflow/types';

const AVATAR_TOKENS = [
  'var(--color-confirmed)',
  'var(--color-card-blue)',
  'var(--color-card-plum)',
  'var(--color-card-ochre)',
  'var(--color-concern)',
];

/** Stage 3 (delta 4): reader-notes intake. Five slots max (Epps), three
    recommended. The writer's own private-read marks appear in a separate lane,
    never as a reader (amendment 4). Tagging is a post-session act (the head
    stays up during the conversation). Recording is a stub — TODO integration. */
export function NotesIntake() {
  const t = useT();
  const readers = useAppStore((s) => s.workflow.readers);
  const readMarks = useAppStore((s) => s.workflow.readMarks);
  const addReader = useAppStore((s) => s.addReader);
  const addReaderNote = useAppStore((s) => s.addReaderNote);
  const setReaderNoteKind = useAppStore((s) => s.setReaderNoteKind);
  const [activeReaderId, setActiveReaderId] = useState<string | null>(null);
  const [addingSlot, setAddingSlot] = useState<number | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [draft, setDraft] = useState('');

  const initial = readers.filter((r) => r.role === 'initial');
  const active = initial.find((r) => r.id === activeReaderId) ?? initial[0] ?? null;
  const noteCount = initial.reduce((n, r) => n + (r.notes ?? []).length, 0);

  const submitReader = () => {
    if (nameDraft.trim() === '') return;
    addReader(nameDraft.trim(), 'initial');
    setNameDraft('');
    setAddingSlot(null);
  };

  const submitNote = () => {
    if (!active || draft.trim() === '') return;
    const note: ReaderNote = {
      id: `rn-${crypto.randomUUID()}`,
      quote: draft.trim(),
      kind: 'symptom',
      createdAt: Date.now(),
    };
    addReaderNote(active.id, note);
    setDraft('');
  };

  return (
    <div className="notes-intake" role="region" aria-label={t('ni.title')}>
      <header className="ni-header">
        <h2 className="panel-title">{t('ni.title')}</h2>
        <span className="ni-subtitle">{t('ni.subtitle')}</span>
      </header>

      <div className="ni-reader-row">
        {Array.from({ length: MAX_INITIAL_READERS }, (_, i) => {
          const reader = initial[i];
          if (!reader) {
            if (addingSlot === i) {
              return (
                <span key={`slot-${i}`} className="ni-reader-slot is-adding">
                  <input
                    type="text"
                    className="ni-name-input"
                    placeholder={t('ni.namePrompt')}
                    value={nameDraft}
                    autoFocus
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        submitReader();
                      }
                      if (e.key === 'Escape') setAddingSlot(null);
                    }}
                    onBlur={() => {
                      if (nameDraft.trim() !== '') submitReader();
                      else setAddingSlot(null);
                    }}
                  />
                </span>
              );
            }
            return (
              <button key={`slot-${i}`} type="button" className="ni-reader-slot" onClick={() => setAddingSlot(i)}>
                {t('ni.addReader')} {i + 1}
              </button>
            );
          }
          return (
            <button
              key={reader.id}
              type="button"
              className={`ni-reader-card${active?.id === reader.id ? ' is-active' : ''}`}
              aria-pressed={active?.id === reader.id}
              onClick={() => setActiveReaderId(reader.id)}
            >
              <span className="ni-avatar" style={{ background: AVATAR_TOKENS[i] }} aria-hidden="true">
                {reader.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="ni-reader-name">{reader.name}</span>
              {reader.title && <span className="ni-reader-role">{reader.title}</span>}
              <span className="ni-reader-stat">
                {(reader.notes ?? []).length} · {(reader.notes ?? []).filter((n) => n.kind === 'whatWorked').length} ★
              </span>
            </button>
          );
        })}
      </div>

      {/* Amendment 4: the writer's marks are a distinct lane, not a reader. */}
      <div className="ni-you-lane" role="group" aria-label={t('ni.you')}>
        <span className="ni-you-title">{t('ni.you')}</span>
        <span className="ni-you-note">
          {t('ni.youNote')} · {readMarks.length}
        </span>
      </div>

      <div className="ni-body">
        <section className="ni-session" aria-label={t('ni.record')}>
          <div className="ni-session-head">
            <span className="ni-consent">{t('ni.consent')}</span>
            <button type="button" className="tool-button" disabled title={t('ni.recordTodo')}>
              {t('ni.record')}
            </button>
          </div>
          <p className="ni-taglater">{t('ni.tagLater')}</p>
          <ul className="ni-notes">
            {(active?.notes ?? []).map((n) => (
              <li key={n.id} className={`ni-note ni-note-${n.kind}`}>
                <span className="ni-quote">{n.quote}</span>
                <span className="ni-kind-row" role="group" aria-label={t('ni.tagLater')}>
                  {(['symptom', 'remedy', 'whatWorked'] as const).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      className={`ni-kind ni-kind-${kind}`}
                      aria-pressed={n.kind === kind}
                      onClick={() => active && setReaderNoteKind(active.id, n.id, kind)}
                    >
                      {t(`ni.kind.${kind}` as StringKey)}
                    </button>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <input
            type="text"
            className="ni-input"
            placeholder={t('ni.noteInput')}
            value={draft}
            disabled={!active}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitNote();
              }
            }}
          />
        </section>

        <aside className="ni-whatworked" aria-label={t('ww.title')}>
          <h3 className="ni-ww-title">{t('ww.title')}</h3>
          <p className="ni-ww-protected">{t('ww.protected')}</p>
          <ul className="ni-ww-list">
            {initial
              .flatMap((r) => (r.notes ?? []).filter((n) => n.kind === 'whatWorked').map((n) => ({ r, n })))
              .map(({ r, n }) => (
                <li key={n.id} className="ni-ww-card">
                  <span className="ni-ww-quote">{n.quote}</span>
                  <span className="ni-ww-attr">{r.name}</span>
                </li>
              ))}
          </ul>
        </aside>
      </div>

      <footer className="ni-footer">
        {initial.length}/5 {t('ni.readerCount')} · {noteCount} {t('ni.notesGathered')}
      </footer>
    </div>
  );
}
