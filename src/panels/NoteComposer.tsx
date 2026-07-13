import { useState } from 'react';
import { useAppStore, type Selection } from '../store/appStore';
import { useT } from '../i18n/strings';
import type { ClaimType, EvidenceStatus } from '../model/evidence';

type ComposerSource = 'writer' | 'reader' | 'producer_executive';

const CLAIM_CHOICES: ClaimType[] = ['textual_fact', 'reader_reaction', 'writer_confirmed', 'unresolved_hypothesis'];
const STATUS_CHOICES: EvidenceStatus[] = ['clear', 'uncertain', 'priority_concern'];

/** Add a human note to the selected line. Writer, reader (registered readers
    only, interim readers auto-labeled), and producer/executive sources.
    AI notes never come from here — the AI panel writes those. */
export function NoteComposer({ selection }: { selection: Selection }) {
  const addEvidenceNote = useAppStore((s) => s.addEvidenceNote);
  const readers = useAppStore((s) => s.workflow.readers);
  const activePassId = useAppStore((s) => s.activePassId);
  const open = useAppStore((s) => s.noteComposerOpen);
  const setOpen = useAppStore((s) => s.setNoteComposerOpen);
  const t = useT();

  const [source, setSource] = useState<ComposerSource>('writer');
  const [readerId, setReaderId] = useState('');
  const [claimType, setClaimType] = useState<ClaimType>('textual_fact');
  const [status, setStatus] = useState<EvidenceStatus>('uncertain');
  const [summary, setSummary] = useState('');

  const chosenReader = readers.find((r) => r.id === readerId) ?? readers[0];
  const needsReader = source === 'reader' && !chosenReader;
  const canSave = summary.trim().length > 0 && !needsReader;

  const save = () => {
    if (!canSave) return;
    addEvidenceNote({
      id: `note-${crypto.randomUUID()}`,
      source: source === 'reader' ? (chosenReader!.role === 'interim' ? 'interim_reader' : 'reader') : source,
      claimType,
      status,
      summary: summary.trim(),
      sceneId: selection.sceneId,
      elementId: selection.elementId,
      readerName: source === 'reader' ? chosenReader!.name : undefined,
      passId: activePassId ?? undefined,
    });
    setSummary('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button type="button" className="seg-button note-add" aria-expanded={false} onClick={() => setOpen(true)}>
        {t('notes.add')}
      </button>
    );
  }

  return (
    <form
      className="note-composer"
      aria-label={t('notes.add')}
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <label className="control-label" htmlFor="note-source">
        {t('notes.source')}
      </label>
      <select id="note-source" value={source} onChange={(e) => setSource(e.target.value as ComposerSource)}>
        <option value="writer">{t('source.writer')}</option>
        <option value="reader">{t('source.reader')}</option>
        <option value="producer_executive">{t('source.producer_executive')}</option>
      </select>

      {source === 'reader' && (
        <>
          <label className="control-label" htmlFor="note-reader">
            {t('notes.reader')}
          </label>
          <select id="note-reader" value={chosenReader?.id ?? ''} onChange={(e) => setReaderId(e.target.value)}>
            {readers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          {needsReader && <p className="inspector-hint">{t('notes.needReader')}</p>}
        </>
      )}

      <label className="control-label" htmlFor="note-claim">
        {t('notes.claim')}
      </label>
      <select id="note-claim" value={claimType} onChange={(e) => setClaimType(e.target.value as ClaimType)}>
        {CLAIM_CHOICES.map((c) => (
          <option key={c} value={c}>
            {t(`claim.${c}`)}
          </option>
        ))}
      </select>
      <p className="inspector-hint claim-definition">{t(`claimdef.${claimType}`)}</p>

      <label className="control-label" htmlFor="note-status">
        {t('notes.status')}
      </label>
      <select id="note-status" value={status} onChange={(e) => setStatus(e.target.value as EvidenceStatus)}>
        {STATUS_CHOICES.map((sVal) => (
          <option key={sVal} value={sVal}>
            {t(`status.${sVal}`)}
          </option>
        ))}
      </select>

      <label className="control-label" htmlFor="note-text">
        {t('notes.text')}
      </label>
      <textarea id="note-text" value={summary} onChange={(e) => setSummary(e.target.value)} />

      <div className="note-actions">
        <button type="button" className="seg-button" aria-label={t('notes.close')} onClick={() => setOpen(false)}>
          ×
        </button>
        <button type="submit" className="seg-button" disabled={!canSave}>
          {t('notes.save')}
        </button>
      </div>
    </form>
  );
}
