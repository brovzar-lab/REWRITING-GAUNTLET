import type { Connection, Screenplay } from '../model/screenplay';
import type { RewritePass } from '../model/passes';
import type { Finding } from '../workflow/types';

/** Everything a provider may look at. Nothing else ever leaves this boundary. */
export interface DiagnoseRequest {
  screenplay: Screenplay;
  connections: Connection[];
  pass: RewritePass;
  passRunId: string;
  /** Timestamp injected by the caller so providers stay deterministic. */
  now: number;
}

/** Provider-agnostic AI boundary. No module outside src/ai/adapters/ may name
    a vendor. Every provider returns the same Finding shape: labeled
    hypotheses with real citations, never a score, never an unreviewed rewrite. */
export interface AIProvider {
  id: 'local' | 'cloud';
  /** Shown in the UI next to every finding this provider produced. */
  label: string;
  diagnose(request: DiagnoseRequest): Promise<Finding[]>;
}
