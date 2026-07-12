import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';

/** The guided private annotated read: scene-by-scene navigation, quick margin
    notes (writer evidence), and the completion flag that unlocks AI diagnosis.
    Epps: the writer reads and annotates alone before any outside voice. */
export function AnnotatedReadBar() {
  const active = useAppStore((s) => s.readModeActive);
  const screenplay = useAppStore((s) => s.screenplay);
  const selection = useAppStore((s) => s.selection);
  const visited = useAppStore((s) => s.workflow.visitedScenes);
  const goToReadScene = useAppStore((s) => s.goToReadScene);
  const exitReadMode = useAppStore((s) => s.exitReadMode);
  const completeAnnotatedRead = useAppStore((s) => s.completeAnnotatedRead);
  const addEvidenceNote = useAppStore((s) => s.addEvidenceNote);
  const t = useT();
  const [note, setNote] = useState('');

  if (!active) return null;

  const scenes = screenplay.scenes;
  const index = Math.max(
    0,
    scenes.findIndex((s) => s.id === selection?.sceneId),
  );
  const scene = scenes[index];
  const allVisited = scenes.every((s) => visited.includes(s.id));

  const saveMarginNote = () => {
    if (note.trim() === '' || !scene) return;
    addEvidenceNote({
      id: `note-${crypto.randomUUID()}`,
      source: 'writer',
      claimType: 'unresolved_hypothesis',
      status: 'uncertain',
      summary: note.trim(),
      sceneId: scene.id,
      elementId: scene.elements[0].id,
    });
    setNote('');
  };

  return (
    <div className="read-bar" role="region" aria-label={t('read.title')}>
      <div className="read-bar-row">
        <span className="read-bar-title">{t('read.title')}</span>
        <span className="read-bar-progress">
          {t('status.scene')} {index + 1} {t('status.of')} {scenes.length} · {visited.length}/{scenes.length}{' '}
          {t('read.visited')}
        </span>
        <span className="top-bar-spacer" />
        <button type="button" className="seg-button" onClick={() => goToReadScene(index - 1)} disabled={index === 0}>
          {t('read.prev')}
        </button>
        <button
          type="button"
          className="seg-button"
          onClick={() => goToReadScene(index + 1)}
          disabled={index >= scenes.length - 1}
        >
          {t('read.next')}
        </button>
        <button
          type="button"
          className="seg-button read-complete"
          disabled={!allVisited}
          onClick={() => {
            completeAnnotatedRead();
            exitReadMode();
          }}
        >
          {t('read.complete')}
        </button>
        <button type="button" className="seg-button" onClick={exitReadMode}>
          {t('read.exit')}
        </button>
      </div>
      <div className="read-bar-row">
        <label className="control-label" htmlFor="read-margin-note">
          {t('read.margin')}
        </label>
        <input
          id="read-margin-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              saveMarginNote();
            }
          }}
        />
        <button type="button" className="seg-button" disabled={note.trim() === ''} onClick={saveMarginNote}>
          {t('read.marginSave')}
        </button>
        <span className="read-bar-privacy">{t('read.privacy')}</span>
      </div>
    </div>
  );
}
