import { Fragment } from 'react';
import { useAppStore } from '../store/appStore';
import { useT, type StringKey } from '../i18n/strings';
import type { Finding, PassRunState } from '../workflow/types';

/** The seven fixed steps of the rewrite journey, in order. */
const STEP_KEYS: StringKey[] = [
  'import.open',
  'journey.read',
  'journey.choose',
  'ai.diagnose',
  'journey.review',
  'ai.completePass',
  'export.open',
];

export interface JourneyState {
  annotatedReadComplete: boolean;
  activePassId: string | null;
  passRuns: Record<string, PassRunState>;
  findings: Pick<Finding, 'passId' | 'resolution'>[];
}

/** Which journey step is current (0..6). Import is never current after load —
    a screenplay always exists — so the floor is 1 (Private read). */
export function currentStep(s: JourneyState): number {
  if (!s.annotatedReadComplete) return 1;
  if (!s.activePassId) return 2;
  const run = s.passRuns[s.activePassId] ?? 'not_started';
  if (run === 'not_started' || run === 'diagnosing') return 3;
  if (run === 'reviewing') {
    const open = s.findings.some((f) => f.passId === s.activePassId && f.resolution === 'open');
    return open ? 4 : 5;
  }
  return 6;
}

/** Always-visible journey indicator: plain text, no tabbable children. */
export function WorkflowStrip() {
  const annotatedReadComplete = useAppStore((s) => s.workflow.annotatedReadComplete);
  const activePassId = useAppStore((s) => s.activePassId);
  const passRuns = useAppStore((s) => s.workflow.passRuns);
  const findings = useAppStore((s) => s.workflow.findings);
  const t = useT();

  const current = currentStep({ annotatedReadComplete, activePassId, passRuns, findings });

  return (
    <nav className="workflow-strip" aria-label={t('journey.label')}>
      {STEP_KEYS.map((key, i) => (
        <Fragment key={key}>
          {i > 0 && (
            <span className="journey-arrow" aria-hidden="true">
              →
            </span>
          )}
          <span
            className={`journey-step${i < current ? ' is-done' : ''}${i === current ? ' is-current' : ''}`}
            aria-current={i === current ? 'step' : undefined}
          >
            {i < current && <span aria-hidden="true">✓ </span>}
            {t(key)}
          </span>
        </Fragment>
      ))}
    </nav>
  );
}
