import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from './appStore';
import { emptyGamePlan } from '../model/gameplan';
import { annotationCounts } from '../editor/ScreenplayEditor';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('game plan store state', () => {
  it('starts empty and updates objective fields without touching others', () => {
    const s = useAppStore.getState();
    expect(s.gamePlan).toEqual(emptyGamePlan());
    s.updateGamePlan({ statementOfIntent: 'Make Marisol drive every scene she is in.' });
    expect(useAppStore.getState().gamePlan.statementOfIntent).toBe(
      'Make Marisol drive every scene she is in.',
    );
    expect(useAppStore.getState().gamePlan.about).toBe('');
  });

  it('updates compass fields and the ticking clock anchor', () => {
    const s = useAppStore.getState();
    s.updateCompass({ tickingClock: 'The bank forecloses in ten days.' });
    s.updateCompass({ tickingClockAnchor: { sceneId: 'sc2', elementId: 'sc2-e5' } });
    const compass = useAppStore.getState().gamePlan.compass;
    expect(compass.tickingClock).toBe('The bank forecloses in ten days.');
    expect(compass.tickingClockAnchor).toEqual({ sceneId: 'sc2', elementId: 'sc2-e5' });
  });

  it('reorders pass priorities as a whole list', () => {
    const s = useAppStore.getState();
    const reversed = [...s.gamePlan.passPriorities].reverse();
    s.setPassPriorities(reversed);
    expect(useAppStore.getState().gamePlan.passPriorities).toEqual(reversed);
  });

  it('adds a motif and marks exact element occurrences, deduplicated', () => {
    const s = useAppStore.getState();
    s.addMotif('The empty heron nest');
    const motif = useAppStore.getState().gamePlan.compass.motifs[0];
    expect(motif.name).toBe('The empty heron nest');
    expect(motif.occurrences).toEqual([]);

    s.addMotifOccurrence(motif.id, { sceneId: 'sc2', elementId: 'sc2-e5' });
    s.addMotifOccurrence(motif.id, { sceneId: 'sc2', elementId: 'sc2-e5' });
    expect(useAppStore.getState().gamePlan.compass.motifs[0].occurrences).toEqual([
      { sceneId: 'sc2', elementId: 'sc2-e5' },
    ]);

    s.removeMotifOccurrence(motif.id, 'sc2-e5');
    expect(useAppStore.getState().gamePlan.compass.motifs[0].occurrences).toEqual([]);

    s.removeMotif(motif.id);
    expect(useAppStore.getState().gamePlan.compass.motifs).toEqual([]);
  });

  it('importing a new document resets the game plan — it belongs to the old draft', () => {
    const s = useAppStore.getState();
    s.updateGamePlan({ statementOfIntent: 'Old draft intent.' });
    s.replaceDocument({ id: 'new-doc', title: 'NEW', draftLabel: 'First', scenes: s.screenplay.scenes });
    expect(useAppStore.getState().gamePlan).toEqual(emptyGamePlan());
  });
});

describe('motif occurrences feed the margin markers', () => {
  it('a marked occurrence and a linked ticking clock count toward the element marker', () => {
    const s = useAppStore.getState();
    const before = annotationCounts(useAppStore.getState()).get('sc2-e5') ?? 0;
    s.addMotif('Calculators');
    const motif = useAppStore.getState().gamePlan.compass.motifs[0];
    s.addMotifOccurrence(motif.id, { sceneId: 'sc2', elementId: 'sc2-e5' });
    s.updateCompass({ tickingClockAnchor: { sceneId: 'sc2', elementId: 'sc2-e5' } });
    const after = annotationCounts(useAppStore.getState()).get('sc2-e5') ?? 0;
    expect(after).toBe(before + 2);
  });
});
