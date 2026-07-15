import { describe, expect, it } from 'vitest';
import { JOURNEY_STAGES, currentJourneyStage } from './journeyStages';
import { emptyWorkflow } from '../workflow/types';

function fakeState(overrides: Record<string, unknown> = {}) {
  return {
    screenplay: { scenes: [{ id: 's1' }] },
    workflow: emptyWorkflow(),
    gamePlan: { statementOfIntent: '' },
    polishReadComplete: false,
    ...overrides,
  } as never;
}

describe('journey stages', () => {
  it('has nine stages ending in polish then letgo (amendment 1)', () => {
    expect(JOURNEY_STAGES.map((s) => s.id)).toEqual([
      'script',
      'privateRead',
      'notes',
      'organize',
      'interpret',
      'gameplan',
      'passes',
      'polish',
      'letgo',
    ]);
  });

  it('starts on script when no scenes, privateRead once a script exists', () => {
    expect(currentJourneyStage(fakeState({ screenplay: { scenes: [] } }))).toBe(0);
    expect(currentJourneyStage(fakeState())).toBe(1);
  });

  it('advances to notes after the annotated read completes', () => {
    const wf = { ...emptyWorkflow(), annotatedReadComplete: true };
    expect(currentJourneyStage(fakeState({ workflow: wf }))).toBe(2);
  });

  it('polish is a real stage: passes complete but polish read not done → stage 7', () => {
    const wf = {
      ...emptyWorkflow(),
      annotatedReadComplete: true,
      readers: [
        {
          id: 'r1',
          name: 'A',
          role: 'initial' as const,
          addedAt: 1,
          notes: [{ id: 'n1', quote: 'x', kind: 'symptom' as const, createdAt: 1 }],
        },
      ],
      passRuns: { foundation: 'complete' as const },
    };
    expect(currentJourneyStage(fakeState({ workflow: wf, gamePlan: { statementOfIntent: 'intent' } }))).toBe(7);
  });
});
