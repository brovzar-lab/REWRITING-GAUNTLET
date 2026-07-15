import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';
import type { EvidenceRecord, EvidenceStatus, NoteSource } from '../model/evidence';
import { NoteComposer } from './NoteComposer';
import { ScenePointCard } from './ScenePointCard';
import './inspector.css';

const SOURCE_KEY: Record<NoteSource, `source.${NoteSource}`> = {
  writer: 'source.writer',
  reader: 'source.reader',
  ai: 'source.ai',
  producer_executive: 'source.producer_executive',
  interim_reader: 'source.interim_reader',
};

/** Status is always icon + word, never color alone. */
const STATUS_ICON: Record<EvidenceStatus, string> = {
  clear: '✓',
  uncertain: '?',
  priority_concern: '!',
};

function EvidenceCard({ record }: { record: EvidenceRecord }) {
  const select = useAppStore((s) => s.select);
  const selection = useAppStore((s) => s.selection);
  const t = useT();
  const linked = selection?.elementId === record.elementId;
  return (
    <li>
      <button
        type="button"
        className={`evidence-card source-${record.source}${linked ? ' is-linked' : ''}`}
        onClick={() => select({ sceneId: record.sceneId, elementId: record.elementId })}
      >
        {linked && <span className="visually-hidden">{t('evidence.linked')}</span>}
        <span className="evidence-meta">
          <span className={`source-chip source-${record.source}`}>{t(SOURCE_KEY[record.source])}</span>
          {record.readerName && <span className="reader-name">{record.readerName}</span>}
          {record.kind === 'margin_note' ? (
            <span className="claim-label">{t('claim.margin')}</span>
          ) : (
            <span className="claim-label" title={t(`claimdef.${record.claimType}`)}>
              {t(`claim.${record.claimType}`)}
            </span>
          )}
        </span>
        <span className="evidence-summary">{record.summary}</span>
        {record.kind !== 'margin_note' && (
          <span className={`evidence-status status-${record.status}`}>
            <span data-status-icon aria-hidden="true">
              {STATUS_ICON[record.status]}
            </span>
            {t(`status.${record.status}`)}
          </span>
        )}
      </button>
    </li>
  );
}

/** Evidence and notes for the current screenplay selection. Every record names
    its source and claim type, and clicking it selects the exact line. */
export function EvidenceInspector() {
  const selection = useAppStore((s) => s.selection);
  const evidence = useAppStore((s) => s.evidence);
  const screenplay = useAppStore((s) => s.screenplay);
  const t = useT();

  const scene = selection ? screenplay.scenes.find((s) => s.id === selection.sceneId) : undefined;
  const lineEvidence = selection ? evidence.filter((e) => e.elementId === selection.elementId) : [];
  const sceneEvidence = selection
    ? evidence.filter((e) => e.sceneId === selection.sceneId && e.elementId !== selection.elementId)
    : [];

  return (
    <aside className="evidence-inspector" aria-label={t('inspector.title')}>
      <h2 className="panel-title">{t('inspector.title')}</h2>
      {!selection && <p className="inspector-hint">{t('inspector.empty')}</p>}
      {selection && (
        <>
          <p className="inspector-context">
            <span className="scene-number">{scene?.number}</span> {scene?.slug}
          </p>
          <ScenePointCard sceneId={selection.sceneId} />
          <h3 className="inspector-section">{t('inspector.thisline')}</h3>
          {lineEvidence.length === 0 ? (
            <p className="inspector-hint">{t('inspector.none')}</p>
          ) : (
            <ul className="evidence-list">
              {lineEvidence.map((record) => (
                <EvidenceCard key={record.id} record={record} />
              ))}
            </ul>
          )}
          <NoteComposer selection={selection} />
          {sceneEvidence.length > 0 && (
            <>
              <h3 className="inspector-section">{t('inspector.scenewide')}</h3>
              <ul className="evidence-list">
                {sceneEvidence.map((record) => (
                  <EvidenceCard key={record.id} record={record} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </aside>
  );
}
