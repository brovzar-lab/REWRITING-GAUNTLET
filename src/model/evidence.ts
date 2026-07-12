/** Evidence and note provenance. Sources stay visibly separated; claims stay labeled. */

export type NoteSource = 'writer' | 'reader' | 'ai' | 'producer_executive' | 'interim_reader';

export type ClaimType =
  | 'textual_fact'
  | 'reader_reaction'
  | 'ai_hypothesis'
  | 'writer_confirmed'
  | 'unresolved_hypothesis';

/** Evidence-backed statuses. There is never an overall numerical screenplay score. */
export type EvidenceStatus = 'clear' | 'uncertain' | 'priority_concern';

export interface EvidenceRecord {
  id: string;
  source: NoteSource;
  claimType: ClaimType;
  status: EvidenceStatus;
  summary: string;
  sceneId: string;
  elementId: string;
  readerName?: string;
  /** Rewrite pass that was active when the note was made, if any. */
  passId?: string;
}
